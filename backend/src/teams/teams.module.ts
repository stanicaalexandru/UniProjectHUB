import { User } from '../users/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Invitation } from './entities/invitation.entity';
import { JoinRequest } from './entities/join-request.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({ 
  imports: [TypeOrmModule.forFeature([Team, TeamMember, Invitation, JoinRequest, User])], 
  providers: [TeamsService], 
  controllers: [TeamsController], 
  exports: [TeamsService] 
})
export class TeamsModule {}