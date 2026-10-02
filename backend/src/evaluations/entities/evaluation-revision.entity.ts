import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { User } from '../../users/entities/user.entity';

// O corectura facuta dupa finalizarea evaluarii: cine, cand, de ce si cum arata evaluarea inainte
@Entity('evaluation_revisions')
export class EvaluationRevision {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() evaluationId: string;
  @ManyToOne(() => Evaluation, (e) => e.revisions) @JoinColumn({ name: 'evaluationId' }) evaluation: Evaluation;
  @Column({ nullable: true }) changedById: string;
  @ManyToOne(() => User, { eager: true, nullable: true }) @JoinColumn({ name: 'changedById' }) changedBy: User;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) oldTotalScore: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) newTotalScore: number;
  @Column({ type: 'text' }) reason: string;
  // Scorurile si feedback-ul dinaintea corecturii, pe criterii
  @Column({ type: 'jsonb' }) snapshot: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
}
