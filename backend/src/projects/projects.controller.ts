import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CommentDto, CreateProjectDto, MilestoneDto, UpdateProjectDto } from './dto';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private svc: ProjectsService) {}
  @Get() findAll(@Query() q: Record<string, string>, @CurrentUser() user: User) { return this.svc.findAll(q, user); }
  @Get('stats') getStats() { return this.svc.getStats(); }
  // Rutele cu segment fix inaintea celor cu :id, altfel ":id" le-ar prinde
  @Patch('milestones/:id') updateMilestone(@Param('id') id: string, @Body() dto: MilestoneDto, @CurrentUser() user: User) { return this.svc.updateMilestone(id, dto, user); }
  @Get(':id') findOne(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.findOneFor(id, user); }
  @Post() create(@Body() dto: CreateProjectDto, @CurrentUser() user: User) { return this.svc.create(dto, user); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: User) { return this.svc.update(id, dto, user); }
  @Delete(':id') remove(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.delete(id, user); }
  @Get(':id/milestones') getMilestones(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.getMilestones(id, user); }
  @Post(':id/milestones') createMilestone(@Param('id') id: string, @Body() dto: MilestoneDto, @CurrentUser() user: User) { return this.svc.createMilestone(id, dto, user); }
  @Get(':id/activities') getActivities(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.getActivities(id, user); }
  @Get(':id/comments') getComments(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.getComments(id, user); }
  @Post(':id/comments') addComment(@Param('id') id: string, @Body() dto: CommentDto, @CurrentUser() user: User) { return this.svc.addComment(id, dto.content, user); }
}
