"use client";
import { Languages } from "lucide-react";
import { LOCALES, useT, type Locale } from "@/i18n";

// Comutator de limba (RO/EN); varianta "dark" pentru paginile cu fundal intunecat (autentificare)
export function LanguageSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale, t } = useT();
  const base = variant === "dark"
    ? "text-slate-300 hover:text-white"
    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100";
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs ${base}`} role="group" aria-label={t("language.label")}>
      <Languages className="w-3.5 h-3.5" aria-hidden="true" />
      {LOCALES.map((l: Locale) => (
        <button key={l} type="button" onClick={() => setLocale(l)} aria-pressed={locale === l} lang={l}
          className={`px-1.5 py-0.5 rounded ${locale === l ? "font-bold underline underline-offset-2" : "opacity-80 hover:opacity-100"}`}>
          {l.toUpperCase()}<span className="sr-only"> — {t(`language.${l}`)}</span>
        </button>
      ))}
    </div>
  );
}
