"use client";
import { useState, useEffect, useRef } from "react";
import { Download, FileText, FolderOpen, HardDrive, History, RefreshCw, Trash2, type LucideIcon } from "lucide-react";
import { apiFetch, apiFetchAll, downloadFile } from "@/lib/api";
import { storedUser, visibleProjects } from "@/lib/projects";
import { canDeleteDocument } from "@/lib/permissions";
import { useConfirm } from "@/components/ui/Feedback";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage, useFormat, useUserName } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { UploadButton } from "@/components/ui/UploadButton";
import { EmptyState, LoadingState } from "@/components/ui/States";
import type { Document, Project } from "@/types";

export default function DocumentsPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const format = useFormat();
  const displayName = useUserName();
  const confirm = useConfirm();
  const { user } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Studentii vad doar proiectele lor; profesorii si administratorii pe toate cele la care au acces
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(visibleProjects(data, storedUser()))).catch(() => {});
  }, []);

  const loadDocs = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/documents?projectId=${pid}`);
      setDocs(Array.isArray(data) ? data : data.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  };

  const handleProjectChange = (pid: string) => { setProjectId(pid); loadDocs(pid); };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !projectId) { setError(t("documents.selectProjectFirst")); return; }
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);
      fd.append("projectId", projectId);
      await apiFetch("/documents/upload", { method: "POST", body: fd });
      await loadDocs(projectId);
    } catch (err) { setError(err); }
    finally { setUploading(false); input.value = ""; }
  };

  const handleDownload = async (doc: Document) => {
    try { await downloadFile(`/documents/${doc.id}/download`, doc.originalName || doc.name); }
    catch (e) { setError(e); }
  };

  const project = projects.find(p => p.id === projectId);
  const canDelete = (doc: Document) => canDeleteDocument(project, user, doc);

  const handleDelete = async (doc: Document) => {
    if (!(await confirm({ title: t("documents.deleteTitle"), message: t("documents.deleteMessage"), confirmLabel: t("common.delete"), danger: true }))) return;
    try {
      await apiFetch(`/documents/${doc.id}`, { method: "DELETE" });
      setDocs(list => list.filter(d => d.id !== doc.id));
    } catch (e) { setError(e); }
  };

  const totalSize = docs.reduce((a, d) => a + Number(d.size || 0), 0);
  const stats: [LucideIcon, string | number, string][] = [
    [FileText, docs.length, t("documents.statTotal")],
    [HardDrive, format.fileSize(totalSize), t("documents.statStorage")],
    [History, docs.length > 0 ? `v${Math.max(...docs.map(d => d.currentVersion || 1))}` : t("common.none"), t("documents.statVersion")],
  ];

  return (
    <Page>
      <PageHeader title={t("documents.title")}>
        {projectId && (
          <button aria-label={t("documents.reload")} title={t("documents.reload")} onClick={() => loadDocs(projectId)} className="btn-secondary p-2">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <UploadButton label={uploading ? t("documents.uploading") : t("documents.upload")} busy={uploading} onFile={handleUpload} inputRef={fileRef} />
      </PageHeader>

      <PageBody>
        {error ? <Alert className="mb-4" onDismiss={() => setError(null)} dismissLabel={t("common.close")}>{errorMessage(error)}</Alert> : null}

        <SelectField label={t("documents.selectProject")} wrapperClassName="mb-5 max-w-sm" value={projectId} onChange={e => handleProjectChange(e.target.value)}>
          <option value="">{t("documents.chooseProject")}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </SelectField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {stats.map(([Icon, value, label]) => (
            <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-400">
                {label}<Icon className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold tabular-nums dark:text-slate-100 mt-2">{value}</div>
            </div>
          ))}
        </div>

        {!projectId ? (
          <EmptyState icon={FolderOpen} title={t("documents.selectProjectHint")} />
        ) : loading ? (
          <LoadingState label={t("common.loading")} />
        ) : docs.length === 0 ? (
          <EmptyState icon={FileText} title={t("documents.none")} action={<UploadButton label={t("documents.uploadFirst")} busy={uploading} onFile={handleUpload} />} />
        ) : (
          <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
            {docs.map(doc => (
              <li key={doc.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0" aria-hidden="true"><FileText className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate dark:text-slate-200">{doc.name || doc.originalName}</div>
                  <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                    v{doc.currentVersion} · {format.fileSize(Number(doc.size))} · {displayName(doc.uploadedBy)} · {format.date(doc.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleDownload(doc)} className="btn-secondary text-xs px-3 py-1.5" aria-label={t("documents.downloadLabel", { name: doc.name })}>
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />{t("common.download")}
                  </button>
                  {canDelete(doc) && (
                    <button aria-label={t("documents.deleteLabel", { name: doc.name })} title={t("common.delete")} onClick={() => handleDelete(doc)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors dark:text-slate-400">
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </Page>
  );
}
