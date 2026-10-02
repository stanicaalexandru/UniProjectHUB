import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
export enum RoomType { PROJECT='project', TEAM='team', DIRECT='direct', GENERAL='general' }
@Entity('chat_rooms') export class ChatRoom {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ nullable: true }) name?: string;
  @Column({ type: 'enum', enum: RoomType, default: RoomType.PROJECT }) type: RoomType;
  @Column({ nullable: true }) entityId?: string;
  @Column({ type: 'simple-array', nullable: true }) memberIds: string[];
  @Column({ default: true }) isActive: boolean;
  @OneToMany(() => ChatMessage, (m) => m.room, { cascade: true }) messages: ChatMessage[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
