import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAnalysis } from './entities/ai-analysis.entity';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
@Module({ imports: [TypeOrmModule.forFeature([AiAnalysis])], providers: [AiService], controllers: [AiController], exports: [AiService] })
export class AiModule {}
