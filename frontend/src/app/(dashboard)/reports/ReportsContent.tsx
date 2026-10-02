"use client";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { isProjectMember } from "@/lib/projects";
import { averageScore } from "@/lib/evaluations";
import { useT } from "@/i18n";
import { useToast } from "@/components/ui/Feedback";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { SelectField } from "@/components/ui/Field";
import { EmptyState, LoadingState, Spinner } from "@/components/ui/States";
import { generateProjectPdf, generateStudentPdf, type ProjectReportData, type StudentReportData } from "./reportPdf";
import type { Evaluation, Milestone, Project, Task, User } from "@/types";

const listOf = <T,>(r: PromiseSettledResult<unknown>): T[] =>
  r.status !== "fulfilled" ? [] : Array.isArray(r.value) ? r.value : ((r.value as { data?: T[] })?.data ?? []);

async function loadProjectParts(id: string) {
  const [ms, tk, ev] = await Promise.allSettled([apiFetch(`/projects/${id}/milestones`), apiFetch(`/tasks?projectId=${id}`), apiFetch(`/evaluations?projectId=${id}`)]);
  return { milestones: listOf<Milestone>(ms), tasks: listOf<Task>(tk), evaluations: listOf<Evaluation>(ev) };
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{label}</div>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold dark:text-slate-100 mb-3">{title}</h3>
      <dl className="space-y-2">
        {items.map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-xs"><dt className="text-slate-500 dark:text-slate-400">{k}</dt><dd className="font-medium dark:text-slate-300 text-right break-all">{v}</dd></div>)}
      </dl>
    </section>
  );
}

function GenerateButton({ busy, label, onClick }: { busy: boolean; label: string; onClick: () => void }) {
  const { t } = useT();
  return (
    <button onClick={onClick} disabled={busy} className="btn-primary w-full justify-center py-3 text-base">
      {busy ? <><Spinner />{t("reports.generating")}</> : <><Download className="w-5 h-5" aria-hidden="true" />{label}</>}
    </button>
  );
}

