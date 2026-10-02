import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember, TeamRole } from './entities/team-member.entity';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { JoinRequest, JoinRequestStatus } from './entities/join-request.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ProjectAccessService, pick } from '../access/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { randomUUID } from 'crypto';
import { appError } from '../common/errors';
import { TeamDto } from './dto';

const TEAM_FIELDS = ['name', 'description', 'avatar', 'maxMembers', 'isPublic', 'faculty', 'department'] as const;

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(TeamMember) private memberRepo: Repository<TeamMember>,
    @InjectRepository(Invitation) private invRepo: Repository<Invitation>,
    @InjectRepository(JoinRequest) private joinRequestRepo: Repository<JoinRequest>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private access: ProjectAccessService,
    private notifications: NotificationsService,
  ) {}

  // Lista echipelor ramane vizibila tuturor: studentii o folosesc ca sa ceara inscrierea intr-o echipa
  findAll() { return this.teamRepo.find({ relations: ['members', 'members.user'] }); }

  async findOne(id: string) {
    const t = await this.teamRepo.findOne({ where: { id }, relations: ['members', 'members.user'] });
    if (!t) throw new NotFoundException(appError('TEAM_NOT_FOUND'));
    return t;
  }

  async create(input: TeamDto, creatorId: string) {
    const dto = pick<Team>(input, TEAM_FIELDS);
    if (!dto.name || !String(dto.name).trim()) throw new BadRequestException(appError('TEAM_NAME_REQUIRED'));
    const team = await this.teamRepo.save(this.teamRepo.create(dto));
    await this.memberRepo.save(this.memberRepo.create({ teamId: team.id, userId: creatorId, role: TeamRole.LEADER }));
    return this.findOne(team.id);
  }

  async update(id: string, input: TeamDto, user: User) {
    await this.findOne(id);
    await this.access.assertTeamManager(user, id);
    const dto = pick<Team>(input, TEAM_FIELDS);
    if (Object.keys(dto).length) await this.teamRepo.update(id, dto);
    return this.findOne(id);
  }

  // Folosit intern (cereri acceptate, invitatii); nu verifica permisiunile
  async addMember(teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER) {
    const existing = await this.memberRepo.findOne({ where: { teamId, userId } });
    if (existing) return existing;
    const m = this.memberRepo.create({ teamId, userId, role });
    return this.memberRepo.save(m);
  }

  // Adaugare directa din interfata: doar liderul, profesorii sau adminul, si doar studenti existenti
  async addMemberAs(teamId: string, userId: string, actor: User) {
    const team = await this.findOne(teamId);
    await this.access.assertTeamManager(actor, teamId);
    const target = userId ? await this.userRepo.findOne({ where: { id: userId } }) : null;
    if (!target) throw new BadRequestException(appError('USER_NOT_FOUND'));
    if (team.members.length >= team.maxMembers) throw new BadRequestException(appError('TEAM_FULL'));
    const member = await this.addMember(teamId, userId);
    await this.notifications.notify([userId], { type: NotificationType.TEAM, title: 'Ai fost adăugat într-o echipă',
      message: `${actor.firstName} ${actor.lastName} te-a adăugat în echipa „${team.name}”.`,
      actionUrl: '/teams', entityType: 'team', entityId: teamId }, { exclude: actor.id });
    return member;
  }

  // Managerii pot scoate membri; oricine poate pleca singur. Liderul nu poate fi scos (echipa ar ramane fara lider).
  async removeMember(teamId: string, userId: string, actor: User) {
    const member = await this.memberRepo.findOne({ where: { teamId, userId } });
    if (!member) throw new NotFoundException(appError('TEAM_MEMBER_NOT_FOUND'));
    if (userId !== actor.id) await this.access.assertTeamManager(actor, teamId);
    if (member.role === TeamRole.LEADER && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException(appError('TEAM_LEADER_CANNOT_LEAVE'));
    }
    await this.memberRepo.delete({ teamId, userId });
  }

  async invite(teamId: string, email: string, actor: User) {
    await this.findOne(teamId);
    await this.access.assertTeamManager(actor, teamId);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException(appError('EMAIL_INVALID'));
    const inv = this.invRepo.create({ teamId, invitedEmail: email, invitedById: actor.id, token: randomUUID(), expiresAt: new Date(Date.now() + 7 * 86400000) });
    return this.invRepo.save(inv);
  }

  async acceptInvite(token: string, userId: string) {
    const inv = await this.invRepo.findOne({ where: { token } });
    if (!inv || inv.expiresAt < new Date()) throw new NotFoundException(appError('INVITE_INVALID'));
    await this.addMember(inv.teamId, userId);
    await this.invRepo.update(inv.id, { status: InvitationStatus.ACCEPTED, invitedUserId: userId });
    return this.findOne(inv.teamId);
  }

  async requestJoin(teamId: string, userId: string, message?: string) {
    await this.findOne(teamId);
    if (await this.memberRepo.exist({ where: { teamId, userId } })) throw new BadRequestException(appError('ALREADY_TEAM_MEMBER'));
    if (typeof message === 'string') message = message.slice(0, 1000);
    const existing = await this.joinRequestRepo.findOne({ where: { teamId, userId, status: JoinRequestStatus.PENDING } });
    if (existing) return existing;
    const req = await this.joinRequestRepo.save(this.joinRequestRepo.create({ teamId, userId, message, status: JoinRequestStatus.PENDING }));
    const [team, requester, leaders] = await Promise.all([
      this.teamRepo.findOne({ where: { id: teamId } }),
      this.userRepo.findOne({ where: { id: userId } }),
      this.memberRepo.find({ where: { teamId, role: TeamRole.LEADER } }),
    ]);
    const recipients = [...new Set([...leaders.map((l) => l.userId), ...(await this.access.teamCoordinatorIds(teamId))])];
    await this.notifications.notify(recipients, { type: NotificationType.TEAM, title: 'Cerere nouă de înscriere',
      message: `${requester?.firstName} ${requester?.lastName} dorește să se înscrie în echipa „${team?.name}”.`,
      actionUrl: '/teams', entityType: 'team', entityId: teamId }, { exclude: userId });
    return req;
  }

  async getJoinRequests(teamId: string, user: User) {
    await this.access.assertTeamManager(user, teamId);
    return this.joinRequestRepo.find({ where: { teamId, status: JoinRequestStatus.PENDING }, relations: ['user'] });
  }

  async respondToJoinRequest(requestId: string, accept: boolean, user: User) {
    const req = await this.joinRequestRepo.findOne({ where: { id: requestId }, relations: ['user', 'team'] });
    if (!req) throw new NotFoundException(appError('JOIN_REQUEST_NOT_FOUND'));
    await this.access.assertTeamManager(user, req.teamId);
    if (req.status !== JoinRequestStatus.PENDING) throw new BadRequestException(appError('JOIN_REQUEST_ALREADY_HANDLED'));
    const status = accept ? JoinRequestStatus.ACCEPTED : JoinRequestStatus.REJECTED;
    await this.joinRequestRepo.update(requestId, { status });
    if (accept) await this.addMember(req.teamId, req.userId);
    await this.notifications.notify([req.userId], { type: NotificationType.TEAM,
      title: accept ? 'Cerere acceptata' : 'Cerere respinsa',
      message: accept ? `Ai fost acceptat in echipa "${req.team?.name}".` : `Cererea ta de inscriere in echipa "${req.team?.name}" a fost respinsa.`,
      actionUrl: '/teams', entityType: 'team', entityId: req.teamId }, { exclude: user.id });
    return { ...req, status };
  }

  async getUserJoinRequests(userId: string) {
    return this.joinRequestRepo.find({ where: { userId }, relations: ['team'] });
  }
}