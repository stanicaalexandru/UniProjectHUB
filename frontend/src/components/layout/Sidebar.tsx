"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, X } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { apiFetch, clearSession } from "@/lib/api";
import { useT, type TranslationKey } from "@/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ROLE_BADGE } from "@/lib/constants";

type NavEntry = { href: string; label: TranslationKey; icon: string };

const NOTIFICATIONS_POLL_MS = 30000;

function NavItem({ href, label, icon, badge, badgeLabel }: { href: string; label: string; icon: string; badge?: number; badgeLabel?: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link href={href} className={`sidebar-link mb-0.5 ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
      <span className="w-4 text-center flex-shrink-0 text-base" aria-hidden="true">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold leading-none" aria-label={badgeLabel}>{badge}</span> : null}
    </Link>
  );
}

function NavSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title && <div className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-1.5 dark:text-slate-400">{title}</div>}
      {children}
    </div>
  );
}

const MAIN: NavEntry[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: "📊" },
  { href: "/projects", label: "nav.projects", icon: "📁" },
  { href: "/tasks", label: "nav.tasks", icon: "✅" },
  { href: "/milestones", label: "nav.milestones", icon: "🎯" },
  { href: "/calendar", label: "nav.calendar", icon: "📅" },
  { href: "/gantt", label: "nav.gantt", icon: "📈" },
];
const COLLAB: NavEntry[] = [
  { href: "/teams", label: "nav.teams", icon: "👥" },
  { href: "/chat", label: "nav.chat", icon: "💬" },
  { href: "/documents", label: "nav.documents", icon: "📄" },
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
        className={`fixed inset-y-0 left-0 z-50 w-64 lg:w-56 lg:static lg:translate-x-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen flex-shrink-0 transition-transform lg:transition-colors ${open ? "translate-x-0" : "-translate-x-full invisible lg:visible"}`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">U</div>
          <div className="flex-1">
            <div className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{t("app.name")}</div>
            <div className="text-xs text-slate-500 leading-tight dark:text-slate-400">{t("app.shortTagline")}</div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100" aria-label={t("nav.closeMenu")}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label={t("nav.main")}>
          <NavSection title={t("nav.sectionMain")}>{MAIN.map(item)}</NavSection>
          <NavSection title={t("nav.sectionCollab")}>{COLLAB.map(item)}</NavSection>
          <NavSection title={t("nav.sectionEval")}>
            <NavItem href="/evaluations" label={t("nav.evaluations")} icon="📝" />
            <NavItem href="/ai" label={t("nav.ai")} icon="🤖" />
            <NavItem href="/notifications" label={t("nav.notifications")} icon="🔔" badge={unreadCount || undefined} badgeLabel={t("nav.unread", { count: unreadCount })} />
          </NavSection>
          {isStaff && <NavSection title={t("nav.sectionReports")}><NavItem href="/reports" label={t("nav.reports")} icon="📄" /></NavSection>}
          {isAdmin && <NavSection title={t("nav.sectionSystem")}><NavItem href="/users" label={t("nav.users")} icon="👤" /></NavSection>}
          <NavSection><NavItem href="/settings" label={t("nav.settings")} icon="⚙️" /></NavSection>
        </nav>

        {/* Limba, tema si userul curent */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-1">
          <div className="px-3 py-1"><LanguageSwitcher /></div>
          <button onClick={toggleDark} role="switch" aria-checked={dark} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <span className="w-4 text-center text-base" aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
            <span className="flex-1 text-left">{t("theme.dark")}</span>
            <span className={`w-8 h-4 rounded-full relative transition-colors ${dark ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`} aria-hidden="true">
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
          <div className="flex items-center gap-1">
            <Link href="/profile" className="flex-1 min-w-0 flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" title={t("nav.profile")}>
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-300 flex-shrink-0 overflow-hidden" aria-hidden="true">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate dark:text-slate-200">{fullName}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[currentRole]}`}>{t(`roles.${currentRole}`)}</span>
              </div>
            </Link>
            <button onClick={logout} className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-red-950/40 transition-colors" title={t("nav.logout")} aria-label={t("nav.logout")}>
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
