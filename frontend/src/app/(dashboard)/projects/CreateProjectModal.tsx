"use client";
import { useState } from "react";
import { LayoutTemplate, UserRound, Users, X, type LucideIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { PROJECT_TEMPLATES, type ProjectTemplate } from "./projectTemplates";
import type { Project, ProjectPriority, ProjectType, Team, User } from "@/types";

const TYPES: ProjectType[] = ["bachelor_thesis", "master_thesis", "research", "industrial", "open_source", "competition"];
const PRIORITIES: ProjectPriority[] = ["low", "medium", "high", "critical"];
const EMPTY = { title: "", description: "", type: "bachelor_thesis" as ProjectType, priority: "medium" as ProjectPriority, endDate: "", technologies: "", tags: "", objectives: "", teamId: "", coordinatorId: "" };
const splitList = (s: string) => s.split(",").map(x => x.trim()).filter(Boolean);
const addDays = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().split("T")[0]; };

function TemplatePicker({ onPick, onSkip }: { onPick: (t: ProjectTemplate) => void; onSkip: () => void }) {
  const { t, locale } = useT();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PROJECT_TEMPLATES.map(tpl => (
          <button key={tpl.id} type="button" onClick={() => onPick(tpl)} className="text-left border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition-colors bg-white dark:bg-slate-900">
            <div className="p-4 pb-0 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0" aria-hidden="true"><tpl.icon className="w-5 h-5" /></span>
              <span><span className="block font-semibold dark:text-slate-100">{tpl.name[locale]}</span><span className="block text-xs text-slate-500 dark:text-slate-400">{t("projects.milestoneCount", { count: tpl.milestones.length })}</span></span>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{tpl.description[locale]}</p>
              <ul className="space-y-1 mb-3">{tpl.milestones.slice(0, 3).map(ms => (
                <li key={ms.days} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />{ms.title[locale]}</li>
              ))}</ul>
              <div className="flex flex-wrap gap-1">{tpl.technologies.map(tech => <span key={tech} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">{tech}</span>)}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="text-center"><button type="button" onClick={onSkip} className="btn-secondary">{t("projects.noTemplate")}</button></div>
    </div>
  );
}

// Crearea unui proiect, optional dintr-un sablon; coordonatorul ales si echipa sunt notificati de server
export function CreateProjectModal({ teams, professors, onClose, onCreated }: { teams: Team[]; professors: User[]; onClose: () => void; onCreated: () => void }) {
  const { t, locale } = useT();
  const errorMessage = useErrorMessage();
  const [view, setView] = useState<"form" | "templates">("form");
  const [template, setTemplate] = useState<ProjectTemplate | null>(null);
  const [kind, setKind] = useState<"individual" | "team">("individual");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const pickTemplate = (tpl: ProjectTemplate) => {
    setTemplate(tpl);
    setForm(f => ({ ...f, type: tpl.type, technologies: tpl.technologies.join(", "), tags: tpl.tags.join(", "), description: f.description || tpl.description[locale] }));
    setView("form");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const created: Project = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          technologies: splitList(form.technologies),
          tags: splitList(form.tags),
          endDate: form.endDate || undefined,
          teamId: kind === "team" && form.teamId ? form.teamId : undefined,
          coordinatorId: form.coordinatorId || undefined,
        }),
      });
      // Etapele sablonului, in ordine
      if (template && created.id) {
        for (const [order, ms] of template.milestones.entries()) {
          await apiFetch(`/projects/${created.id}/milestones`, {
            method: "POST",
            body: JSON.stringify({ title: ms.title[locale], description: ms.description[locale], dueDate: addDays(ms.days), order }),
          }).catch(() => {});
        }
      }
      onCreated();
    } catch (err) { setError(err); setSaving(false); }
  };

  const kindButton = (value: "individual" | "team", Icon: LucideIcon) => (
    <button type="button" onClick={() => setKind(value)} aria-pressed={kind === value}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${kind === value ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
      <Icon className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      <span>
        <span className={`block text-sm font-semibold ${kind === value ? "text-blue-800 dark:text-blue-300" : "dark:text-slate-300"}`}>{t(`projects.kind.${value}`)}</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`projects.kind.${value}Hint`)}</span>
      </span>
    </button>
  );

  if (view === "templates") {
    return (
      <Modal size="xl" title={t("projects.templatesTitle")} subtitle={t("projects.templatesHint")} onClose={() => setView("form")}>
        <TemplatePicker onPick={pickTemplate} onSkip={() => setView("form")} />
      </Modal>
    );
  }

  return (
    <Modal size="lg" title={t("projects.newProject")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <fieldset>
          <legend className="label">{t("projects.projectKind")}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{kindButton("individual", UserRound)}{kindButton("team", Users)}</div>
        </fieldset>

        {kind === "team" && (teams.length === 0 ? (
          <Alert kind="info">{t("projects.noTeams")}</Alert>
        ) : (
          <SelectField label={t("projects.team")} required value={form.teamId} onChange={e => set("teamId", e.target.value)}>
            <option value="">{t("projects.chooseTeam")}</option>
            {teams.map(team => <option key={team.id} value={team.id}>{team.name} ({t("common.members", { count: team.members?.length || 0 })})</option>)}
          </SelectField>
        ))}

        <SelectField label={t("projects.coordinator")} value={form.coordinatorId} onChange={e => set("coordinatorId", e.target.value)}>
          <option value="">{t("projects.noCoordinator")}</option>
          {professors.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}{p.department ? ` — ${p.department}` : ""}</option>)}
        </SelectField>

        {!template ? (
          <button type="button" onClick={() => setView("templates")} className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all text-left">
            <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0"><LayoutTemplate className="w-5 h-5 text-blue-700 dark:text-blue-400" aria-hidden="true" /></span>
            <span><span className="block text-sm font-semibold text-blue-800 dark:text-blue-400">{t("projects.useTemplate")}</span><span className="block text-xs text-blue-700 dark:text-blue-400">{t("projects.useTemplateHint")}</span></span>
            <span className="ml-auto text-blue-700 text-lg dark:text-blue-400" aria-hidden="true">→</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl">
            <template.icon className="w-5 h-5 flex-shrink-0 text-blue-700 dark:text-blue-400" aria-hidden="true" />
            <div className="flex-1"><div className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t("projects.templateChosen", { name: template.name[locale] })}</div><div className="text-xs text-blue-700 dark:text-blue-400">{t("projects.templateMilestones", { count: template.milestones.length })}</div></div>
            <button aria-label={t("projects.removeTemplate")} title={t("projects.removeTemplate")} type="button" onClick={() => setTemplate(null)} className="p-1 text-blue-700 hover:text-blue-900 dark:text-blue-400"><X className="w-4 h-4" aria-hidden="true" /></button>
          </div>
        )}

        <TextField label={t("projects.titleField")} required value={form.title} onChange={e => set("title", e.target.value)} placeholder={t("projects.titlePlaceholder")} />
        <TextAreaField label={t("projects.description")} required value={form.description} onChange={e => set("description", e.target.value)} className="min-h-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectField label={t("projects.type")} value={form.type} onChange={e => set("type", e.target.value as ProjectType)}>
            {TYPES.map(type => <option key={type} value={type}>{t(`projectType.${type}`)}</option>)}
          </SelectField>
          <SelectField label={t("projects.priority")} value={form.priority} onChange={e => set("priority", e.target.value as ProjectPriority)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
          </SelectField>
        </div>
        <TextField label={t("projects.endDate")} type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
        <TextField label={t("projects.technologies")} value={form.technologies} onChange={e => set("technologies", e.target.value)} placeholder="React, NestJS, PostgreSQL" hint={t("projects.commaHint")} />
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">{t("common.cancel")}</button>
          <button type="submit" disabled={saving || (kind === "team" && teams.length === 0)} className="btn-primary disabled:opacity-50">
            {saving ? t("auth.creating") : template ? t("projects.createWithTemplate") : t("projects.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
