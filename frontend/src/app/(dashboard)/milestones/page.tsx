"use client";
import { Meta } from "@/components/ui/Meta";
import { useState, useEffect } from "react";
import { Download, FileText, Flag, Paperclip, Plus, X } from "lucide-react";
import { apiFetch, apiFetchAll, downloadFile } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import { canDeleteDocument } from "@/lib/permissions";
import { MILESTONE_STATUS_BADGE, MILESTONE_STATUS_DOT } from "@/lib/constants";
import { useConfirm } from "@/components/ui/Feedback";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage, useFormat } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { UploadButton } from "@/components/ui/UploadButton";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { CreateMilestoneModal } from "./CreateMilestoneModal";
import type { Document, Milestone, MilestoneStatus, Project } from "@/types";

const STATUSES: MilestoneStatus[] = ["pending", "in_progress", "completed", "overdue"];

export default function MilestonesPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const format = useFormat();
  const confirm = useConfirm();
  const { user, isStaff } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [docsByMilestone, setDocsByMilestone] = useState<Record<string, Document[]>>({});
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(visibleProjects(data, storedUser()))).catch(() => {});
  }, []);

  const loadMilestones = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/projects/${pid}/milestones`);
      const list: Milestone[] = Array.isArray(data) ? data : data.data || [];
      setMilestones(list);
      // Documentele fiecarei etape, cerute in paralel
      const docs = await Promise.all(list.map(m =>
        apiFetch(`/documents?milestoneId=${m.id}`).then(d => (Array.isArray(d) ? d : []) as Document[]).catch(() => [] as Document[])));
      setDocsByMilestone(Object.fromEntries(list.map((m, i) => [m.id, docs[i]])));
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  const handleProjectChange = (pid: string) => { setProjectId(pid); loadMilestones(pid); };

  const updateStatus = async (id: string, status: MilestoneStatus) => {
    try {
      await apiFetch(`/projects/milestones/${id}`, { method: "PATCH", body: JSON.stringify({ status, ...(status === "completed" ? { progressPercentage: 100 } : {}) }) });
      setMilestones(list => list.map(m => m.id === id ? { ...m, status } : m));
    } catch (e) { setError(e); }
  };

  // Coordonatorul si echipa sunt notificati de server la fiecare document incarcat
  const handleUpload = async (milestoneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploadingFor(milestoneId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);
      fd.append("projectId", projectId);
      fd.append("milestoneId", milestoneId);
      const doc: Document = await apiFetch("/documents/upload", { method: "POST", body: fd });
      setDocsByMilestone(prev => ({ ...prev, [milestoneId]: [...(prev[milestoneId] || []), doc] }));
    } catch (err) { setError(err); }
    finally { setUploadingFor(null); input.value = ""; }
  };

  const deleteDoc = async (milestoneId: string, docId: string) => {
    if (!(await confirm({ title: t("documents.deleteTitle"), message: t("documents.deleteMessage"), confirmLabel: t("common.delete"), danger: true }))) return;
    try {
      await apiFetch(`/documents/${docId}`, { method: "DELETE" });
      setDocsByMilestone(prev => ({ ...prev, [milestoneId]: prev[milestoneId].filter(d => d.id !== docId) }));
    } catch (e) { setError(e); }
  };

  const download = (doc: Document) => downloadFile(`/documents/${doc.id}/download`, doc.originalName || doc.name).catch(setError);
  const project = projects.find(p => p.id === projectId);

  return (
    <Page>
      <PageHeader title={t("milestones.title")}>
        {projectId && isStaff && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("milestones.newMilestone")}</button>}
        {projectId && !isStaff && <span className="text-xs text-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg dark:text-slate-400">{t("milestones.createdByProfessor")}</span>}
      </PageHeader>
      <PageBody>
        {error ? <Alert className="mb-4" onDismiss={() => setError(null)} dismissLabel={t("common.close")}>{errorMessage(error)}</Alert> : null}
        <SelectField label={t("documents.selectProject")} wrapperClassName="mb-5 max-w-sm" value={projectId} onChange={e => handleProjectChange(e.target.value)}>
          <option value="">{t("documents.chooseProject")}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </SelectField>

        {!projectId ? (
          <EmptyState icon={Flag} title={t("milestones.selectProjectHint")} />
        ) : loading ? (
          <LoadingState label={t("common.loading")} />
        ) : milestones.length === 0 ? (
          <EmptyState icon={Flag} title={isStaff ? t("milestones.noneStaff") : t("milestones.noneStudent")}
            action={isStaff ? <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("milestones.addFirst")}</button> : undefined} />
        ) : (
          <ol className="space-y-3">
            {milestones.map((m, i) => {
              const docs = docsByMilestone[m.id] || [];
              return (
                <li key={m.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1" aria-hidden="true">
                      <div className={`w-4 h-4 rounded-full ${MILESTONE_STATUS_DOT[m.status] ?? "bg-slate-300"}`} />
                      {i < milestones.length - 1 && <div className="w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                        <h2 className="font-semibold text-sm dark:text-slate-100">{m.title}</h2>
                        <Badge color={MILESTONE_STATUS_BADGE[m.status]}>{t(`milestoneStatus.${m.status}`)}</Badge>
                        {docs.length > 0 && <Meta icon={Paperclip} className="text-xs text-blue-700 dark:text-blue-400">{t("milestones.docCount", { count: docs.length })}</Meta>}
                        <span className="text-xs text-slate-500 dark:text-slate-400 sm:ml-auto">{t("milestones.due")}: <strong className="text-slate-700 dark:text-slate-200">{format.date(m.dueDate)}</strong></span>
                      </div>
                      {m.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{m.description}</p>}
                      {m.deliverables && <p className="text-xs text-slate-500 mb-2 dark:text-slate-400">{t("milestones.deliverablesLabel")}: {m.deliverables}</p>}
                      <div className="flex justify-between text-xs text-slate-500 mb-1 dark:text-slate-400">
                        <span>{t("milestones.progress")}</span><span className="font-semibold">{m.progressPercentage || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-3" role="progressbar" aria-valuenow={m.progressPercentage || 0} aria-valuemin={0} aria-valuemax={100} aria-label={t("milestones.progress")}>
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.progressPercentage || 0}%` }} />
                      </div>

                      {docs.length > 0 && (
                        <ul className="mb-3 space-y-1.5">
                          {docs.map(doc => {
                            const name = doc.name || doc.originalName;
                            return (
                              <li key={doc.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                                <FileText className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                                <span className="text-xs flex-1 truncate dark:text-slate-300">{name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{format.fileSize(Number(doc.size))}</span>
                                <button aria-label={t("documents.downloadLabel", { name })} title={t("common.download")} onClick={() => download(doc)} className="p-1 text-blue-700 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-blue-950">
                                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                                {canDeleteDocument(project, user, doc) && (
                                  <button aria-label={t("documents.deleteLabel", { name })} title={t("common.delete")} onClick={() => deleteDoc(m.id, doc.id)} className="p-1 text-slate-500 hover:text-red-600 rounded transition-colors dark:text-slate-400">
                                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <select value={m.status} onChange={e => updateStatus(m.id, e.target.value as MilestoneStatus)} aria-label={t("milestones.statusLabel", { title: m.title })}
                          className="text-xs px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-300">
                          {STATUSES.map(s => <option key={s} value={s}>{t(`milestoneStatus.${s}`)}</option>)}
                        </select>
                        <UploadButton variant="dashed" label={uploadingFor === m.id ? t("documents.uploading") : t("milestones.addDocument")} busy={uploadingFor === m.id} onFile={e => handleUpload(m.id, e)} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </PageBody>
      {showCreate && isStaff && (
        <CreateMilestoneModal projectId={projectId} order={milestones.length} onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadMilestones(projectId); }} />
      )}
    </Page>
  );
}
