"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ClipboardCheck, Clock, Folder, FolderCheck, ListChecks, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { storedUser } from "@/lib/projects";
import { useT } from "@/i18n";
import { loadDashboard, percent, type DashboardData } from "./dashboardData";
import { AdminPanels, ProfessorPanels, StudentPanels } from "./DashboardPanels";
import type { User } from "@/types";

type Tone = "blue" | "green" | "amber" | "rose";
type Stat = { icon: LucideIcon; label: string; value: string | number; sub: string; tone: Tone };

// Clase scrise complet, ca Tailwind sa le gaseasca la build
const TONE: Record<Tone, { border: string; icon: string }> = {
  blue: { border: "border-t-tone-blue dark:border-t-tone-blue", icon: "text-tone-blue" },
  green: { border: "border-t-tone-green dark:border-t-tone-green", icon: "text-tone-green" },
  amber: { border: "border-t-tone-amber dark:border-t-tone-amber", icon: "text-tone-amber" },
  rose: { border: "border-t-tone-rose dark:border-t-tone-rose", icon: "text-tone-rose" },
};

function useStats(user: User | null, data: DashboardData | null): Stat[] {
  const { t } = useT();
  if (!user || !data) return [];
  const all = data.allProjects;
  const completedAll = all.filter(p => p.status === "completed").length;
  const activeAll = all.filter(p => p.status === "in_progress").length;

  if (user.role === "student") return [
    { icon: Folder, label: t("dashboard.stat.totalProjects"), value: all.length, sub: t("dashboard.stat.mineCount", { count: data.myProjects.length }), tone: "blue" },
    { icon: FolderCheck, label: t("dashboard.stat.myProjects"), value: data.myProjects.length, sub: t("dashboard.stat.activeTotal", { count: activeAll }), tone: "rose" },
    { icon: ListChecks, label: t("dashboard.stat.tasksDone"), value: data.myTasks.filter(x => x.status === "done").length, sub: t("dashboard.stat.ofMyTasks"), tone: "green" },
    { icon: TrendingUp, label: t("dashboard.stat.completionRate"), value: `${percent(completedAll, all.length)}%`, sub: t("dashboard.stat.ofAllProjects"), tone: "amber" },
  ];
  if (user.role === "professor") {
    const mine = data.myProjects;
    const done = mine.filter(p => p.status === "completed").length;
    return [
      { icon: Folder, label: t("dashboard.stat.coordinated"), value: mine.length, sub: t("dashboard.stat.active", { count: mine.filter(p => p.status === "in_progress").length }), tone: "blue" },
      { icon: CheckCheck, label: t("dashboard.stat.completed"), value: done, sub: t("dashboard.stat.rate", { value: percent(done, mine.length) }), tone: "green" },
      { icon: ClipboardCheck, label: t("dashboard.stat.pendingEvaluations"), value: data.pendingEvaluations.length, sub: t("dashboard.stat.needCompleting"), tone: "amber" },
      { icon: Clock, label: t("dashboard.stat.deadlines7"), value: data.upcomingMilestones.length, sub: t("dashboard.stat.upcomingMilestones"), tone: "rose" },
    ];
  }
  const students = data.users.filter(u => u.role === "student").length;
  const professors = data.users.filter(u => u.role === "professor").length;
  const tasksDone = data.allTasks.filter(x => x.status === "done").length;
  return [
    { icon: Folder, label: t("dashboard.stat.totalProjects"), value: all.length, sub: t("dashboard.stat.active", { count: activeAll }), tone: "blue" },
    { icon: Users, label: t("dashboard.stat.totalUsers"), value: students + professors, sub: t("dashboard.stat.usersSplit", { students, professors }), tone: "rose" },
    { icon: ListChecks, label: t("dashboard.stat.tasksDone"), value: `${tasksDone}/${data.allTasks.length}`, sub: t("dashboard.stat.rate", { value: percent(tasksDone, data.allTasks.length) }), tone: "green" },
    { icon: TrendingUp, label: t("dashboard.stat.finishRate"), value: `${percent(completedAll, all.length)}%`, sub: t("dashboard.stat.projectsCompleted"), tone: "amber" },
  ];
}

export default function DashboardPage() {
  const { t, locale } = useT();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const me = storedUser();
    setUser(me);
    if (!me) return;
    loadDashboard(me).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = useStats(user, data);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("dashboard.morning") : hour < 17 ? t("dashboard.afternoon") : t("dashboard.evening");
  const activeTasks = data?.myTasks.filter(x => x.status !== "done").length ?? 0;
  const subtitle = user?.role === "professor" ? (data?.pendingEvaluations.length ? t("dashboard.pendingNote", { count: data.pendingEvaluations.length }) : "")
    : user?.role === "admin" ? t("dashboard.adminNote")
    : activeTasks > 0 ? t("dashboard.tasksNote", { count: activeTasks }) : "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title={t("nav.dashboard")} action={{ label: t("projects.newProject"), onClick: () => router.push("/projects") }} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
            {new Date().toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="text-xl font-bold dark:text-slate-100 mt-0.5">{greeting}, {user?.firstName || ""}</h2>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(stats.length ? stats : Array.from({ length: 4 }, () => null)).map((s, i) => (
            <div key={i} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-[3px] rounded-xl p-4 sm:p-5 shadow-sm ${s ? TONE[s.tone].border : ""}`}>
              {s ? (
                <>
                  <div className="flex items-start justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                    {s.label}
                    <s.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${TONE[s.tone].icon}`} aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-bold tabular-nums dark:text-slate-100 mt-2">{loading ? "…" : s.value}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.sub}</div>
                </>
              ) : <div className="h-28 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" aria-hidden="true" />}
            </div>
          ))}
        </div>

        {user?.role === "admin" && <AdminPanels data={data} loading={loading} />}
        {user?.role === "professor" && <ProfessorPanels data={data} loading={loading} />}
        {user?.role === "student" && <StudentPanels data={data} loading={loading} />}
      </div>
    </div>
  );
}
