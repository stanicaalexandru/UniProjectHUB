"use client";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import { useT, useErrorMessage, useFormat } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { buildGanttItems, buildTimeline, type GanttItem, type GanttStatus } from "./ganttData";
import type { Milestone, Project, Task } from "@/types";

const STATUS_COLORS: Record<GanttStatus, string> = {
  completed: "bg-green-500",
  in_progress: "bg-blue-500",
  pending: "bg-slate-400",
  overdue: "bg-red-500",
};
const LEGEND: GanttStatus[] = ["completed", "in_progress", "pending", "overdue"];
const colorOf = (status: string) => STATUS_COLORS[status as GanttStatus] ?? "bg-slate-400";
const listOf = <T,>(d: T[] | { data?: T[] }): T[] => (Array.isArray(d) ? d : d.data || []);

export default function GanttPage() {
  const { t, locale } = useT();
  const errorMessage = useErrorMessage();
  const format = useFormat();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMonths, setViewMonths] = useState(6);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(visibleProjects(data, storedUser()))).catch(() => {});
  }, []);

  const loadGanttData = async (pid: string) => {
    if (!pid) return;
    setLoading(true); setError(null);
    try {
      const [milestones, tasks] = await Promise.all([apiFetch(`/projects/${pid}/milestones`), apiFetch(`/tasks?projectId=${pid}`)]);
      setItems(buildGanttItems(projects.find(p => p.id === pid), listOf<Milestone>(milestones), listOf<Task>(tasks)));
    } catch (e) { setError(e); setItems([]); }
    setLoading(false);
  };

  const handleProjectChange = (pid: string) => { setProjectId(pid); loadGanttData(pid); };

  const timeline = buildTimeline(items, viewMonths);
  const monthLabel = (d: Date) => d.toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", { month: "short", year: "numeric" });
  const statusLabel = (s: GanttStatus) => t(`milestoneStatus.${s}`);

  return (
    <Page>
      <PageHeader title={t("gantt.title")}>
        <select value={viewMonths} onChange={e => setViewMonths(+e.target.value)} className="input w-36" aria-label={t("gantt.period")}>
          {[3, 6, 9, 12].map(n => <option key={n} value={n}>{t("gantt.months", { count: n })}</option>)}
        </select>
        <button onClick={() => loadGanttData(projectId)} disabled={!projectId} className="btn-secondary text-xs"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />{t("common.refresh")}</button>
      </PageHeader>

      <PageBody>
        {error ? <Alert className="mb-4">{errorMessage(error)}</Alert> : null}
        <div className="mb-5 flex flex-wrap items-end gap-4">
          <SelectField label={t("documents.selectProject")} wrapperClassName="flex-1 max-w-sm min-w-[220px]" value={projectId} onChange={e => handleProjectChange(e.target.value)}>
            <option value="">{t("documents.chooseProject")}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </SelectField>
          {items.length > 0 && (
            <ul className="flex flex-wrap gap-3 pb-2" aria-label={t("gantt.legend")}>
              {LEGEND.map(s => (
                <li key={s} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${STATUS_COLORS[s]}`} aria-hidden="true" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{statusLabel(s)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!projectId ? (
          <EmptyState icon="📊" title={t("gantt.selectProject")} description={t("gantt.selectProjectHint")} />
        ) : loading ? (
          <LoadingState label={t("gantt.generating")} />
        ) : items.length === 0 ? (
          <EmptyState icon="📊" title={t("gantt.noItems")} description={t("gantt.noItemsHint")} />
        ) : (
          <div className="card overflow-x-auto">
            <div className="flex min-w-[760px]">
              {/* Stanga: denumirile activitatilor */}
              <div className="w-56 lg:w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800">
                <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t("gantt.activity")}</span>
                </div>
                {items.map(item => (
                  <div key={item.id} className="h-12 border-b last:border-0 border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colorOf(item.status)}`} aria-hidden="true" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium" title={item.title}><span aria-hidden="true">{item.icon} </span>{item.title}</span>
                  </div>
                ))}
              </div>

              {/* Dreapta: axa temporala */}
              <div className="flex-1">
                <div className="h-10 border-b border-slate-200 dark:border-slate-800 relative">
                  {timeline.monthColumns.map(m => (
                    <div key={m.date.toISOString()} className="absolute top-0 bottom-0 flex items-center justify-center border-r border-slate-200 dark:border-slate-800" style={{ left: `${m.left}%`, width: `${m.width}%` }}>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{monthLabel(m.date)}</span>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  {timeline.todayLeft >= 0 && timeline.todayLeft <= 100 && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${timeline.todayLeft}%` }} aria-hidden="true">
                      <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                      <div className="absolute top-2 -translate-x-1/2 text-xs text-red-600 font-bold whitespace-nowrap dark:text-red-400">{t("gantt.today")}</div>
                    </div>
                  )}
                  {items.map((item, idx) => (
                    <div key={item.id} className={`h-12 border-b last:border-0 border-slate-100 dark:border-slate-800 relative flex items-center ${idx % 2 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}`}>
                      {timeline.monthColumns.map(m => (
                        <div key={m.date.toISOString()} className="absolute top-0 bottom-0 border-r border-slate-100 dark:border-slate-800" style={{ left: `${m.left}%` }} aria-hidden="true" />
                      ))}
                      <div className="absolute h-6 rounded-full flex items-center overflow-hidden shadow-sm group"
                        style={{ ...timeline.barStyle(item), minWidth: "4px" }}
                        title={`${item.title} — ${format.date(item.start)} → ${format.date(item.end)}`}
                        role="img" aria-label={t("gantt.barLabel", { title: item.title, start: format.date(item.start), end: format.date(item.end), progress: item.progress })}>
                        <div className={`absolute inset-0 ${colorOf(item.status)} opacity-90 group-hover:opacity-100 transition-opacity rounded-full`} />
                        <div className={`absolute top-0 bottom-0 left-0 ${colorOf(item.status)} rounded-full`} style={{ width: `${item.progress}%`, filter: "brightness(1.2)" }} />
                        <span className="relative z-10 text-white text-xs font-medium px-2 truncate">{item.progress > 0 ? `${item.progress}%` : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-600 dark:text-slate-400 min-w-[760px]">
              <span>{t("gantt.totalActivities", { count: items.length })}</span>
              <span>{t("gantt.completedCount", { count: items.filter(i => i.status === "completed").length })}</span>
              <span>{t("gantt.inProgressCount", { count: items.filter(i => i.status === "in_progress").length })}</span>
              <span className="ml-auto">{t("gantt.range", { start: format.date(timeline.start), end: format.date(timeline.end) })}</span>
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  );
}
