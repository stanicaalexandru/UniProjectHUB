"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useT, useFormat } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { EmptyState, LoadingState } from "@/components/ui/States";
import type { Notification } from "@/types";

const TYPE_ICONS: Record<string, string> = {
  info: "ℹ️", success: "✅", warning: "⚠️", error: "❌",
  deadline: "⏰", mention: "💬", evaluation: "📝",
  team: "👥", system: "⚙️", milestone: "🎯",
  project: "📁", task: "✅", chat: "💬",
};

const TYPE_COLORS: Record<string, string> = {
  success: "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900",
  warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900",
  error: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900",
  evaluation: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900",
  deadline: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900",
  team: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900",
  info: "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700",
};

// Navigare dupa tip, cand notificarea nu are o adresa explicita
const TYPE_TO_ROUTE: Record<string, string> = {
  chat: "/chat",
  mention: "/chat",
  evaluation: "/evaluations",
  deadline: "/calendar",
  milestone: "/calendar",
  team: "/teams",
  task: "/tasks",
  project: "/projects",
};

type Filter = "all" | "unread" | "success" | "warning" | "evaluation" | "deadline";
const FILTERS: { value: Filter; label: "notifications.filterAll" | "notifications.filterUnread" | "notifications.filterSuccess" | "notifications.filterWarning" | "notifications.filterEvaluation" | "notifications.filterDeadline" }[] = [
  { value: "all", label: "notifications.filterAll" },
  { value: "unread", label: "notifications.filterUnread" },
  { value: "success", label: "notifications.filterSuccess" },
  { value: "warning", label: "notifications.filterWarning" },
  { value: "evaluation", label: "notifications.filterEvaluation" },
  { value: "deadline", label: "notifications.filterDeadline" },
];

// Unde duce notificarea: adresa explicita, pagina proiectului sau o pagina dedusa din tip
function resolveDestination(n: Notification): string | null {
  if (n.actionUrl) return n.actionUrl;
  if (n.entityType === "project" && n.entityId) return `/projects/${n.entityId}`;
  return TYPE_TO_ROUTE[n.type] ?? null;
}

const notifyCountChanged = () => window.dispatchEvent(new Event("notifications-updated"));

export default function NotificationsPage() {
  const { t } = useT();
  const format = useFormat();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/notifications");
      setNotifs(Array.isArray(data) ? data : data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifs(list => list.map(n => n.id === id ? { ...n, isRead: true } : n));
      notifyCountChanged();
    } catch {}
  };

  const markAll = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifs(list => list.map(n => ({ ...n, isRead: true })));
      notifyCountChanged();
    } catch {}
  };

  // La apasare: marcheaza citita, apoi navigheaza daca exista destinatie
  const handleClick = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    const dest = resolveDestination(n);
    if (dest) router.push(dest);
  };

  const filtered = filter === "all" ? notifs : filter === "unread" ? notifs.filter(n => !n.isRead) : notifs.filter(n => n.type === filter);
  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <Page>
      <PageHeader title={<>
        {t("notifications.title")}
        {unread > 0 && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">{t("notifications.newCount", { count: unread })}</span>}
      </>}>
        <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="input w-40" aria-label={t("notifications.filterLabel")}>
          {FILTERS.map(f => <option key={f.value} value={f.value}>{t(f.label)}</option>)}
        </select>
        {unread > 0 && <button onClick={markAll} className="btn-secondary text-xs"><Check className="w-3.5 h-3.5" aria-hidden="true" /> {t("notifications.markAll")}</button>}
        <button onClick={load} className="btn-secondary text-xs"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.refresh")}</button>
      </PageHeader>

      <PageBody>
        {loading ? <LoadingState label={t("common.loading")} /> : filtered.length === 0 ? (
          <EmptyState icon="🔔" title={filter === "unread" ? t("notifications.noUnread") : t("notifications.none")} description={t("notifications.emptyHint")} />
        ) : (
          <ul className="space-y-2 max-w-3xl mx-auto">
            {filtered.map(n => {
              const dest = resolveDestination(n);
              return (
                <li key={n.id} className={`flex items-start gap-2 rounded-xl border transition-all hover:shadow-sm ${
                  !n.isRead ? (TYPE_COLORS[n.type] || TYPE_COLORS.info) : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"}`}>
                  <button onClick={() => handleClick(n)} className="flex-1 min-w-0 flex items-start gap-3 p-4 text-left rounded-xl">
                    <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl flex-shrink-0 shadow-sm" aria-hidden="true">
                      {TYPE_ICONS[n.type] || "🔔"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold dark:text-slate-100">{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" role="img" aria-label={t("notifications.unreadDot")} />}
                      </span>
                      <span className="block text-xs text-slate-600 dark:text-slate-400">{n.message}</span>
                      <span className="flex items-center gap-2 mt-1 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">{format.dateTime(n.createdAt)}</span>
                        {dest && <span className="text-blue-700 dark:text-blue-400">· {t("notifications.clickToOpen")}</span>}
                      </span>
                    </span>
                  </button>
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)} className="m-3 p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
                      title={t("notifications.markRead")} aria-label={t("notifications.markRead")}>
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </Page>
  );
}
