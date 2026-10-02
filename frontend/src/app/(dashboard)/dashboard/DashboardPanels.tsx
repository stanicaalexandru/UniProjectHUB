"use client";
import Link from "next/link";
import { useT } from "@/i18n";
import { PRIORITY_DOT, PROJECT_STATUS_BADGE, PROJECT_STATUS_HEX, TASK_STATUS_BADGE, EVALUATION_STATUS_BADGE } from "@/lib/constants";
import { ALL_STATUSES } from "@/lib/permissions";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/States";
import type { DashboardData } from "./dashboardData";
import type { Project } from "@/types";

const DAY = 86400000;

// Card cu titlu si link "vezi tot"
function Panel({ title, href, linkLabel, children, className = "" }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold dark:text-slate-100">{title}</h2>
        {href && <Link href={href} className="text-xs text-blue-700 dark:text-blue-400 hover:underline">{linkLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ icon, text, action }: { icon?: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-6">
      {icon && <div className="text-3xl mb-2" aria-hidden="true">{icon}</div>}
      <p className="text-slate-500 text-sm dark:text-slate-400">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function Loading() {
  const { t } = useT();
  return <div className="flex justify-center py-8 text-slate-500 dark:text-slate-400" role="status" aria-label={t("common.loading")}><Spinner className="w-5 h-5" /></div>;
}

// Rand de proiect: titlu, o linie secundara, progres si stare
function ProjectRow({ p, subtitle }: { p: Project; subtitle: string }) {
  const { t } = useT();
  return (
    <li>
      <Link href={`/projects/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
        <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-lg flex-shrink-0" aria-hidden="true">{p.team ? "👥" : "📁"}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate dark:text-slate-200">{p.title}</span>
          <span className="block text-xs text-slate-500 mt-0.5 dark:text-slate-400 truncate">{subtitle}</span>
          <span className="block h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5" aria-hidden="true"><span className="block h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPercentage || 0}%` }} /></span>
        </span>
        <span className="text-right flex-shrink-0">
          <Badge color={PROJECT_STATUS_BADGE[p.status]}>{t(`projectStatus.${p.status}`)}</Badge>
          <span className="block text-xs text-slate-500 mt-1 dark:text-slate-400">{p.progressPercentage || 0}%</span>
        </span>
      </Link>
    </li>
  );
}

const personName = (u?: { firstName?: string; lastName?: string } | null) => (u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "");

export function AdminPanels({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const { t } = useT();
  const projects = data?.allProjects ?? [];
  const users = data?.users ?? [];
  const distribution = ALL_STATUSES.map(status => ({ status, count: projects.filter(p => p.status === status).length })).filter(s => s.count > 0);
  const maxCount = Math.max(...distribution.map(s => s.count), 1);
  const roles = [
    { key: "student", icon: "🎓", color: "#16a34a" },
    { key: "professor", icon: "👨‍🏫", color: "#2563eb" },
    { key: "admin", icon: "⚙️", color: "#9333ea" },
  ] as const;
  const professors = users.filter(u => u.role === "professor")
    .map(prof => ({ prof, count: projects.filter(p => p.coordinatorId === prof.id).length }))
    .sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title={t("dashboard.statusDistribution")} className="lg:col-span-2">
          <div className="p-5">
            {loading ? <Loading /> : distribution.length === 0 ? <Empty text={t("projects.none")} /> : (
              <ul className="space-y-3">
                {distribution.map(s => (
                  <li key={s.status} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-600 dark:text-slate-400 flex-shrink-0">{t(`projectStatus.${s.status}`)}</span>
                    <span className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden" aria-hidden="true">
                      <span className="h-full rounded-lg flex items-center px-2 transition-all" style={{ width: `${Math.max((s.count / maxCount) * 100, 8)}%`, backgroundColor: PROJECT_STATUS_HEX[s.status] ?? "#64748b" }}>
                        <span className="text-white text-xs font-bold">{s.count}</span>
                      </span>
                    </span>
                    <span className="w-8 text-xs font-semibold dark:text-slate-300 text-right">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel title={t("dashboard.usersByRole")}>
          <div className="p-5">
            {loading ? <Loading /> : (
              <>
                <ul className="space-y-4">
                  {roles.map(r => {
                    const value = users.filter(u => u.role === r.key).length;
                    return (
                      <li key={r.key} className="flex items-center gap-3">
                        <span className="text-xl flex-shrink-0" aria-hidden="true">{r.icon}</span>
                        <span className="flex-1">
                          <span className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400">{t(`dashboard.rolePlural.${r.key}`)}</span><span className="font-semibold dark:text-slate-300">{value}</span></span>
                          <span className="block h-2 bg-slate-100 dark:bg-slate-800 rounded-full" aria-hidden="true"><span className="block h-full rounded-full" style={{ width: `${(value / (users.length || 1)) * 100}%`, backgroundColor: r.color }} /></span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 text-center dark:text-slate-400">{t("dashboard.totalUsers", { count: users.length })}</p>
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title={t("dashboard.activeProfessors")} href="/users" linkLabel={t("dashboard.seeAll")}>
          {loading ? <Loading /> : professors.length === 0 ? <Empty text={t("dashboard.noProfessors")} /> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {professors.map(({ prof, count }) => (
                <li key={prof.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar user={prof} size="sm" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium dark:text-slate-200 truncate">{personName(prof)}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{prof.department || t("common.none")}</span>
                  </span>
                  <span className="text-right flex-shrink-0 text-sm font-bold dark:text-slate-200">{t("dashboard.projectCount", { count })}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("dashboard.recentProjects")} href="/projects" linkLabel={t("dashboard.seeAll")}>
          <div className="p-2">
            {loading ? <Loading /> : projects.length === 0 ? <Empty text={t("projects.none")} /> : (
              <ul>{projects.slice(0, 4).map(p => <ProjectRow key={p.id} p={p} subtitle={personName(p.coordinator) || t("dashboard.noCoordinator")} />)}</ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ProfessorPanels({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const { t } = useT();
  const projects = data?.myProjects ?? [];
  const evals = data?.pendingEvaluations ?? [];
  const deadlines = data?.upcomingMilestones ?? [];
  const now = Date.now();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Panel title={t("dashboard.coordinatedProjects")} href="/projects" linkLabel={t("dashboard.seeAll")}>
        <div className="p-2">
          {loading ? <Loading /> : projects.length === 0 ? <Empty icon="📁" text={t("dashboard.noCoordinated")} /> : (
            <ul>{projects.slice(0, 4).map(p => <ProjectRow key={p.id} p={p} subtitle={personName(p.createdBy) || t("common.unknownUser")} />)}</ul>
          )}
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title={t("dashboard.evaluationsToComplete")} href="/evaluations" linkLabel={t("dashboard.go")}>
          <div className="p-3">
            {loading ? <Loading /> : evals.length === 0 ? <Empty icon="✅" text={t("dashboard.allEvaluationsDone")} /> : (
              <ul>
                {evals.slice(0, 4).map(ev => (
                  <li key={ev.id} className="flex items-center gap-3 p-2 rounded-lg">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-sm flex-shrink-0" aria-hidden="true">📝</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-medium dark:text-slate-200 truncate">{ev.projectTitle}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`evaluationPhase.${ev.phase}`)}</span>
                    </span>
                    <Badge color={EVALUATION_STATUS_BADGE[ev.status]}>{t(`evaluationStatus.${ev.status}`)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel title={t("dashboard.deadlines7")} href="/milestones" linkLabel={t("dashboard.go")}>
          <div className="p-3">
            {loading ? <Loading /> : deadlines.length === 0 ? <Empty icon="🎯" text={t("dashboard.noDeadlines")} /> : (
              <ul>
                {deadlines.slice(0, 4).map(m => {
                  const daysLeft = Math.ceil((new Date(m.dueDate).getTime() - now) / DAY);
                  return (
                    <li key={m.id} className="flex items-center gap-3 p-2 rounded-lg">
                      <span className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center text-sm flex-shrink-0" aria-hidden="true">⏰</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-medium dark:text-slate-200 truncate">{m.title}</span>
                        <span className="block text-xs text-slate-500 truncate dark:text-slate-400">{m.projectTitle}</span>
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${daysLeft <= 2 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"}`}>
                        {daysLeft <= 0 ? t("calendar.today") : daysLeft === 1 ? t("dashboard.tomorrow") : t("dashboard.inDays", { count: daysLeft })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function StudentPanels({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const { t } = useT();
  const projects = data?.myProjects ?? [];
  const tasks = data?.myTasks ?? [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Panel title={t("dashboard.myProjects")} href="/projects" linkLabel={t("dashboard.seeAll")}>
        <div className="p-2">
          {loading ? <Loading /> : projects.length === 0 ? (
            <Empty icon="📁" text={t("profile.noProjects")} action={<Link href="/projects" className="btn-primary text-xs">{t("dashboard.createFirstProject")}</Link>} />
          ) : (
            <ul>{projects.slice(0, 4).map(p => <ProjectRow key={p.id} p={p} subtitle={personName(p.coordinator) || t("dashboard.noCoordinator")} />)}</ul>
          )}
        </div>
      </Panel>

      <Panel title={t("dashboard.myTasks")} href="/tasks" linkLabel={t("dashboard.seeAll")}>
        <div className="p-4">
          {loading ? <Loading /> : tasks.length === 0 ? (
            <Empty icon="✅" text={t("dashboard.noTasksAssigned")} action={<Link href="/tasks" className="btn-primary text-xs">{t("tasks.newTask")}</Link>} />
          ) : (
            <ul>
              {tasks.slice(0, 4).map(task => (
                <li key={task.id} className="flex items-center gap-3 py-2.5 border-b last:border-0 border-slate-100 dark:border-slate-800">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority] ?? "bg-slate-300"}`} role="img" aria-label={t(`priority.${task.priority}`)} />
                  <span className="text-sm flex-1 truncate dark:text-slate-300">{task.title}</span>
                  <Badge color={TASK_STATUS_BADGE[task.status]}>{t(`taskStatus.${task.status}`)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}
