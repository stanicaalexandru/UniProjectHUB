import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { appError } from '../common/errors';

// Conexiunea cere token JWT (handshake.auth.token); userul vine din token, nu din mesajele clientului.
// Accesul la o camera trece prin aceleasi verificari ca API-ul REST.
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwt: JwtService,
    private config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const raw = client.handshake.auth?.token || String(client.handshake.headers.authorization || '').replace(/^Bearer /, '');
      const payload = this.jwt.verify(raw, { secret: this.config.getOrThrow('JWT_SECRET') });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.status !== UserStatus.ACTIVE) throw new Error('user inactiv');
      client.data.user = user;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  private user(client: Socket): User {
    const user = client.data.user as User | undefined;
    if (!user) throw new WsException(appError('UNAUTHENTICATED'));
    return user;
  }

  @SubscribeMessage('join-room')
  async handleJoin(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const user = this.user(client);
    try { await this.chatService.assertRoom(data?.roomId, user); } catch { throw new WsException(appError('CHAT_ROOM_NOT_FOUND')); }
    client.join(data.roomId);
    client.to(data.roomId).emit('user-joined', { userId: user.id });
    return { joined: data.roomId };
  }

  @SubscribeMessage('leave-room')
  handleLeave(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data?.roomId);
  }

  @SubscribeMessage('send-message')
  async handleMessage(@MessageBody() data: { roomId: string; content: string; parentId?: string }, @ConnectedSocket() client: Socket) {
    const user = this.user(client);
    try {
      const msg = await this.chatService.sendMessage(data?.roomId, user, data?.content, data?.parentId);
      this.server.to(data.roomId).emit('new-message', msg);
      return msg;
    } catch (e) {
      throw new WsException(e instanceof Error ? e.message : 'Mesajul nu a putut fi trimis');
    }
  }

  // "Scrie..." doar in camerele in care userul a intrat efectiv (dupa verificarea din join-room)
  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { roomId: string; isTyping: boolean }, @ConnectedSocket() client: Socket) {
    const user = this.user(client);
    if (!data?.roomId || !client.rooms.has(data.roomId)) return;
    client.to(data.roomId).emit('user-typing', { roomId: data.roomId, userId: user.id, isTyping: !!data.isTyping });
  }
}
