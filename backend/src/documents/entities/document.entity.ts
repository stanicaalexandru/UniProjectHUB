import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentVersion } from './document-version.entity';
export enum DocumentType { THESIS='thesis', PRESENTATION='presentation', REPORT='report', CODE='code', MEDIA='media', OTHER='other' }
@Entity('documents') export class Document {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 300 }) name: string;
  @Column({ nullable: true, type: 'text' }) description?: string;
  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER }) type: DocumentType;
  @Column() filename: string;
  @Column() originalName: string;
  @Column() mimeType: string;
  @Column({ type: 'bigint' }) size: number;
  @Column() storagePath: string;
  @Column({ nullable: true }) thumbnailPath?: string;
  @Column({ nullable: true, type: 'text' }) extractedText?: string;
  @Column({ nullable: true }) projectId: string;
  @ManyToOne(() => Project, (p) => p.documents) @JoinColumn({ name: 'projectId' }) project: Project;
  @Column({ nullable: true }) milestoneId?: string;
  @Column({ nullable: true }) uploadedById: string;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'uploadedById' }) uploadedBy: User;
  @Column({ default: 1 }) currentVersion: number;
  @Column({ default: false }) isPublic: boolean;
  @Column({ type: 'simple-array', nullable: true }) tags?: string[];
  @Column({ nullable: true }) plagiarismScore?: number;
  @Column({ type: 'jsonb', nullable: true, default: {} }) metadata: Record<string, unknown>;
  @OneToMany(() => DocumentVersion, (v) => v.document, { cascade: true }) versions: DocumentVersion[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
