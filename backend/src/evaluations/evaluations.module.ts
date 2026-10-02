import { EvaluationRevision } from './entities/evaluation-revision.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationCriteria } from './entities/evaluation-criteria.entity';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
@Module({ imports: [TypeOrmModule.forFeature([Evaluation, EvaluationCriteria, EvaluationRevision])], providers: [EvaluationsService], controllers: [EvaluationsController], exports: [EvaluationsService] })
export class EvaluationsModule {}
