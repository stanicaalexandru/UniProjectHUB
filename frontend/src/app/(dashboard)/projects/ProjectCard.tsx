"use client";
import Link from "next/link";
import { Lock, Star, Trash2 } from "lucide-react";
import { useT, useFormat } from "@/i18n";
import { allowedStatuses, canDeleteProject, canEditProjectDetails } from "@/lib/permissions";
import { PRIORITY_BADGE, PROJECT_STATUS_BADGE } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import type { Project, ProjectStatus, User } from "@/types";

export function ProjectCard({ project: p, user, isFavorite, onToggleFavorite, onStatusChange, onDelete }: {
  project: Project; user: User | null; isFavorite: boolean;
  onToggleFavorite: () => void; onStatusChange: (status: ProjectStatus) => void; onDelete: () => void;
}) {
  const { t } = useT();
  const format = useFormat();
  // Aceleasi reguli ca pe server (lib/permissions): controalele apar doar pentru actiunile permise
  const statusOptions = allowedStatuses(p, user);
  const readOnly = !canEditProjectDetails(p, user) && statusOptions.length <= 1;

  return (
    <article className={`bg-white dark:bg-slate-900 border rounded-xl p-4 sm:p-5 transition-colors shadow-sm ${isFavorite ? "border-amber-200 dark:border-amber-900/60 hover:border-amber-300" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}>
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="hidden sm:flex w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 items-center justify-center text-xl flex-shrink-0" aria-hidden="true">{p.team ? "👥" : "📁"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <button onClick={onToggleFavorite} aria-pressed={isFavorite} className="flex-shrink-0 p-0.5 transition-transform hover:scale-110"
              title={isFavorite ? t("projects.unfavorite") : t("projects.favorite")} aria-label={isFavorite ? t("projects.unfavoriteLabel", { title: p.title }) : t("projects.favoriteLabel", { title: p.title })}>
              <Star className={`w-4 h-4 transition-colors ${isFavorite ? "fill-amber-400 text-amber-500" : "text-slate-500 dark:text-slate-400 hover:text-amber-500"}`} aria-hidden="true" />
            </button>
            <h2 className="text-sm font-semibold"><Link href={`/projects/${p.id}`} className="dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">{p.title}</Link></h2>
            <Badge color={PROJECT_STATUS_BADGE[p.status]}>{t(`projectStatus.${p.status}`)}</Badge>
            <Badge color={PRIORITY_BADGE[p.priority]}>{t(`priority.${p.priority}`)}</Badge>
            {p.team && <span className="text-xs text-blue-700 dark:text-blue-400"><span aria-hidden="true">👥 </span>{p.team.name}</span>}
            {readOnly && <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Lock className="w-3 h-3" aria-hidden="true" />{t("common.view")}</span>}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{p.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex-1 min-w-[160px]">
              <div className="flex justify-between text-xs text-slate-500 mb-1 dark:text-slate-400"><span>{t("milestones.progress")}</span><span className="font-semibold">{p.progressPercentage || 0}%</span></div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" aria-hidden="true"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPercentage || 0}%` }} /></div>
            </div>
            {p.coordinator && <span className="text-xs text-slate-500 dark:text-slate-400"><span aria-hidden="true">👤 </span>{p.coordinator.firstName} {p.coordinator.lastName}</span>}
            {p.endDate && <span className="text-xs text-slate-500 dark:text-slate-400"><span aria-hidden="true">📅 </span>{format.date(p.endDate)}</span>}
          </div>
          {!!p.technologies?.length && (
            <ul className="flex gap-1.5 mt-3 flex-wrap" aria-label={t("projects.technologiesLabel")}>
              {p.technologies.map(tech => <li key={tech} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">{tech}</li>)}
            </ul>
          )}
          {statusOptions.length > 1 && (
            <select value={p.status} onChange={e => onStatusChange(e.target.value as ProjectStatus)} aria-label={t("projects.statusLabel", { title: p.title })}
              className="mt-3 text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-300">
              {statusOptions.map(v => <option key={v} value={v}>{t(`projectStatus.${v}`)}</option>)}
            </select>
          )}
        </div>
        {canDeleteProject(p, user) && (
          <button aria-label={t("projects.deleteLabel", { title: p.title })} title={t("common.delete")} onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors flex-shrink-0 dark:text-slate-400">
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}
