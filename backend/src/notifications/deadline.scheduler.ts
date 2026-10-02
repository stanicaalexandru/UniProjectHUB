import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Milestone, MilestoneStatus } from '../projects/entities/milestone.entity';
import { Project } from '../projects/entities/project.entity';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DeadlineScheduler {
  private readonly logger = new Logger(DeadlineScheduler.name);
  constructor(
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  // // Aduna persoanele implicate in proiect: creator, coordonator si membrii echipei
  private getProjectRecipients(project: Project | undefined): string[] {
    const ids = new Set<string>();
    if (project?.createdById) ids.add(project.createdById);
    if (project?.coordinatorId) ids.add(project.coordinatorId);
    for (const member of project?.team?.members || []) {
      const memberId = member?.user?.id || member?.userId;
      if (memberId) ids.add(memberId);
    }
    return Array.from(ids);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDeadlines() {
    this.logger.log('Verificare deadline-uri milestone-uri...');
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    try {
      // Milestone-uri care nu sunt terminate si sunt de rezolvat in urmatoarele 7 zile
      const upcoming = await this.milestoneRepo.find({
        where: {
          status: In([MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS]),
          dueDate: LessThanOrEqual(in7Days),
        },
        relations: ['project', 'project.coordinator', 'project.team', 'project.team.members', 'project.team.members.user'],
      });

      let notifiedCount = 0;
      for (const milestone of upcoming) {
        const dueDate = new Date(milestone.dueDate);
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 0 || daysLeft > 7) continue;

        const projectTitle = milestone.project?.title || 'proiect';
        const message = `Milestone-ul "${milestone.title}" din proiectul "${projectTitle}" expira in ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'} (${dueDate.toLocaleDateString('ro')}).`;

        // Doar persoanele care sunt implicate in acest proiect primesc notificari
        const recipients = this.getProjectRecipients(milestone.project);
        for (const userId of recipients) {
          await this.notificationsService.create({
            userId,
            type: NotificationType.DEADLINE,
            title: 'Termen apropiat',
            message,
            actionUrl: milestone.project?.id ? `/projects/${milestone.project.id}` : '/calendar',
            entityType: 'project',
            entityId: milestone.project?.id,
          }).catch(() => {});
          notifiedCount++;
        }
        this.logger.log(`Notificari trimise pentru "${milestone.title}" (${daysLeft} zile) catre ${recipients.length} utilizatori`);
      }

      // // Milestone-uri care au depasit termenul fara sa fie finalizate
      const overdue = await this.milestoneRepo.find({
        where: {
          status: In([MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS]),
          dueDate: LessThanOrEqual(now),
        },
        relations: ['project', 'project.coordinator', 'project.team', 'project.team.members', 'project.team.members.user'],
      });

      for (const milestone of overdue) {
        await this.milestoneRepo.update(milestone.id, { status: MilestoneStatus.OVERDUE });
        const projectTitle = milestone.project?.title || 'proiect';
        const recipients = this.getProjectRecipients(milestone.project);
        for (const userId of recipients) {
          await this.notificationsService.create({
            userId,
            type: NotificationType.DEADLINE,
            title: 'Termen depasit',
            message: `Milestone-ul "${milestone.title}" din proiectul "${projectTitle}" a depasit termenul limita.`,
            actionUrl: milestone.project?.id ? `/projects/${milestone.project.id}` : '/calendar',
            entityType: 'project',
            entityId: milestone.project?.id,
          }).catch(() => {});
        }
      }

      this.logger.log(`Verificare completa: ${upcoming.length} milestone-uri apropiate, ${overdue.length} intarziate, ${notifiedCount} notificari generate.`);
    } catch (error) {
      this.logger.error('Eroare la verificarea deadline-urilor:', error);
    }
  }

  async onModuleInit() {
    this.logger.log('Deadline scheduler initializat!');
    // Pentru testare
    //await this.checkDeadlines();
  }
}