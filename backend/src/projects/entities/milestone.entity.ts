import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from './project.entity';
import { Task } from '../../tasks/entities/task.entity';

export enum MilestoneStatus { PENDING='pending', IN_PROGRESS='in_progress', COMPLETED='completed', OVERDUE='overdue' }

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 200 }) title: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING }) status: MilestoneStatus;
  @Column({ type: 'date' }) dueDate: Date;
  @Column({ type: 'date', nullable: true }) completedAt?: Date;
  @Column({ default: 0 }) order: number;
  @Column({ default: 0 }) progressPercentage: number;
  @Column({ nullable: true }) deliverables?: string;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.milestones) @JoinColumn({ name: 'projectId' }) project: Project;
  @OneToMany(() => Task, (t) => t.milestone) tasks: Task[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
