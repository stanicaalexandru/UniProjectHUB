"use client";
import Link from "next/link";
import { CalendarRange, ClipboardCheck, FileChartColumn, MessagesSquare } from "lucide-react";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { LogoMark } from "@/components/ui/Logo";

const FEATURES = [
  { icon: CalendarRange, key: "planning" },
  { icon: MessagesSquare, key: "collaboration" },
  { icon: ClipboardCheck, key: "evaluation" },
  { icon: FileChartColumn, key: "reports" },
] as const;

// Cadrul comun al paginilor de autentificare: formularul in stanga, pe ecrane mari o prezentare scurta in dreapta
export function AuthLayout({ subtitle, children, wide = false }: { subtitle: string; children: React.ReactNode; wide?: boolean }) {
  const { t } = useT();
  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      <div className="flex-1 flex flex-col px-4 sm:px-8 py-6">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-bold text-slate-800 dark:text-slate-100">{t("app.name")}</span>
          </span>
          <LanguageSwitcher />
        </header>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{subtitle}</p>
            <main>{children}</main>
          </div>
        </div>

        <footer className="text-xs space-x-4 text-center lg:text-left">
          <Link href="/privacy" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline">{t("legalLinks.privacy")}</Link>
          <Link href="/terms" className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:underline">{t("legalLinks.terms")}</Link>
        </footer>
      </div>

      <aside className="hidden lg:flex w-[44%] max-w-xl bg-blue-700 text-white flex-col justify-center px-12 xl:px-16">
        <h2 className="text-2xl xl:text-3xl font-bold leading-snug mb-8">{t("authPanel.title")}</h2>
        <ul className="space-y-5">
          {FEATURES.map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-start gap-3 text-blue-100">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-white" aria-hidden="true" />
              <span className="text-sm leading-relaxed">{t(`authPanel.${key}`)}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
