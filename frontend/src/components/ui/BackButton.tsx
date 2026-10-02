"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useT } from "@/i18n";

// Numarul de pagini vizitate in aplicatie in tab-ul curent. Daca pagina a fost deschisa direct
// (link primit, tab nou), "inapoi" ar parasi aplicatia, asa ca mergem la panoul principal.
let visitedPages = 0;

export function useTrackNavigation() {
  const pathname = usePathname();
  useEffect(() => { visitedPages += 1; }, [pathname]);
}

export function BackButton({ fallback = "/dashboard" }: { fallback?: string }) {
  const { t } = useT();
  const router = useRouter();
  const goBack = () => (visitedPages > 1 ? router.back() : router.push(fallback));
  return (
    <button type="button" onClick={goBack} aria-label={t("common.back")} title={t("common.back")}
      className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
