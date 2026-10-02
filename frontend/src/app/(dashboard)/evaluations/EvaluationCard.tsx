"use client";
import { Pencil } from "lucide-react";
import { useT, useFormat, useUserName } from "@/i18n";
import { EVALUATION_STATUS_BADGE } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import type { Evaluation } from "@/types";

const pct = (score: unknown, max: unknown) => (Number(max) > 0 ? (Number(score) / Number(max)) * 100 : 0);

export function EvaluationCard({ ev, canEdit, onEdit }: { ev: Evaluation; canEdit: boolean; onEdit: () => void }) {
  const { t } = useT();
  const format = useFormat();
  const displayName = useUserName();
  const hasScore = ev.totalScore != null && Number(ev.totalScore) > 0;

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[160px]">
          <h2 className="font-semibold dark:text-slate-100 text-base">{t(`evaluationPhase.${ev.phase}`)}</h2>
          <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{t("evaluations.evaluator")}: {displayName(ev.evaluator)} · {format.date(ev.createdAt)}</div>
        </div>
        <Badge color={EVALUATION_STATUS_BADGE[ev.status]}>{t(`evaluationStatus.${ev.status}`)}</Badge>
        {hasScore && (
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{Number(ev.totalScore).toFixed(0)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t("evaluations.outOf", { max: Number(ev.maxScore).toFixed(0) })}</div>
          </div>
        )}
        {canEdit && (
          <button onClick={onEdit} className="btn-primary"><Pencil className="w-3.5 h-3.5" aria-hidden="true" />{ev.status === "completed" ? t("common.edit") : t("evaluations.complete")}</button>
        )}
      </div>

      {hasScore && (
        <div className="mb-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" role="progressbar" aria-valuenow={Math.round(pct(ev.totalScore, ev.maxScore))} aria-valuemin={0} aria-valuemax={100} aria-label={t("evaluations.totalScore")}>
          <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct(ev.totalScore, ev.maxScore)}%` }} />
        </div>
      )}

      {ev.criteria?.length > 0 && (
        <ul className="space-y-2 mb-4">
          {ev.criteria.map(c => (
            <li key={c.id} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-28 sm:w-32 flex-shrink-0">{c.name}</span>
              <span className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" aria-hidden="true">
                <span className="block h-full bg-blue-400 rounded-full" style={{ width: `${pct(c.score, c.maxScore)}%` }} />
              </span>
              <span className="text-xs font-semibold dark:text-slate-300 w-16 text-right">{Number(c.score).toFixed(0)}/{Number(c.maxScore).toFixed(0)}</span>
            </li>
          ))}
        </ul>
      )}

      {ev.generalFeedback && <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-3">{ev.generalFeedback}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ev.strengths && <div className="text-xs text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-950/50 border border-green-100 dark:border-green-900 rounded-lg p-3"><span className="font-semibold">{t("evaluations.strengths")}:</span> {ev.strengths}</div>}
        {ev.improvements && <div className="text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 rounded-lg p-3"><span className="font-semibold">{t("evaluations.improvements")}:</span> {ev.improvements}</div>}
      </div>

      {!!ev.revisions?.length && (
        <details className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          <summary className="cursor-pointer font-semibold">{t("evaluations.revisions", { count: ev.revisions.length })}</summary>
          <ul className="mt-2 space-y-1.5">
            {ev.revisions.map(r => (
              <li key={r.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="font-semibold">{t("evaluations.revisionChange", { from: Number(r.oldTotalScore).toFixed(0), to: Number(r.newTotalScore).toFixed(0) })}</span>
                {" · "}{format.dateTime(r.createdAt)}{" · "}{displayName(r.changedBy)}
                <div className="mt-0.5">{t("evaluations.reason")}: {r.reason}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

// Media evaluarilor finalizate ale proiectului, cu scorul fiecarei faze
export function EvaluationSummary({ evals }: { evals: Evaluation[] }) {
  const { t } = useT();
  const completed = evals.filter(e => e.status === "completed" && Number(e.totalScore) > 0);
  if (completed.length === 0) return null;
  const avg = completed.reduce((s, e) => s + pct(e.totalScore, e.maxScore), 0) / completed.length;
  const avgRaw = completed.reduce((s, e) => s + Number(e.totalScore), 0) / completed.length;
  const avgMax = completed.reduce((s, e) => s + Number(e.maxScore), 0) / completed.length;
  const qual = avg >= 90 ? { key: "excellent", style: "text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-950/50" } as const
    : avg >= 75 ? { key: "veryGood", style: "text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" } as const
    : avg >= 60 ? { key: "good", style: "text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50" } as const
    : avg >= 50 ? { key: "fair", style: "text-orange-800 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50" } as const
    : { key: "poor", style: "text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950/50" } as const;
  const circumference = 2 * Math.PI * 32;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-shrink-0 text-center">
          <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-label={t("evaluations.averageLabel", { value: avg.toFixed(0) })}>
            <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="7" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#3b82f6" strokeWidth="7" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - avg / 100)}
              strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 0.5s" }} />
            <text x="40" y="44" textAnchor="middle" fontSize="16" fontWeight="700" className="fill-slate-800 dark:fill-slate-100">{avg.toFixed(0)}%</text>
          </svg>
          <div className="text-xs text-slate-500 mt-1 dark:text-slate-400">{t("evaluations.average")}</div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="text-sm font-bold dark:text-slate-100">{t("evaluations.summaryTitle")}</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${qual.style}`}>{t(`evaluations.quality.${qual.key}`)}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            {t("evaluations.summaryText", { done: completed.length, total: evals.length, avg: avgRaw.toFixed(1), max: avgMax.toFixed(0) })}
          </p>
          <ul className="space-y-1.5">
            {completed.map(ev => {
              const p = pct(ev.totalScore, ev.maxScore);
              return (
                <li key={ev.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-24 flex-shrink-0">{t(`evaluationPhase.${ev.phase}`)}</span>
                  <span className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" aria-hidden="true"><span className="block h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p}%` }} /></span>
                  <span className="text-xs font-semibold dark:text-slate-300 w-24 text-right">{t("evaluations.phaseScore", { score: Number(ev.totalScore).toFixed(0), pct: p.toFixed(0) })}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
