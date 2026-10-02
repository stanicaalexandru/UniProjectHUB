"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, Bell, CalendarDays, ChartGantt, ClipboardCheck, FileChartColumn, FileText, Flag, Folder, LayoutDashboard,
  ListChecks, LogOut, MessageSquare, Moon, Settings, Sun, UserCog, Users, X, type LucideIcon,
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { apiFetch, clearSession } from "@/lib/api";
import { useT, type TranslationKey } from "@/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LogoMark } from "@/components/ui/Logo";

type NavEntry = { href: string; label: TranslationKey; icon: LucideIcon };

const NOTIFICATIONS_POLL_MS = 30000;

function NavItem({ href, label, icon: Icon, badge, badgeLabel }: { href: string; label: string; icon: LucideIcon; badge?: number; badgeLabel?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link href={href} className={`sidebar-link mb-0.5 ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {badge ? <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold leading-none" aria-label={badgeLabel}>{badge}</span> : null}
    </Link>
  );
}

function NavSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title && <div className="text-xs font-bold text-blue-300 uppercase tracking-widest px-2 mb-1.5 dark:text-slate-500">{title}</div>}
      {children}
    </div>
  );
}

const MAIN: NavEntry[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "nav.projects", icon: Folder },
  { href: "/tasks", label: "nav.tasks", icon: ListChecks },
  { href: "/milestones", label: "nav.milestones", icon: Flag },
  { href: "/calendar", label: "nav.calendar", icon: CalendarDays },
  { href: "/gantt", label: "nav.gantt", icon: ChartGantt },
];
const COLLAB: NavEntry[] = [
  { href: "/teams", label: "nav.teams", icon: Users },
  { href: "/chat", label: "nav.chat", icon: MessageSquare },
  { href: "/documents", label: "nav.documents", icon: FileText },
];

// Meniul lateral: fix pe ecrane mari; pe telefon devine sertar deschis din butonul din bara de sus (vezi layout)
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, role, isAdmin, isStaff } = useRole();

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
  }, []);

  // Sertarul se inchide la schimbarea paginii si la Escape
  useEffect(() => { onClose(); }, [pathname, onClose]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const fetchCount = () => apiFetch("/notifications/count").then(d => setUnreadCount(Number(d) || 0)).catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, NOTIFICATIONS_POLL_MS);
    window.addEventListener("notifications-updated", fetchCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", fetchCount);
    };
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const logout = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    clearSession();
    router.push("/login");
  };

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "?";
  const fullName = user ? `${user.firstName} ${user.lastName}` : t("common.user");
  const currentRole = role || "student";
  const item = (e: NavEntry) => <NavItem key={e.href} href={e.href} label={t(e.label)} icon={e.icon} />;

  return (
    <>
      {/* Fundal semitransparent in spatele sertarului, doar pe telefon */}
      {open && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-56 lg:static lg:translate-x-0 bg-blue-700 dark:bg-slate-900 border-r border-blue-700 dark:border-slate-800 flex flex-col h-screen flex-shrink-0 transition-transform lg:transition-colors ${open ? "translate-x-0" : "-translate-x-full invisible lg:visible"}`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-white/10 dark:border-slate-800">
          <LogoMark size={32} light />
          <div className="flex-1">
            <div className="text-sm font-bold leading-tight text-white dark:text-slate-100">{t("app.name")}</div>
            <div className="text-xs text-blue-300 leading-tight dark:text-slate-400">{t("app.shortTagline")}</div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-blue-200 hover:text-white dark:text-slate-400 dark:hover:text-slate-100" aria-label={t("nav.closeMenu")}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label={t("nav.main")}>
          <NavSection title={t("nav.sectionMain")}>{MAIN.map(item)}</NavSection>
          <NavSection title={t("nav.sectionCollab")}>{COLLAB.map(item)}</NavSection>
          <NavSection title={t("nav.sectionEval")}>
            <NavItem href="/evaluations" label={t("nav.evaluations")} icon={ClipboardCheck} />
            <NavItem href="/ai" label={t("nav.ai")} icon={Activity} />
            <NavItem href="/notifications" label={t("nav.notifications")} icon={Bell} badge={unreadCount || undefined} badgeLabel={t("nav.unread", { count: unreadCount })} />
          </NavSection>
          {isStaff && <NavSection title={t("nav.sectionReports")}><NavItem href="/reports" label={t("nav.reports")} icon={FileChartColumn} /></NavSection>}
          {isAdmin && <NavSection title={t("nav.sectionSystem")}><NavItem href="/users" label={t("nav.users")} icon={UserCog} /></NavSection>}
          <NavSection><NavItem href="/settings" label={t("nav.settings")} icon={Settings} /></NavSection>
        </nav>

        {/* Limba, tema si userul curent */}
        <div className="border-t border-white/10 dark:border-slate-800 p-3 space-y-1">
          <div className="px-3 py-1"><LanguageSwitcher variant="dark" /></div>
          <button onClick={toggleDark} role="switch" aria-checked={dark} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-blue-200 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-800 transition-colors">
            {dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
            <span className="flex-1 text-left">{t("theme.dark")}</span>
            <span className={`w-8 h-4 rounded-full relative transition-colors ${dark ? "bg-accent" : "bg-white/25"}`} aria-hidden="true">
              <span className={`absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
          <div className="flex items-center gap-1">
            <Link href="/profile" className="flex-1 min-w-0 flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800 transition-colors" title={t("nav.profile")}>
              <div className="w-7 h-7 rounded-full bg-white/15 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-white dark:text-blue-300 flex-shrink-0 overflow-hidden" aria-hidden="true">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-white dark:text-slate-200">{fullName}</div>
                <span className="text-xs text-blue-300 dark:text-slate-400">{t(`roles.${currentRole}`)}</span>
              </div>
            </Link>
            <button onClick={logout} className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 dark:text-slate-400 dark:hover:bg-red-950/40 transition-colors" title={t("nav.logout")} aria-label={t("nav.logout")}>
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
