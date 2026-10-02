"use client";
import Link from "next/link";
import { CalendarDays, Lock, Star, Trash2, UserRound, Users } from "lucide-react";
import { useT, useFormat } from "@/i18n";
import { allowedStatuses, canDeleteProject, canEditProjectDetails } from "@/lib/permissions";
import { PRIORITY_DOT, PROJECT_STATUS_BADGE } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { AvatarStack } from "@/components/ui/Avatar";
import { Meta } from "@/components/ui/Meta";
import type { Project, ProjectStatus, User } from "@/types";

// Un rand din lista de proiecte: titlu si detalii in stanga, stare si progres in dreapta
export function ProjectCard({ project: p, user, isFavorite, onToggleFavorite, onStatusChange, onDelete }: {
  project: Project; user: User | null; isFavorite: boolean;
  onToggleFavorite: () => void; onStatusChange: (status: ProjectStatus) => void; onDelete: () => void;
}) {
  const { t } = useT();
  const format = useFormat();
  // Aceleasi reguli ca pe server (lib/permissions): controalele apar doar pentru actiunile permise
  const statusOptions = allowedStatuses(p, user);
  const readOnly = !canEditProjectDetails(p, user) && statusOptions.length <= 1;
  const progress = p.progressPercentage || 0;
  // Membrii echipei; la un proiect individual, autorul lui
  const people = p.team?.members?.map(m => m.user) ?? (p.createdBy ? [p.createdBy] : []);

  return (
    <li className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <button onClick={onToggleFavorite} aria-pressed={isFavorite} className="flex-shrink-0 p-0.5 mt-0.5"
          title={isFavorite ? t("projects.unfavorite") : t("projects.favorite")} aria-label={isFavorite ? t("projects.unfavoriteLabel", { title: p.title }) : t("projects.favoriteLabel", { title: p.title })}>
          <Star className={`w-4 h-4 transition-colors ${isFavorite ? "fill-amber-400 text-amber-500" : "text-slate-400 dark:text-slate-500 hover:text-amber-500"}`} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Link href={`/projects/${p.id}`} className="truncate dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">{p.title}</Link>
            {readOnly && <Lock className="w-3 h-3 flex-shrink-0 text-slate-400" aria-label={t("common.view")} />}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">{p.description}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p.priority]}`} aria-hidden="true" />{t(`priority.${p.priority}`)}
            </span>
            {p.team && <Meta icon={Users}>{p.team.name}</Meta>}
            {p.coordinator && <Meta icon={UserRound}>{p.coordinator.firstName} {p.coordinator.lastName}</Meta>}
            {p.endDate && <Meta icon={CalendarDays}>{format.date(p.endDate)}</Meta>}
            {!!p.technologies?.length && <span aria-label={t("projects.technologiesLabel")}>{p.technologies.join(" · ")}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 md:flex-shrink-0 pl-7 md:pl-0">
        <div className="md:w-20 flex md:justify-end"><AvatarStack people={people} label={t("common.membersLabel")} /></div>
        {statusOptions.length > 1 ? (
          <select value={p.status} onChange={e => onStatusChange(e.target.value as ProjectStatus)} aria-label={t("projects.statusLabel", { title: p.title })}
            className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-300 w-32">
            {statusOptions.map(v => <option key={v} value={v}>{t(`projectStatus.${v}`)}</option>)}
          </select>
        ) : (
          <Badge color={PROJECT_STATUS_BADGE[p.status]} className="w-32 justify-center">{t(`projectStatus.${p.status}`)}</Badge>
        )}
        <div className="flex items-center gap-2 order-last basis-full md:order-none md:basis-auto md:w-36" title={t("milestones.progress")}>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" aria-hidden="true"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} /></div>
          <span className="text-xs tabular-nums text-slate-600 dark:text-slate-400 w-9 text-right">{progress}%</span>
        </div>
        <div className="w-8 flex justify-end ml-auto md:ml-0">
          {canDeleteProject(p, user) && (
            <button aria-label={t("projects.deleteLabel", { title: p.title })} title={t("common.delete")} onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
