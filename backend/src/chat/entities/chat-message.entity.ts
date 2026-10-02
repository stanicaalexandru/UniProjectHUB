import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatRoom } from './chat-room.entity';
// Fisier atasat unui mesaj (salvat in uploads/chat)
export interface ChatAttachment { filename: string; originalName: string; mimeType: string; size: number }

export enum MessageType { TEXT='text', FILE='file', SYSTEM='system', CODE='code' }
@Entity('chat_messages') export class ChatMessage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) roomId: string;
  @ManyToOne(() => ChatRoom, (r) => r.messages) @JoinColumn({ name: 'roomId' }) room: ChatRoom;
  @Column({ nullable: true }) senderId: string;
  @ManyToOne(() => User, (u) => u.messages, { eager: true }) @JoinColumn({ name: 'senderId' }) sender: User;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT }) type: MessageType;
  @Column({ nullable: true }) parentId?: string;
  @Column({ default: false }) isEdited: boolean;
  @Column({ default: false }) isDeleted: boolean;
  @Column({ type: 'jsonb', nullable: true }) reactions?: Record<string, string[]>;
  @Column({ type: 'jsonb', nullable: true }) attachments?: ChatAttachment[] | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
