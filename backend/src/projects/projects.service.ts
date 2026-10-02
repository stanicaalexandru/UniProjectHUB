import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { CHAT_UPLOAD_DIR } from '../common/uploads';
import { Project, ProjectStatus } from './entities/project.entity';
import { Milestone } from './entities/milestone.entity';
import { Activity } from './entities/activity.entity';
import { Comment } from './entities/comment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ProjectAccessService, PROJECT_MANAGERS, pick } from '../access/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { appError } from '../common/errors';
import { CreateProjectDto, MilestoneDto, UpdateProjectDto } from './dto';

const fullName = (u: Pick<User, 'firstName' | 'lastName'>) => `${u.firstName} ${u.lastName}`;
// Aceleasi denumiri ca in interfata (projectStatus.* din dictionarul romanesc)
const STATUS_LABELS: Record<string, string> = { draft: 'Ciornă', proposed: 'Propus', approved: 'Aprobat', in_progress: 'În desfășurare',
  review: 'În evaluare', completed: 'Finalizat', archived: 'Arhivat', rejected: 'Respins' };
const statusLabel = (status: string) => STATUS_LABELS[status] || status;

// Campuri descriptive, pe care le poate edita si echipa (cat timp proiectul e in draft/proposed)
const DETAIL_FIELDS = ['title', 'description', 'objectives', 'type', 'priority', 'startDate', 'endDate',
  'faculty', 'department', 'academicYear'] as const;
