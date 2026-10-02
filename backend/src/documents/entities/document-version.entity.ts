import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Document } from './document.entity';
import { User } from '../../users/entities/user.entity';
@Entity('document_versions') export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) documentId: string;
  @ManyToOne(() => Document, (d) => d.versions) @JoinColumn({ name: 'documentId' }) document: Document;
  @Column() version: number;
  @Column() filename: string;
  @Column() storagePath: string;
  @Column({ type: 'bigint' }) size: number;
  @Column({ nullable: true, type: 'text' }) changelog?: string;
  @Column({ nullable: true }) uploadedById: string;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'uploadedById' }) uploadedBy: User;
  @CreateDateColumn() createdAt: Date;
}
