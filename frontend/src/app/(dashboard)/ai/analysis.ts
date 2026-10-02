import type { Milestone, Project, Task } from "@/types";

// Analiza proiectului se face local, pe baza datelor reale (etape, sarcini, detalii),
// cu reguli simple si transparente. Rezultatul contine coduri si numere; textele vin din traduceri.

export type Category = "progress" | "time" | "organization" | "documentation" | "stability";
export const CATEGORIES: Category[] = ["progress", "time", "organization", "documentation", "stability"];

export type RiskLevel = "critical" | "warning" | "info" | "success";
export type Risk =
  | { level: RiskLevel; kind: "milestoneOverdue"; title: string; days: number }
  | { level: RiskLevel; kind: "milestoneSoon"; title: string; days: number }
  | { level: RiskLevel; kind: "unassigned"; count: number }
  | { level: RiskLevel; kind: "noEndDate" }
  | { level: RiskLevel; kind: "noTasks" }
  | { level: RiskLevel; kind: "healthy" };

export type RecPriority = "high" | "medium" | "low";
export type Recommendation = {
  priority: RecPriority;
  kind: "accelerate" | "deadlines" | "assign" | "docs" | "wip" | "finish" | "fine";
  params: Record<string, number>;
};

export type Prediction = { estimatedFinish: Date; daysLeft: number; estimatedDaysNeeded: number; onTime: boolean; dailyRate: number };
export type Analysis = { scores: Record<Category, number>; globalScore: number; risks: Risk[]; recs: Recommendation[]; prediction: Prediction | null };

const DAY = 86400000;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function analyzeProject(proj: Project | undefined, milestones: Milestone[], tasks: Task[], now = new Date()): Analysis {
  const completedMs = milestones.filter(m => m.status === "completed").length;
  const totalMs = milestones.length;
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const totalTasks = tasks.length;
  const progress = proj?.progressPercentage || 0;
  const overdueTasks = tasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now);
  const overdueMilestones = milestones.filter(m => m.status !== "completed" && m.dueDate && new Date(m.dueDate) < now);
  const unassignedTasks = tasks.filter(t => !(t.assigneeId || t.assignee) && t.status !== "done");
  const descriptionLength = proj?.description?.length ?? 0;

  // Scor 0-100 pe fiecare categorie
  const scores: Record<Category, number> = {
    progress: clamp((totalMs > 0 ? (completedMs / totalMs) * 50 : 0) + (totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0)),
    time: clamp(100 - overdueMilestones.length * 20 - overdueTasks.length * 10),
    organization: clamp(100 - unassignedTasks.length * 15 - (totalTasks === 0 ? 30 : 0) - (totalMs === 0 ? 30 : 0)),
    documentation: clamp((descriptionLength > 100 ? 40 : descriptionLength > 50 ? 20 : 0) + (proj?.technologies?.length ? 30 : 0) + (proj?.endDate ? 30 : 0)),
    stability: clamp(100 - overdueMilestones.length * 25 - overdueTasks.length * 10 - (!proj?.endDate ? 20 : 0) - (progress < 20 && totalMs > 0 ? 15 : 0)),
  };
  const globalScore = Math.round(CATEGORIES.reduce((sum, c) => sum + scores[c], 0) / CATEGORIES.length);

  const risks: Risk[] = [];
  for (const m of overdueMilestones) {
    risks.push({ level: "critical", kind: "milestoneOverdue", title: m.title, days: Math.ceil((now.getTime() - new Date(m.dueDate).getTime()) / DAY) });
  }
  for (const m of milestones) {
    if (m.status === "completed" || !m.dueDate) continue;
    const daysLeft = Math.ceil((new Date(m.dueDate).getTime() - now.getTime()) / DAY);
    if (daysLeft > 0 && daysLeft <= 7) risks.push({ level: "warning", kind: "milestoneSoon", title: m.title, days: daysLeft });
  }
  if (unassignedTasks.length > 0) risks.push({ level: "warning", kind: "unassigned", count: unassignedTasks.length });
  if (!proj?.endDate) risks.push({ level: "info", kind: "noEndDate" });
  if (totalTasks === 0 && totalMs > 0) risks.push({ level: "info", kind: "noTasks" });
  if (risks.length === 0) risks.push({ level: "success", kind: "healthy" });

  const recs: Recommendation[] = [];
  if (scores.progress < 40) recs.push({ priority: "high", kind: "accelerate", params: { completedMs, totalMs, completedTasks, totalTasks } });
  if (scores.time < 60) recs.push({ priority: "high", kind: "deadlines", params: { milestones: overdueMilestones.length, tasks: overdueTasks.length } });
  if (scores.organization < 60 && unassignedTasks.length > 0) recs.push({ priority: "medium", kind: "assign", params: { count: unassignedTasks.length } });
  if (scores.documentation < 60) recs.push({ priority: "medium", kind: "docs", params: {} });
  if (inProgressTasks > 5) recs.push({ priority: "medium", kind: "wip", params: { count: inProgressTasks } });
  if (progress > 80) recs.push({ priority: "low", kind: "finish", params: {} });
  if (recs.length === 0) recs.push({ priority: "low", kind: "fine", params: {} });

  // Estimarea datei de finalizare dupa ritmul de pana acum
  let prediction: Prediction | null = null;
  if (proj?.endDate && progress > 0) {
    const endDate = new Date(proj.endDate);
    const startDate = proj.startDate ? new Date(proj.startDate) : new Date(now.getTime() - 30 * DAY);
    const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / DAY);
    const dailyRate = progress / Math.max(daysElapsed, 1);
    const estimatedDaysNeeded = Math.ceil((100 - progress) / Math.max(dailyRate, 0.1));
    const estimatedFinish = new Date(now.getTime() + estimatedDaysNeeded * DAY);
    prediction = { estimatedFinish, daysLeft: Math.ceil((endDate.getTime() - now.getTime()) / DAY), estimatedDaysNeeded, onTime: estimatedFinish <= endDate, dailyRate };
  }

  return { scores, globalScore, risks, recs, prediction };
}

export const scoreColor = (s: number) => (s >= 80 ? "#16a34a" : s >= 60 ? "#2563eb" : s >= 40 ? "#d97706" : "#dc2626");
export const scoreLevel = (s: number) => (s >= 80 ? "excellent" : s >= 60 ? "good" : s >= 40 ? "fair" : "risk") as "excellent" | "good" | "fair" | "risk";
