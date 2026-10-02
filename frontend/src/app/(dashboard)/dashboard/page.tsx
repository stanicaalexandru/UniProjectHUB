"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { storedUser } from "@/lib/projects";
import { useT } from "@/i18n";
import { loadDashboard, percent, type DashboardData } from "./dashboardData";
import { AdminPanels, ProfessorPanels, StudentPanels } from "./DashboardPanels";
import type { User } from "@/types";

type Stat = { icon: string; label: string; value: string | number; sub: string; bg: string };

function useStats(user: User | null, data: DashboardData | null): Stat[] {
  const { t } = useT();
  if (!user || !data) return [];
  const all = data.allProjects;
  const completedAll = all.filter(p => p.status === "completed").length;
  const activeAll = all.filter(p => p.status === "in_progress").length;

  if (user.role === "student") return [
    { icon: "📁", label: t("dashboard.stat.totalProjects"), value: all.length, sub: t("dashboard.stat.mineCount", { count: data.myProjects.length }), bg: "bg-blue-50 dark:bg-blue-950" },
    { icon: "🎯", label: t("dashboard.stat.myProjects"), value: data.myProjects.length, sub: t("dashboard.stat.activeTotal", { count: activeAll }), bg: "bg-violet-50 dark:bg-violet-950" },
    { icon: "✅", label: t("dashboard.stat.tasksDone"), value: data.myTasks.filter(x => x.status === "done").length, sub: t("dashboard.stat.ofMyTasks"), bg: "bg-green-50 dark:bg-green-950" },
    { icon: "📈", label: t("dashboard.stat.completionRate"), value: `${percent(completedAll, all.length)}%`, sub: t("dashboard.stat.ofAllProjects"), bg: "bg-purple-50 dark:bg-purple-950" },
  ];
  if (user.role === "professor") {
    const mine = data.myProjects;
    const done = mine.filter(p => p.status === "completed").length;
    return [
      { icon: "📁", label: t("dashboard.stat.coordinated"), value: mine.length, sub: t("dashboard.stat.active", { count: mine.filter(p => p.status === "in_progress").length }), bg: "bg-blue-50 dark:bg-blue-950" },
      { icon: "✅", label: t("dashboard.stat.completed"), value: done, sub: t("dashboard.stat.rate", { value: percent(done, mine.length) }), bg: "bg-green-50 dark:bg-green-950" },
      { icon: "📝", label: t("dashboard.stat.pendingEvaluations"), value: data.pendingEvaluations.length, sub: t("dashboard.stat.needCompleting"), bg: "bg-amber-50 dark:bg-amber-950" },
      { icon: "⏰", label: t("dashboard.stat.deadlines7"), value: data.upcomingMilestones.length, sub: t("dashboard.stat.upcomingMilestones"), bg: "bg-red-50 dark:bg-red-950" },
    ];
  }
  const students = data.users.filter(u => u.role === "student").length;
  const professors = data.users.filter(u => u.role === "professor").length;
  const tasksDone = data.allTasks.filter(x => x.status === "done").length;
  return [
    { icon: "📁", label: t("dashboard.stat.totalProjects"), value: all.length, sub: t("dashboard.stat.active", { count: activeAll }), bg: "bg-blue-50 dark:bg-blue-950" },
    { icon: "👥", label: t("dashboard.stat.totalUsers"), value: students + professors, sub: t("dashboard.stat.usersSplit", { students, professors }), bg: "bg-amber-50 dark:bg-amber-950" },
    { icon: "✅", label: t("dashboard.stat.tasksDone"), value: `${tasksDone}/${data.allTasks.length}`, sub: t("dashboard.stat.rate", { value: percent(tasksDone, data.allTasks.length) }), bg: "bg-green-50 dark:bg-green-950" },
    { icon: "📈", label: t("dashboard.stat.finishRate"), value: `${percent(completedAll, all.length)}%`, sub: t("dashboard.stat.projectsCompleted"), bg: "bg-purple-50 dark:bg-purple-950" },
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/profile" className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors sm:flex-shrink-0">
            <span className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl font-bold text-blue-700 dark:text-blue-300 overflow-hidden flex-shrink-0" aria-hidden="true">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`}
            </span>
            <span>
              <span className="block text-sm font-bold dark:text-slate-100">{user?.firstName} {user?.lastName}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{user && t(`roles.${user.role}`)} · {user?.faculty || t("settings.noFaculty")}</span>
              <span className="block text-xs text-blue-700 mt-0.5 dark:text-blue-400">{t("dashboard.viewProfile")} →</span>
            </span>
          </Link>
          <div className="flex-1">
            <h2 className="text-xl font-bold dark:text-slate-100">{greeting}, {user?.firstName || ""}! <span aria-hidden="true">👋</span></h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              <span className="capitalize">{new Date().toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              {subtitle && ` — ${subtitle}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(stats.length ? stats : Array.from({ length: 4 }, () => null)).map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
              {s ? (
                <>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${s.bg}`} aria-hidden="true">{s.icon}</div>
                  <div className="text-2xl font-bold dark:text-slate-100 mb-1">{loading ? "…" : s.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{s.label}</div>
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
