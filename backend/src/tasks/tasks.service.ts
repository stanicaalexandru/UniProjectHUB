import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Milestone } from '../projects/entities/milestone.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ProjectAccessService, pick } from '../access/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { appError } from '../common/errors';
import { TaskDto } from './dto';

const TASK_FIELDS = ['title', 'description', 'status', 'priority', 'milestoneId', 'assigneeId', 'dueDate',
  'estimatedHours', 'loggedHours', 'order', 'tags'] as const;

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private access: ProjectAccessService,
    private notifications: NotificationsService,
  ) {}

  private async notifyAssignee(task: Task, actor: User) {
    await this.notifications.notify([task.assigneeId], { type: NotificationType.INFO, title: 'Sarcină nouă',
      message: `${actor.firstName} ${actor.lastName} ți-a atribuit sarcina „${task.title}”.`,
      actionUrl: '/tasks', entityType: 'task', entityId: task.id }, { exclude: actor.id });
  }

  findAll(filters: Record<string, string>, user: User) {
    const qb = this.repo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.reporter', 'reporter')
      .leftJoinAndSelect('task.project', 'project')
      .orderBy('task.order', 'ASC');
    if (filters.projectId) qb.andWhere('task.projectId = :projectId', { projectId: filters.projectId });
    if (filters.assigneeId) qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    if (filters.status) qb.andWhere('task.status = :status', { status: filters.status });
    // Doar task-urile din proiectele accesibile, plus cele fara proiect in care userul e autor sau responsabil
    if (user.role !== UserRole.ADMIN) {
      qb.andWhere(`(task."projectId" IN ${this.access.accessibleProjectIdsSql()}
        OR (task."projectId" IS NULL AND (task."reporterId" = :accessUserId OR task."assigneeId" = :accessUserId)))`,
        { accessUserId: user.id });
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const t = await this.repo.findOne({ where: { id }, relations: ['assignee', 'reporter', 'project'] });
    if (!t) throw new NotFoundException(appError('TASK_NOT_FOUND'));
    return t;
  }

  // Task din proiect: acces prin proiect. Task personal (fara proiect): doar autorul, responsabilul sau adminul.
  private async assertTask(id: string, user: User) {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(appError('TASK_NOT_FOUND'));
    if (task.projectId) await this.access.assertProject(user, task.projectId);
    else if (user.role !== UserRole.ADMIN && task.reporterId !== user.id && task.assigneeId !== user.id) {
      throw new NotFoundException(appError('TASK_NOT_FOUND'));
    }
    return task;
  }

  // Responsabilul si milestone-ul trebuie sa apartina aceluiasi proiect
  private async validateLinks(dto: Partial<Task>, projectId: string | null) {
    if (dto.assigneeId) {
      const assignee = await this.userRepo.findOne({ where: { id: dto.assigneeId } });
      const ok = assignee && (projectId
        ? await this.access.roleIn(assignee, await this.projectRepo.findOneOrFail({ where: { id: projectId } }))
        : true);
      if (!ok) throw new BadRequestException(appError('ASSIGNEE_NOT_IN_PROJECT'));
    }
    if (dto.milestoneId) {
      const ms = await this.milestoneRepo.findOne({ where: { id: dto.milestoneId } });
      if (!ms || ms.projectId !== projectId) throw new BadRequestException(appError('MILESTONE_OTHER_PROJECT'));
    }
  }

  async findOneFor(id: string, user: User) {
    await this.assertTask(id, user);
    return this.findOne(id);
  }

  async create(input: TaskDto, user: User) {
    const dto = pick<Task>(input, TASK_FIELDS);
    const projectId = input?.projectId || null;
    if (projectId) await this.access.assertProject(user, projectId);
    await this.validateLinks(dto, projectId);
    const saved = await this.repo.save(this.repo.create({ ...dto, projectId, reporterId: user.id }));
    if (projectId) await this.updateProgress(projectId);
    await this.notifyAssignee(saved, user);
    return this.findOne(saved.id);
  }

  async update(id: string, input: TaskDto, user: User) {
    const task = await this.assertTask(id, user);
    const dto = pick<Task>(input, TASK_FIELDS);
    await this.validateLinks(dto, task.projectId);
    if (Object.keys(dto).length) await this.repo.update(id, dto);
    if (task.projectId) await this.updateProgress(task.projectId);
    const updated = await this.findOne(id);
    if (dto.assigneeId && dto.assigneeId !== task.assigneeId) await this.notifyAssignee(updated, user);
    return updated;
  }

  async remove(id: string, user: User) {
    const task = await this.assertTask(id, user);
    await this.repo.delete(id);
    if (task.projectId) await this.updateProgress(task.projectId);
  }

  async updateStatus(id: string, status: TaskStatus, user: User) {
    await this.assertTask(id, user);
    if (!Object.values(TaskStatus).includes(status)) throw new BadRequestException(appError('STATUS_INVALID'));
    await this.repo.update(id, { status });
    const task = await this.findOne(id);
    if (task.projectId) await this.updateProgress(task.projectId);
    return task;
  }

  private async updateProgress(projectId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId }, relations: ['milestones', 'tasks'] });
    if (!project) return;
    const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = project.milestones.length;
    const completedTasks = project.tasks.filter(t => t.status === 'done').length;
    const totalTasks = project.tasks.length;
    let progress = 0;
    if (totalMilestones > 0) progress += (completedMilestones / totalMilestones) * 60;
    if (totalTasks > 0) progress += (completedTasks / totalTasks) * 40;
    await this.projectRepo.update(projectId, { progressPercentage: Math.round(progress) });
  }
}