import type { Document, Project, ProjectStatus, Team, User } from "@/types";

// Aceleasi reguli ca ProjectAccessService din backend, ca interfata sa ofere doar actiunile permise.
// Serverul ramane sursa de adevar: aceste functii doar ascund butoanele care ar fi refuzate.

export type ProjectRole = "admin" | "coordinator" | "member" | null;
type Person = Pick<User, "id" | "role"> | null | undefined;

const EDITABLE_BY_TEAM: ProjectStatus[] = ["draft", "proposed"];
export const ALL_STATUSES: ProjectStatus[] = ["draft", "proposed", "approved", "in_progress", "review", "completed", "archived", "rejected"];

export function projectRole(project: Project | null | undefined, user: Person): ProjectRole {
  if (!project || !user) return null;
  if (user.role === "admin") return "admin";
  if (project.coordinatorId === user.id || project.coordinator?.id === user.id) return "coordinator";
  const isCreator = project.createdById === user.id || project.createdBy?.id === user.id;
  const isTeamMember = project.team?.members?.some(m => m.user?.id === user.id);
  return isCreator || isTeamMember ? "member" : null;
}

const isManager = (role: ProjectRole) => role === "admin" || role === "coordinator";

// Detaliile proiectului: coordonatorul/adminul oricand; echipa doar cat timp proiectul e draft sau propus
export function canEditProjectDetails(project: Project, user: Person) {
  const role = projectRole(project, user);
  return isManager(role) || (role === "member" && EDITABLE_BY_TEAM.includes(project.status));
}

// Statusurile pe care userul le poate alege (include statusul curent); echipa poate doar propune proiectul
export function allowedStatuses(project: Project, user: Person): ProjectStatus[] {
  const role = projectRole(project, user);
  if (isManager(role)) return ALL_STATUSES;
  if (role === "member" && project.status === "draft") return ["draft", "proposed"];
  return [];
}

export function canDeleteProject(project: Project, user: Person) {
  const role = projectRole(project, user);
  return isManager(role) || (role === "member" && project.status === "draft");
}

// Un document il poate sterge cine l-a incarcat, coordonatorul proiectului sau un administrator
export function canDeleteDocument(project: Project | null | undefined, user: Person, doc: Pick<Document, "uploadedBy" | "uploadedById">) {
  if (!user) return false;
  return doc.uploadedBy?.id === user.id || doc.uploadedById === user.id || isManager(projectRole(project, user));
}

// Echipa o administreaza adminul, liderul si profesorii implicati: membri ai echipei sau coordonatori
// ai unui proiect al ei. Aceiasi (plus membrii) au acces la conversatia echipei.
export function canManageTeam(team: Team, user: Person, projects: Pick<Project, "teamId" | "coordinatorId">[]) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const membership = team.members?.find(m => m.user?.id === user.id);
  if (membership?.role === "leader") return true;
  return user.role === "professor" && (!!membership || projects.some(p => p.teamId === team.id && p.coordinatorId === user.id));
}

export function canAccessTeam(team: Team, user: Person, projects: Pick<Project, "teamId" | "coordinatorId">[]) {
  return !!team.members?.some(m => m.user?.id === user?.id) || canManageTeam(team, user, projects);
}
