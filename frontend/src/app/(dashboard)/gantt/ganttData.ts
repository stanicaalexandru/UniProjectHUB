import type { Milestone, Project, Task } from "@/types";

export type GanttStatus = "completed" | "in_progress" | "pending" | "overdue";
export type GanttItem = {
  id: string;
  title: string;
  icon: string;
  start: Date;
  end: Date;
  status: string;
  type: "milestone" | "task" | "project";
  progress: number;
};

const DAY = 86400000;
const daysBefore = (date: Date, days: number) => new Date(date.getTime() - days * DAY);

// Elementele diagramei: proiectul (daca are termen), etapele (2 saptamani inainte de termen)
// si sarcinile (o saptamana inainte de termen), ordonate dupa data de inceput
export function buildGanttItems(project: Project | undefined, milestones: Milestone[], tasks: Task[]): GanttItem[] {
  const items: GanttItem[] = [];
  if (project?.endDate) {
    const end = new Date(project.endDate);
    items.push({
      id: `proj-${project.id}`, title: project.title, icon: "📁", type: "project",
      start: project.startDate ? new Date(project.startDate) : daysBefore(end, 90), end,
      status: project.status, progress: project.progressPercentage || 0,
    });
  }
  for (const m of milestones) {
    if (!m.dueDate) continue;
    const end = new Date(m.dueDate);
    items.push({ id: `ms-${m.id}`, title: m.title, icon: "🎯", type: "milestone", start: daysBefore(end, 14), end, status: m.status, progress: m.progressPercentage || 0 });
  }
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const end = new Date(task.dueDate);
    const status: GanttStatus = task.status === "done" ? "completed" : task.status === "in_progress" ? "in_progress" : "pending";
    items.push({ id: `task-${task.id}`, title: task.title, icon: "✅", type: "task", start: daysBefore(end, 7), end, status, progress: status === "completed" ? 100 : status === "in_progress" ? 50 : 0 });
  }
  return items.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Axa temporala: incepe la inceputul lunii primului element si are `months` luni
export function buildTimeline(items: GanttItem[], months: number, today = new Date()) {
  const start = items.length === 0
    ? new Date(today.getFullYear(), today.getMonth(), 1)
    : (() => { const d = new Date(Math.min(...items.map(i => i.start.getTime()))); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / DAY);
  const pct = (date: Date) => ((date.getTime() - start.getTime()) / DAY / totalDays) * 100;

  const monthStarts: Date[] = [];
  for (const cur = new Date(start); cur < end; cur.setMonth(cur.getMonth() + 1)) monthStarts.push(new Date(cur));
  const monthColumns = monthStarts.map(m => {
    const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const left = Math.max(0, pct(m));
    return { date: m, left, width: Math.min(100, pct(next)) - left };
  });

  const barStyle = (item: GanttItem) => {
    const left = Math.max(0, pct(item.start));
    const width = Math.min(Math.max(pct(item.end) - pct(item.start), 100 / totalDays), 100 - left);
    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  };

  return { start, end, monthColumns, barStyle, todayLeft: pct(today) };
}
