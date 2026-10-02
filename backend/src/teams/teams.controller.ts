import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AddMemberDto, InviteDto, JoinRequestDto, RespondDto, TeamDto } from './dto';

@ApiTags('teams') @ApiBearerAuth() @Controller('teams')
export class TeamsController {
  constructor(private svc: TeamsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  // Rutele cu segment fix inaintea celor cu :id, altfel "my-requests" ar fi tratat ca id de echipa
  @Get('my-requests') getMyRequests(@CurrentUser() user: User) { return this.svc.getUserJoinRequests(user.id); }
  @Patch('join-requests/:requestId') respondToJoinRequest(@Param('requestId') requestId: string, @Body() dto: RespondDto, @CurrentUser() user: User) { return this.svc.respondToJoinRequest(requestId, dto.accept === true, user); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: TeamDto, @CurrentUser() user: User) { return this.svc.create(dto, user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: TeamDto, @CurrentUser() user: User) { return this.svc.update(id, dto, user); }
  // Rolul nu se accepta din cerere: membrii noi sunt mereu "member"; liderul e creatorul echipei
  @Post(':id/members') addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @CurrentUser() user: User) { return this.svc.addMemberAs(id, dto.userId, user); }
  @Delete(':id/members/:userId') removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: User) { return this.svc.removeMember(id, userId, user); }
  @Post(':id/invite') invite(@Param('id') id: string, @Body() dto: InviteDto, @CurrentUser() user: User) { return this.svc.invite(id, dto.email, user); }
  @Post(':id/request-join') requestJoin(@Param('id') id: string, @Body() dto: JoinRequestDto, @CurrentUser() user: User) { return this.svc.requestJoin(id, user.id, dto.message); }
  @Get(':id/join-requests') getJoinRequests(@Param('id') id: string, @CurrentUser() user: User) { return this.svc.getJoinRequests(id, user); }
}
