"use client";
import Link from "next/link";
import { useT } from "@/i18n";
import { StatusPage } from "@/components/layout/StatusPage";

export default function NotFound() {
  const { t } = useT();
  return (
    <StatusPage code="404" title={t("notFound.title")} text={t("notFound.text")}>
      <Link href="/dashboard" className="btn-primary">{t("notFound.goHome")}</Link>
    </StatusPage>
  );
}
