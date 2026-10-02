import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';
export enum InvitationStatus { PENDING='pending', ACCEPTED='accepted', REJECTED='rejected', EXPIRED='expired' }
@Entity('invitations') export class Invitation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() teamId: string;
  @ManyToOne(() => Team) @JoinColumn({ name: 'teamId' }) team: Team;
  @Column() invitedEmail: string;
  @Column({ nullable: true }) invitedUserId?: string;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'invitedUserId' }) invitedUser?: User;
  @Column() invitedById: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'invitedById' }) invitedBy: User;
  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING }) status: InvitationStatus;
  @Column({ unique: true }) token: string;
  @Column() expiresAt: Date;
  @CreateDateColumn() createdAt: Date;
}
