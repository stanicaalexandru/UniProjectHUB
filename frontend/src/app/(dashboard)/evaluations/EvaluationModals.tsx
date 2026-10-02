"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { Modal } from "@/components/ui/Modal";
import { SelectField, TextAreaField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Evaluation, EvaluationCriteria, EvaluationPhase } from "@/types";

const PHASES: EvaluationPhase[] = ["proposal", "midterm", "final", "defense"];
// Rubrica standard (100 de puncte); numele criteriilor se salveaza in limba celui care creeaza evaluarea
const RUBRIC = [
  { key: "functionality", maxScore: 30 },
  { key: "codeQuality", maxScore: 25 },
  { key: "documentation", maxScore: 20 },
  { key: "presentation", maxScore: 15 },
  { key: "originality", maxScore: 10 },
] as const;

export function CreateEvaluationModal({ projectId, onClose, onCreated }: { projectId: string; onClose: () => void; onCreated: () => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [phase, setPhase] = useState<EvaluationPhase>("midterm");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await apiFetch("/evaluations", {
        method: "POST",
        body: JSON.stringify({
          projectId, phase,
          criteria: RUBRIC.map(c => ({ name: t(`evaluations.rubric.${c.key}`), description: t(`evaluations.rubric.${c.key}Desc`), maxScore: c.maxScore, weight: 1, score: 0 })),
        }),
      });
      onCreated();
    } catch (err) { setError(err); setSaving(false); }
  };

  return (
    <Modal title={t("evaluations.newEvaluation")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <SelectField label={t("evaluations.phase")} value={phase} onChange={e => setPhase(e.target.value as EvaluationPhase)}>
          {PHASES.map(p => <option key={p} value={p}>{t(`evaluationPhase.${p}`)}</option>)}
        </SelectField>
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-2">{t("evaluations.rubricIncluded")}</p>
          <ul>{RUBRIC.map(c => <li key={c.key} className="text-xs text-blue-800 dark:text-blue-400">✓ {t(`evaluations.rubric.${c.key}`)} ({c.maxScore}p)</li>)}</ul>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? t("common.saving") : t("evaluations.create")}</button>
        </div>
      </form>
    </Modal>
  );
}

type Criterion = EvaluationCriteria & { score: number };

// Completarea evaluarii sau, daca e deja finalizata, corectura ei (motivul ramane in istoric, vizibil echipei)
export function CompleteEvaluationModal({ ev, onClose, onSaved }: { ev: Evaluation; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const isCorrection = ev.status === "completed";
  const [criteria, setCriteria] = useState<Criterion[]>(ev.criteria.map(c => ({ ...c, score: Number(c.score) || 0 })));
  const [text, setText] = useState({ generalFeedback: ev.generalFeedback || "", strengths: ev.strengths || "", improvements: ev.improvements || "" });
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const setScore = (i: number, value: number) =>
    setCriteria(list => list.map((c, j) => (j === i ? { ...c, score: Math.min(Number(c.maxScore), Math.max(0, value || 0)) } : c)));

  const totalScore = criteria.reduce((s, c) => s + c.score, 0);
  const maxScore = criteria.reduce((s, c) => s + Number(c.maxScore), 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await apiFetch(`/evaluations/${ev.id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ criteria, ...text, ...(isCorrection ? { reason } : {}) }),
      });
      onSaved();
    } catch (err) { setError(err); setSaving(false); }
  };

  const levelOf = (c: Criterion) => c.score >= Number(c.maxScore) * 0.8 ? "excellent" : c.score >= Number(c.maxScore) * 0.5 ? "fair" : "poor";
  const levelStyle = { excellent: "text-green-700 dark:text-green-400", fair: "text-amber-700 dark:text-amber-400", poor: "text-red-600 dark:text-red-400" };

  return (
    <Modal size="lg" onClose={onClose}
      title={`${isCorrection ? t("evaluations.correctTitle") : t("evaluations.completeTitle")} — ${t(`evaluationPhase.${ev.phase}`)}`}
      subtitle={isCorrection ? t("evaluations.correctHint") : t("evaluations.completeHint")}>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-gradient-to-r from-blue-700 to-violet-700 rounded-xl p-4 text-white flex items-center gap-4" aria-live="polite">
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">{t("evaluations.currentTotal")}</div>
            <div className="h-2 bg-white/30 rounded-full"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${percentage}%` }} /></div>
            <div className="text-xs mt-1 opacity-90">{t("evaluations.percentOfMax", { value: percentage })}</div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-4xl font-bold">{totalScore}</div>
            <div className="text-xs opacity-90">{t("evaluations.outOf", { max: maxScore })}</div>
          </div>
        </div>

        {criteria.map((c, i) => (
          <fieldset key={c.id || i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <legend className="contents">
                <span>
                  <span className="block text-sm font-semibold dark:text-slate-200">{c.name}</span>
                  {c.description && <span className="block text-xs text-slate-500 mt-0.5 dark:text-slate-400">{c.description}</span>}
                </span>
              </legend>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={c.maxScore} value={c.score} onChange={e => setScore(i, Number(e.target.value))}
                  aria-label={t("evaluations.scoreFor", { name: c.name })} className="input w-20 text-center font-bold text-lg" />
                <span className="text-slate-500 text-sm dark:text-slate-400">/ {Number(c.maxScore)}</span>
              </div>
            </div>
            <input type="range" min={0} max={c.maxScore} value={c.score} onChange={e => setScore(i, Number(e.target.value))}
              aria-label={t("evaluations.scoreFor", { name: c.name })} className="w-full accent-blue-600" />
            <div className="flex justify-between text-xs text-slate-500 mt-0.5 dark:text-slate-400">
              <span>0</span>
              <span className={`font-medium ${levelStyle[levelOf(c)]}`}>{t(`evaluations.quality.${levelOf(c)}`)}</span>
              <span>{Number(c.maxScore)}</span>
            </div>
          </fieldset>
        ))}

        <TextAreaField label={t("evaluations.generalFeedback")} required value={text.generalFeedback} onChange={e => setText(f => ({ ...f, generalFeedback: e.target.value }))} className="min-h-20" placeholder={t("evaluations.generalFeedbackPlaceholder")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextAreaField label={t("evaluations.strengths")} value={text.strengths} onChange={e => setText(f => ({ ...f, strengths: e.target.value }))} className="min-h-16" placeholder={t("evaluations.strengthsPlaceholder")} />
          <TextAreaField label={t("evaluations.improvements")} value={text.improvements} onChange={e => setText(f => ({ ...f, improvements: e.target.value }))} className="min-h-16" placeholder={t("evaluations.improvementsPlaceholder")} />
        </div>
        {isCorrection && (
          <TextAreaField label={t("evaluations.correctionReason")} required minLength={5} value={reason} onChange={e => setReason(e.target.value)} className="min-h-16" placeholder={t("evaluations.correctionReasonPlaceholder")} />
        )}
        {error ? <Alert>{errorMessage(error)}</Alert> : null}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button type="submit" disabled={saving} className="btn-primary">
            <Check className="w-4 h-4" aria-hidden="true" />
            {saving ? t("common.saving") : isCorrection ? t("evaluations.saveCorrection", { score: totalScore, max: maxScore }) : t("evaluations.finish", { score: totalScore, max: maxScore })}
          </button>
        </div>
      </form>
    </Modal>
  );
}
