import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { Milestone } from '../../projects/entities/milestone.entity';
export enum TaskStatus { TODO='todo', IN_PROGRESS='in_progress', IN_REVIEW='in_review', DONE='done', BLOCKED='blocked' }
export enum TaskPriority { LOW='low', MEDIUM='medium', HIGH='high', CRITICAL='critical' }
@Entity('tasks') export class Task {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 300 }) title: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO }) status: TaskStatus;
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM }) priority: TaskPriority;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.tasks) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column({ nullable: true }) milestoneId?: string;
  @ManyToOne(() => Milestone, { nullable: true }) @JoinColumn({ name: 'milestoneId' }) milestone?: Milestone;
  @Column({ nullable: true }) assigneeId?: string;
  @ManyToOne(() => User, { eager: true, nullable: true }) @JoinColumn({ name: 'assigneeId' }) assignee?: User;
  @Column({ nullable: true }) reporterId: string;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'reporterId' }) reporter: User;
  @Column({ type: 'date', nullable: true }) dueDate?: Date;
  @Column({ nullable: true, type: 'decimal' }) estimatedHours?: number;
  @Column({ nullable: true, type: 'decimal' }) loggedHours?: number;
  @Column({ default: 0 }) order: number;
  @Column({ type: 'simple-array', nullable: true }) tags?: string[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
