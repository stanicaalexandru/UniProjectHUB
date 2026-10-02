import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { TeamMember, TeamRole } from '../teams/entities/team-member.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { appError } from '../common/errors';

// Rolul unui user intr-un proiect anume (diferit de rolul global al contului)
export type ProjectRole = 'admin' | 'coordinator' | 'member';
export const ANY_PROJECT_ROLE: ProjectRole[] = ['admin', 'coordinator', 'member'];
export const PROJECT_MANAGERS: ProjectRole[] = ['admin', 'coordinator'];

export type TeamRoleForUser = 'admin' | 'staff' | 'leader' | 'member';

// Singurul loc care decide cine are acces la un proiect sau la o echipa.
// Fara acces se raspunde cu 404, nu 403, ca sa nu confirmam ca resursa exista.
@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(TeamMember) private memberRepo: Repository<TeamMember>,
  ) {}

  async roleIn(user: Pick<User, 'id' | 'role'>, project: Pick<Project, 'coordinatorId' | 'createdById' | 'teamId'>): Promise<ProjectRole | null> {
    if (user.role === UserRole.ADMIN) return 'admin';
    if (project.coordinatorId === user.id) return 'coordinator';
    if (project.createdById === user.id) return 'member';
    if (project.teamId && await this.memberRepo.exist({ where: { teamId: project.teamId, userId: user.id } })) return 'member';
    return null;
  }

  // Verifica accesul si intoarce proiectul impreuna cu rolul userului in el
  async assertProject(user: Pick<User, 'id' | 'role'>, projectId: string | null | undefined, allowed: ProjectRole[] = ANY_PROJECT_ROLE) {
    const project = projectId ? await this.projectRepo.findOne({ where: { id: projectId } }) : null;
    const role = project ? await this.roleIn(user, project) : null;
    if (!project || !role) throw new NotFoundException(appError('PROJECT_NOT_FOUND'));
    if (!allowed.includes(role)) throw new ForbiddenException(appError('PROJECT_FORBIDDEN'));
    return { project, role };
  }

  // Restrange o interogare la proiectele accesibile userului (pentru liste)
  scopeProjects<T>(qb: SelectQueryBuilder<T>, alias: string, user: Pick<User, 'id' | 'role'>) {
    if (user.role === UserRole.ADMIN) return qb;
    return qb.andWhere(
      `(${alias}."coordinatorId" = :accessUserId OR ${alias}."createdById" = :accessUserId OR ${alias}."teamId" IN
        (SELECT tm."teamId" FROM team_members tm WHERE tm."userId" = :accessUserId))`,
      { accessUserId: user.id },
    );
  }

  // Subinterogare SQL cu id-urile proiectelor accesibile (pentru task-uri, documente etc.)
  accessibleProjectIdsSql(paramName = 'accessUserId') {
    return `(SELECT p.id FROM projects p WHERE p."coordinatorId" = :${paramName} OR p."createdById" = :${paramName} OR p."teamId" IN
      (SELECT tm."teamId" FROM team_members tm WHERE tm."userId" = :${paramName}))`;
  }

  // Cine e implicat intr-un proiect: destinatarii notificarilor despre el
  async audience(projectId: string): Promise<{ coordinatorId: string | null; memberIds: string[] }> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) return { coordinatorId: null, memberIds: [] };
    const team = project.teamId ? await this.memberRepo.find({ where: { teamId: project.teamId } }) : [];
    const memberIds = [...new Set([project.createdById, ...team.map((m) => m.userId)].filter(Boolean))]
      .filter((id) => id !== project.coordinatorId);
    return { coordinatorId: project.coordinatorId || null, memberIds };
  }

  // Rolul in echipa: adminul oricand; liderul si membrii dupa apartenenta; un profesor doar daca e membru
  // al echipei sau coordoneaza un proiect al ei ("staff"). Alti profesori nu au acces la echipa (nici la chatul ei).
  async teamRole(user: Pick<User, 'id' | 'role'>, teamId: string): Promise<TeamRoleForUser | null> {
    if (user.role === UserRole.ADMIN) return 'admin';
    const m = await this.memberRepo.findOne({ where: { teamId, userId: user.id } });
    if (m?.role === TeamRole.LEADER) return 'leader';
    if (user.role === UserRole.PROFESSOR && (m || await this.coordinatesTeamProject(user.id, teamId))) return 'staff';
    return m ? 'member' : null;
  }

  private coordinatesTeamProject(userId: string, teamId: string) {
    return this.projectRepo.exist({ where: { teamId, coordinatorId: userId } });
  }

  // Coordonatorii proiectelor unei echipe (destinatari pentru cererile de inscriere, alaturi de lider)
  async teamCoordinatorIds(teamId: string): Promise<string[]> {
    const projects = await this.projectRepo.find({ where: { teamId }, select: ['coordinatorId'] });
    return [...new Set(projects.map((p) => p.coordinatorId).filter(Boolean))];
  }

  async assertTeamManager(user: Pick<User, 'id' | 'role'>, teamId: string) {
    const role = await this.teamRole(user, teamId);
    if (!role || role === 'member') throw new ForbiddenException(appError('TEAM_MANAGER_ONLY'));
    return role;
  }
}

// Pastreaza doar campurile permise dintr-un obiect primit de la client (impotriva "mass assignment")
export function pick<T extends object>(dto: unknown, fields: readonly (keyof T)[]): Partial<T> {
  const out: Partial<T> = {};
  if (!dto || typeof dto !== 'object') return out;
  const src = dto as Record<string, unknown>;
  for (const f of fields) if (src[f as string] !== undefined) (out as Record<string, unknown>)[f as string] = src[f as string];
  return out;
}
