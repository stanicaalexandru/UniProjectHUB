"use client";
import { Meta } from "@/components/ui/Meta";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ClipboardCheck, FileText, Flag, Folder, FolderX, ListChecks, Pencil, UserRound, Video } from "lucide-react";
import { apiFetch, startVideoCall } from "@/lib/api";
import { canEditProjectDetails } from "@/lib/permissions";
import { PROJECT_STATUS_BADGE } from "@/lib/constants";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage, useFormat } from "@/i18n";
import { Page, PageHeader } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";
import { averageScore } from "@/lib/evaluations";
import { ActivityTab, DocumentsTab, EvaluationsTab, MilestonesTab, OverviewTab, TasksTab, type Activity } from "./ProjectTabs";
import { CommentsTab, type Comment } from "./CommentsTab";
import { EditProjectModal } from "./EditProjectModal";
import type { Document, Evaluation, Milestone, Project, Task } from "@/types";
import { ProjectStepper } from "./ProjectStepper";

type Tab = "overview" | "milestones" | "tasks" | "documents" | "evaluations" | "comments" | "activity";
const asList = <T,>(r: PromiseSettledResult<unknown>): T[] | null =>
  r.status !== "fulfilled" ? null : Array.isArray(r.value) ? r.value : ((r.value as { data?: T[] })?.data ?? []);

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const format = useFormat();
  const { user } = useRole();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<unknown>(null);
  const [showEdit, setShowEdit] = useState(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      apiFetch(`/projects/${id}`),
      apiFetch(`/projects/${id}/milestones`),
      apiFetch(`/tasks?projectId=${id}`),
      apiFetch(`/evaluations?projectId=${id}`),
      apiFetch(`/documents?projectId=${id}`),
      apiFetch(`/projects/${id}/comments`),
      apiFetch(`/projects/${id}/activities`),
    ]);
    const [proj, ms, tk, ev, docs, cmts, acts] = results;
    if (proj.status === "fulfilled") setProject(proj.value);
    setMilestones(asList<Milestone>(ms) ?? []);
    setTasks(asList<Task>(tk) ?? []);
    setEvaluations(asList<Evaluation>(ev) ?? []);
    setDocuments(asList<Document>(docs) ?? []);
    setComments((asList<Comment>(cmts) ?? []).reverse()); // serverul le intoarce de la cel mai nou
    setActivities(asList<Activity>(acts) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { if (id) loadProject(); }, [id, loadProject]);

  // Apelul video foloseste conversatia proiectului (aceiasi membri)
  const startProjectCall = async () => {
    try {
      await startVideoCall(async () => (await apiFetch("/chat/rooms", { method: "POST", body: JSON.stringify({ entityId: id, type: "project" }) })).id);
    } catch (e) { setError(e); }
  };

  if (loading) return <Page><LoadingState label={t("projectDetail.loading")} /></Page>;
  if (!project) return (
    <Page>
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <FolderX className="w-10 h-10 mx-auto mb-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="text-slate-700 dark:text-slate-300 font-semibold mb-4">{t("projectDetail.notFound")}</h1>
          <Link href="/projects" className="btn-primary"><ArrowLeft className="w-4 h-4" aria-hidden="true" />{t("projectDetail.backToProjects")}</Link>
        </div>
      </div>
    </Page>
  );

  const progress = project.progressPercentage || 0;
  const avg = averageScore(evaluations);
  const stats = [
    { icon: Flag, value: `${milestones.filter(m => m.status === "completed").length}/${milestones.length}`, label: t("ai.statMilestones") },
    { icon: ListChecks, value: `${tasks.filter(x => x.status === "done").length}/${tasks.length}`, label: t("ai.statTasks") },
    { icon: FileText, value: documents.length, label: t("documents.title") },
    { icon: ClipboardCheck, value: avg ? `${avg.score.toFixed(1)}p` : t("common.none"), label: t("projectDetail.averageScoreShort") },
  ];
  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: t("projectDetail.tab.overview") },
    { value: "milestones", label: t("projectDetail.tab.milestones", { count: milestones.length }) },
    { value: "tasks", label: t("projectDetail.tab.tasks", { count: tasks.length }) },
    { value: "documents", label: t("projectDetail.tab.documents", { count: documents.length }) },
    { value: "evaluations", label: t("projectDetail.tab.evaluations", { count: evaluations.length }) },
    { value: "comments", label: t("projectDetail.tab.comments", { count: comments.length }) },
    { value: "activity", label: t("projectDetail.tab.activity", { count: activities.length }) },
  ];

  return (
    <Page>
      <PageHeader title={project.title}>
        <Badge color={PROJECT_STATUS_BADGE[project.status]}>{t(`projectStatus.${project.status}`)}</Badge>
        <button type="button" onClick={startProjectCall} className="btn-secondary text-xs" title={t("projectDetail.videoCallHint")}>
          <Video className="w-3.5 h-3.5" aria-hidden="true" />{t("projectDetail.videoCall")}
        </button>
        {canEditProjectDetails(project, user) && (
          <button onClick={() => setShowEdit(true)} className="btn-secondary text-xs"><Pencil className="w-3.5 h-3.5" aria-hidden="true" />{t("common.edit")}</button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {error ? <Alert className="mx-4 sm:mx-6 mt-4" onDismiss={() => setError(null)} dismissLabel={t("common.close")}>{errorMessage(error)}</Alert> : null}

        <div className="bg-blue-700 px-4 sm:px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <span className="hidden sm:flex w-12 h-12 rounded-xl bg-white/20 items-center justify-center flex-shrink-0" aria-hidden="true"><Folder className="w-6 h-6" /></span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1">{project.title}</h2>
              <p className="text-blue-100 text-sm mb-3 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-4 flex-wrap text-sm text-blue-100">
                {project.coordinator && <Meta icon={UserRound}>{project.coordinator.firstName} {project.coordinator.lastName}</Meta>}
                {project.endDate && <Meta icon={CalendarDays}>{format.date(project.endDate)}</Meta>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-bold">{progress}%</div>
              <div className="text-blue-100 text-xs">{t("milestones.progress")}</div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/20 rounded-full" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t("milestones.progress")}>
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
          <ProjectStepper status={project.status} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 py-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm text-center">
              <s.icon className="w-4 h-4 mx-auto mb-1.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <div className="text-xl font-bold dark:text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 pb-6">
          <Tabs label={t("projectDetail.tabsLabel")} value={tab} onChange={setTab} tabs={tabs} />
          {tab === "overview" && <OverviewTab project={project} />}
          {tab === "milestones" && <MilestonesTab milestones={milestones} />}
          {tab === "tasks" && <TasksTab tasks={tasks} />}
          {tab === "documents" && <DocumentsTab documents={documents} onError={setError} />}
          {tab === "evaluations" && <EvaluationsTab evaluations={evaluations} />}
          {tab === "activity" && <ActivityTab activities={activities} />}
          {tab === "comments" && <CommentsTab projectId={project.id} user={user} comments={comments} onAdded={c => setComments(list => [...list, c])} onError={setError} />}
        </div>
      </div>

      {showEdit && <EditProjectModal project={project} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); loadProject(); }} />}
    </Page>
  );
}
