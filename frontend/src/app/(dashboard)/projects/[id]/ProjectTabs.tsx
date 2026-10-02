"use client";
import { Download } from "lucide-react";
import { downloadFile } from "@/lib/api";
import { useT, useFormat, useUserName } from "@/i18n";
import { MILESTONE_STATUS_BADGE, MILESTONE_STATUS_DOT, PRIORITY_DOT, PROJECT_STATUS_BADGE, TASK_STATUS_BADGE } from "@/lib/constants";
import { averageScore } from "@/lib/evaluations";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/States";
import type { Document, Evaluation, Milestone, Project, Task, User } from "@/types";

export type Activity = { id: string; action: string; description?: string; user?: User | null; createdAt: string };

const card = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm";

export function OverviewTab({ project }: { project: Project }) {
  const { t } = useT();
  const format = useFormat();
  const details: [string, React.ReactNode][] = [
    [t("projects.type"), t(`projectType.${project.type}`)],
    [t("projects.priority"), t(`priority.${project.priority}`)],
    [t("projectDetail.status"), <Badge key="s" color={PROJECT_STATUS_BADGE[project.status]}>{t(`projectStatus.${project.status}`)}</Badge>],
    [t("profile.faculty"), project.faculty || t("common.none")],
    [t("projectDetail.startDate"), format.date(project.startDate)],
    [t("projects.endDate"), format.date(project.endDate)],
  ];
  return (
    <div className="space-y-4">
      <section className={`${card} p-5`}>
        <h2 className="text-sm font-semibold dark:text-slate-100 mb-3">{t("projectDetail.details")}</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details.map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500 mb-0.5 dark:text-slate-400">{k}</dt><dd className="text-sm font-medium dark:text-slate-200">{v}</dd></div>)}
        </dl>
        {project.description && <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{project.description}</p>}
      </section>
      {!!project.technologies?.length && (
        <section className={`${card} p-5`}>
          <h2 className="text-sm font-semibold dark:text-slate-100 mb-3">{t("projects.technologies")}</h2>
          <ul className="flex flex-wrap gap-2">
            {project.technologies.map(tech => <li key={tech} className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">{tech}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

export function MilestonesTab({ milestones }: { milestones: Milestone[] }) {
  const { t } = useT();
  const format = useFormat();
  if (milestones.length === 0) return <EmptyState icon="🎯" title={t("projectDetail.noMilestones")} />;
  return (
    <ol className="space-y-3">
      {milestones.map((m, i) => (
        <li key={m.id} className={card}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${MILESTONE_STATUS_DOT[m.status] ?? "bg-slate-300"}`} aria-hidden="true">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-medium text-sm dark:text-slate-200">{m.title}</h3>
                <Badge color={MILESTONE_STATUS_BADGE[m.status]}>{t(`milestoneStatus.${m.status}`)}</Badge>
              </div>
              {m.description && <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>}
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2" aria-hidden="true"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.progressPercentage || 0}%` }} /></div>
            </div>
            <div className="text-right flex-shrink-0"><div className="text-xs text-slate-500 dark:text-slate-400">{t("milestones.due")}</div><div className="text-sm font-semibold dark:text-slate-200">{format.date(m.dueDate)}</div></div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TasksTab({ tasks }: { tasks: Task[] }) {
  const { t } = useT();
  const format = useFormat();
  if (tasks.length === 0) return <EmptyState icon="✅" title={t("tasks.noTasks")} />;
  return (
    <ul className="space-y-2">
      {tasks.map(task => (
        <li key={task.id} className={`${card} flex flex-wrap items-center gap-3`}>
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? "bg-slate-300"}`} role="img" aria-label={t(`priority.${task.priority}`)} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium dark:text-slate-200">{task.title}</div>
            {task.assignee && <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400"><span aria-hidden="true">👤 </span>{task.assignee.firstName} {task.assignee.lastName}</div>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge color={TASK_STATUS_BADGE[task.status]}>{t(`taskStatus.${task.status}`)}</Badge>
            {task.dueDate && <span className="text-xs text-slate-500 dark:text-slate-400"><span aria-hidden="true">📅 </span>{format.date(task.dueDate)}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DocumentsTab({ documents, onError }: { documents: Document[]; onError: (e: unknown) => void }) {
  const { t } = useT();
  const format = useFormat();
  const displayName = useUserName();
  if (documents.length === 0) return <EmptyState icon="📄" title={t("documents.none")} />;
  return (
    <ul className="space-y-2">
      {documents.map(doc => {
        const name = doc.name || doc.originalName;
        return (
          <li key={doc.id} className={`${card} flex items-center gap-3`}>
            <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">📄</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium dark:text-slate-200 truncate">{name}</div>
              <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{displayName(doc.uploadedBy)} · {format.date(doc.createdAt)}</div>
            </div>
            <button type="button" onClick={() => downloadFile(`/documents/${doc.id}/download`, doc.originalName || doc.name).catch(onError)}
              className="btn-secondary text-xs px-3 py-1.5" aria-label={t("documents.downloadLabel", { name })}>
              <Download className="w-3.5 h-3.5" aria-hidden="true" />{t("common.download")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function EvaluationsTab({ evaluations }: { evaluations: Evaluation[] }) {
  const { t } = useT();
  const format = useFormat();
  const displayName = useUserName();
  if (evaluations.length === 0) return <EmptyState icon="📝" title={t("evaluations.none")} />;
  const avg = averageScore(evaluations);
  return (
    <div className="space-y-4">
      {avg && (
        <div className="bg-gradient-to-r from-blue-700 to-violet-700 rounded-xl p-5 text-white flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <div className="font-bold text-lg mb-1">{t("projectDetail.averageScore")}</div>
            <div className="text-blue-100 text-sm">{t("projectDetail.completedEvaluations", { count: evaluations.filter(e => e.status === "completed").length })}</div>
          </div>
          <div className="text-5xl font-bold">{avg.score.toFixed(1)}<span className="text-2xl text-blue-100">/{avg.max.toFixed(0)}</span></div>
        </div>
      )}
      {evaluations.map(ev => (
        <article key={ev.id} className={card}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold dark:text-slate-100">{t(`evaluationPhase.${ev.phase}`)}</h3>
              <div className="text-xs text-slate-500 dark:text-slate-400">{displayName(ev.evaluator)} · {format.date(ev.createdAt)}</div>
            </div>
            {Number(ev.totalScore) > 0 && <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{Number(ev.totalScore).toFixed(0)}<span className="text-sm text-slate-500 dark:text-slate-400">/{Number(ev.maxScore || 100).toFixed(0)}</span></div>}
          </div>
          {ev.generalFeedback && <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">{ev.generalFeedback}</p>}
        </article>
      ))}
    </div>
  );
}

export function ActivityTab({ activities }: { activities: Activity[] }) {
  const { t, tr } = useT();
  const format = useFormat();
  const displayName = useUserName();
  if (activities.length === 0) return <EmptyState icon="📋" title={t("projectDetail.noActivity")} />;
  return (
    <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
      {activities.map(a => (
        <li key={a.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <Avatar user={a.user} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium dark:text-slate-200">{displayName(a.user)}</span>
              {a.user?.role && <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded dark:text-slate-400">{t(`roles.${a.user.role}`)}</span>}
              <span className="text-xs font-medium text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                {tr(`projectDetail.action.${a.action}`, a.action?.replace(/_/g, " "))}
              </span>
            </div>
            {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</p>}
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0 whitespace-nowrap dark:text-slate-400">{format.dateTime(a.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
