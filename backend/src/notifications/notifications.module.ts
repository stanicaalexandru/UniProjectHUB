import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DeadlineScheduler } from './deadline.scheduler';
import { Milestone } from '../projects/entities/milestone.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../users/mail.service';

// Global: orice modul poate genera notificari (proiecte, task-uri, evaluari, echipe, chat)
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification, Milestone, User])],
  providers: [NotificationsService, DeadlineScheduler, MailService],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}