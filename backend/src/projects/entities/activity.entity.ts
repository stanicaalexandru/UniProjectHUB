import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() action: string;
  @Column({ nullable: true }) description?: string;
  @Column({ nullable: true }) entityType?: string;
  @Column({ nullable: true }) entityId?: string;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.activities) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column({ nullable: true }) userId: string;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'jsonb', nullable: true }) metadata?: Record<string, unknown>;
  @CreateDateColumn() createdAt: Date;
}
