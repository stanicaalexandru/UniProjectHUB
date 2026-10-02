import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CompleteEvaluationDto, CreateEvaluationDto } from './dto';

@ApiTags('evaluations') @ApiBearerAuth() @Controller('evaluations')
export class EvaluationsController {
  constructor(private svc: EvaluationsService) {}
  @Get() findByProject(@Query('projectId') projectId: string, @CurrentUser() user: User) { return this.svc.findByProject(projectId, user); }
  @Get(':id') findOne(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.findOneFor(id, user); }
  @Post() create(@Body() dto: CreateEvaluationDto, @CurrentUser() user: User) { return this.svc.create(dto, user); }
  @Patch(':id/complete') complete(@Param('id') id: string, @Body() dto: CompleteEvaluationDto, @CurrentUser() user: User) { return this.svc.complete(id, dto, user); }
}
