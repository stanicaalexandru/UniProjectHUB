// evaluation-criteria.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Evaluation } from './evaluation.entity';
@Entity('evaluation_criteria') export class EvaluationCriteria {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) evaluationId: string;
  @ManyToOne(() => Evaluation, (e) => e.criteria) @JoinColumn({ name: 'evaluationId' }) evaluation: Evaluation;
  @Column() name: string;
  @Column({ nullable: true, type: 'text' }) description?: string;
  @Column({ type: 'decimal', precision: 4, scale: 2 }) score: number;
  @Column({ type: 'decimal', precision: 4, scale: 2 }) maxScore: number;
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 }) weight: number;
  @Column({ nullable: true, type: 'text' }) feedback?: string;
}
