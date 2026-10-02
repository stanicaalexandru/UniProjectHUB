"use client";
import { Meta } from "@/components/ui/Meta";
import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Folder, Plus, RefreshCw, X } from "lucide-react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import { PRIORITY_DOT } from "@/lib/constants";
import { useT, useErrorMessage, useFormat } from "@/i18n";
import { useConfirm } from "@/components/ui/Feedback";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingState } from "@/components/ui/States";
import { CreateTaskModal } from "./CreateTaskModal";
import type { Project, Task, TaskStatus, User } from "@/types";

const COLUMNS: { status: TaskStatus; bg: string }[] = [
  { status: "todo", bg: "bg-slate-100 dark:bg-slate-900/60" },
  { status: "in_progress", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { status: "in_review", bg: "bg-purple-50 dark:bg-purple-950/40" },
  { status: "blocked", bg: "bg-red-50 dark:bg-red-950/30" },
  { status: "done", bg: "bg-green-50 dark:bg-green-950/40" },
];

function TaskCard({ task, onMove, onDelete }: { task: Task; onMove: (status: TaskStatus) => void; onDelete: () => void }) {
  const { t } = useT();
  const format = useFormat();
  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm">
      <div className="flex items-start gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${PRIORITY_DOT[task.priority] ?? "bg-slate-300"}`} role="img" aria-label={t(`priority.${task.priority}`)} title={t(`priority.${task.priority}`)} />
        <h3 className="text-sm font-medium flex-1 leading-tight dark:text-slate-200">{task.title}</h3>
        <button aria-label={t("tasks.deleteLabel", { title: task.title })} title={t("common.delete")} onClick={onDelete} className="text-slate-500 hover:text-red-600 transition-colors flex-shrink-0 dark:text-slate-400">
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
      {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2 dark:text-slate-400">{task.description}</p>}
      {task.project && <div className="text-xs text-blue-700 dark:text-blue-400 mb-1.5 truncate"><Meta icon={Folder}>{task.project.title}</Meta></div>}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2 dark:text-slate-400">
        {task.assignee ? (
          <span className="flex items-center gap-1 min-w-0"><Avatar user={task.assignee} size="xs" /><span className="truncate">{task.assignee.firstName}</span></span>
        ) : <span>{t("tasks.unassigned")}</span>}
        {task.dueDate && <Meta icon={CalendarDays} className="flex-shrink-0">{format.date(task.dueDate)}</Meta>}
      </div>
      <select value={task.status} onChange={e => onMove(e.target.value as TaskStatus)} aria-label={t("tasks.statusLabel", { title: task.title })}
        className="w-full text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
        {COLUMNS.map(c => <option key={c.status} value={c.status}>{t(`taskStatus.${c.status}`)}</option>)}
      </select>
    </article>
  );
}

export default function TasksPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const confirm = useConfirm();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterProjectId, setFilterProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async (projectId?: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(projectId ? `/tasks?projectId=${projectId}` : "/tasks");
      setTasks(Array.isArray(data) ? data : data.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const me = storedUser();
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(visibleProjects(data, me))).catch(() => {});
    // Fara proiect ales, studentii pot asigna doar altor studenti
    apiFetchAll<User>("/users").then(({ data }) => setUsers(me?.role === "student" ? data.filter(u => u.role === "student") : data)).catch(() => {});
    load();
  }, [load]);

  const handleFilterChange = (pid: string) => { setFilterProjectId(pid); load(pid); };

  const moveTask = async (id: string, status: TaskStatus) => {
    try {
      await apiFetch(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setTasks(list => list.map(task => task.id === id ? { ...task, status } : task));
    } catch (e) { setError(e); }
  };

  const deleteTask = async (task: Task) => {
    if (!(await confirm({ title: t("tasks.deleteTitle"), message: task.title, confirmLabel: t("common.delete"), danger: true }))) return;
    try {
      await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
      setTasks(list => list.filter(x => x.id !== task.id));
    } catch (e) { setError(e); }
  };

  return (
    <Page>
      <PageHeader title={t("tasks.title")}>
        <select value={filterProjectId} onChange={e => handleFilterChange(e.target.value)} className="input w-48" aria-label={t("tasks.filterByProject")}>
          <option value="">{t("tasks.allProjects")}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button aria-label={t("tasks.reload")} title={t("tasks.reload")} onClick={() => load(filterProjectId)} className="btn-secondary p-2"><RefreshCw className="w-4 h-4" aria-hidden="true" /></button>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("tasks.newTask")}</button>
      </PageHeader>

      <PageBody>
        {error ? <Alert className="mb-4" onDismiss={() => setError(null)} dismissLabel={t("common.close")}>{errorMessage(error)}</Alert> : null}
        {loading ? <LoadingState label={t("common.loading")} /> : (
          // Pe ecrane inguste coloanele se deruleaza orizontal
          <div className="grid grid-flow-col auto-cols-[minmax(250px,1fr)] gap-4 min-h-96 overflow-x-auto pb-2">
            {COLUMNS.map(col => {
              const items = tasks.filter(task => task.status === col.status);
              return (
                <section key={col.status} className={`${col.bg} rounded-xl p-3 transition-colors`} aria-label={t(`taskStatus.${col.status}`)}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t(`taskStatus.${col.status}`)}</h2>
                    <span className="text-xs bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-2 py-0.5 font-semibold">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(task => <TaskCard key={task.id} task={task} onMove={s => moveTask(task.id, s)} onDelete={() => deleteTask(task)} />)}
                  </div>
                  {items.length === 0 && <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">{t("tasks.noTasks")}</div>}
                  <button onClick={() => setShowCreate(true)} className="w-full mt-2 py-2 text-xs text-slate-600 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 transition-colors dark:text-slate-400">
                    + {t("tasks.newTask")}
                  </button>
                </section>
              );
            })}
          </div>
        )}
      </PageBody>

      {showCreate && (
        <CreateTaskModal projects={projects} users={users} defaultProjectId={filterProjectId} onClose={() => setShowCreate(false)}
          onCreated={task => { setTasks(list => [...list, task]); setShowCreate(false); }} />
      )}
    </Page>
  );
}
