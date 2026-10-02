import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation, EvaluationStatus, EvaluationPhase } from './entities/evaluation.entity';
import { EvaluationCriteria } from './entities/evaluation-criteria.entity';
import { EvaluationRevision } from './entities/evaluation-revision.entity';
import { User } from '../users/entities/user.entity';
import { ProjectAccessService, PROJECT_MANAGERS } from '../access/project-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { appError } from '../common/errors';
import { CompleteEvaluationDto, CreateEvaluationDto } from './dto';

const PHASE_LABELS: Record<string, string> = { proposal: 'Propunere', midterm: 'Intermediară', final: 'Finală', defense: 'Susținere' };
const clip = (s: unknown, max = 5000) => (typeof s === 'string' ? s.slice(0, max) : undefined);

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation) private evalRepo: Repository<Evaluation>,
    @InjectRepository(EvaluationCriteria) private criteriaRepo: Repository<EvaluationCriteria>,
    @InjectRepository(EvaluationRevision) private revisionRepo: Repository<EvaluationRevision>,
    private access: ProjectAccessService,
    private notifications: NotificationsService,
  ) {}

  // Echipa isi vede evaluarile; doar coordonatorul si adminul le creeaza si le completeaza
  async findByProject(projectId: string, user: User) {
    await this.access.assertProject(user, projectId);
    return this.evalRepo.find({
      where: { projectId },
      relations: ['evaluator', 'criteria', 'revisions'],
      order: { createdAt: 'DESC', revisions: { createdAt: 'DESC' } }
    });
  }

  async findOne(id: string) {
    const e = await this.evalRepo.findOne({ where: { id }, relations: ['evaluator', 'criteria', 'project', 'revisions'], order: { revisions: { createdAt: 'DESC' } } });
    if (!e) throw new NotFoundException(appError('EVALUATION_NOT_FOUND'));
    return e;
  }

  async findOneFor(id: string, user: User) {
    const e = await this.findOne(id);
    await this.access.assertProject(user, e.projectId);
    return e;
  }

  async create(dto: CreateEvaluationDto, user: User) {
    await this.access.assertProject(user, dto?.projectId, PROJECT_MANAGERS);
    const phase = dto.phase as EvaluationPhase;
    if (!Object.values(EvaluationPhase).includes(phase)) throw new BadRequestException(appError('EVALUATION_PHASE_INVALID'));
    const evaluation = await this.evalRepo.save(
      this.evalRepo.create({ projectId: dto.projectId, phase, evaluatorId: user.id, status: EvaluationStatus.IN_PROGRESS })
    );
    if (Array.isArray(dto.criteria) && dto.criteria.length) {
      const criteriaToSave = dto.criteria.slice(0, 50).map((c: Record<string, unknown>) =>
        this.criteriaRepo.create({
          name: clip(c.name, 200) || 'Criteriu',
          description: clip(c.description, 1000),
          maxScore: Math.max(0, Number(c.maxScore) || 0),
          weight: Number(c.weight) || 1,
          score: 0,
          evaluationId: evaluation.id
        })
      );
      await this.criteriaRepo.save(criteriaToSave);
    }
    return this.findOne(evaluation.id);
  }

  // Prima completare finalizeaza evaluarea. Dupa finalizare, orice modificare e o corectura:
  // motivul e obligatoriu si starea anterioara se pastreaza in istoric, vizibil echipei.
  async complete(id: string, dto: CompleteEvaluationDto, user: User) {
    const evaluation = await this.findOne(id);
    await this.access.assertProject(user, evaluation.projectId, PROJECT_MANAGERS);
    const isCorrection = evaluation.status === EvaluationStatus.COMPLETED;
    const reason = typeof dto?.reason === 'string' ? dto.reason.trim() : '';
    if (isCorrection && reason.length < 5) {
      throw new BadRequestException(appError('CORRECTION_REASON_REQUIRED'));
    }
    const snapshot = {
      totalScore: evaluation.totalScore, maxScore: evaluation.maxScore,
      generalFeedback: evaluation.generalFeedback, strengths: evaluation.strengths, improvements: evaluation.improvements,
      criteria: evaluation.criteria.map((c) => ({ id: c.id, name: c.name, score: c.score, maxScore: c.maxScore, feedback: c.feedback })),
    };

    // Doar criteriile acestei evaluari; scorul limitat intre 0 si punctajul maxim salvat (nu cel trimis de client)
    const byId = new Map((dto?.criteria || []).map((c) => [c.id, c]));
    let total = 0, max = 0;
    for (const c of evaluation.criteria) {
      const sent = byId.get(c.id);
      const score = Math.min(Math.max(Number(sent?.score) || 0, 0), Number(c.maxScore));
      total += score;
      max += Number(c.maxScore);
      await this.criteriaRepo.update(c.id, { score, feedback: clip(sent?.feedback, 2000) });
    }
    await this.evalRepo.update(id, {
      status: EvaluationStatus.COMPLETED,
      totalScore: total,
      maxScore: max,
      generalFeedback: clip(dto?.generalFeedback),
      strengths: clip(dto?.strengths),
      improvements: clip(dto?.improvements),
      // La corectura pastram data finalizarii initiale
      ...(isCorrection ? {} : { completedAt: new Date() }),
    });
    if (isCorrection) {
      await this.revisionRepo.save(this.revisionRepo.create({
        evaluationId: id, changedById: user.id, reason: reason.slice(0, 2000), snapshot,
        oldTotalScore: evaluation.totalScore, newTotalScore: total,
      }));
    }
    // Nota ajunge doar la echipa proiectului evaluat
    const { memberIds } = await this.access.audience(evaluation.projectId);
    const phase = PHASE_LABELS[evaluation.phase] || evaluation.phase;
    await this.notifications.notify(memberIds, {
      type: NotificationType.EVALUATION,
      title: isCorrection ? `Evaluare corectată: ${phase}` : `Evaluare finalizată: ${phase}`,
      message: isCorrection
        ? `Scorul s-a schimbat din ${Number(evaluation.totalScore)} în ${total}/${max} puncte. Motiv: ${reason.slice(0, 200)}`
        : `Evaluarea „${phase}” a proiectului „${evaluation.project?.title}” a fost finalizată: ${total}/${max} puncte.`,
      actionUrl: '/evaluations', entityType: 'evaluation', entityId: id,
    }, { exclude: user.id, pref: 'evals' });
    return this.findOne(id);
  }
}
