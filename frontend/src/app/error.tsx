"use client";
import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useT } from "@/i18n";
import { StatusPage } from "@/components/layout/StatusPage";

// Afisata cand o pagina arunca o eroare neasteptata; reset() incearca din nou randarea ei
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <StatusPage title={t("errorPage.title")} text={t("errorPage.text")}>
      <button type="button" onClick={reset} className="btn-primary"><RotateCcw className="w-4 h-4" aria-hidden="true" />{t("errorPage.retry")}</button>
      <Link href="/dashboard" className="btn-secondary">{t("notFound.goHome")}</Link>
    </StatusPage>
  );
}
