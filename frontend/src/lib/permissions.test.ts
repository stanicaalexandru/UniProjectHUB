import { describe, expect, it } from "vitest";
import { allowedStatuses, canAccessTeam, canDeleteProject, canEditProjectDetails, canManageTeam, projectRole } from "./permissions";
import type { Project, Team } from "@/types";

const admin = { id: "admin", role: "admin" as const };
const coordinator = { id: "prof", role: "professor" as const };
const otherProfessor = { id: "prof2", role: "professor" as const };
const leader = { id: "leader", role: "student" as const };
const member = { id: "member", role: "student" as const };
const outsider = { id: "outsider", role: "student" as const };

const team = {
  id: "team",
  members: [
    { role: "leader", user: { id: leader.id } },
    { role: "member", user: { id: member.id } },
  ],
} as unknown as Team;

const project = (status: Project["status"]) =>
  ({ id: "p", status, coordinatorId: coordinator.id, createdById: leader.id, teamId: team.id, team } as unknown as Project);

describe("projectRole", () => {
  it("recunoaste fiecare rol fata de proiect", () => {
    const p = project("in_progress");
    expect(projectRole(p, admin)).toBe("admin");
    expect(projectRole(p, coordinator)).toBe("coordinator");
    expect(projectRole(p, leader)).toBe("member");
    expect(projectRole(p, member)).toBe("member");
    expect(projectRole(p, outsider)).toBeNull();
    expect(projectRole(p, otherProfessor)).toBeNull();
    expect(projectRole(p, null)).toBeNull();
  });
});

describe("editarea si stergerea proiectului", () => {
  it("echipa editeaza doar cat proiectul e ciorna sau propus", () => {
    expect(canEditProjectDetails(project("draft"), member)).toBe(true);
    expect(canEditProjectDetails(project("proposed"), member)).toBe(true);
    expect(canEditProjectDetails(project("in_progress"), member)).toBe(false);
    expect(canEditProjectDetails(project("in_progress"), coordinator)).toBe(true);
  });

  it("echipa sterge doar ciornele; coordonatorul si adminul oricand", () => {
    expect(canDeleteProject(project("draft"), member)).toBe(true);
    expect(canDeleteProject(project("proposed"), member)).toBe(false);
    expect(canDeleteProject(project("completed"), coordinator)).toBe(true);
    expect(canDeleteProject(project("completed"), admin)).toBe(true);
    expect(canDeleteProject(project("draft"), outsider)).toBe(false);
  });

  it("echipa poate doar propune o ciorna; cei din afara nu pot schimba starea", () => {
    expect(allowedStatuses(project("draft"), member)).toEqual(["draft", "proposed"]);
    expect(allowedStatuses(project("proposed"), member)).toEqual([]);
    expect(allowedStatuses(project("proposed"), coordinator)).toContain("approved");
    expect(allowedStatuses(project("draft"), outsider)).toEqual([]);
  });
});

describe("echipe", () => {
  const coordinated = [{ teamId: team.id, coordinatorId: coordinator.id }];

  it("liderul, adminul si profesorul coordonator administreaza echipa", () => {
    expect(canManageTeam(team, leader, [])).toBe(true);
    expect(canManageTeam(team, admin, [])).toBe(true);
    expect(canManageTeam(team, coordinator, coordinated)).toBe(true);
  });

  it("un membru obisnuit sau un profesor fara legatura nu administreaza echipa", () => {
    expect(canManageTeam(team, member, coordinated)).toBe(false);
    expect(canManageTeam(team, otherProfessor, coordinated)).toBe(false);
  });

  it("membrii si coordonatorul au acces la echipa, cei din afara nu", () => {
    expect(canAccessTeam(team, member, [])).toBe(true);
    expect(canAccessTeam(team, coordinator, coordinated)).toBe(true);
    expect(canAccessTeam(team, outsider, coordinated)).toBe(false);
  });
});
