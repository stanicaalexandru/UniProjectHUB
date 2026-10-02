import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
export enum AnalysisType { PROGRESS_SCORE='progress_score', RISK_ASSESSMENT='risk_assessment', RECOMMENDATIONS='recommendations', COMPLETION_PREDICTION='completion_prediction', QUALITY_ASSESSMENT='quality_assessment' }
@Entity('ai_analyses') export class AiAnalysis {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.aiAnalyses) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column({ type: 'enum', enum: AnalysisType }) type: AnalysisType;
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true }) score?: number;
  @Column({ type: 'jsonb' }) result: Record<string, unknown>;
  @Column({ nullable: true, type: 'text' }) summary?: string;
  @Column({ nullable: true, type: 'text' }) recommendations?: string;
  @Column({ default: 'rule-based' }) model: string;
  @CreateDateColumn() createdAt: Date;
}
