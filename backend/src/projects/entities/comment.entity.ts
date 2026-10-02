import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'text' }) content: string;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.comments) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column({ nullable: true }) authorId: string;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'authorId' }) author: User;
  @Column({ nullable: true }) parentId?: string;
  @ManyToOne(() => Comment, { nullable: true }) @JoinColumn({ name: 'parentId' }) parent?: Comment;
  @Column({ default: false }) isEdited: boolean;
  @Column({ type: 'jsonb', nullable: true }) attachments?: Record<string, unknown>[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
