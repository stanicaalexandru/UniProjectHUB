import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
@ApiTags('dashboard') @ApiBearerAuth() @Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}
  @Get('overview') getOverview(@CurrentUser() user: User) { return this.svc.getOverview(user.id, user.role); }
  @Get('projects-by-status') getByStatus() { return this.svc.getProjectsByStatus(); }
}
