import { apiFetch, apiFetchAll } from "@/lib/api";
import { isProjectMember } from "@/lib/projects";
import type { Evaluation, Milestone, Project, Task, User } from "@/types";

export type PendingEvaluation = Evaluation & { projectTitle: string };
export type UpcomingMilestone = Milestone & { projectTitle: string };

export type DashboardData = {
  allProjects: Project[];
  users: User[];
  myProjects: Project[];          // student: proiectele lui; profesor: cele coordonate; admin: toate
  myTasks: Task[];                // sarcinile asignate utilizatorului
  allTasks: Task[];               // doar pentru administrator
  pendingEvaluations: PendingEvaluation[];
  upcomingMilestones: UpcomingMilestone[];
};

const DAY = 86400000;
const listOf = <T,>(r: PromiseSettledResult<unknown>): T[] =>
  r.status !== "fulfilled" ? [] : Array.isArray(r.value) ? r.value : ((r.value as { data?: T[] })?.data ?? []);

export async function loadDashboard(user: User): Promise<DashboardData> {
  const [projectsRes, myTasksRes, usersRes, allTasksRes] = await Promise.allSettled([
    apiFetchAll("/projects"),
    apiFetch(`/tasks?assigneeId=${user.id}`),
    apiFetchAll("/users"),
    user.role === "admin" ? apiFetch("/tasks") : Promise.resolve([]),
  ]);
  const allProjects = listOf<Project>(projectsRes);
  const myProjects = user.role === "professor" ? allProjects.filter(p => p.coordinatorId === user.id)
    : user.role === "student" ? allProjects.filter(p => isProjectMember(p, user.id))
    : allProjects;

  // Profesorul vede termenele din urmatoarele 7 zile si evaluarile neterminate din toate proiectele coordonate
  let pendingEvaluations: PendingEvaluation[] = [];
  let upcomingMilestones: UpcomingMilestone[] = [];
  if (user.role === "professor") {
    const now = Date.now();
    const perProject = await Promise.all(myProjects.map(async p => {
      const [ms, ev] = await Promise.allSettled([apiFetch(`/projects/${p.id}/milestones`), apiFetch(`/evaluations?projectId=${p.id}`)]);
      return {
        milestones: listOf<Milestone>(ms).filter(m => {
          const due = m.dueDate ? new Date(m.dueDate).getTime() : NaN;
          return m.status !== "completed" && due >= now && due <= now + 7 * DAY;
        }).map(m => ({ ...m, projectTitle: p.title })),
        evaluations: listOf<Evaluation>(ev).filter(e => e.status !== "completed").map(e => ({ ...e, projectTitle: p.title })),
      };
    }));
    upcomingMilestones = perProject.flatMap(x => x.milestones).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    pendingEvaluations = perProject.flatMap(x => x.evaluations);
  }

  return {
    allProjects,
    users: listOf<User>(usersRes),
    myProjects,
    myTasks: listOf<Task>(myTasksRes),
    allTasks: listOf<Task>(allTasksRes),
    pendingEvaluations,
    upcomingMilestones,
  };
}

export const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);
