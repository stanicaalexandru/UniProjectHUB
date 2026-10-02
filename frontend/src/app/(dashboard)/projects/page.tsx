"use client";
import { useState, useEffect, useCallback } from "react";
import { Folder, Plus, RefreshCw, Star } from "lucide-react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { isProjectMember } from "@/lib/projects";
import { ALL_STATUSES } from "@/lib/permissions";
import { useConfirm } from "@/components/ui/Feedback";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { ProjectCard } from "./ProjectCard";
import { CreateProjectModal } from "./CreateProjectModal";
import type { Project, ProjectStatus, Team, User } from "@/types";

type Scope = "all" | "mine" | "favorites";

export default function ProjectsPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const confirm = useConfirm();
  const { user } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [professors, setProfessors] = useState<User[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [scope, setScope] = useState<Scope>("all");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProjects((await apiFetchAll<Project>("/projects")).data); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/users/professors").then(d => setProfessors(Array.isArray(d) ? d : [])).catch(() => {});
    // La un proiect de echipa se poate alege doar o echipa din care faci parte
    apiFetch("/teams").then(d => {
      const list: Team[] = Array.isArray(d) ? d : d.data || [];
      setTeams(list.filter(team => team.members?.some(m => m.user?.id === user.id)));
    }).catch(() => {});
    setFavorites(Array.isArray(user.favoriteProjects) ? user.favoriteProjects : []);
  }, [user]);

  // Favoritele sunt salvate in contul utilizatorului
  const toggleFavorite = async (projectId: string) => {
    if (!user) return;
    const previous = favorites;
    const updated = favorites.includes(projectId) ? favorites.filter(id => id !== projectId) : [...favorites, projectId];
    setFavorites(updated);
    try {
      await apiFetch(`/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ favoriteProjects: updated }) });
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, favoriteProjects: updated }));
    } catch { setFavorites(previous); }
  };

  const handleDelete = async (p: Project) => {
    if (!(await confirm({ title: t("projects.deleteTitle", { title: p.title }), message: t("projects.deleteMessage"), confirmLabel: t("common.delete"), danger: true }))) return;
    try {
      await apiFetch(`/projects/${p.id}`, { method: "DELETE" });
      setProjects(list => list.filter(x => x.id !== p.id));
    } catch (e) { setError(e); }
  };

  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    try {
      await apiFetch(`/projects/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setProjects(list => list.map(p => p.id === id ? { ...p, status } : p));
    } catch (e) { setError(e); }
  };

  const visible = projects
    .filter(p => scope !== "mine" || isProjectMember(p, user?.id))
    .filter(p => scope !== "favorites" || favorites.includes(p.id))
    .filter(p => !statusFilter || p.status === statusFilter)
    .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))); // favoritele primele

  const scopeButton = (value: Scope, label: React.ReactNode) => (
    <button onClick={() => setScope(value)} aria-pressed={scope === value}
      className={`text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${scope === value ? `bg-white dark:bg-slate-700 shadow-sm font-medium ${value === "favorites" ? "text-amber-800 dark:text-amber-400" : "dark:text-slate-200"}` : "text-slate-600 dark:text-slate-400"}`}>
      {label}
    </button>
  );

  return (
    <Page>
      <PageHeader title={t("projects.title")}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ProjectStatus | "")} className="input w-44" aria-label={t("projects.filterByStatus")}>
          <option value="">{t("projects.allStatuses")}</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{t(`projectStatus.${s}`)}</option>)}
        </select>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("projects.newProject")}</button>
      </PageHeader>

      <PageBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1" role="group" aria-label={t("projects.scopeLabel")}>
            {scopeButton("all", t("projects.scopeAll"))}
            {scopeButton("mine", t("projects.scopeMine"))}
            {scopeButton("favorites", <><Star className={`w-3 h-3 ${scope === "favorites" ? "fill-amber-500 text-amber-600" : ""}`} aria-hidden="true" />{t("projects.scopeFavorites")}{favorites.length > 0 && ` (${favorites.length})`}</>)}
          </div>
          <button aria-label={t("projects.reload")} title={t("projects.reload")} onClick={load} className="btn-secondary p-2"><RefreshCw className="w-4 h-4" aria-hidden="true" /></button>
          {!loading && visible.length > 0 && <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">{t("projects.count", { count: visible.length })}</span>}
        </div>

        {error ? <Alert onDismiss={() => setError(null)} dismissLabel={t("common.close")}>{errorMessage(error)}</Alert> : null}

        {loading ? <LoadingState label={t("common.loading")} /> : visible.length === 0 ? (
          scope === "favorites"
            ? <EmptyState icon={Star} title={t("projects.noFavorites")} description={t("projects.noFavoritesHint")} />
            : <EmptyState icon={Folder} title={t("projects.none")} action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("projects.newProject")}</button>} />
        ) : (
          <ul className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {visible.map(p => (
              <ProjectCard key={p.id} project={p} user={user} isFavorite={favorites.includes(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)} onStatusChange={s => handleStatusChange(p.id, s)} onDelete={() => handleDelete(p)} />
            ))}
          </ul>
        )}
      </PageBody>

      {showCreate && <CreateProjectModal teams={teams} professors={professors} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </Page>
  );
}
