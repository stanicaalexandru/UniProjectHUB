import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { EvaluationCriteria } from './evaluation-criteria.entity';
import { EvaluationRevision } from './evaluation-revision.entity';
export enum EvaluationStatus { DRAFT='draft', IN_PROGRESS='in_progress', COMPLETED='completed' }
export enum EvaluationPhase { PROPOSAL='proposal', MIDTERM='midterm', FINAL='final', DEFENSE='defense' }
@Entity('evaluations') export class Evaluation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.evaluations) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column({ nullable: true }) evaluatorId: string;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'evaluatorId' }) evaluator: User;
  @Column({ type: 'enum', enum: EvaluationStatus, default: EvaluationStatus.DRAFT }) status: EvaluationStatus;
  @Column({ type: 'enum', enum: EvaluationPhase }) phase: EvaluationPhase;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) totalScore?: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) maxScore?: number;
  @Column({ type: 'text', nullable: true }) generalFeedback?: string;
  @Column({ type: 'text', nullable: true }) strengths?: string;
  @Column({ type: 'text', nullable: true }) improvements?: string;
  @Column({ nullable: true }) completedAt?: Date;
  @OneToMany(() => EvaluationCriteria, (c) => c.evaluation, { cascade: true }) criteria: EvaluationCriteria[];
  @OneToMany(() => EvaluationRevision, (r) => r.evaluation) revisions: EvaluationRevision[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
