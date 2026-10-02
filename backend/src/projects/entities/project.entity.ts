import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Team } from '../../teams/entities/team.entity';
import { Milestone } from './milestone.entity';
import { Comment } from './comment.entity';
import { Activity } from './activity.entity';
import { Document } from '../../documents/entities/document.entity';
import { Evaluation } from '../../evaluations/entities/evaluation.entity';
import { Task } from '../../tasks/entities/task.entity';
import { AiAnalysis } from '../../ai/entities/ai-analysis.entity';

export enum ProjectStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  APPROVED = 'approved',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  REJECTED = 'rejected',
}

export enum ProjectType {
  BACHELOR_THESIS = 'bachelor_thesis',
  MASTER_THESIS = 'master_thesis',
  RESEARCH = 'research',
  INDUSTRIAL = 'industrial',
  OPEN_SOURCE = 'open_source',
  COMPETITION = 'competition',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('projects')
@Index(['status'])
@Index(['coordinatorId'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  objectives?: string;

  @Column({ type: 'enum', enum: ProjectType, default: ProjectType.BACHELOR_THESIS })
  type: ProjectType;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ type: 'enum', enum: ProjectPriority, default: ProjectPriority.MEDIUM })
  priority: ProjectPriority;

  @Column({ nullable: true })
  coordinatorId: string;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'coordinatorId' })
  coordinator: User;

  @Column({ nullable: true })
  teamId: string;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ nullable: true })
  repository?: string;

  @Column({ nullable: true })
  demoUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'simple-array', nullable: true })
  technologies?: string[];

  @Column({ nullable: true })
  faculty?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true, type: 'integer' })
  academicYear?: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  finalGrade?: number;

  @Column({ default: 0 })
  progressPercentage: number;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  settings: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Milestone, (m) => m.project, { cascade: true })
  milestones: Milestone[];

  @OneToMany(() => Task, (t) => t.project, { cascade: true })
  tasks: Task[];

  @OneToMany(() => Comment, (c) => c.project, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Activity, (a) => a.project, { cascade: true })
  activities: Activity[];

  @OneToMany(() => Document, (d) => d.project, { cascade: true })
  documents: Document[];

  @OneToMany(() => Evaluation, (e) => e.project, { cascade: true })
  evaluations: Evaluation[];

  @OneToMany(() => AiAnalysis, (a) => a.project, { cascade: true })
  aiAnalyses: AiAnalysis[];
}
