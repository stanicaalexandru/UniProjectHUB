"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

// Crearea unei etape; echipa proiectului e notificata de server
export function CreateMilestoneModal({ projectId, order, onClose, onCreated }: {
  projectId: string; order: number; onClose: () => void; onCreated: () => void;
}) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", deliverables: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await apiFetch(`/projects/${projectId}/milestones`, { method: "POST", body: JSON.stringify({ ...form, order }) });
      onCreated();
    } catch (err) { setError(err); setSaving(false); }
  };

  return (
    <Modal title={t("milestones.newMilestone")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <TextField label={t("milestones.titleField")} required value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("milestones.titlePlaceholder")} />
        <TextAreaField label={t("milestones.description")} value={form.description} onChange={e => set("description", e.target.value)} className="min-h-16" />
        <TextField label={t("milestones.dueDate")} required type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
        <TextField label={t("milestones.deliverables")} value={form.deliverables} onChange={e => set("deliverables", e.target.value)} placeholder={t("milestones.deliverablesPlaceholder")} />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? t("common.saving") : t("milestones.create")}</button>
        </div>
      </form>
    </Modal>
  );
}
