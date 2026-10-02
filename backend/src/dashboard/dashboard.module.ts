import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
@Module({ imports: [TypeOrmModule.forFeature([Project, Task, User, Notification])], providers: [DashboardService], controllers: [DashboardController] })
export class DashboardModule {}
