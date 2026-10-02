import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { pick } from '../access/project-access.service';
import { generateCode, hashSecret, secretMatches, CODE_TTL_MS, MAX_CODE_ATTEMPTS } from '../auth/codes';
import * as bcrypt from 'bcryptjs';
import { MailService } from './mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { appError } from '../common/errors';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private mailService: MailService,
    private notifications: NotificationsService,
  ) {}

  async findAll(filters: { role?: UserRole; status?: UserStatus; search?: string; page?: number; limit?: number }) {
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
    const qb = this.userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.firstName', 'u.lastName', 'u.email', 'u.role', 'u.status', 'u.faculty', 'u.department', 'u.avatar', 'u.createdAt'])
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (Object.values(UserRole).includes(filters.role)) qb.andWhere('u.role = :role', { role: filters.role });
    if (Object.values(UserStatus).includes(filters.status)) qb.andWhere('u.status = :status', { status: filters.status });
    if (filters.search) {
      qb.andWhere(`(u."firstName" || ' ' || u."lastName" ILIKE :search OR u.email ILIKE :search)`,
        { search: `%${String(filters.search).slice(0, 100)}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ 
      where: { id },
      select: ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'avatar', 'faculty', 'department', 'studyYear', 'bio', 'notificationPreferences', 'createdAt', 'updatedAt']
    });
    if (!user) throw new NotFoundException(appError('USER_NOT_FOUND'));
    return user;
  }

  // Doar campurile de profil; emailul nu se schimba aici (ar ocoli verificarea adresei)
  async updateProfile(id: string, input: UpdateUserDto, asAdmin = false): Promise<User> {
    const fields = ['firstName', 'lastName', 'faculty', 'department', 'studyYear', 'bio', 'phone',
      'notificationPreferences', 'favoriteProjects'] as const;
    const dto: Partial<User> = pick<User>(input, fields);
    const before = asAdmin ? await this.userRepo.findOne({ where: { id } }) : null;
    if (asAdmin) {
      if (Object.values(UserRole).includes(input?.role)) dto.role = input.role;
      if (Object.values(UserStatus).includes(input?.status)) dto.status = input.status;
    }
    if (Object.keys(dto).length) await this.userRepo.update(id, dto);
    // Profesorul aprobat de admin afla imediat ce se autentifica
    if (before?.status === UserStatus.PENDING_APPROVAL && dto.status === UserStatus.ACTIVE) {
      await this.notifications.notify([id], { type: NotificationType.SYSTEM, title: 'Cont aprobat',
        message: 'Contul tau de profesor a fost aprobat de un administrator. Bun venit in UniProject Hub!' });
      this.mailService.sendWelcomeEmail(before.email, before.firstName, before.role).catch(() => {});
    }
    return this.findOne(id);
  }

  // Poza de profil: doar imagini, ca data URL, de cel mult ~2 MB
  async setAvatar(id: string, avatar: string) {
    if (typeof avatar !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(avatar)) {
      throw new BadRequestException(appError('AVATAR_INVALID_TYPE'));
    }
    if (avatar.length > 2.8 * 1024 * 1024) throw new BadRequestException(appError('AVATAR_TOO_LARGE'));
    await this.userRepo.update(id, { avatar });
    return this.findOne(id);
  }

  async getStudents() {
    return this.userRepo.find({ where: { role: UserRole.STUDENT },
      select: ['id', 'firstName', 'lastName', 'email', 'faculty', 'department', 'studyYear'] });
  }

 async getProfessors() {
    return this.userRepo.find({ where: { role: UserRole.PROFESSOR },
      select: ['id', 'firstName', 'lastName', 'email', 'faculty', 'department'] });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(appError('USER_NOT_FOUND'));
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw new BadRequestException(appError('PASSWORD_TOO_SHORT'));
    if (typeof currentPassword !== 'string') throw new BadRequestException(appError('PASSWORD_WRONG'));
   const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException(appError('PASSWORD_WRONG'));
    const hashed = await bcrypt.hash(newPassword, 10);
    // Schimbarea parolei inchide celelalte sesiuni (refresh token invalidat)
    await this.userRepo.update(id, { password: hashed, refreshToken: null });
    return { success: true, message: 'Parola schimbata cu succes!' };
  }

  private async assertPassword(id: string, password: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(appError('USER_NOT_FOUND'));
    if (typeof password !== 'string' || !(await user.validatePassword(password))) throw new BadRequestException(appError('PASSWORD_WRONG'));
    return user;
  }

  async setPin(id: string, currentPassword: string, pin: string) {
    await this.assertPassword(id, currentPassword);
    await this.userRepo.update(id, { pin: await bcrypt.hash(pin, 10), isPinEnabled: true });
    return { success: true, isPinEnabled: true };
  }

  async removePin(id: string, currentPassword: string) {
    await this.assertPassword(id, currentPassword);
    await this.userRepo.update(id, { pin: null, isPinEnabled: false });
    return { success: true, isPinEnabled: false };
  }

  // Raspuns identic daca emailul exista sau nu, ca sa nu se poata afla ce conturi sunt inregistrate
  async requestPasswordReset(email: string) {
    const generic = { success: true, message: 'Daca exista un cont cu acest email, am trimis un cod de resetare.' };
    const user = typeof email === 'string' ? await this.userRepo.findOne({ where: { email } }) : null;
    if (!user || user.status !== UserStatus.ACTIVE) return generic;
    const code = generateCode();
    await this.userRepo.update(user.id, {
      passwordResetToken: hashSecret(code), passwordResetExpires: new Date(Date.now() + CODE_TTL_MS), codeAttempts: 0,
    });
    try { await this.mailService.sendPasswordResetEmail(user.email, code, user.firstName); } catch { /* raspuns generic, ca la verificare */ }
    return generic;
  }

  async resetPasswordWithCode(email: string, code: string, newPassword: string) {
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw new BadRequestException(appError('PASSWORD_TOO_SHORT'));
    const user = typeof email === 'string' ? await this.userRepo.findOne({ where: { email } }) : null;
    const invalid = new BadRequestException(appError('RESET_CODE_INVALID'));
    if (!user || !user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires < new Date()
      || user.codeAttempts >= MAX_CODE_ATTEMPTS) throw invalid;
    if (!secretMatches(code, user.passwordResetToken)) {
      await this.userRepo.update(user.id, { codeAttempts: user.codeAttempts + 1 });
      throw invalid;
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, {
      password: hashed, passwordResetToken: null, passwordResetExpires: null, codeAttempts: 0,
      refreshToken: null, failedLoginAttempts: 0, lockoutUntil: null,
    });
    return { success: true, message: 'Parola schimbata cu succes!' };
  }

  // Stergerea contului (GDPR art. 17). Datele personale se sterg, contributiile comune cu echipa
  // raman, dar fara autor. Totul intr-o singura tranzactie: daca un pas esueaza, nu se sterge nimic.
  // Cheile straine spre users sunt NO ACTION, deci daca pe viitor apare un tabel netratat aici,
  // DELETE-ul final esueaza si tranzactia se anuleaza, in loc sa lase date orfane.
  async deleteAccount(id: string, password: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(appError('USER_NOT_FOUND'));
    if (!password || !(await user.validatePassword(password))) {
      throw new BadRequestException(appError('PASSWORD_WRONG'));
    }
    if (user.role === UserRole.ADMIN) {
      const admins = await this.userRepo.count({ where: { role: UserRole.ADMIN } });
      if (admins <= 1) throw new ForbiddenException(appError('LAST_ADMIN'));
    }

    await this.userRepo.manager.transaction(async (em) => {
      // 1. Echipele in care e lider primesc ca lider cel mai vechi membru activ ramas
      const led: { teamId: string }[] = await em.query(
        `SELECT "teamId" FROM team_members WHERE "userId" = $1 AND role = 'leader'`, [id]);
      for (const { teamId } of led) {
        await em.query(
          `UPDATE team_members SET role = 'leader' WHERE id = (
             SELECT id FROM team_members WHERE "teamId" = $1 AND "userId" <> $2 AND "isActive"
             ORDER BY "joinedAt" LIMIT 1)`, [teamId, id]);
      }

      // 2. Date care apartin doar userului: se sterg
      await em.query(`DELETE FROM team_members WHERE "userId" = $1`, [id]);
      await em.query(`DELETE FROM notifications WHERE "userId" = $1`, [id]);
      await em.query(`DELETE FROM team_join_requests WHERE "userId" = $1`, [id]);
      await em.query(
        `DELETE FROM invitations WHERE "invitedById" = $1 OR "invitedUserId" = $1 OR lower("invitedEmail") = lower($2)`,
        [id, user.email]);

      // 3. Contributii comune: raman, dar autorul devine NULL ("Utilizator sters" in interfata)
      const anonymize: [string, string][] = [
        ['documents', 'uploadedById'], ['document_versions', 'uploadedById'],
        ['tasks', 'assigneeId'], ['tasks', 'reporterId'],
        ['comments', 'authorId'], ['activities', 'userId'], ['chat_messages', 'senderId'],
        ['evaluations', 'evaluatorId'], ['evaluation_revisions', 'changedById'], ['projects', 'coordinatorId'], ['projects', 'createdById'],
      ];
      for (const [table, column] of anonymize) {
        await em.query(`UPDATE ${table} SET "${column}" = NULL WHERE "${column}" = $1`, [id]);
      }

      // 4. ID-uri pastrate in liste, nu in chei straine: le scoatem manual
      await em.query(
        `UPDATE chat_rooms SET "memberIds" = array_to_string(array_remove(string_to_array("memberIds", ','), $1), ',')
         WHERE "memberIds" LIKE '%' || $1 || '%'`, [id]);
      const reacted: { id: string; reactions: Record<string, string[]> }[] = await em.query(
        `SELECT id, reactions FROM chat_messages WHERE reactions::text LIKE '%' || $1 || '%'`, [id]);
      for (const msg of reacted) {
        const cleaned: Record<string, string[]> = {};
        for (const [emoji, userIds] of Object.entries(msg.reactions)) {
          const rest = userIds.filter((u) => u !== id);
          if (rest.length) cleaned[emoji] = rest;
        }
        await em.query(`UPDATE chat_messages SET reactions = $1 WHERE id = $2`, [JSON.stringify(cleaned), msg.id]);
      }

      // 5. Randul userului: nume, email, telefon, avatar, parola, PIN etc.
      await em.query(`DELETE FROM users WHERE id = $1`, [id]);
    });

    return { success: true, message: 'Contul a fost sters.' };
  }
}
