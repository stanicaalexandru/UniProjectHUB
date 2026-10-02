"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { useConfirm } from "@/components/ui/Feedback";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage } from "@/i18n";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { TeamCard } from "./TeamCard";
import { AddMemberModal, CreateTeamModal, JoinRequestModal } from "./TeamModals";
import { canManageTeam } from "@/lib/permissions";
import type { JoinRequest, Project, Team, TeamMember, User } from "@/types";

type Dialog = { kind: "create" } | { kind: "addMember"; team: Team } | { kind: "request"; team: Team } | null;
const asList = <T,>(d: unknown): T[] => (Array.isArray(d) ? d : []);

export default function TeamsPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const confirm = useConfirm();
  const { isStaff, role, user } = useRole();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [joinRequests, setJoinRequests] = useState<Record<string, JoinRequest[]>>({});
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const load = useCallback(async () => {
    if (!role) return; // rolul se citeste din localStorage dupa montare
    setLoading(true);
    try {
      const [data, projectList] = await Promise.all([apiFetch("/teams"), apiFetchAll<Project>("/projects").then(r => r.data).catch(() => [] as Project[])]);
      const list: Team[] = Array.isArray(data) ? data : data.data || [];
      setTeams(list);
      setProjects(projectList);
      // Echipa o administreaza liderul, adminul si profesorii implicati in ea (aceeasi regula ca pe server)
      const managed = list.filter(team => canManageTeam(team, user, projectList));
      const [requests, users, mine] = await Promise.all([
        Promise.all(managed.map(team => apiFetch(`/teams/${team.id}/join-requests`).then(asList<JoinRequest>).catch(() => []))),
        isStaff ? apiFetchAll<User>("/users").then(({ data }) => data).catch(() => [] as User[]) : Promise.resolve([] as User[]),
        isStaff ? Promise.resolve([] as JoinRequest[]) : apiFetch("/teams/my-requests").then(asList<JoinRequest>).catch(() => []),
      ]);
      setJoinRequests(Object.fromEntries(managed.map((team, i) => [team.id, requests[i]])));
      setStudents(users.filter(u => u.role === "student"));
      setMyRequests(mine);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [role, isStaff, user]);

  useEffect(() => { load(); }, [load]);

  const closeAndReload = () => { setDialog(null); load(); };

  const removeMember = async (team: Team, member: TeamMember) => {
    const name = `${member.user?.firstName ?? ""} ${member.user?.lastName ?? ""}`.trim();
    if (!(await confirm({ title: t("teams.removeTitle", { name }), message: t("teams.removeMessage"), confirmLabel: t("teams.remove"), danger: true }))) return;
    try {
      await apiFetch(`/teams/${team.id}/members/${member.user?.id}`, { method: "DELETE" });
      await load();
    } catch (e) { setError(e); }
  };

  // Studentul e notificat de server despre raspuns
  const respondToRequest = async (request: JoinRequest, accept: boolean) => {
    try {
      await apiFetch(`/teams/join-requests/${request.id}`, { method: "PATCH", body: JSON.stringify({ accept }) });
      await load();
    } catch (e) { setError(e); }
  };

  const availableStudents = (team: Team) => {
    const memberIds = new Set(team.members?.map(m => m.user?.id));
    return students.filter(s => !memberIds.has(s.id));
  };
  const totalPending = Object.values(joinRequests).reduce((sum, reqs) => sum + reqs.length, 0);

  return (
    <Page>
      <PageHeader title={<>
        {t("teams.title")}
        {totalPending > 0 && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">{t("teams.requestsBadge", { count: totalPending })}</span>}
      </>}>
        <button onClick={load} className="btn-secondary text-xs"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />{t("common.refresh")}</button>
        {isStaff && <button onClick={() => setDialog({ kind: "create" })} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("teams.newTeam")}</button>}
      </PageHeader>

      <PageBody>
        {error ? <Alert className="mb-4" onDismiss={() => setError(null)} dismissLabel={t("common.close")}>{errorMessage(error)}</Alert> : null}
        {role && !isStaff && <Alert kind="info" className="mb-4">{t("teams.studentHint")}</Alert>}

        {loading ? <LoadingState label={t("common.loading")} /> : teams.length === 0 ? (
          <EmptyState icon="👥" title={isStaff ? t("teams.noneStaff") : t("teams.noneStudent")}
            action={isStaff ? <button onClick={() => setDialog({ kind: "create" })} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" />{t("teams.createFirst")}</button> : undefined} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {teams.map(team => (
              <TeamCard key={team.id} team={team} isStaff={isStaff} canManage={canManageTeam(team, user, projects)}
                isMember={!!team.members?.some(m => m.user?.id === user?.id)}
                hasPendingRequest={myRequests.some(r => r.teamId === team.id && r.status === "pending")}
                pendingRequests={joinRequests[team.id] || []}
                canAddMembers={availableStudents(team).length > 0}
                onAddMember={() => setDialog({ kind: "addMember", team })}
                onRemoveMember={m => removeMember(team, m)}
                onRespond={respondToRequest}
                onRequestJoin={() => setDialog({ kind: "request", team })} />
            ))}
          </div>
        )}
      </PageBody>

      {dialog?.kind === "create" && isStaff && <CreateTeamModal onClose={() => setDialog(null)} onDone={closeAndReload} />}
      {dialog?.kind === "addMember" && isStaff && <AddMemberModal team={dialog.team} students={availableStudents(dialog.team)} onClose={() => setDialog(null)} onDone={closeAndReload} />}
      {dialog?.kind === "request" && <JoinRequestModal team={dialog.team} onClose={() => setDialog(null)} onDone={closeAndReload} />}
    </Page>
  );
}
