import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TaskDto, TaskStatusDto } from './dto';
import { TaskStatus } from './entities/task.entity';

@ApiTags('tasks') @ApiBearerAuth() @Controller('tasks')
export class TasksController {
  constructor(private svc: TasksService) {}
  @Get() findAll(@Query() q: Record<string, string>, @CurrentUser() user: User) { return this.svc.findAll(q, user); }
  @Get(':id') findOne(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.findOneFor(id, user); }
  @Post() create(@Body() dto: TaskDto, @CurrentUser() user: User) { return this.svc.create(dto, user); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: TaskDto, @CurrentUser() user: User) { return this.svc.update(id, dto, user); }
  @Delete(':id') remove(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.remove(id, user); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() dto: TaskStatusDto, @CurrentUser() user: User) { return this.svc.updateStatus(id, dto.status as TaskStatus, user); }
}
