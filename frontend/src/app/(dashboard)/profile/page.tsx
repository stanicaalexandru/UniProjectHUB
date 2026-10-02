"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { apiFetchAll } from "@/lib/api";
import { useT } from "@/i18n";
import { PROJECT_STATUS_BADGE, ROLE_BADGE, USER_STATUS_BADGE } from "@/lib/constants";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, LoadingState } from "@/components/ui/States";
import type { Project, User } from "@/types";

function Card({ title, children, className = "" }: { title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm ${className}`}>
      {title && <h3 className="text-sm font-semibold dark:text-slate-100 mb-4">{title}</h3>}
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { t } = useT();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { setLoading(false); return; }
    const parsed: User = JSON.parse(stored);
    setUser(parsed);
    // Proiectele create sau coordonate de utilizator
    apiFetchAll<Project>("/projects")
      .then(({ data }) => setProjects(data.filter(p => p.createdById === parsed.id || p.coordinatorId === parsed.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Page><LoadingState label={t("common.loading")} /></Page>;
  if (!user) return null;

  const notSet = t("profile.notSet");
  const info: [string, string, string][] = [
    ["👤", t("profile.fullName"), `${user.firstName} ${user.lastName}`],
    ["📧", t("profile.email"), user.email],
    ["🏛️", t("profile.faculty"), user.faculty || notSet],
    ["🔬", t("profile.department"), user.department || notSet],
    ["📅", t("profile.studyYear"), user.studyYear ? t("profile.yearN", { year: user.studyYear }) : notSet],
    ["📱", t("profile.phone"), user.phone || notSet],
  ];
  const averageProgress = projects.length > 0
    ? `${Math.round(projects.reduce((s, p) => s + (p.progressPercentage || 0), 0) / projects.length)}%`
    : t("common.none");
  const stats = [
    { icon: "📁", value: projects.length, label: t("profile.statProjects") },
    { icon: "✅", value: projects.filter(p => p.status === "completed").length, label: t("profile.statCompleted") },
    { icon: "📈", value: averageProgress, label: t("profile.statProgress") },
  ];

  return (
    <Page>
      <PageHeader title={<span className="inline-flex items-center gap-2">
        <button onClick={() => router.back()} aria-label={t("common.back")} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        {t("profile.title")}
      </span>}>
        <Link href="/settings" className="btn-secondary text-xs"><Settings className="w-3.5 h-3.5" aria-hidden="true" /> {t("profile.editProfile")}</Link>
      </PageHeader>

      <PageBody>
        {/* Avatar si informatii de baza */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-300 flex-shrink-0 overflow-hidden" aria-hidden="true">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold dark:text-slate-100">{user.firstName} {user.lastName}</h2>
              <Badge color={ROLE_BADGE[user.role]}>{t(`roles.${user.role}`)}</Badge>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 break-all">{user.email}</div>
            {user.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2 dark:text-slate-400">{user.bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <Card title={t("profile.personalInfo")}>
              <dl className="space-y-3">
                {info.map(([icon, label, value]) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
                    <div className="min-w-0">
                      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                      <dd className="text-sm font-medium dark:text-slate-200 break-words">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </Card>

            {user.bio && (
              <Card title={t("profile.aboutMe")}>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{user.bio}</p>
              </Card>
            )}

            <Card title={t("profile.security")}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">{t("profile.accountStatus")}</span>
                <Badge color={USER_STATUS_BADGE[user.status ?? "active"]}>{t(`userStatus.${user.status ?? "active"}`)}</Badge>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map(s => (
                <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm text-center">
                  <div className="text-2xl mb-1" aria-hidden="true">{s.icon}</div>
                  <div className="text-2xl font-bold dark:text-slate-100">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <h3 className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold dark:text-slate-100">
                {t("profile.myProjects", { count: projects.length })}
              </h3>
              {projects.length === 0 ? (
                <div className="p-4"><EmptyState icon="📁" title={t("profile.noProjects")} /></div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projects.map(p => (
                    <li key={p.id}>
                      <Link href={`/projects/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-lg flex-shrink-0" aria-hidden="true">📁</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium dark:text-slate-200 truncate">{p.title}</span>
                          <span className="flex items-center gap-2 mt-0.5">
                            <Badge color={PROJECT_STATUS_BADGE[p.status]}>{t(`projectStatus.${p.status}`)}</Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t("profile.percentDone", { value: p.progressPercentage || 0 })}</span>
                          </span>
                        </span>
                        <span className="w-16 flex-shrink-0 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" aria-hidden="true">
                          <span className="block h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPercentage || 0}%` }} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}
