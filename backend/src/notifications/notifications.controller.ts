import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateNotificationDto } from './dto';
import { User } from '../users/entities/user.entity';

@ApiTags('notifications') @ApiBearerAuth() @Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() findAll(@CurrentUser() user: User) { return this.svc.findAll(user.id); }
  @Get('unread') getUnread(@CurrentUser() user: User) { return this.svc.getUnread(user.id); }
  @Get('count') getCount(@CurrentUser() user: User) { return this.svc.getCount(user.id); }
  // Notificarile sunt generate de server la fiecare eveniment; manual doar adminul (anunturi de sistem)
  @Post() @Roles('admin') create(@Body() dto: CreateNotificationDto) { return this.svc.create(dto); }
  @Patch(':id/read') markRead(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.markRead(id, user.id); }
  @Patch('read-all') markAllRead(@CurrentUser() user: User) { return this.svc.markAllRead(user.id); }
}
