"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { projectMembers } from "@/lib/projects";
import { useT, useErrorMessage } from "@/i18n";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Project, Task, TaskPriority, User } from "@/types";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];
const EMPTY = { title: "", description: "", priority: "medium" as TaskPriority, dueDate: "", projectId: "", assigneeId: "" };

// Fereastra de creare a unei sarcini; persoana asignata e notificata de server
export function CreateTaskModal({ projects, users, defaultProjectId, onClose, onCreated }: {
  projects: Project[]; users: User[]; defaultProjectId?: string; onClose: () => void; onCreated: (task: Task) => void;
}) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({ ...EMPTY, projectId: defaultProjectId ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  // Intr-un proiect sarcina poate fi asignata doar membrilor lui (regula serverului)
  const project = projects.find(p => p.id === form.projectId);
  const candidates = project ? projectMembers(project) : users;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const task = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
          projectId: form.projectId || undefined,
          assigneeId: form.assigneeId || undefined,
        }),
      });
      onCreated(task);
    } catch (err) { setError(err); setSaving(false); }
  };

  return (
    <Modal title={t("tasks.newTask")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <SelectField label={t("tasks.project")} value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value, assigneeId: "" }))}>
          <option value="">{t("tasks.noProject")}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </SelectField>
        <TextField label={t("tasks.titleField")} required value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("tasks.titlePlaceholder")} />
        <TextAreaField label={t("tasks.description")} value={form.description} onChange={e => set("description", e.target.value)} className="min-h-16" />
        <SelectField label={t("tasks.assignee")} value={form.assigneeId} onChange={e => set("assigneeId", e.target.value)}>
          <option value="">{t("tasks.unassignedOption")}</option>
          {candidates.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({t(`roles.${u.role}`)})</option>)}
        </SelectField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField label={t("tasks.priority")} value={form.priority} onChange={e => set("priority", e.target.value as TaskPriority)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
          </SelectField>
          <TextField label={t("tasks.dueDate")} type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? t("common.saving") : t("tasks.addTask")}</button>
        </div>
      </form>
    </Modal>
  );
}
