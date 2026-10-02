import type { Project, User } from "@/types";

// Userii implicati intr-un proiect: autorul, coordonatorul si membrii echipei (fara duplicate)
export function projectMembers(p?: Project | null): User[] {
  if (!p) return [];
  const byId = new Map<string, User>();
  for (const u of [p.createdBy, p.coordinator, ...(p.team?.members?.map(m => m.user) ?? [])]) {
    if (u?.id && !byId.has(u.id)) byId.set(u.id, u);
  }
  return [...byId.values()];
}

export function isProjectMember(p: Project, userId?: string): boolean {
  if (!userId) return false;
  return p.createdById === userId || p.coordinatorId === userId || !!p.team?.members?.some(m => m.user?.id === userId);
}

// Studentii vad in liste doar proiectele lor; profesorii si administratorii primesc deja de la server doar ce au voie sa vada
export function visibleProjects(list: Project[], user?: Pick<User, "id" | "role"> | null): Project[] {
  return user?.role === "student" ? list.filter(p => isProjectMember(p, user.id)) : list;
}

export function storedUser(): User | null {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}
