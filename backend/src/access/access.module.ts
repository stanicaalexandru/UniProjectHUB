import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { ProjectAccessService } from './project-access.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Project, TeamMember])],
  providers: [ProjectAccessService],
  exports: [ProjectAccessService],
})
export class AccessModule {}