// Metadate tehnice, editabile de echipa in orice status (nu influenteaza evaluarea)
const TECH_FIELDS = ['repository', 'demoUrl', 'tags', 'technologies'] as const;
// Doar coordonatorul sau adminul: decizii academice
const MANAGER_FIELDS = ['status', 'finalGrade', 'rejectionReason', 'coordinatorId', 'teamId'] as const;
const EDITABLE_BY_TEAM: ProjectStatus[] = [ProjectStatus.DRAFT, ProjectStatus.PROPOSED];
const MILESTONE_FIELDS = ['title', 'description', 'status', 'dueDate', 'completedAt', 'order', 'progressPercentage', 'deliverables'] as const;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private access: ProjectAccessService,
    private notifications: NotificationsService,
  ) {}

  // Anunta toti cei implicati in proiect (coordonator + echipa), mai putin autorul actiunii
  private async notifyProject(projectId: string, actor: User, payload: { type: NotificationType; title: string; message: string }, pref = 'push') {
    const { coordinatorId, memberIds } = await this.access.audience(projectId);
    await this.notifications.notify([coordinatorId, ...memberIds],
      { ...payload, actionUrl: `/projects/${projectId}`, entityType: 'project', entityId: projectId }, { exclude: actor.id, pref });
  }

  async findAll(filters: {
    status?: ProjectStatus; type?: string; coordinatorId?: string;
    teamId?: string; search?: string; page?: number; limit?: number;
  }, user: User) {
    const { search, status, type, coordinatorId, teamId } = filters;
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
    const query = this.projectRepo.createQueryBuilder('project')
      .leftJoinAndSelect('project.coordinator', 'coordinator')
      .leftJoinAndSelect('project.team', 'team')
      .leftJoinAndSelect('team.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('project.milestones', 'milestones')
      .leftJoinAndSelect('project.createdBy', 'createdBy');

    if (search) {
      query.andWhere('(project.title ILIKE :search OR project.description ILIKE :search)', { search: `%${search}%` });
    }
    if (status) query.andWhere('project.status = :status', { status });
    if (type) query.andWhere('project.type = :type', { type });
    if (coordinatorId) query.andWhere('project.coordinatorId = :coordinatorId', { coordinatorId });
    if (teamId) query.andWhere('project.teamId = :teamId', { teamId });
    // Fiecare vede doar proiectele in care e implicat (adminul le vede pe toate)
    this.access.scopeProjects(query, 'project', user);

    query.orderBy('project.updatedAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['coordinator', 'team', 'team.members', 'team.members.user',
                  'milestones', 'tasks', 'documents', 'evaluations', 'aiAnalyses'],
    });
    if (!project) throw new NotFoundException(appError('PROJECT_NOT_FOUND'));
    return project;
  }

  async findOneFor(id: string, user: User): Promise<Project> {
    await this.access.assertProject(user, id);
    return this.findOne(id);
  }

  // Coordonatorul trebuie sa fie profesor; echipa trebuie sa fie una din care face parte creatorul
  private async validateLinks(dto: { coordinatorId?: string; teamId?: string }, user: User) {
    if (dto.coordinatorId) {
      const prof = await this.userRepo.findOne({ where: { id: dto.coordinatorId } });
      if (!prof || prof.role !== UserRole.PROFESSOR) throw new BadRequestException(appError('COORDINATOR_NOT_PROFESSOR'));
    }
    if (dto.teamId && !(await this.access.teamRole(user, dto.teamId))) {
      throw new BadRequestException(appError('TEAM_NOT_MEMBER_FOR_PROJECT'));
    }
  }

  async create(input: CreateProjectDto, creator: User): Promise<Project> {
    const dto = pick<Project>(input, [...DETAIL_FIELDS, ...TECH_FIELDS, 'coordinatorId', 'teamId']);
    if (creator.role === UserRole.PROFESSOR) dto.coordinatorId = creator.id;
    await this.validateLinks(dto, creator);
    const project = this.projectRepo.create({
      ...dto,
      createdById: creator.id,
      status: ProjectStatus.DRAFT,
      startDate: dto.startDate || new Date(),
    });
    const saved = await this.projectRepo.save(project);
        await this.logActivity(saved.id, creator.id, 'PROJECT_CREATED', `Proiectul „${saved.title}” a fost creat`);
    const link = { actionUrl: `/projects/${saved.id}`, entityType: 'project', entityId: saved.id };
    await this.notifications.notify([saved.coordinatorId], { type: NotificationType.INFO, title: 'Ai fost ales coordonator',
      message: `${fullName(creator)} te-a ales coordonator pentru proiectul „${saved.title}”.`, ...link }, { exclude: creator.id });
    const { memberIds } = await this.access.audience(saved.id);
    await this.notifications.notify(memberIds, { type: NotificationType.TEAM, title: 'Proiect nou în echipă',
      message: `${fullName(creator)} a creat proiectul „${saved.title}”.`, ...link }, { exclude: creator.id });
    return saved;
  }

    async update(id: string, input: UpdateProjectDto, user: User): Promise<Project> {
    const { role } = await this.access.assertProject(user, id);
    const project = await this.findOne(id);
    let dto: Partial<Project>;
    if (PROJECT_MANAGERS.includes(role)) {
      dto = pick<Project>(input, [...DETAIL_FIELDS, ...TECH_FIELDS, ...MANAGER_FIELDS]);
      await this.validateLinks(dto, user);
    } else {
      // Echipa: metadatele tehnice oricand; detaliile doar in draft/proposed; statusul doar draft -> proposed
      dto = pick<Project>(input, TECH_FIELDS);
      const details = pick<Project>(input, DETAIL_FIELDS);
      if (Object.keys(details).length) {
        if (!EDITABLE_BY_TEAM.includes(project.status)) {
          throw new ForbiddenException(appError('PROJECT_LOCKED_FOR_TEAM'));
        }
        Object.assign(dto, details);
      }
      if (input?.status !== undefined && input.status !== project.status) {
        if (!(project.status === ProjectStatus.DRAFT && input.status === ProjectStatus.PROPOSED)) {
          throw new ForbiddenException(appError('PROJECT_STATUS_TEAM_ONLY_PROPOSE'));
        }
        dto.status = ProjectStatus.PROPOSED;
      }
    }
    const oldStatus = project.status;
    // Relatiile incarcate de findOne nu se salveaza; actualizam doar coloanele proiectului
    if (Object.keys(dto).length) await this.projectRepo.update(id, dto);
    const saved = await this.findOne(id);
    if (oldStatus !== saved.status) {
      await this.logActivity(id, user.id, 'STATUS_CHANGED', `Starea s-a schimbat din „${statusLabel(oldStatus)}” în „${statusLabel(saved.status)}”`);
      await this.notifyProject(id, user, { type: NotificationType.INFO, title: `Proiectul „${saved.title}”: ${statusLabel(saved.status)}`,
        message: `${fullName(user)} a schimbat starea proiectului în „${statusLabel(saved.status)}”.` });
    }
    // Modificarile asupra celorlalte campuri sunt consemnate separat
    const editedFields = Object.keys(dto).filter(k => k !== 'status');
    if (editedFields.length > 0) {
      await this.logActivity(id, user.id, 'PROJECT_UPDATED', `Detaliile proiectului „${saved.title}” au fost actualizate`);
    }
    return saved;
  }

  async delete(id: string, user: User): Promise<void> {
    const { project, role } = await this.access.assertProject(user, id);
    if (role === 'member' && project.status !== ProjectStatus.DRAFT) {
      throw new ForbiddenException(appError('PROJECT_DELETE_DRAFT_ONLY'));
    }
    // Totul intr-o singura tranzactie: fie se sterge proiectul complet, fie nimic
    const files = await this.projectRepo.manager.transaction(async (tx) => {
      const q = (sql: string) => tx.query(sql, [id]);
      await q('DELETE FROM activities WHERE "projectId" = $1');
      await q('DELETE FROM comments WHERE "projectId" = $1');
      await q('DELETE FROM tasks WHERE "projectId" = $1');
      await q('DELETE FROM milestones WHERE "projectId" = $1');
      await q('DELETE FROM evaluation_criteria WHERE "evaluationId" IN (SELECT id FROM evaluations WHERE "projectId" = $1)');
      await q('DELETE FROM evaluation_revisions WHERE "evaluationId" IN (SELECT id FROM evaluations WHERE "projectId" = $1)');
      await q('DELETE FROM evaluations WHERE "projectId" = $1');
      // Fisierele documentelor (si ale versiunilor) si atasamentele din conversatia proiectului
      const docs: { storagePath: string }[] = await q(
        `SELECT "storagePath" FROM documents WHERE "projectId" = $1
         UNION SELECT v."storagePath" FROM document_versions v JOIN documents d ON d.id = v."documentId" WHERE d."projectId" = $1`);
      const attachments: { filename: string }[] = await q(
        `SELECT a->>'filename' AS filename FROM chat_messages m CROSS JOIN LATERAL jsonb_array_elements(COALESCE(m.attachments, '[]'::jsonb)) a
         WHERE m."roomId" IN (SELECT id FROM chat_rooms WHERE type = 'project' AND "entityId" = $1::text)`);
      await q('DELETE FROM document_versions WHERE "documentId" IN (SELECT id FROM documents WHERE "projectId" = $1)');
      await q('DELETE FROM documents WHERE "projectId" = $1');
      await q(`DELETE FROM chat_messages WHERE "roomId" IN (SELECT id FROM chat_rooms WHERE type = 'project' AND "entityId" = $1::text)`);
      await q(`DELETE FROM chat_rooms WHERE type = 'project' AND "entityId" = $1::text`);
      await q('DELETE FROM ai_analyses WHERE "projectId" = $1');
      await q('DELETE FROM projects WHERE id = $1');
      return [
        ...docs.map((d) => d.storagePath),
        ...attachments.filter((a) => a.filename).map((a) => path.resolve(CHAT_UPLOAD_DIR, path.basename(a.filename))),
      ];
    });
    // Fisierele de pe disc se sterg doar dupa ce baza de date a confirmat stergerea
    await Promise.all(files.map((f) => fs.promises.unlink(f).catch(() => {})));
  }

  async updateProgress(id: string): Promise<number> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['milestones', 'tasks'],
    });
    if (!project) return 0;
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = project.milestones.length;
    const completedTasks = project.tasks.filter(t => t.status === 'done').length;
    const totalTasks = project.tasks.length;
    let progress = 0;
    if (totalMilestones > 0) progress += (completedMilestones / totalMilestones) * 60;
    if (totalTasks > 0) progress += (completedTasks / totalTasks) * 40;
    await this.projectRepo.update(id, { progressPercentage: Math.round(progress) });
    return Math.round(progress);
  }

  // Milestone-uri
  async getMilestones(projectId: string, user: User) {
    await this.access.assertProject(user, projectId);
    return this.milestoneRepo.find({ where: { projectId }, relations: ['tasks'], order: { order: 'ASC' } });
  }

  async createMilestone(projectId: string, input: MilestoneDto, user: User): Promise<Milestone> {
    await this.access.assertProject(user, projectId);
    const milestone = this.milestoneRepo.create({ ...pick<Milestone>(input, MILESTONE_FIELDS), projectId });
    const saved = await this.milestoneRepo.save(milestone);
        await this.logActivity(projectId, user.id, 'MILESTONE_CREATED', `Etapa „${saved.title}” a fost creată`);
    await this.notifyProject(projectId, user, { type: NotificationType.INFO, title: 'Etapă nouă',
      message: `${fullName(user)} a adăugat etapa „${saved.title}”.` });
    return saved;
  }

  async updateMilestone(id: string, input: MilestoneDto, user: User): Promise<Milestone> {
    const existing = await this.milestoneRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(appError('MILESTONE_NOT_FOUND'));
    await this.access.assertProject(user, existing.projectId);
    const dto = pick<Milestone>(input, MILESTONE_FIELDS);
    if (Object.keys(dto).length) await this.milestoneRepo.update(id, dto);
    const milestone = await this.milestoneRepo.findOne({ where: { id } });
    await this.updateProgress(milestone.projectId);
    if (dto.status === 'completed' && existing.status !== 'completed') {
      await this.notifyProject(milestone.projectId, user, { type: NotificationType.SUCCESS, title: 'Etapă finalizată',
        message: `${fullName(user)} a finalizat etapa „${milestone.title}”.` });
    }
    return milestone;
  }

  // Comentarii
  async getComments(projectId: string, user: User) {
    await this.access.assertProject(user, projectId);
    return this.commentRepo.find({
      where: { projectId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

    async addComment(projectId: string, content: string, user: User): Promise<Comment> {
    await this.access.assertProject(user, projectId);
    if (!content || typeof content !== 'string' || !content.trim()) throw new BadRequestException(appError('COMMENT_EMPTY'));
    const comment = this.commentRepo.create({ projectId, content: content.slice(0, 5000), authorId: user.id });
    const saved = await this.commentRepo.save(comment);
    await this.logActivity(projectId, user.id, 'COMMENT_ADDED', 'A fost adăugat un comentariu');
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    const preview = content.trim().length > 60 ? `${content.trim().slice(0, 60)}...` : content.trim();
    await this.notifyProject(projectId, user, { type: NotificationType.INFO, title: `Comentariu nou la „${project?.title}”`,
      message: `${fullName(user)}: "${preview}"` });
    return saved;
  }
  // Activitate
  async getActivities(projectId: string, user: User) {
    await this.access.assertProject(user, projectId);
    return this.activityRepo.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private async logActivity(projectId: string, userId: string, action: string, description: string) {
    const activity = this.activityRepo.create({ projectId, userId, action, description });
    await this.activityRepo.save(activity);
  }

  async getStats() {
    const [total, active, completed, draft] = await Promise.all([
      this.projectRepo.count(),
      this.projectRepo.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
      this.projectRepo.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.projectRepo.count({ where: { status: ProjectStatus.DRAFT } }),
    ]);
    return { total, active, completed, draft };
  }
}
