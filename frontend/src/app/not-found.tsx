"use client";
import Link from "next/link";
import { useT } from "@/i18n";

export default function NotFound() {
  const { t } = useT();
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30" aria-hidden="true">
          <span className="text-white font-bold text-4xl">U</span>
        </div>
        <div className="text-8xl font-bold text-white mb-4" aria-hidden="true">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">{t("notFound.title")}</h1>
        <p className="text-slate-300 mb-8 max-w-sm mx-auto">{t("notFound.text")}</p>
        <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">{t("notFound.goHome")}</Link>
        <p className="text-slate-400 text-xs mt-8">{t("app.name")}</p>
      </div>
    </main>
  );
}
