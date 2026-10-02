import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ChatRoom, RoomType } from './entities/chat-room.entity';
import { ChatMessage, ChatAttachment } from './entities/chat-message.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { ProjectAccessService } from '../access/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { appError } from '../common/errors';

export { CHAT_UPLOAD_DIR } from '../common/uploads';
import { CHAT_UPLOAD_DIR } from '../common/uploads';
const MAX_MESSAGE = 5000;

// Membrii unei camere se calculeaza pe server, din echipa sau proiectul camerei (niciodata din ce trimite clientul).
// Camere suportate: echipa (membrii + profesorii/adminii, ca in interfata) si proiect (cine are acces la proiect).
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom) private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatMessage) private msgRepo: Repository<ChatMessage>,
    @InjectRepository(TeamMember) private memberRepo: Repository<TeamMember>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private access: ProjectAccessService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  private async canAccessEntity(user: User, type: RoomType, entityId: string): Promise<boolean> {
    if (!entityId) return false;
    if (type === RoomType.TEAM) return !!(await this.access.teamRole(user, entityId));
    if (type === RoomType.PROJECT) {
      try { await this.access.assertProject(user, entityId); return true; } catch { return false; }
    }
    return false;
  }

  async assertRoom(roomId: string, user: User): Promise<ChatRoom> {
    const room = roomId ? await this.roomRepo.findOne({ where: { id: roomId } }) : null;
    if (!room || !(await this.canAccessEntity(user, room.type, room.entityId))) throw new NotFoundException(appError('CHAT_ROOM_NOT_FOUND'));
    return room;
  }

  // Participantii care primesc notificari: echipa, respectiv coordonatorul si echipa proiectului
  private async participantIds(room: ChatRoom): Promise<string[]> {
    // Conversatia echipei: membrii si profesorii care coordoneaza proiecte ale echipei
    if (room.type === RoomType.TEAM) {
      const members = (await this.memberRepo.find({ where: { teamId: room.entityId } })).map((m) => m.userId);
      return [...new Set([...members, ...(await this.access.teamCoordinatorIds(room.entityId))])];
    }
    const { coordinatorId, memberIds } = await this.access.audience(room.entityId);
    return [coordinatorId, ...memberIds].filter(Boolean) as string[];
  }

  async findOrCreateRoom(entityId: string, type: RoomType, user: User) {
    if (![RoomType.TEAM, RoomType.PROJECT].includes(type)) throw new BadRequestException(appError('CHAT_ROOM_TYPE_INVALID'));
    if (!(await this.canAccessEntity(user, type, entityId))) throw new NotFoundException(appError('CHAT_ROOM_NOT_FOUND'));
    let room = await this.roomRepo.findOne({ where: { entityId, type } });
    if (!room) room = await this.roomRepo.save(this.roomRepo.create({ entityId, type, memberIds: [] }));
    return room;
  }

  async getMessages(roomId: string, user: User, limit = 50) {
    await this.assertRoom(roomId, user);
    const take = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const messages = await this.msgRepo.find({ where: { roomId, isDeleted: false }, relations: ['sender'], order: { createdAt: 'DESC' }, take });
    const parentIds = messages.map((m) => m.parentId).filter(Boolean) as string[];
    if (parentIds.length === 0) return messages;
    const parents = await this.msgRepo.find({ where: { id: In(parentIds), roomId }, relations: ['sender'] });
    const parentMap = new Map(parents.map((p) => [p.id, p]));
    return messages.map((m) => ({
      ...m,
      parent: m.parentId ? parentMap.get(m.parentId) || null : null,
    }));
  }

  // Atasamentele trebuie sa fie fisiere incarcate efectiv in folderul de chat; pastram doar campurile sigure
  private sanitizeAttachments(attachments: unknown): ChatAttachment[] | null {
    if (!Array.isArray(attachments) || !attachments.length) return null;
    const clean = attachments.slice(0, 10).map((a: Partial<ChatAttachment> | null) => {
      const filename = path.basename(String(a?.filename || ''));
      if (!filename || !fs.existsSync(path.resolve(CHAT_UPLOAD_DIR, filename))) throw new BadRequestException(appError('ATTACHMENT_INVALID'));
      return { filename, originalName: String(a?.originalName || filename).slice(0, 255), mimeType: String(a?.mimeType || ''), size: Number(a?.size) || 0 };
    });
    return clean;
  }

  async sendMessage(roomId: string, sender: User, content: string, parentId?: string, attachments?: unknown[]) {
    const room = await this.assertRoom(roomId, sender);
    const text = typeof content === 'string' ? content.slice(0, MAX_MESSAGE) : '';
    const cleanAttachments = this.sanitizeAttachments(attachments);
    if (!text.trim() && !cleanAttachments) throw new BadRequestException(appError('MESSAGE_EMPTY'));
    if (parentId && !(await this.msgRepo.exist({ where: { id: parentId, roomId } }))) parentId = undefined;
    const msg = await this.msgRepo.save(this.msgRepo.create({ roomId, senderId: sender.id, content: text, parentId, attachments: cleanAttachments }));
    await this.notifyParticipants(room, sender, text);
    return this.msgRepo.findOne({ where: { id: msg.id }, relations: ['sender'] });
  }

  private async notifyParticipants(room: ChatRoom, sender: User, text: string) {
    const ids = await this.participantIds(room);
    const users = ids.length ? await this.userRepo.find({ where: { id: In(ids) } }) : [];
    const preview = text ? `"${text.length > 60 ? `${text.slice(0, 60)}...` : text}"` : 'a trimis un fisier';
    const senderName = `${sender.firstName} ${sender.lastName}`;
    const mentioned = users.filter((u) => text.includes(`@${u.firstName} ${u.lastName}`)).map((u) => u.id);
    const base = { actionUrl: '/chat', entityType: 'chat_room', entityId: room.id };
    await this.notifications.notify(mentioned, { type: NotificationType.MENTION, title: `Ai fost mentionat de ${senderName}`, message: preview, ...base },
      { exclude: sender.id, pref: 'chat' });
    await this.notifications.notify(ids.filter((id) => !mentioned.includes(id)),
      { type: NotificationType.INFO, title: 'Mesaj nou', message: `${senderName}: ${preview}`, ...base }, { exclude: sender.id, pref: 'chat' });
  }

  async editMessage(id: string, user: User, content: string) {
    const msg = await this.msgRepo.findOne({ where: { id, isDeleted: false } });
    if (!msg) throw new NotFoundException(appError('MESSAGE_NOT_FOUND'));
    await this.assertRoom(msg.roomId, user);
    if (msg.senderId !== user.id) throw new ForbiddenException(appError('MESSAGE_OWN_ONLY'));
    if (typeof content !== 'string' || !content.trim()) throw new BadRequestException(appError('MESSAGE_EMPTY'));
    await this.msgRepo.update(id, { content: content.slice(0, MAX_MESSAGE), isEdited: true });
    return this.msgRepo.findOne({ where: { id }, relations: ['sender'] });
  }

  async deleteMessage(id: string, user: User) {
    const msg = await this.msgRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException(appError('MESSAGE_NOT_FOUND'));
    await this.assertRoom(msg.roomId, user);
    if (msg.senderId !== user.id && user.role !== UserRole.ADMIN) throw new ForbiddenException(appError('MESSAGE_OWN_ONLY'));
    // Mesajul sters nu-si mai pastreaza continutul: textul, reactiile si atasamentele (si fisierele lor) dispar;
    // ramane doar randul, ca raspunsurile la el sa poata arata "mesaj sters"
    await this.msgRepo.update(id, { isDeleted: true, content: '', attachments: null, reactions: {} });
    await Promise.all((msg.attachments || []).map((a) =>
      fs.promises.unlink(path.resolve(CHAT_UPLOAD_DIR, path.basename(a.filename))).catch(() => {})));
    return { deleted: true };
  }

  async toggleReaction(id: string, user: User, emoji: string) {
    const msg = await this.msgRepo.findOne({ where: { id, isDeleted: false } });
    if (!msg) throw new NotFoundException(appError('MESSAGE_NOT_FOUND'));
    await this.assertRoom(msg.roomId, user);
    if (typeof emoji !== 'string' || !emoji || emoji.length > 16) throw new BadRequestException(appError('REACTION_INVALID'));
    const reactions: Record<string, string[]> = msg.reactions || {};
    const usersForEmoji = reactions[emoji] || [];
    if (usersForEmoji.includes(user.id)) {
      reactions[emoji] = usersForEmoji.filter((u) => u !== user.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      if (Object.keys(reactions).length >= 20) throw new BadRequestException(appError('TOO_MANY_REACTIONS'));
      reactions[emoji] = [...usersForEmoji, user.id];
    }
    await this.msgRepo.update(id, { reactions });
    return this.msgRepo.findOne({ where: { id }, relations: ['sender'] });
  }

  // Camerele echipelor din care face parte userul si ale proiectelor la care are acces
  async getRooms(user: User) {
    const qb = this.roomRepo.createQueryBuilder('room');
    if (user.role === UserRole.ADMIN) return qb.getMany();
    return qb
      .where(`(room.type = 'team' AND (room."entityId" IN (SELECT tm."teamId"::text FROM team_members tm WHERE tm."userId" = :accessUserId)
        OR room."entityId" IN (SELECT p."teamId"::text FROM projects p WHERE p."coordinatorId" = :accessUserId AND p."teamId" IS NOT NULL)))`)
      .orWhere(`(room.type = 'project' AND room."entityId" IN (SELECT id::text FROM ${this.access.accessibleProjectIdsSql()} AS ap))`)
      .setParameter('accessUserId', user.id)
      .getMany();
  }

  // Apel video Jitsi Meet pentru membrii conversatiei. Numele camerei e un HMAC al id-ului conversatiei:
  // negibil de ghicit si stabil (toti membrii ajung in aceeasi camera), dat doar celor cu acces la conversatie.
  async getCallUrl(roomId: string, user: User) {
    await this.assertRoom(roomId, user);
    const secret = `${this.config.getOrThrow('JWT_SECRET')}:video-call`;
    const name = `UniProjectHub-${createHmac('sha256', secret).update(roomId).digest('hex').slice(0, 24)}`;
    const base = String(this.config.get('JITSI_BASE_URL') || 'https://meet.jit.si').replace(/\/+$/, '');
    const displayName = encodeURIComponent(JSON.stringify(`${user.firstName} ${user.lastName}`));
    return { url: `${base}/${name}#userInfo.displayName=${displayName}`, provider: new URL(base).hostname };
  }

  // Atasamentul se descarca doar de cine are acces la conversatia in care a fost trimis
  async assertAttachment(filename: string, user: User) {
    const safeName = path.basename(filename || '');
    const msg = await this.msgRepo.createQueryBuilder('m')
      .where(`m.attachments @> :att::jsonb`, { att: JSON.stringify([{ filename: safeName }]) })
      .getOne();
    if (!msg) throw new NotFoundException(appError('FILE_NOT_FOUND'));
    await this.assertRoom(msg.roomId, user);
    const att = (msg.attachments || []).find((a) => a.filename === safeName);
    return { filePath: path.resolve(CHAT_UPLOAD_DIR, safeName), originalName: att?.originalName || safeName, mimeType: att?.mimeType || '' };
  }
}
