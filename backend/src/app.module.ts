import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validateEnv } from './config/env.validation';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';
import { TasksModule } from './tasks/tasks.module';
import { DocumentsModule } from './documents/documents.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AccessModule } from './access/access.module';
import { User } from './users/entities/user.entity';
import { Project } from './projects/entities/project.entity';
import { Team } from './teams/entities/team.entity';
import { TeamMember } from './teams/entities/team-member.entity';
import { Task } from './tasks/entities/task.entity';
import { Milestone } from './projects/entities/milestone.entity';
import { Document } from './documents/entities/document.entity';
import { DocumentVersion } from './documents/entities/document-version.entity';
import { Evaluation } from './evaluations/entities/evaluation.entity';
import { EvaluationCriteria } from './evaluations/entities/evaluation-criteria.entity';
import { EvaluationRevision } from './evaluations/entities/evaluation-revision.entity';
import { Notification } from './notifications/entities/notification.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';
import { ChatRoom } from './chat/entities/chat-room.entity';
import { AiAnalysis } from './ai/entities/ai-analysis.entity';
import { Comment } from './projects/entities/comment.entity';
import { Activity } from './projects/entities/activity.entity';
import { Invitation } from './teams/entities/invitation.entity';
import { JoinRequest } from './teams/entities/join-request.entity';
import { ShowcaseModule } from './showcase/showcase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'uniproject'),
        // Bazele de date gazduite (ex. Supabase) cer conexiune criptata
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [
          User, Project, Team, TeamMember, Task, Milestone,
          Document, DocumentVersion, Evaluation, EvaluationCriteria, EvaluationRevision,
          Notification, ChatMessage, ChatRoom, AiAnalysis,
          Comment, Activity, Invitation, JoinRequest,
        ],
        // Schema se gestioneaza prin migratii (src/database/migrations), rulate automat la pornire.
        // DB_SYNCHRONIZE=true doar pentru dezvoltare locala rapida: TypeORM modifica schema direct din entitati,
        // iar o coloana redenumita isi pierde datele - niciodata in productie.
        synchronize: config.get('DB_SYNCHRONIZE') === 'true' && config.get('NODE_ENV') !== 'production',
        migrationsRun: config.get('DB_SYNCHRONIZE') !== 'true',
        migrations: [join(__dirname, 'database', 'migrations', '*.js')],
        logging: config.get('DB_LOGGING') === 'true',
      }),
    }),
    // Limita globala pe IP (THROTTLE_LIMIT cereri pe minut); rutele de autentificare au limite mai stricte
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{ ttl: 60_000, limit: Number(config.get('THROTTLE_LIMIT')) || 300 }],
    }),
    ScheduleModule.forRoot(),
    ShowcaseModule,
    AccessModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TeamsModule,
    TasksModule,
    DocumentsModule,
    EvaluationsModule,
    NotificationsModule,
    AiModule,
    ChatModule,
    DashboardModule,
  ],
  // Inainte de autentificare: cererile peste limita sunt oprite fara sa ajunga la baza de date
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
