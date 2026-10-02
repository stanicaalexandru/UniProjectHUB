"use client";
import { Activity, Flag, ListChecks, TrendingUp, TriangleAlert } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import { useT } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Spinner, EmptyState } from "@/components/ui/States";
import { analyzeProject, scoreLevel, type Analysis } from "./analysis";
import { AnalysisResults, ScoreRing } from "./AnalysisResults";
import type { Milestone, Project, Task } from "@/types";

type HistoryEntry = { score: number | string; createdAt: string };
const asList = <T,>(d: unknown): T[] => (Array.isArray(d) ? d : ((d as { data?: T[] })?.data ?? []));

export default function AiPage() {
  const { t } = useT();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [result, setResult] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(visibleProjects(data, storedUser()))).catch(() => {});
  }, []);

  const project = projects.find(p => p.id === projectId);

  const handleProjectChange = async (pid: string) => {
    setProjectId(pid);
    setResult(null);
    setMilestones([]); setTasks([]); setHistory([]);
    if (!pid) return;
    const [ms, tk, hist] = await Promise.allSettled([
      apiFetch(`/projects/${pid}/milestones`),
      apiFetch(`/tasks?projectId=${pid}`),
      apiFetch(`/ai/history/${pid}`),
    ]);
    if (ms.status === "fulfilled") setMilestones(asList<Milestone>(ms.value));
    if (tk.status === "fulfilled") setTasks(asList<Task>(tk.value));
    if (hist.status === "fulfilled") setHistory(asList<HistoryEntry>(hist.value));
  };

  // Analiza ruleaza local; scorul se salveaza pe server pentru istoricul proiectului
  const runAnalysis = async () => {
    if (!projectId) return;
    setAnalyzing(true);
    const analysis = analyzeProject(project, milestones, tasks);
    setResult(analysis);
    try {
      await apiFetch(`/ai/analyze/${projectId}`, { method: "POST", body: JSON.stringify({ progress: analysis.globalScore, score: analysis.globalScore }) });
      setHistory(asList<HistoryEntry>(await apiFetch(`/ai/history/${projectId}`)));
    } catch {}
    setAnalyzing(false);
  };

  const riskCount = result ? result.risks.filter(r => r.level !== "success").length : null;
  const stats = [
    { icon: Flag, value: `${milestones.filter(m => m.status === "completed").length}/${milestones.length}`, label: t("ai.statMilestones") },
    { icon: ListChecks, value: `${tasks.filter(x => x.status === "done").length}/${tasks.length}`, label: t("ai.statTasks") },
    { icon: TrendingUp, value: `${project?.progressPercentage || 0}%`, label: t("ai.statProgress") },
    { icon: TriangleAlert, value: riskCount ?? t("common.none"), label: t("ai.statRisks") },
  ];

  return (
    <Page>
      <PageHeader title={t("ai.title")} />
      <PageBody>
        <section className="card p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-xl">{t("ai.heroText")}</p>
              <div className="flex flex-wrap items-center gap-3">
                <select value={projectId} onChange={e => handleProjectChange(e.target.value)} aria-label={t("documents.selectProject")}
                  className="input flex-1 min-w-[200px] max-w-72">
                  <option value="">{t("documents.chooseProject")}</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <button onClick={runAnalysis} disabled={analyzing || !projectId} className="btn-primary disabled:opacity-60">
                  {analyzing ? <><Spinner />{t("ai.analyzing")}</> : t("ai.run")}
                </button>
              </div>
            </div>
            {result && (
              <div className="text-center flex-shrink-0">
                <ScoreRing score={result.globalScore} size={88} stroke={7} label={t("ai.globalScore", { score: result.globalScore })} />
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t(`ai.level.${scoreLevel(result.globalScore)}`)}</div>
              </div>
            )}
          </div>
        </section>

        {projectId && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {stats.map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {s.label}<s.icon className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <div className="text-xl font-bold tabular-nums dark:text-slate-100 mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {result ? <AnalysisResults result={result} history={history} /> : projectId ? (
          <EmptyState icon={Activity} title={t("ai.readyTitle")} description={t("ai.readyText")} action={<button onClick={runAnalysis} className="btn-primary">{t("ai.runNow")}</button>} />
        ) : (
          <EmptyState icon={Activity} title={t("ai.pickProject")} />
        )}
      </PageBody>
    </Page>
  );
}
