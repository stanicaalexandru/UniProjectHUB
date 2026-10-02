import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UploadedFile, UseInterceptors, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ChatService, CHAT_UPLOAD_DIR } from './chat.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoomType } from './entities/chat-room.entity';
import { User } from '../users/entities/user.entity';
import { isAllowedUpload, INLINE_IMAGE_TYPES } from '../common/uploads';
import { appError } from '../common/errors';
import { CreateRoomDto, EditMessageDto, ReactionDto, SendMessageDto } from './dto';

@ApiTags('chat') @ApiBearerAuth() @Controller('chat')
export class ChatController {
  constructor(private svc: ChatService) {}
  @Get('rooms') getRooms(@CurrentUser() user: User) { return this.svc.getRooms(user); }
  // Membrii nu se mai accepta de la client: sunt calculati pe server din echipa/proiect
  @Post('rooms') createRoom(@Body() dto: CreateRoomDto, @CurrentUser() user: User) { return this.svc.findOrCreateRoom(dto.entityId, dto.type as RoomType, user); }
  @Get('rooms/:roomId/call') getCall(@Param('roomId') roomId: string, @CurrentUser() user: User) { return this.svc.getCallUrl(roomId, user); }
  @Get('rooms/:roomId/messages') getMessages(@Param('roomId') roomId: string, @Query('limit') limit: number, @CurrentUser() user: User) { return this.svc.getMessages(roomId, user, limit); }
  @Post('rooms/:roomId/messages') sendMessage(@Param('roomId') roomId: string, @Body() dto: SendMessageDto, @CurrentUser() user: User) {
    return this.svc.sendMessage(roomId, user, dto.content ?? '', dto.parentId, dto.attachments);
  }
  @Patch('messages/:id') editMessage(@Param('id') id: string, @Body() dto: EditMessageDto, @CurrentUser() user: User) { return this.svc.editMessage(id, user, dto.content); }
  @Delete('messages/:id') deleteMessage(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.deleteMessage(id, user); }
  @Post('messages/:id/reactions') toggleReaction(@Param('id') id: string, @Body() dto: ReactionDto, @CurrentUser() user: User) { return this.svc.toggleReaction(id, user, dto.emoji); }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        // Ne asiguram ca folderul exista
        if (!fs.existsSync(CHAT_UPLOAD_DIR)) fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });
        cb(null, CHAT_UPLOAD_DIR);
      },
      filename: (req, file, cb) => {
        // Nume aleator, greu de ghicit; extensia doar din lista permisa
        cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter: (req, file, cb) => cb(null, isAllowedUpload(file)),
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException(appError('FILE_TYPE_NOT_ALLOWED'));
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Get('attachments/:filename')
  async downloadAttachment(@Param('filename') filename: string, @CurrentUser() user: User, @Res() res: Response) {
    const att = await this.svc.assertAttachment(filename, user);
    if (!fs.existsSync(att.filePath)) throw new NotFoundException(appError('FILE_NOT_FOUND'));
    // Doar imaginile raster se afiseaza in pagina; restul (inclusiv SVG/HTML) se descarca, ca sa nu ruleze in browser
    if (!INLINE_IMAGE_TYPES.includes(att.mimeType)) res.attachment(att.originalName);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(att.filePath);
  }
}
