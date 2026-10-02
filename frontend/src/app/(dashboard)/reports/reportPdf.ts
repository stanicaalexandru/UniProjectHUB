import { averageScore } from "@/lib/evaluations";
import type { Evaluation, Milestone, Project, Task, User } from "@/types";
import { LOGO_BARS } from "@/components/ui/Logo";

// Generarea rapoartelor PDF (jsPDF, incarcat doar la nevoie).
// Fonturile standard din PDF nu au diacriticele romanesti, asa ca textul e transliterat (ș -> s, ă -> a).

type T = (key: string, params?: Record<string, string | number>) => string;
type RGB = [number, number, number];
export type ProjectReportData = { project: Project; milestones: Milestone[]; tasks: Task[]; evaluations: Evaluation[] };
export type StudentReportData = { student: User; projects: (Project & { milestones: Milestone[]; tasks: Task[]; evaluations: Evaluation[] })[] };

const BLUE: RGB = [30, 58, 95];
const VIOLET: RGB = [139, 92, 246];
const GREEN: RGB = [16, 185, 129];
export const pdfText = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const person = (u?: { firstName?: string; lastName?: string } | null) => (u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "—");
const fileSafe = (s: string) => pdfText(s).replace(/[^\w-]+/g, "_");

async function createDoc() {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  return { doc, autoTable, pageW: doc.internal.pageSize.getWidth(), pageH: doc.internal.pageSize.getHeight() };
}
type Ctx = Awaited<ReturnType<typeof createDoc>>;

function cover({ doc, pageW, pageH }: Ctx, subtitle: string, t: T) {
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 60, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 12, 36, 36, 4, 4, "F");
  // Semnul aplicatiei (vezi components/ui/Logo): pe 36 mm, deci 36/32 mm pe unitate
  const unit = 36 / 32;
  doc.setFillColor(...BLUE);
  for (const b of LOGO_BARS) doc.roundedRect(15 + b.x * unit, 12 + b.y * unit, b.w * unit, 4 * unit, 2 * unit, 2 * unit, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("UniProject Hub", 60, 28);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(pdfText(subtitle), 60, 37);
  doc.setFontSize(9);
  doc.text(pdfText(t("reports.pdf.generatedBy")), 60, 45);
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 60, pageW, pageH - 60, "F");
}

function titleBlock({ doc, pageW }: Ctx, title: string, caption: string, y: number) {
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const clean = pdfText(title);
  doc.text(clean.length > 45 ? `${clean.slice(0, 45)}...` : clean, pageW / 2, y, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(pdfText(caption).toUpperCase(), pageW / 2, y + 10, { align: "center" });
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.line(30, y + 15, pageW - 30, y + 15);
}

// Grila de casete eticheta/valoare pe doua coloane
function infoGrid({ doc, pageW }: Ctx, items: [string, string][], y: number) {
  items.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 20 : pageW / 2 + 5;
    const boxY = y + Math.floor(i / 2) * 22;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, boxY, pageW / 2 - 25, 18, 2, 2, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(pdfText(label), x + 4, boxY + 6);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(pdfText(value), x + 4, boxY + 13);
  });
}

function tablePage(ctx: Ctx, heading: string, color: RGB, head: string[], body: (string | number)[][], altRow: RGB) {
  const { doc, autoTable, pageW } = ctx;
  doc.addPage();
  doc.setFillColor(...color);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(pdfText(heading).toUpperCase(), 15, 12);
  autoTable(doc, {
    startY: 25,
    head: [head.map(pdfText)],
    body: body.map(row => row.map(pdfText)),
    headStyles: { fillColor: color, textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: altRow },
    margin: { left: 15, right: 15 },
  });
}

function footer({ doc, pageW, pageH }: Ctx, text: string, t: T) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(pdfText(text), 15, pageH - 4);
    doc.text(pdfText(t("reports.pdf.page", { page: i, total })), pageW - 15, pageH - 4, { align: "right" });
  }
}

export async function generateProjectPdf({ project, milestones, tasks, evaluations }: ProjectReportData, t: T, tag: string) {
  const ctx = await createDoc();
  const today = new Date();
  const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(tag) : "—");
  cover(ctx, t("reports.pdf.platformSubtitle"), t);
  titleBlock(ctx, project.title || "", t("reports.pdf.progressReport"), 85);
  infoGrid(ctx, [
    [t("projects.type"), t(`projectType.${project.type}`)],
    [t("projectDetail.status"), t(`projectStatus.${project.status}`)],
    [t("projects.priority"), t(`priority.${project.priority}`)],
    [t("milestones.progress"), `${project.progressPercentage || 0}%`],
    [t("projects.coordinator"), person(project.coordinator)],
    [t("reports.pdf.generatedOn"), today.toLocaleDateString(tag, { year: "numeric", month: "long", day: "numeric" })],
  ], 115);

  if (milestones.length > 0) {
    tablePage(ctx, t("milestones.title"), BLUE, ["#", t("projects.titleField"), t("projectDetail.status"), t("milestones.due"), t("milestones.progress")],
      milestones.map((m, i) => [i + 1, m.title, t(`milestoneStatus.${m.status}`), date(m.dueDate), `${m.progressPercentage || 0}%`]), [248, 250, 252]);
  }
  if (tasks.length > 0) {
    tablePage(ctx, t("nav.tasks"), VIOLET, ["#", t("projects.titleField"), t("projectDetail.status"), t("projects.priority"), t("tasks.assignee"), t("tasks.dueDate")],
      tasks.map((task, i) => [i + 1, task.title, t(`taskStatus.${task.status}`), t(`priority.${task.priority}`), task.assignee ? person(task.assignee) : t("tasks.unassigned"), date(task.dueDate)]), [250, 245, 255]);
  }
  if (evaluations.length > 0) {
    tablePage(ctx, t("nav.evaluations"), GREEN, [t("evaluations.phase"), t("projectDetail.status"), t("evaluations.totalScore"), t("reports.pdf.maxScore"), t("evaluations.evaluator")],
      evaluations.map(ev => [t(`evaluationPhase.${ev.phase}`), t(`evaluationStatus.${ev.status}`), ev.totalScore ? Number(ev.totalScore).toFixed(0) : "—", ev.maxScore ? Number(ev.maxScore).toFixed(0) : "—", person(ev.evaluator)]), [240, 253, 244]);
  }
  footer(ctx, t("reports.pdf.footer", { date: today.toLocaleString(tag) }), t);
  ctx.doc.save(`${t("reports.pdf.fileProject")}_${fileSafe(project.title)}_${today.toISOString().split("T")[0]}.pdf`);
}

