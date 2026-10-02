"use client";
import { useEffect, useState } from "react";
import { useT } from "@/i18n";
import type { User, UserRole } from "@/types";

export type { UserRole };

export function useRole() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      const parsed: User = JSON.parse(u);
      setUser(parsed);
      setRole(parsed.role);
    }
  }, []);

  const isAdmin = role === "admin";
  const isProfessor = role === "professor";
  const isStudent = role === "student";
  const isStaff = isAdmin || isProfessor;

  const can = {
    createProject: isAdmin || isProfessor,
    deleteProject: isAdmin || isProfessor,
    editProject: isAdmin || isProfessor,
    approveProject: isAdmin || isProfessor,
    createEvaluation: isAdmin || isProfessor,
    completeEvaluation: isAdmin || isProfessor,
    viewAllProjects: isAdmin || isProfessor,
    manageUsers: isAdmin,
    viewUsers: isAdmin || isProfessor,
    createTeam: true,
    uploadDocument: true,
    createTask: true,
    createMilestone: isAdmin || isProfessor,
    viewReports: isAdmin || isProfessor,
    runAiAnalysis: true,
  };

  return { user, role, isAdmin, isProfessor, isStudent, isStaff, can };
}

export function RequireRole({ roles, children, fallback }: { roles: UserRole[], children: React.ReactNode, fallback?: React.ReactNode }) {
  const { role } = useRole();
  const { t } = useT();
  if (!role) return null;
  if (!roles.includes(role)) {
    return fallback ? <>{fallback}</> : (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm">
          <div className="text-5xl mb-4" aria-hidden="true">🔒</div>
          <div className="text-lg font-bold dark:text-slate-100 mb-2">{t("access.restrictedTitle")}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{t("access.restrictedText")}</div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t("access.currentRole")} <span className="font-semibold">{t(`roles.${role}`)}</span></div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