export default function ReportsContent() {
  const { t, tr, locale } = useT();
  const format = locale === "ro" ? "ro-RO" : "en-GB"; // formatul datelor, in pagina si in PDF
  const pdfT = (key: string, params?: Record<string, string | number>) => tr(key, undefined, params);
  const toast = useToast();
  const [tab, setTab] = useState<"project" | "student">("project");
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  const [projectId, setProjectId] = useState("");
  const [projectData, setProjectData] = useState<ProjectReportData | null>(null);
  const [studentId, setStudentId] = useState("");
  const [studentData, setStudentData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiFetchAll<Project>("/projects").then(({ data }) => setProjects(data)).catch(() => {});
    apiFetch("/users/students").then(d => setStudents(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const loadProject = async (pid: string) => {
    setProjectId(pid); setProjectData(null);
    if (!pid) return;
    setLoading(true);
    try {
      const [project, parts] = await Promise.all([apiFetch(`/projects/${pid}`), loadProjectParts(pid)]);
      setProjectData({ project, ...parts });
    } catch {}
    setLoading(false);
  };

  // Raportul unui student cuprinde proiectele create de el sau ale echipelor din care face parte
  const loadStudent = async (sid: string) => {
    setStudentId(sid); setStudentData(null);
    const student = students.find(s => s.id === sid);
    if (!sid || !student) return;
    setLoading(true);
    const involved = projects.filter(p => isProjectMember(p, sid));
    const withParts = await Promise.all(involved.map(async p => ({ ...p, ...(await loadProjectParts(p.id)) })));
    setStudentData({ student, projects: withParts });
    setLoading(false);
  };

  const generate = async (build: () => Promise<void>) => {
    setGenerating(true);
    try { await build(); } catch { toast.error(t("reports.pdfFailed")); }
    setGenerating(false);
  };

  const projectAvg = projectData && averageScore(projectData.evaluations);
  const studentEvaluations = studentData?.projects.flatMap(p => p.evaluations) ?? [];
  const studentAvg = averageScore(studentEvaluations, true);

  return (
    <Page>
      <PageHeader title={t("reports.title")} />
      <PageBody>
        <Tabs label={t("reports.tabsLabel")} value={tab} onChange={setTab} tabs={[
          { value: "project", label: `📁 ${t("reports.byProject")}` },
          { value: "student", label: `👤 ${t("reports.byStudent")}` },
        ]} />

        {tab === "project" && (
          <>
            <SelectField label={t("documents.selectProject")} wrapperClassName="mb-6 max-w-sm" value={projectId} onChange={e => loadProject(e.target.value)}>
              <option value="">{t("documents.chooseProject")}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </SelectField>
            {!projectId ? <EmptyState icon="📄" title={t("reports.pickProject")} /> : loading ? <LoadingState label={t("common.loading")} /> : projectData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white flex items-center gap-4">
                    <span className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-700 font-bold text-xl" aria-hidden="true">U</span>
                    <div><div className="font-bold text-lg">UniProject Hub</div><div className="text-blue-100 text-sm">{t("reports.progressReport")}</div></div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold dark:text-slate-100 mb-1">{projectData.project.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">{projectData.project.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <Stat label={t("milestones.progress")} value={`${projectData.project.progressPercentage || 0}%`} color="text-blue-700 dark:text-blue-400" />
                      <Stat label={t("nav.milestones")} value={`${projectData.milestones.filter(m => m.status === "completed").length}/${projectData.milestones.length}`} color="text-purple-700 dark:text-purple-400" />
                      <Stat label={t("nav.tasks")} value={`${projectData.tasks.filter(x => x.status === "done").length}/${projectData.tasks.length}`} color="text-amber-700 dark:text-amber-400" />
                      <Stat label={t("projectDetail.averageScoreShort")} value={projectAvg ? `${projectAvg.score.toFixed(1)}p` : t("common.none")} color="text-green-700 dark:text-green-400" />
                    </div>
                    <GenerateButton busy={generating} label={t("reports.generateProject")} onClick={() => generate(() => generateProjectPdf(projectData, pdfT, format))} />
                  </div>
                </section>
                <InfoList title={t("projectDetail.details")} items={[
                  [t("projects.type"), t(`projectType.${projectData.project.type}`)],
                  [t("projectDetail.status"), t(`projectStatus.${projectData.project.status}`)],
                  [t("projects.coordinator"), projectData.project.coordinator ? `${projectData.project.coordinator.firstName} ${projectData.project.coordinator.lastName}` : t("common.none")],
                  [t("projects.endDate"), projectData.project.endDate ? new Date(projectData.project.endDate).toLocaleDateString(format) : t("common.none")],
                ]} />
              </div>
            )}
          </>
        )}

        {tab === "student" && (
          <>
            <SelectField label={t("reports.selectStudent")} wrapperClassName="mb-6 max-w-sm" value={studentId} onChange={e => loadStudent(e.target.value)}>
              <option value="">{t("teams.chooseStudent")}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.email}</option>)}
            </SelectField>
            {!studentId ? <EmptyState icon="👤" title={t("reports.pickStudent")} description={t("reports.pickStudentHint")} /> : loading ? <LoadingState label={t("common.loading")} /> : studentData && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-violet-700 to-blue-700 p-6 text-white flex items-center gap-4">
                    <span className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold" aria-hidden="true">{studentData.student.firstName?.[0]}{studentData.student.lastName?.[0]}</span>
                    <div className="min-w-0">
                      <h2 className="font-bold text-xl">{studentData.student.firstName} {studentData.student.lastName}</h2>
                      <div className="text-blue-100 text-sm break-all">{studentData.student.email}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <Stat label={t("projects.title")} value={studentData.projects.length} color="text-blue-700 dark:text-blue-400" />
                      <Stat label={t("nav.evaluations")} value={studentEvaluations.filter(e => e.status === "completed").length} color="text-green-700 dark:text-green-400" />
                      <Stat label={t("projectDetail.averageScoreShort")} value={studentAvg ? `${studentAvg.score.toFixed(1)}p` : t("common.none")} color="text-violet-700 dark:text-violet-400" />
                      <Stat label={t("nav.tasks")} value={studentData.projects.flatMap(p => p.tasks).length} color="text-amber-700 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("projects.title")}</h3>
                    {studentData.projects.length === 0 ? (
                      <p className="text-center py-6 mb-5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400">{t("reports.noStudentProjects")}</p>
                    ) : (
                      <ul className="space-y-2 mb-5">
                        {studentData.projects.slice(0, 5).map(p => (
                          <li key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <span className="text-base" aria-hidden="true">📁</span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium dark:text-slate-200 truncate">{p.title}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400">{t("reports.projectLine", { progress: p.progressPercentage || 0, count: p.evaluations.filter(e => e.status === "completed").length })}</span>
                            </span>
                            <span className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" aria-hidden="true"><span className="block h-full bg-blue-500 rounded-full" style={{ width: `${p.progressPercentage || 0}%` }} /></span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <GenerateButton busy={generating} label={t("reports.generateStudent")} onClick={() => generate(() => generateStudentPdf(studentData, pdfT, format))} />
                  </div>
                </section>
                <div className="space-y-4">
                  <InfoList title={t("reports.studentInfo")} items={[
                    [t("profile.email"), studentData.student.email || t("common.none")],
                    [t("profile.faculty"), studentData.student.faculty || t("common.none")],
                    [t("profile.department"), studentData.student.department || t("common.none")],
                    [t("profile.studyYear"), studentData.student.studyYear ? t("profile.yearN", { year: studentData.student.studyYear }) : t("common.none")],
                  ]} />
                  <section className="bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-2">{t("reports.contents")}</h3>
                    <ul className="space-y-1.5 text-xs text-violet-800 dark:text-violet-400">
                      {(["content1", "content2", "content3", "content4", "content5"] as const).map(k => <li key={k}>✓ {t(`reports.${k}`)}</li>)}
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </>
        )}
      </PageBody>
    </Page>
  );
}
