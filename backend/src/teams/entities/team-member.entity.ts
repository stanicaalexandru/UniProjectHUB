import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';
export enum TeamRole { LEADER='leader', MEMBER='member' }
@Entity('team_members') export class TeamMember {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) teamId: string;
  @ManyToOne(() => Team, (t) => t.members) @JoinColumn({ name: 'teamId' }) team: Team;
  @Column({ nullable: true }) userId: string;
  @ManyToOne(() => User, (u) => u.teamMemberships, { eager: true }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'enum', enum: TeamRole, default: TeamRole.MEMBER }) role: TeamRole;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() joinedAt: Date;
}