export async function generateStudentPdf({ student, projects }: StudentReportData, t: T, tag: string) {
  const ctx = await createDoc();
  const { doc, pageW } = ctx;
  const today = new Date();
  const name = person(student);
  cover(ctx, t("reports.pdf.studentSubtitle"), t);
  titleBlock(ctx, name, t("reports.pdf.academicReport"), 82);
  infoGrid(ctx, [
    [t("profile.email"), student.email || "—"],
    [t("profile.faculty"), student.faculty || "—"],
    [t("profile.department"), student.department || "—"],
    [t("profile.studyYear"), student.studyYear ? t("profile.yearN", { year: student.studyYear }) : "—"],
    [t("reports.pdf.projectCount"), String(projects.length)],
    [t("reports.pdf.generatedOn"), today.toLocaleDateString(tag, { year: "numeric", month: "long", day: "numeric" })],
  ], 107);

  const allEvaluations = projects.flatMap(p => p.evaluations);
  const avg = averageScore(allEvaluations, true);
  const summary: { label: string; value: string | number; color: RGB }[] = [
    { label: t("projects.title"), value: projects.length, color: BLUE },
    { label: t("nav.tasks"), value: projects.flatMap(p => p.tasks).length, color: VIOLET },
    { label: t("nav.milestones"), value: projects.flatMap(p => p.milestones).length, color: [59, 130, 246] },
    { label: t("projectDetail.averageScoreShort"), value: avg ? avg.score.toFixed(1) : "—", color: GREEN },
  ];
  summary.forEach((s, i) => {
    const w = (pageW - 40) / 4 - 2;
    const x = 20 + i * ((pageW - 40) / 4 + 1);
    doc.setFillColor(...s.color);
    doc.roundedRect(x, 178, w, 22, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(s.value), x + w / 2, 190, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(pdfText(s.label), x + w / 2, 196, { align: "center" });
  });

  const done = <X,>(list: X[], pred: (x: X) => boolean) => `${list.filter(pred).length}/${list.length}`;
  tablePage(ctx, `${t("projects.title")} — ${name}`, BLUE,
    ["#", t("projects.titleField"), t("projectDetail.status"), t("milestones.progress"), t("nav.milestones"), t("nav.tasks"), t("nav.evaluations")],
    projects.map((p, i) => [i + 1, p.title, t(`projectStatus.${p.status}`), `${p.progressPercentage || 0}%`,
      done(p.milestones, m => m.status === "completed"), done(p.tasks, x => x.status === "done"), done(p.evaluations, e => e.status === "completed")]), [248, 250, 252]);

  const completed = projects.flatMap(p => p.evaluations.filter(e => e.status === "completed").map(e => ({ e, p })));
  if (completed.length > 0) {
    tablePage(ctx, `${t("nav.evaluations")} — ${name}`, GREEN,
      [t("reports.pdf.project"), t("evaluations.phase"), t("reports.pdf.score"), t("reports.pdf.maxScore"), t("reports.pdf.percent"), t("evaluations.evaluator")],
      completed.map(({ e, p }) => [p.title.slice(0, 25), t(`evaluationPhase.${e.phase}`), e.totalScore ? Number(e.totalScore).toFixed(0) : "—",
        e.maxScore ? Number(e.maxScore).toFixed(0) : "—", e.totalScore && e.maxScore ? `${Math.round((Number(e.totalScore) / Number(e.maxScore)) * 100)}%` : "—", person(e.evaluator)]), [240, 253, 244]);
    if (avg) {
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(15, finalY, pageW - 30, 20, 3, 3, "F");
      doc.setTextColor(...BLUE);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(pdfText(t("reports.pdf.overallAverage", { score: avg.score.toFixed(1), max: avg.max.toFixed(0) })), pageW / 2, finalY + 13, { align: "center" });
    }
  }
  footer(ctx, t("reports.pdf.studentFooter", { date: today.toLocaleString(tag) }), t);
  doc.save(`${t("reports.pdf.fileStudent")}_${fileSafe(name)}_${today.toISOString().split("T")[0]}.pdf`);
}
