"use client";
import Link from "next/link";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

// Cadrul comun al paginilor de autentificare: fundal, logo, subtitlu, card si linkuri de subsol
export function AuthLayout({ subtitle, children, wide = false }: { subtitle: string; children: React.ReactNode; wide?: boolean }) {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
        <div className="flex justify-end mb-4"><LanguageSwitcher variant="dark" /></div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-2xl" aria-hidden="true">U</span>
          </div>
          <h1 className="text-white text-2xl font-bold">{t("app.name")}</h1>
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        </div>
        <main className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8">{children}</main>
        <p className="text-center text-slate-400 text-xs mt-6">{t("app.motto")}</p>
        <p className="text-center text-xs mt-3 space-x-3">
          <Link href="/privacy" className="text-slate-400 hover:text-slate-200 hover:underline">{t("legalLinks.privacy")}</Link>
          <Link href="/terms" className="text-slate-400 hover:text-slate-200 hover:underline">{t("legalLinks.terms")}</Link>
        </p>
      </div>
    </div>
  );
}
