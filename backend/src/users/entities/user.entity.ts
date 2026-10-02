import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsEmail } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { TeamMember } from '../../teams/entities/team-member.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';

export enum UserRole {
  ADMIN = 'admin',
  PROFESSOR = 'professor',
  STUDENT = 'student',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  // Cont de profesor cu emailul confirmat, care asteapta aprobarea unui administrator
  PENDING_APPROVAL = 'pending_approval',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ nullable: true })
  avatar?: string;

  // Vizibil doar proprietarului (vezi toSelfView din users/user-view.ts); ascuns in raspunsurile despre alti useri
  @Column({ nullable: true })
  @Exclude()
  phone?: string;

  @Column({ nullable: true })
  faculty?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  studyYear?: number;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  // Hash-ul (SHA-256) refresh token-ului curent, nu token-ul in clar
  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

  // Incercari gresite pentru codul curent (confirmare email / resetare parola); la 5, codul se anuleaza
  @Column({ default: 0 })
  @Exclude()
  codeAttempts: number;

  // PIN de securitate (pas suplimentar la autentificare): doar hash-ul bcrypt; verificat pe server
  // inainte de a deschide sesiunea (vezi AuthService.login / verifyLoginPin)
  @Column({ nullable: true })
  @Exclude()
  pin?: string;

  // Ascuns in raspunsurile despre alti useri (nu dezvaluim cum isi protejeaza contul); vizibil proprietarului
  @Column({ default: false })
  @Exclude()
  isPinEnabled: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken?: string;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationExpires?: Date;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken?: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetExpires?: Date;

  // Momentul in care userul a acceptat Termenii si Politica de confidentialitate (dovada consimtamantului, art. 7 GDPR)
  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  termsAcceptedAt?: Date;

  @Column({ default: 0 })
  @Exclude()
  failedLoginAttempts: number;

  @Column({ nullable: true })
  @Exclude()
  lockoutUntil?: Date;

  // Preferintele si favoritele sunt personale: apar doar in datele userului despre el insusi (toSelfView)
  @Column({ type: 'jsonb', nullable: true, default: {} })
  @Exclude()
  notificationPreferences: Record<string, boolean>;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  @Exclude()
  favoriteProjects: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TeamMember, (tm) => tm.user)
  teamMemberships: TeamMember[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => ChatMessage, (m) => m.sender)
  messages: ChatMessage[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Exclude()
  get isLocked(): boolean {
    return this.lockoutUntil && this.lockoutUntil > new Date();
  }
}
