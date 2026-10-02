import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiAnalysis, AnalysisType } from './entities/ai-analysis.entity';
import { ConfigService } from '@nestjs/config';
import { AnalyzeDto } from './dto';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiAnalysis) private repo: Repository<AiAnalysis>,
    private config: ConfigService,
  ) {}

  async analyzeProject(projectId: string, projectData: AnalyzeDto): Promise<AiAnalysis> {
    // Calculeaza scorul de progres pe baza indicatorilor proiectului
    const progressScore = this.calculateProgressScore(projectData);
    const riskLevel = this.assessRisk(projectData);
    const recommendations = this.generateRecommendations(projectData, riskLevel);
    const estimatedCompletion = this.predictCompletion(projectData);

    const result = { progressScore, riskLevel, recommendations, estimatedCompletion,
      activityRate: projectData.recentActivity || 0,
      documentScore: projectData.documentCount > 0 ? Math.min(projectData.documentCount * 10, 100) : 0,
      taskCompletionRate: projectData.totalTasks > 0 ? (projectData.completedTasks / projectData.totalTasks) * 100 : 0,
    };

    const analysis = this.repo.create({
      projectId, type: AnalysisType.PROGRESS_SCORE,
      score: progressScore, result,
      summary: `Project health score: ${progressScore}/100. Risk: ${riskLevel}.`,
      recommendations: recommendations.join('\n'),
    });
    return this.repo.save(analysis);
  }

  async getRiskAssessment(projectId: string, projectData: AnalyzeDto) {
    const risks = [];
    const now = new Date();
    if (projectData.endDate) {
      const daysLeft = Math.ceil((new Date(projectData.endDate).getTime() - now.getTime()) / 86400000);
      if (daysLeft < 14) risks.push({ type: 'DEADLINE', severity: 'critical', message: `Only ${daysLeft} days until deadline` });
      else if (daysLeft < 30) risks.push({ type: 'DEADLINE', severity: 'warning', message: `${daysLeft} days until deadline` });
    }
    if (projectData.progress < 30 && projectData.daysElapsed > 50) risks.push({ type: 'PROGRESS', severity: 'critical', message: 'Low progress relative to time elapsed' });
    if (projectData.documentCount === 0) risks.push({ type: 'DOCUMENTATION', severity: 'warning', message: 'No documents uploaded yet' });
    if (projectData.recentActivity === 0) risks.push({ type: 'INACTIVITY', severity: 'warning', message: 'No activity in the last 7 days' });
    return { projectId, risks, overallRisk: risks.some(r => r.severity === 'critical') ? 'critical' : risks.length > 0 ? 'medium' : 'low', analyzedAt: new Date() };
  }

  async getHistory(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 20 });
  }

  private calculateProgressScore(data: AnalyzeDto): number {
    let score = data.progress || 0;
    if (data.documentCount > 0) score = Math.min(score + 5, 100);
    if (data.recentActivity > 0) score = Math.min(score + 5, 100);
    if (data.completedMilestones > 0) score = Math.min(score + 10, 100);
    return Math.round(score);
  }

  private assessRisk(data: AnalyzeDto): string {
    const now = new Date();
    const daysLeft = data.endDate ? Math.ceil((new Date(data.endDate).getTime() - now.getTime()) / 86400000) : 999;
    if (daysLeft < 7 || data.progress < 20) return 'critical';
    if (daysLeft < 21 || data.progress < 40) return 'high';
    if (daysLeft < 45 || data.recentActivity === 0) return 'medium';
    return 'low';
  }

  private generateRecommendations(data: AnalyzeDto, riskLevel: string): string[] {
    const recs = [];
    if (data.progress < 50) recs.push('Focus on completing pending milestones to improve overall progress.');
    if (data.documentCount === 0) recs.push('Upload initial documentation to establish project baseline.');
    if (riskLevel === 'critical') recs.push('Schedule an urgent meeting with your coordinator to address timeline risks.');
    if (data.recentActivity === 0) recs.push('Resume regular project activity — consistent work leads to better outcomes.');
    if (data.openTasks > 10) recs.push('Consider breaking down large tasks into smaller, manageable subtasks.');
    if (recs.length === 0) recs.push('Great progress! Keep up the consistent work and maintain documentation.');
    return recs;
  }

  private predictCompletion(data: AnalyzeDto): string {
    if (!data.startDate || !data.endDate) return 'Unknown';
    const start = new Date(data.startDate);
    const now = new Date();
    const elapsed = (now.getTime() - start.getTime()) / 86400000;
    const progress = data.progress ?? 0;
    const rate = elapsed > 0 ? progress / elapsed : 0;
    if (rate <= 0) return 'On track';
    const remainingProgress = 100 - progress;
    const estimatedDaysLeft = remainingProgress / rate;
    const estimatedCompletion = new Date(now.getTime() + estimatedDaysLeft * 86400000);
    return estimatedCompletion.toISOString().split('T')[0];
  }
}
