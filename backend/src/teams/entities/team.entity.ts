import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TeamMember } from './team-member.entity';
@Entity('teams') export class Team {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 150 }) name: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ nullable: true }) avatar?: string;
  @Column({ default: 5 }) maxMembers: number;
  @Column({ default: false }) isPublic: boolean;
  @Column({ nullable: true }) faculty?: string;
  @Column({ nullable: true }) department?: string;
  @Column({ type: 'jsonb', nullable: true, default: {} }) metadata: Record<string, unknown>;
  @OneToMany(() => TeamMember, (tm) => tm.team, { cascade: true }) members: TeamMember[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
