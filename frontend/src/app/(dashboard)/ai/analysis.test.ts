import { describe, expect, it } from "vitest";
import { analyzeProject, scoreLevel } from "./analysis";
import type { Milestone, Project, Task } from "@/types";

const NOW = new Date("2026-10-01T12:00:00Z");
const daysFromNow = (days: number) => new Date(NOW.getTime() + days * 86400000).toISOString();

const project = (extra: Partial<Project> = {}) => ({
  id: "p", title: "Proiect", status: "in_progress", progressPercentage: 50,
  description: "O descriere suficient de lunga pentru a conta ca documentare completa: obiective, arhitectura, tehnologii si rezultate.",
  technologies: ["Next.js"], startDate: daysFromNow(-50), endDate: daysFromNow(50), ...extra,
} as unknown as Project);

const milestone = (status: Milestone["status"], dueInDays: number) =>
  ({ id: `m${dueInDays}`, title: `Etapa ${dueInDays}`, status, dueDate: daysFromNow(dueInDays) } as unknown as Milestone);
const task = (status: Task["status"], assigned = true, dueInDays?: number) =>
  ({ id: `t${Math.random()}`, title: "Sarcina", status, assigneeId: assigned ? "u" : null, dueDate: dueInDays === undefined ? null : daysFromNow(dueInDays) } as unknown as Task);

describe("analyzeProject", () => {
  it("un proiect la zi, organizat si documentat primeste scor bun si nicio problema", () => {
    const result = analyzeProject(project(), [milestone("completed", -10), milestone("in_progress", 30)], [task("done"), task("in_progress")], NOW);
    expect(result.scores.time).toBe(100);
    expect(result.scores.documentation).toBe(100);
    expect(result.risks).toEqual([{ level: "success", kind: "healthy" }]);
    expect(scoreLevel(result.globalScore)).not.toBe("risk");
  });

  it("o etapa depasita apare ca risc critic, cu numarul de zile de intarziere", () => {
    const result = analyzeProject(project(), [milestone("in_progress", -6)], [task("todo")], NOW);
    expect(result.risks).toContainEqual({ level: "critical", kind: "milestoneOverdue", title: "Etapa -6", days: 6 });
    expect(result.scores.time).toBe(80);
  });

  it("mai multe termene depasite duc la recomandarea de a recupera intarzierile", () => {
    // 2 etape (-20 fiecare) si o sarcina (-10) depasite: scorul de timp scade la 50
    const result = analyzeProject(project(), [milestone("in_progress", -6), milestone("pending", -2)], [task("todo", true, -1)], NOW);
    expect(result.scores.time).toBe(50);
    expect(result.recs.map(r => r.kind)).toContain("deadlines");
  });

  it("semnaleaza sarcinile fara responsabil si recomanda asignarea lor", () => {
    // 3 sarcini neasignate (-15 fiecare): scorul de organizare scade sub 60
    const result = analyzeProject(project(), [milestone("in_progress", 30)], [task("todo", false), task("todo", false), task("todo", false)], NOW);
    expect(result.risks).toContainEqual({ level: "warning", kind: "unassigned", count: 3 });
    expect(result.recs.map(r => r.kind)).toContain("assign");
  });

  it("estimeaza finalizarea dupa ritmul de pana acum", () => {
    // 50% in 50 de zile => 1% pe zi => mai sunt necesare 50 de zile, exact pana la termen
    const onTime = analyzeProject(project(), [], [], NOW).prediction;
    expect(onTime?.estimatedDaysNeeded).toBe(50);
    expect(onTime?.onTime).toBe(true);

    const late = analyzeProject(project({ progressPercentage: 20 }), [], [], NOW).prediction;
    expect(late?.onTime).toBe(false);
  });

  it("fara termen final nu exista estimare, iar lipsa lui apare ca observatie", () => {
    const result = analyzeProject(project({ endDate: undefined }), [], [], NOW);
    expect(result.prediction).toBeNull();
    expect(result.risks).toContainEqual({ level: "info", kind: "noEndDate" });
  });
});
