// Obiectele libere din liste au nevoie de @Type(() => Object): conversia implicita le-ar transforma in liste goale
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsUUID() entityId: string;
  // Tipul se verifica in serviciu (CHAT_ROOM_TYPE_INVALID)
  @IsString() type: string;
  // Ignorat: membrii se calculeaza pe server din echipa sau proiect
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) memberIds?: string[];
}

export class SendMessageDto {
  // Mesajul poate avea doar atasament; mesajul complet gol e respins in serviciu (MESSAGE_EMPTY)
  @IsOptional() @IsString() @MaxLength(5000) content?: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(5) @Type(() => Object) @IsObject({ each: true }) attachments?: Record<string, unknown>[];
}

export class EditMessageDto {
  @IsString() @MaxLength(5000) content: string;
}

export class ReactionDto {
  @IsString() @MaxLength(16) emoji: string;
}
