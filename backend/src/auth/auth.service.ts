import * as bcrypt from 'bcryptjs';
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { MailService } from '../users/mail.service';
import { toSelfView } from '../users/user-view';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { generateCode, hashSecret, secretMatches, CODE_TTL_MS, MAX_CODE_ATTEMPTS } from './codes';
import { appError } from '../common/errors';
import { isShowcase, skipsEmailVerification } from '../common/showcase';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
// La inregistrare se poate alege doar student sau profesor; profesorii asteapta aprobarea unui admin
const SELF_SERVICE_ROLES = [UserRole.STUDENT, UserRole.PROFESSOR];

export type RegisterInput = {
  firstName: string; lastName: string; email: string; password: string;
  role?: UserRole; faculty?: string; department?: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private notifications: NotificationsService,
  ) {}

  async register(dto: RegisterInput): Promise<{ message: string; email: string } | TokenPair> {
    const role = SELF_SERVICE_ROLES.includes(dto.role) ? dto.role : UserRole.STUDENT;
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException(appError('EMAIL_TAKEN'));

    const code = generateCode();
    const user = this.userRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      role,
      faculty: dto.faculty,
      department: dto.department,
      termsAcceptedAt: new Date(),
      status: UserStatus.PENDING_VERIFICATION,
      emailVerificationToken: hashSecret(code),
      emailVerificationExpires: new Date(Date.now() + CODE_TTL_MS),
      codeAttempts: 0,
    });
    await this.userRepo.save(user);

    // Demo fara server de email: contul e activat direct si se deschide sesiunea
    if (skipsEmailVerification()) {
      await this.userRepo.update(user.id, {
        status: UserStatus.ACTIVE, emailVerificationToken: null, emailVerificationExpires: null,
      });
      user.status = UserStatus.ACTIVE;
      return this.generateTokens(user);
    }

    try {
      await this.mailService.sendVerificationCode(dto.email, code, dto.firstName);
    } catch {
      // // Contul exista deja; utilizatorul poate cere un cod nou din ecranul de confirmare
    }

    return { message: 'Verification code sent', email: dto.email };
  }

  async verifyEmail(email: string, code: string): Promise<TokenPair | { pendingApproval: true; message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || user.status !== UserStatus.PENDING_VERIFICATION) throw new BadRequestException(appError('VERIFICATION_CODE_INVALID'));

    const expires = user.emailVerificationExpires;
    if (!user.emailVerificationToken || !expires || expires < new Date() || user.codeAttempts >= MAX_CODE_ATTEMPTS) {
      throw new BadRequestException(appError('VERIFICATION_CODE_EXPIRED'));
    }
    if (!secretMatches(code, user.emailVerificationToken)) {
      await this.userRepo.update(user.id, { codeAttempts: user.codeAttempts + 1 });
      throw new BadRequestException(appError('VERIFICATION_CODE_INVALID'));
    }

    // Profesorii intra in asteptare pana ii aproba un admin; studentii sunt activi imediat.
    // In demo-ul public adminul nu e accesibil vizitatorilor, deci si profesorii sunt activati direct.
    const status = user.role === UserRole.PROFESSOR && !isShowcase() ? UserStatus.PENDING_APPROVAL : UserStatus.ACTIVE;
    await this.userRepo.update(user.id, {
      status, emailVerificationToken: null, emailVerificationExpires: null, codeAttempts: 0,
    });
    user.status = status;
    if (status === UserStatus.PENDING_APPROVAL) {
      const admins = await this.userRepo.find({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } });
      await this.notifications.notify(admins.map((a) => a.id), {
        type: NotificationType.SYSTEM, title: 'Cont de profesor de aprobat',
        message: `${user.firstName} ${user.lastName} (${user.email}) s-a înregistrat ca profesor și așteaptă aprobarea.`,
        actionUrl: '/users', entityType: 'user', entityId: user.id,
      });
      return { pendingApproval: true, message: 'Email confirmat. Contul de profesor va fi activat după aprobarea unui administrator.' };
    }
    // Emailul de bun venit nu trebuie sa blocheze autentificarea daca serverul de email nu raspunde
    this.mailService.sendWelcomeEmail(user.email, user.firstName, user.role).catch(() => {});
    return this.generateTokens(user);
  }

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    // Raspuns identic in ambele cazuri, ca sa nu se poata afla ce conturi exista
    const generic = { message: 'If the account exists, a new code has been sent' };
    if (!user || user.status !== UserStatus.PENDING_VERIFICATION) return generic;
    const code = generateCode();
    await this.userRepo.update(user.id, {
      emailVerificationToken: hashSecret(code),
      emailVerificationExpires: new Date(Date.now() + CODE_TTL_MS),
      codeAttempts: 0,
    });
    try {
      await this.mailService.sendVerificationCode(user.email, code, user.firstName);
    } catch {
      // Raspunsul ramane acelasi indiferent daca emailul a plecat (nu dezvaluim ce conturi exista)
    }
    return generic;
  }

  async login(email: string, password: string): Promise<TokenPair | { pinRequired: true; pinToken: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException(appError('INVALID_CREDENTIALS'));

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new HttpException(appError('ACCOUNT_LOCKED', { minutes }), HttpStatus.TOO_MANY_REQUESTS);
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lock = attempts >= MAX_LOGIN_ATTEMPTS;
      await this.userRepo.update(user.id, {
        failedLoginAttempts: lock ? 0 : attempts,
        lockoutUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : user.lockoutUntil,
      });
      throw new UnauthorizedException(appError('INVALID_CREDENTIALS'));
    }

    // Statusul contului se verifica abia dupa parola corecta, ca sa nu dezvaluim starea conturilor altora
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) throw new UnauthorizedException(appError('ACCOUNT_SUSPENDED'));
    if (user.status === UserStatus.PENDING_VERIFICATION) throw new ForbiddenException(appError('EMAIL_NOT_VERIFIED'));
    if (user.status === UserStatus.PENDING_APPROVAL) {
      throw new ForbiddenException(appError('ACCOUNT_PENDING_APPROVAL'));
    }

    // Cu PIN activ, parola corecta nu deschide inca sesiunea: primeste doar un bilet de 5 minute pentru pasul PIN
    if (user.isPinEnabled && user.pin) {
      const pinToken = this.jwtService.sign({ sub: user.id, purpose: 'pin' }, { secret: this.pinSecret(), expiresIn: '5m' });
      return { pinRequired: true, pinToken };
    }
    await this.userRepo.update(user.id, { failedLoginAttempts: 0, lockoutUntil: null });
    return this.generateTokens(user);
  }

  // Cheie separata pentru biletele PIN: un bilet nu poate fi folosit ca token de sesiune (si invers)
  private pinSecret() {
    return `${this.configService.getOrThrow('JWT_SECRET')}:login-pin`;
  }

  async verifyLoginPin(pinToken: string, pin: string): Promise<TokenPair> {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(pinToken, { secret: this.pinSecret() });
    } catch {
      throw new UnauthorizedException(appError('LOGIN_STEP_EXPIRED'));
    }
    if (payload.purpose !== 'pin') throw new UnauthorizedException(appError('INVALID_CREDENTIALS'));
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE || !user.isPinEnabled || !user.pin) throw new UnauthorizedException(appError('INVALID_CREDENTIALS'));

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new HttpException(appError('ACCOUNT_LOCKED', { minutes }), HttpStatus.TOO_MANY_REQUESTS);
    }
    // PIN-urile gresite se aduna la acelasi contor ca parolele gresite: dupa 5, contul se blocheaza 15 minute
    if (typeof pin !== 'string' || !(await bcrypt.compare(pin, user.pin))) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lock = attempts >= MAX_LOGIN_ATTEMPTS;
      await this.userRepo.update(user.id, {
        failedLoginAttempts: lock ? 0 : attempts,
        lockoutUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : user.lockoutUntil,
      });
      throw new UnauthorizedException(appError('PIN_INVALID'));
    }
    await this.userRepo.update(user.id, { failedLoginAttempts: 0, lockoutUntil: null });
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status !== UserStatus.ACTIVE || !secretMatches(refreshToken, user.refreshToken)) {
        throw new UnauthorizedException(appError('SESSION_EXPIRED'));
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException(appError('SESSION_EXPIRED'));
    }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: null });
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    // In baza de date doar hash-ul: o scurgere din DB nu mai da sesiuni valide
    await this.userRepo.update(user.id, { refreshToken: hashSecret(refreshToken) });
    return { accessToken, refreshToken, user: toSelfView(user) };
  }
}
