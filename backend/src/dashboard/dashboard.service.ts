import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getOverview(userId: string, _role: UserRole) {
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      this.projectRepo.count(),
      this.projectRepo.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
      this.projectRepo.count({ where: { status: ProjectStatus.COMPLETED } }),
    ]);
    const [totalStudents, totalProfessors] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.STUDENT } }),
      this.userRepo.count({ where: { role: UserRole.PROFESSOR } }),
    ]);
    const recentProjects = await this.projectRepo.find({
      take: 5, order: { updatedAt: 'DESC' },
      relations: ['coordinator', 'team'],
    });
    const upcomingTasks = await this.taskRepo.find({
      where: { assigneeId: userId },
      take: 5, order: { dueDate: 'ASC' },
    });
    return {
      stats: { totalProjects, activeProjects, completedProjects, totalStudents, totalProfessors,
        completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0 },
      recentProjects, upcomingTasks,
      timeline: await this.getTimeline(),
    };
  }

  async getTimeline() {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const count = Math.floor(Math.random() * 10) + 2;
      months.push({ month: label, projects: count, completed: Math.floor(count * 0.6) });
    }
    return months;
  }

  async getProjectsByStatus() {
    const statuses = Object.values(ProjectStatus);
    const counts = await Promise.all(statuses.map(s => this.projectRepo.count({ where: { status: s } })));
    return statuses.map((s, i) => ({ status: s, count: counts[i] }));
  }
}
