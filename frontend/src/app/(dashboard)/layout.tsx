"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SessionWatcher } from "@/components/layout/SessionWatcher";
import { useT } from "@/i18n";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useT();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/login"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors">
      <SessionWatcher />
      <Sidebar open={menuOpen} onClose={closeMenu} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Bara de sus pentru telefon/tableta: pe ecrane mari meniul lateral e mereu vizibil */}
        <div className="lg:hidden h-12 flex items-center gap-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button onClick={() => setMenuOpen(true)} className="p-1.5 -ml-1.5 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={t("nav.openMenu")} aria-expanded={menuOpen} aria-controls="app-sidebar">
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-xs" aria-hidden="true">U</div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t("app.name")}</span>
        </div>
        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
