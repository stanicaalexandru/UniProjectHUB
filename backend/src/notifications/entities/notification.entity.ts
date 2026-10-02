import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
export enum NotificationType { INFO='info', SUCCESS='success', WARNING='warning', ERROR='error', DEADLINE='deadline', MENTION='mention', EVALUATION='evaluation', TEAM='team', SYSTEM='system' }
@Entity('notifications') export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) userId: string;
  @ManyToOne(() => User, (u) => u.notifications) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO }) type: NotificationType;
  @Column({ length: 200 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ nullable: true }) actionUrl?: string;
  @Column({ nullable: true }) entityType?: string;
  @Column({ nullable: true }) entityId?: string;
  @Column({ default: false }) isRead: boolean;
  @Column({ default: false }) isEmailSent: boolean;
  @Column({ type: 'jsonb', nullable: true }) metadata?: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
}
