"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Project, ProjectPriority, ProjectType } from "@/types";

const TYPES: ProjectType[] = ["bachelor_thesis", "master_thesis", "research", "industrial", "open_source", "competition"];
const PRIORITIES: ProjectPriority[] = ["low", "medium", "high", "critical"];
const day = (iso?: string) => (iso ? iso.split("T")[0] : "");

export function EditProjectModal({ project, onClose, onSaved }: { project: Project; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({
    title: project.title || "", description: project.description || "",
    type: project.type || "bachelor_thesis", priority: project.priority || "medium",
    startDate: day(project.startDate), endDate: day(project.endDate),
    technologies: (project.technologies || []).join(", "), faculty: project.faculty || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await apiFetch(`/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title, description: form.description, type: form.type, priority: form.priority,
          startDate: form.startDate || undefined, endDate: form.endDate || undefined,
          technologies: form.technologies.split(",").map(s => s.trim()).filter(Boolean),
          faculty: form.faculty || undefined,
        }),
      });
      onSaved();
    } catch (err) { setError(err); setSaving(false); }
  };

  return (
    <Modal size="lg" title={t("projectDetail.editTitle")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <TextField label={t("projects.titleField")} required value={form.title} onChange={e => set("title", e.target.value)} />
        <TextAreaField label={t("projects.description")} required value={form.description} onChange={e => set("description", e.target.value)} className="min-h-24" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField label={t("projects.type")} value={form.type} onChange={e => set("type", e.target.value as ProjectType)}>
            {TYPES.map(type => <option key={type} value={type}>{t(`projectType.${type}`)}</option>)}
          </SelectField>
          <SelectField label={t("projects.priority")} value={form.priority} onChange={e => set("priority", e.target.value as ProjectPriority)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
          </SelectField>
          <TextField label={t("projectDetail.startDate")} type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
          <TextField label={t("projects.endDate")} type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
        </div>
        <TextField label={t("profile.faculty")} value={form.faculty} onChange={e => set("faculty", e.target.value)} placeholder={t("settings.facultyPlaceholder")} />
        <TextField label={t("projects.technologies")} value={form.technologies} onChange={e => set("technologies", e.target.value)} placeholder="React, NestJS, PostgreSQL" hint={t("projects.commaHint")} />
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? t("common.saving") : t("settings.saveChanges")}</button>
        </div>
      </form>
    </Modal>
  );
}
