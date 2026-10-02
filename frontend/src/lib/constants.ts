import type { EvaluationStatus, MilestoneStatus, ProjectPriority, ProjectStatus, TaskStatus, UserRole, UserStatus } from "@/types";

// Culorile folosite pentru statusuri, prioritati si roluri, in acelasi fel pe toate paginile.
// Textele corespunzatoare vin din traduceri (projectStatus.*, priority.*, roles.* etc.).

const SLATE = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
const BLUE = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
const GREEN = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
const EMERALD = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
const AMBER = "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
const PURPLE = "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300";
const RED = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
const YELLOW = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
const ORANGE = "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, string> = {
  draft: SLATE, proposed: BLUE, approved: GREEN, in_progress: AMBER, review: PURPLE, completed: EMERALD, archived: SLATE, rejected: RED,
};

// Culori pentru grafice (hex, nu clase Tailwind)
export const PROJECT_STATUS_HEX: Partial<Record<ProjectStatus, string>> = {
  draft: "#94a3b8", proposed: "#3b82f6", approved: "#22c55e", in_progress: "#f59e0b", review: "#a855f7", completed: "#10b981",
};

export const PRIORITY_BADGE: Record<ProjectPriority, string> = { low: GREEN, medium: YELLOW, high: ORANGE, critical: RED };
export const PRIORITY_DOT: Record<ProjectPriority, string> = { low: "bg-green-400", medium: "bg-yellow-400", high: "bg-orange-400", critical: "bg-red-500" };

export const MILESTONE_STATUS_BADGE: Record<MilestoneStatus, string> = { pending: SLATE, in_progress: AMBER, completed: GREEN, overdue: RED };
export const MILESTONE_STATUS_DOT: Record<MilestoneStatus, string> = { pending: "bg-slate-300", in_progress: "bg-amber-400", completed: "bg-green-500", overdue: "bg-red-500" };

export const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", in_progress: BLUE, in_review: PURPLE, blocked: RED, done: GREEN,
};

export const EVALUATION_STATUS_BADGE: Record<EvaluationStatus, string> = { draft: SLATE, in_progress: AMBER, completed: GREEN };

export const ROLE_BADGE: Record<UserRole, string> = { admin: PURPLE, professor: BLUE, student: GREEN };

export const USER_STATUS_BADGE: Record<UserStatus, string> = {
  active: GREEN,
  pending_approval: AMBER,
  pending_verification: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  suspended: RED,
  inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};
