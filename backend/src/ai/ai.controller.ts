import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ProjectAccessService } from '../access/project-access.service';
import { AnalyzeDto } from './dto';

@ApiTags('ai') @ApiBearerAuth() @Controller('ai')
export class AiController {
  constructor(private svc: AiService, private access: ProjectAccessService) {}
  @Post('analyze/:projectId') async analyze(@Param('projectId') id: string, @Body() data: AnalyzeDto, @CurrentUser() user: User) {
    await this.access.assertProject(user, id);
    return this.svc.analyzeProject(id, data);
  }
  @Get('risk/:projectId') async getRisk(@Param('projectId') id: string, @CurrentUser() user: User) {
    await this.access.assertProject(user, id);
    return this.svc.getRiskAssessment(id, {});
  }
  @Get('history/:projectId') async getHistory(@Param('projectId') id: string, @CurrentUser() user: User) {
    await this.access.assertProject(user, id);
    return this.svc.getHistory(id);
  }
}
