"use client";
import { useT, useFormat } from "@/i18n";
import { CATEGORIES, scoreColor, scoreLevel, type Analysis, type RecPriority, type Risk, type RiskLevel } from "./analysis";

const CATEGORY_ICONS = { progress: "📈", time: "⏰", organization: "👥", documentation: "📝", stability: "🛡️" };
const LEVEL_STYLE: Record<RiskLevel, string> = {
  critical: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
  warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300",
  info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
};
const LEVEL_ICON: Record<RiskLevel, string> = { critical: "🔴", warning: "⚠️", info: "ℹ️", success: "✅" };
const PRIORITY_BORDER: Record<RecPriority, string> = { high: "border-l-red-500", medium: "border-l-amber-500", low: "border-l-blue-500" };
const PRIORITY_BADGE: Record<RecPriority, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

// Cerc de progres cu scorul in mijloc
export function ScoreRing({ score, size = 72, stroke = 6, track = "#e2e8f0", textColor, label }: { score: number; size?: number; stroke?: number; track?: string; textColor?: string; label: string }) {
  const r = size / 2 - stroke - 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor(score)} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 1s" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size / 4.5} fontWeight="700" fill={textColor ?? scoreColor(score)}>{score}</text>
    </svg>
  );
}

function riskText(risk: Risk, t: ReturnType<typeof useT>["t"]) {
  switch (risk.kind) {
    case "milestoneOverdue": return { title: t("ai.risk.overdueTitle", { title: risk.title }), desc: t("ai.risk.overdueDesc", { count: risk.days }), action: t("ai.risk.overdueAction", { title: risk.title }) };
    case "milestoneSoon": return { title: t("ai.risk.soonTitle", { title: risk.title }), desc: t("ai.risk.soonDesc", { count: risk.days }), action: t("ai.risk.soonAction", { title: risk.title }) };
    case "unassigned": return { title: t("ai.risk.unassignedTitle", { count: risk.count }), desc: t("ai.risk.unassignedDesc"), action: t("ai.risk.unassignedAction") };
    case "noEndDate": return { title: t("ai.risk.noEndTitle"), desc: t("ai.risk.noEndDesc"), action: t("ai.risk.noEndAction") };
    case "noTasks": return { title: t("ai.risk.noTasksTitle"), desc: t("ai.risk.noTasksDesc"), action: t("ai.risk.noTasksAction") };
    case "healthy": return { title: t("ai.risk.healthyTitle"), desc: t("ai.risk.healthyDesc"), action: t("ai.risk.healthyAction") };
  }
}

const REC_ICON = { accelerate: "🚀", deadlines: "⏰", assign: "👤", docs: "📝", wip: "🎯", finish: "🏁", fine: "🌟" };

export function AnalysisResults({ result, history }: { result: Analysis; history: { score: number | string; createdAt: string }[] }) {
  const { t } = useT();
  const format = useFormat();
  const p = result.prediction;

  return (
    <>
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-5">
        <h2 className="text-sm font-semibold dark:text-slate-100 mb-4">{t("ai.categoriesTitle")}</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map(c => {
            const score = result.scores[c];
            return (
              <li key={c} className="text-center">
                <ScoreRing score={score} label={`${t(`ai.category.${c}`)}: ${score}`} />
                <div className="text-lg mb-0.5" aria-hidden="true">{CATEGORY_ICONS[c]}</div>
                <div className="text-xs font-semibold dark:text-slate-300">{t(`ai.category.${c}`)}</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color: scoreColor(score) }}>{t(`ai.level.${scoreLevel(score)}`)}</div>
              </li>
            );
          })}
        </ul>
      </section>

      {p && (
        <section className={`rounded-xl p-5 shadow-sm mb-5 border ${p.onTime ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"}`}>
          <div className="flex items-center gap-4">
            <div className="text-3xl" aria-hidden="true">{p.onTime ? "🟢" : "🔴"}</div>
            <div className="flex-1">
              <h2 className={`font-semibold mb-1 ${p.onTime ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>{p.onTime ? t("ai.onTime") : t("ai.lateRisk")}</h2>
              <p className={`text-sm ${p.onTime ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
                {t("ai.predictionText", { rate: format.number(p.dailyRate, 2), date: format.date(p.estimatedFinish, { day: "numeric", month: "long", year: "numeric" }) })}
                {!p.onTime && ` ${t("ai.predictionLate", { daysLeft: p.daysLeft, needed: p.estimatedDaysNeeded })}`}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h2 className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold dark:text-slate-100">{t("ai.risksTitle")}</h2>
          <ul className="p-4 space-y-3">
            {result.risks.map((r, i) => {
              const text = riskText(r, t);
              return (
                <li key={i} className={`p-3 rounded-xl border ${LEVEL_STYLE[r.level]}`}>
                  <div className="flex items-center gap-2 mb-1"><span aria-hidden="true">{LEVEL_ICON[r.level]}</span><span className="font-semibold text-xs">{text.title}</span></div>
                  <p className="text-xs mb-1">{text.desc}</p>
                  <p className="text-xs font-medium">→ {text.action}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h2 className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold dark:text-slate-100">{t("ai.planTitle")}</h2>
          <ul className="p-4 space-y-3">
            {result.recs.map((r, i) => (
              <li key={i} className={`p-3 rounded-xl border-l-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${PRIORITY_BORDER[r.priority]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base" aria-hidden="true">{REC_ICON[r.kind]}</span>
                  <span className="font-semibold text-xs dark:text-slate-200">{t(`ai.rec.${r.kind}Title`)}</span>
                  <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[r.priority]}`}>{t(`ai.priority.${r.priority}`)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{t(`ai.rec.${r.kind}Desc`, r.params)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {history.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <h2 className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold dark:text-slate-100">{t("ai.historyTitle")}</h2>
          <ol className="p-4 flex items-end gap-2 h-32" aria-label={t("ai.historyTitle")}>
            {history.slice(-10).map((h, i) => {
              const v = Number(h.score) || 50;
              return (
                <li key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-semibold dark:text-slate-400">{v}</span>
                  <div className="w-full rounded-t transition-all" style={{ height: `${(v / 100) * 80}px`, backgroundColor: scoreColor(v) }} aria-hidden="true" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{format.date(h.createdAt, { day: "2-digit", month: "2-digit" })}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </>
  );
}
