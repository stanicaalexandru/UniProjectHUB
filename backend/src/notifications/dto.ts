import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { NotificationType } from './entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID() userId: string;
  @IsEnum(NotificationType) type: NotificationType;
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(2000) message: string;
  @IsOptional() @IsString() @MaxLength(500) actionUrl?: string;
  @IsOptional() @IsString() @MaxLength(50) entityType?: string;
  @IsOptional() @IsUUID() entityId?: string;
}
