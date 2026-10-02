import type { EvaluationStatus, MilestoneStatus, ProjectPriority, ProjectStatus, TaskStatus, UserRole, UserStatus } from "@/types";

// Culorile folosite pentru statusuri, prioritati si roluri, in acelasi fel pe toate paginile.
// Textele corespunzatoare vin din traduceri (projectStatus.*, priority.*, roles.* etc.).

const SLATE = "bg-badge-slate-bg text-badge-slate-fg dark:bg-slate-800 dark:text-slate-400";
const BLUE = "bg-badge-blue-bg text-badge-blue-fg dark:bg-blue-900/50 dark:text-blue-300";
const GREEN = "bg-badge-green-bg text-badge-green-fg dark:bg-green-900/40 dark:text-green-300";
const EMERALD = "bg-badge-emerald-bg text-badge-emerald-fg dark:bg-emerald-900/40 dark:text-emerald-300";
const AMBER = "bg-badge-amber-bg text-badge-amber-fg dark:bg-amber-900/40 dark:text-amber-300";
const PURPLE = "bg-badge-violet-bg text-badge-violet-fg dark:bg-purple-900/40 dark:text-purple-300";
const RED = "bg-badge-rose-bg text-badge-rose-fg dark:bg-red-900/40 dark:text-red-300";
const YELLOW = "bg-badge-yellow-bg text-badge-yellow-fg dark:bg-yellow-900/40 dark:text-yellow-300";
const ORANGE = "bg-badge-orange-bg text-badge-orange-fg dark:bg-orange-900/40 dark:text-orange-300";

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, string> = {
  draft: SLATE, proposed: BLUE, approved: GREEN, in_progress: AMBER, review: PURPLE, completed: EMERALD, archived: SLATE, rejected: RED,
};

// Culori pentru grafice (hex, nu clase Tailwind)
export const PROJECT_STATUS_HEX: Partial<Record<ProjectStatus, string>> = {
  draft: "#94a3b8", proposed: "#5b7fa8", approved: "#6b9a7d", in_progress: "#c49a5a", review: "#8a7aa6", completed: "#4f8a66",
};

export const PRIORITY_BADGE: Record<ProjectPriority, string> = { low: GREEN, medium: YELLOW, high: ORANGE, critical: RED };
export const PRIORITY_DOT: Record<ProjectPriority, string> = { low: "bg-tone-green", medium: "bg-tone-amber", high: "bg-tone-orange", critical: "bg-tone-rose" };

export const MILESTONE_STATUS_BADGE: Record<MilestoneStatus, string> = { pending: SLATE, in_progress: AMBER, completed: GREEN, overdue: RED };
export const MILESTONE_STATUS_DOT: Record<MilestoneStatus, string> = { pending: "bg-slate-300", in_progress: "bg-tone-amber", completed: "bg-tone-green", overdue: "bg-tone-rose" };

export const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
  todo: SLATE, in_progress: BLUE, in_review: PURPLE, blocked: RED, done: GREEN,
};

export const EVALUATION_STATUS_BADGE: Record<EvaluationStatus, string> = { draft: SLATE, in_progress: AMBER, completed: GREEN };

export const ROLE_BADGE: Record<UserRole, string> = { admin: PURPLE, professor: BLUE, student: GREEN };

export const USER_STATUS_BADGE: Record<UserStatus, string> = {
  active: GREEN,
  pending_approval: AMBER,
  pending_verification: SLATE,
  suspended: RED,
  inactive: SLATE,
};
