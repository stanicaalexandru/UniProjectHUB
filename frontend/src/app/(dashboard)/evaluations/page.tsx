"use client";
import { useState, useEffect } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { EvaluationCard, EvaluationSummary } from "./EvaluationCard";
import { CompleteEvaluationModal, CreateEvaluationModal } from "./EvaluationModals";
import type { Evaluation, Project } from "@/types";

export default function EvaluationsPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const { can } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Evaluation | null>(null);

  useEffect(() => {
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(visibleProjects(data, storedUser()))).catch(() => {});
  }, []);

  const loadEvals = async (pid: string) => {
    if (!pid) return;
    setLoading(true); setError(null);
    try {
      const data = await apiFetch(`/evaluations?projectId=${pid}`);
      setEvals(Array.isArray(data) ? data : data.data || []);
    } catch (e) { setError(e); }
    setLoading(false);
  };

  const handleProjectChange = (pid: string) => { setProjectId(pid); loadEvals(pid); };
  const newButton = (label: string) => <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{label}</button>;

  return (
    <Page>
      <PageHeader title={t("evaluations.title")}>
        {projectId && can.createEvaluation && newButton(t("evaluations.newEvaluation"))}
      </PageHeader>

      <PageBody>
        {error ? <Alert className="mb-4">{errorMessage(error)}</Alert> : null}
        <SelectField label={t("documents.selectProject")} wrapperClassName="mb-5 max-w-sm" value={projectId} onChange={e => handleProjectChange(e.target.value)}>
          <option value="">{t("documents.chooseProject")}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </SelectField>

        {!projectId ? (
          <EmptyState icon={ClipboardCheck} title={t("evaluations.selectProjectHint")} />
        ) : loading ? (
          <LoadingState label={t("evaluations.loading")} />
        ) : evals.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title={t("evaluations.none")} action={can.createEvaluation ? newButton(t("evaluations.addEvaluation")) : undefined} />
        ) : (
          <>
            <EvaluationSummary evals={evals} />
            <div className="space-y-4">
              {evals.map(ev => <EvaluationCard key={ev.id} ev={ev} canEdit={can.completeEvaluation} onEdit={() => setEditing(ev)} />)}
            </div>
          </>
        )}
      </PageBody>

      {/* Notificarea echipei o trimite serverul */}
      {showCreate && <CreateEvaluationModal projectId={projectId} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadEvals(projectId); }} />}
      {editing && <CompleteEvaluationModal ev={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadEvals(projectId); }} />}
    </Page>
  );
}
