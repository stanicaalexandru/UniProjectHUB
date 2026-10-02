import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../users/mail.service';

const TYPE_TO_PREF: Record<string, string> = {
  info: 'chat',
  success: 'push',
  warning: 'risk',
  error: 'push',
  deadline: 'risk',
  evaluation: 'evals',
  team: 'push',
  system: 'push',
  mention: 'chat',
};

// Doar la aceste lucruri este notificat si pe email utilizatorul
const EMAIL_WORTHY_TYPES: string[] = [
  NotificationType.DEADLINE,
  NotificationType.EVALUATION,
  NotificationType.MENTION,
];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private mailService: MailService,
  ) {}
  findAll(userId: string) { return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 }); }
  getUnread(userId: string) { return this.repo.find({ where: { userId, isRead: false }, order: { createdAt: 'DESC' } }); }
  // Conditia pe userId face ca fiecare sa-si poata marca doar propriile notificari
  async markRead(id: string, userId: string) { await this.repo.update({ id, userId }, { isRead: true }); }
  async markAllRead(userId: string) { await this.repo.update({ userId, isRead: false }, { isRead: true }); }
  // Trimite aceeasi notificare mai multor useri (fara duplicate, fara autorul actiunii).
  // "pref" = preferinta din Setari care controleaza evenimentul (push, chat, evals, risk).
  async notify(
    userIds: (string | null | undefined)[],
    payload: { type: NotificationType; title: string; message: string; actionUrl?: string; entityType?: string; entityId?: string },
    opts: { exclude?: string; pref?: string } = {},
  ) {
    const targets = [...new Set(userIds.filter((id): id is string => !!id && id !== opts.exclude))];
    for (const userId of targets) {
      await this.create({ ...payload, userId, title: payload.title.slice(0, 200), message: payload.message.slice(0, 1000) }, opts.pref)
        .catch((err) => this.logger.warn(`Notificare esuata pentru ${userId}: ${err.message}`));
    }
  }

  async create(dto: { userId: string; type: NotificationType | string; title: string; message: string; actionUrl?: string; entityType?: string; entityId?: string }, prefOverride?: string) {
    const validTypes = Object.values(NotificationType);
    const type = validTypes.includes(dto.type as NotificationType) ? (dto.type as NotificationType) : NotificationType.INFO;

    let user: User | null = null;
    try {
      user = await this.userRepo.findOne({ where: { id: dto.userId } });
      if (!user) return null;
      if (user?.notificationPreferences) {
        const prefKey = prefOverride || TYPE_TO_PREF[type];
        if (prefKey && user.notificationPreferences[prefKey] === false) {
          return null; // Utilizaatorul a dezazctivat aceasta notificare
        }
      }
    } catch {
      // Daca preferintele nu pot fi citite, notificarea se trimite oricum
    }

    const { userId, title, message, actionUrl, entityType, entityId } = dto;
    const saved = await this.repo.save(this.repo.create({ userId, title, message, actionUrl, entityType, entityId, type }));

            // Trimite o copie si pe email
    if (user && EMAIL_WORTHY_TYPES.includes(type) && user.notificationPreferences?.email === true) {
      this.mailService
        .sendNotificationEmail(user.email, user.firstName, dto.title, dto.message)
        .then(() => this.repo.update(saved.id, { isEmailSent: true }))
        .catch((err) => this.logger.warn(`Email notification failed for ${user!.email}: ${err.message}`));
    }

    return saved;
  }
  async createBulk(userIds: string[], dto: { type: NotificationType; title: string; message: string; actionUrl?: string }) {
    const notifs = userIds.map(uid => this.repo.create({ ...dto, userId: uid }));
    return this.repo.save(notifs);
  }
  async getCount(userId: string) { return this.repo.count({ where: { userId, isRead: false } }); }
}