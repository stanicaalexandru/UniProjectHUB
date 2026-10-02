"use client";
import Link from "next/link";
import { useT } from "@/i18n";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

// Textele legale exista in ambele limbi (randate pe server); aici se alege versiunea pentru limba curenta
export function Localized({ ro, en }: { ro: React.ReactNode; en: React.ReactNode }) {
  const { locale } = useT();
  return <>{locale === "en" ? en : ro}</>;
}

export function LegalHeader() {
  const { t } = useT();
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/login" className="flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold" aria-hidden="true">U</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">{t("app.name")}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm" aria-label={t("legalLinks.label")}>
          <Link href="/privacy" className="text-blue-700 dark:text-blue-400 hover:underline">{t("legalLinks.privacy")}</Link>
          <Link href="/terms" className="text-blue-700 dark:text-blue-400 hover:underline">{t("legalLinks.terms")}</Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
