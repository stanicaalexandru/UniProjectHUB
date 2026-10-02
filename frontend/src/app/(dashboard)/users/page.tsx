"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { RequireRole } from "@/hooks/useRole";
import { useT, useErrorMessage, useFormat } from "@/i18n";
import { ROLE_BADGE, USER_STATUS_BADGE } from "@/lib/constants";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Feedback";
import type { User, UserRole } from "@/types";

type Tab = "all" | "pending" | "students" | "professors" | "admins";
const TAB_ROLE: Partial<Record<Tab, UserRole>> = { students: "student", professors: "professor", admins: "admin" };

function UsersContent() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const format = useFormat();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    try { setUsers((await apiFetchAll<User>("/users")).data); }
    catch (e) { setError(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Aprobarea sau respingerea unui cont de profesor
  const setStatus = async (u: User, status: "active" | "inactive") => {
    setBusyId(u.id); setError(null);
    try {
      await apiFetch(`/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setUsers(list => list.map(x => x.id === u.id ? { ...x, status } : x));
      const name = `${u.firstName} ${u.lastName}`;
      toast.success(status === "active" ? t("users.approved", { name }) : t("users.rejected", { name }));
    } catch (e) { setError(e); }
    setBusyId(null);
  };

  const pendingCount = users.filter(u => u.status === "pending_approval").length;
  const query = search.toLowerCase();
  const filtered = users
    .filter(u => tab === "all" || (tab === "pending" ? u.status === "pending_approval" : u.role === TAB_ROLE[tab]))
    .filter(u => !query || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query));

  const columns = [t("users.colUser"), t("users.colRole"), t("users.colFaculty"), t("users.colStatus"), t("users.colRegistered")];

  return (
    <Page>
      <PageHeader title={t("users.title")}>
        <input value={search} onChange={e => setSearch(e.target.value)} className="input w-48" placeholder={t("users.searchPlaceholder")} aria-label={t("users.searchLabel")} />
      </PageHeader>
      <PageBody>
        {error ? <Alert className="mb-4">{errorMessage(error)}</Alert> : null}
        <Tabs label={t("users.tabsLabel")} value={tab} onChange={setTab} tabs={[
          { value: "all", label: t("users.tabAll") },
          { value: "pending", label: t("users.tabPending"), count: pendingCount },
          { value: "students", label: t("users.tabStudents") },
          { value: "professors", label: t("users.tabProfessors") },
          { value: "admins", label: t("users.tabAdmins") },
        ]} />
        <div className="card overflow-x-auto">
          {loading ? <LoadingState label={t("common.loading")} /> : (
            <table className="w-full min-w-[720px]">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                {columns.map(h => <th key={h} scope="col" className="text-left px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{h}</th>)}
                <th scope="col"><span className="sr-only">{t("users.colActions")}</span></th>
              </tr></thead>
              <tbody>
                {filtered.map(u => {
                  const name = `${u.firstName} ${u.lastName}`;
                  return (
                    <tr key={u.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-3">
                        <Avatar user={u} />
                        <div><div className="text-sm font-medium dark:text-slate-200">{name}</div><div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div></div>
                      </div></td>
                      <td className="px-4 py-3"><Badge color={ROLE_BADGE[u.role]}>{t(`roles.${u.role}`)}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{u.faculty || t("common.none")}</td>
                      <td className="px-4 py-3"><Badge color={USER_STATUS_BADGE[u.status] ?? USER_STATUS_BADGE.inactive}>{t(`userStatus.${u.status}`)}</Badge></td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{format.date(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {u.status === "pending_approval" && (
                          <div className="inline-flex gap-2">
                            <button onClick={() => setStatus(u, "active")} disabled={busyId === u.id} className="btn-primary text-xs px-3 py-1.5" aria-label={t("users.approveLabel", { name })}>{t("users.approve")}</button>
                            <button onClick={() => setStatus(u, "inactive")} disabled={busyId === u.id} className="btn-danger text-xs px-3 py-1.5" aria-label={t("users.rejectLabel", { name })}>{t("users.reject")}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">{tab === "pending" ? t("users.noPending") : t("users.noUsers")}</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </PageBody>
    </Page>
  );
}

export default function UsersPage() {
  return <RequireRole roles={["admin"]}><UsersContent /></RequireRole>;
}
