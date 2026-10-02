import { apiFetch, apiFetchAll } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import type { Milestone, Project, Task } from "@/types";

export type EventKind = "projectStart" | "projectEnd" | "milestone" | "task";
export type CalEvent = { id: string; title: string; date: string; kind: EventKind; done: boolean; projectName?: string };

export const EVENT_ICON: Record<EventKind, string> = { projectStart: "🚀", projectEnd: "🏁", milestone: "🎯", task: "✅" };
export const EVENT_COLOR: Record<EventKind, string> = { projectStart: "bg-emerald-700", projectEnd: "bg-green-700", milestone: "bg-blue-600", task: "bg-amber-700" };
export const DONE_COLOR = "bg-teal-700";
export const eventColor = (e: CalEvent) => (e.done ? DONE_COLOR : EVENT_COLOR[e.kind]);

// Data calendaristica locala in format AAAA-LL-ZZ
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseDayKey = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
const toKey = (iso: string) => iso.split("T")[0];

export function startOfWeek(date: Date) {
  const offset = (date.getDay() + 6) % 7; // luni = 0
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

const listOf = <T,>(d: T[] | { data?: T[] }): T[] => (Array.isArray(d) ? d : d.data || []);

// Evenimentele: inceputul si termenul proiectelor, termenele etapelor si ale sarcinilor
// (studentii vad doar sarcinile asignate lor)
export async function loadCalendarEvents(): Promise<CalEvent[]> {
  const me = storedUser();
  const { data } = await apiFetchAll("/projects") as { data: Project[] };
  const projects = visibleProjects(data, me);
  const events: CalEvent[] = [];

  for (const p of projects) {
    if (p.endDate) events.push({ id: `proj-${p.id}`, title: p.title, date: toKey(p.endDate), kind: "projectEnd", done: false, projectName: p.title });
    if (p.startDate) events.push({ id: `proj-start-${p.id}`, title: p.title, date: toKey(p.startDate), kind: "projectStart", done: false, projectName: p.title });
  }

  const [milestoneLists, tasks] = await Promise.all([
    Promise.all(projects.map(p => apiFetch(`/projects/${p.id}/milestones`).then(d => listOf<Milestone>(d)).catch(() => [] as Milestone[]))),
    apiFetch(me?.role === "student" ? `/tasks?assigneeId=${me.id}` : "/tasks").then(d => listOf<Task>(d)).catch(() => [] as Task[]),
  ]);

  milestoneLists.forEach((list, i) => {
    for (const m of list) {
      if (m.dueDate) events.push({ id: `ms-${m.id}`, title: m.title, date: toKey(m.dueDate), kind: "milestone", done: m.status === "completed", projectName: projects[i].title });
    }
  });
  for (const task of tasks) {
    if (task.dueDate) events.push({ id: `task-${task.id}`, title: task.title, date: toKey(task.dueDate), kind: "task", done: task.status === "done", projectName: task.project?.title });
  }
  return events;
}
