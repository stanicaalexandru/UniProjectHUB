"use client";
import { Meta } from "@/components/ui/Meta";
import { Check, Hourglass, Plus, Users, X } from "lucide-react";
import { useT } from "@/i18n";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import type { JoinRequest, Team, TeamMember } from "@/types";

const fullName = (u?: { firstName?: string; lastName?: string }) => `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim();

export function TeamCard({ team, isStaff, canManage, isMember, hasPendingRequest, pendingRequests, canAddMembers, onAddMember, onRemoveMember, onRespond, onRequestJoin }: {
  team: Team;
  isStaff: boolean;
  canManage: boolean;
  isMember: boolean;
  hasPendingRequest: boolean;
  pendingRequests: JoinRequest[];
  canAddMembers: boolean;
  onAddMember: () => void;
  onRemoveMember: (member: TeamMember) => void;
  onRespond: (request: JoinRequest, accept: boolean) => void;
  onRequestJoin: () => void;
}) {
  const { t } = useT();
  const memberCount = team.members?.length || 0;
  const isFull = memberCount >= team.maxMembers;

  return (
    <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        {memberCount > 0
          ? <AvatarStack people={team.members.map(m => m.user)} label={t("common.membersLabel")} />
          : <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0" aria-hidden="true"><Users className="w-5 h-5" /></span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold dark:text-slate-100">{team.name}</h2>
            {canManage && pendingRequests.length > 0 && (
              <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full" aria-label={t("teams.pendingCount", { count: pendingRequests.length })}>{pendingRequests.length}</span>
            )}
          </div>
          {team.description && <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{team.description}</p>}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400" aria-label={t("teams.capacity", { count: memberCount, max: team.maxMembers })}>{memberCount}/{team.maxMembers}</span>
      </div>

      {memberCount > 0 ? (
        <ul className="space-y-2 mb-3">
          {team.members.map(m => (
            <li key={m.id ?? m.user?.id} className="flex items-center gap-2">
              <Avatar user={m.user} size="xs" />
              <span className="text-xs flex-1 dark:text-slate-300">{fullName(m.user) || t("common.unknownUser")}</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{t(`teamRole.${m.role}`)}</span>
              {isStaff && canManage && m.role !== "leader" && (
                <button aria-label={t("teams.removeLabel", { name: fullName(m.user) })} title={t("teams.remove")} onClick={() => onRemoveMember(m)}
                  className="p-0.5 text-slate-500 hover:text-red-600 transition-colors dark:text-slate-400"><X className="w-3.5 h-3.5" aria-hidden="true" /></button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 text-center py-2 mb-3 dark:text-slate-400">{t("teams.noMembers")}</p>
      )}

      {isStaff && canManage && !isFull && canAddMembers && (
        <button onClick={onAddMember}
          className="w-full inline-flex items-center justify-center gap-1 text-xs py-1.5 border border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors mb-3">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />{t("teams.addMember")}
        </button>
      )}

      {canManage && pendingRequests.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mb-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t("teams.joinRequests")}</h3>
          <ul>
            {pendingRequests.map(req => {
              const name = fullName(req.user);
              return (
                <li key={req.id} className="flex items-center gap-2 mb-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900 rounded-lg p-2">
                  <Avatar user={req.user} size="xs" />
                  <span className="text-xs flex-1 dark:text-slate-300">{name}{req.message && <span className="block text-slate-500 dark:text-slate-400 italic">„{req.message}”</span>}</span>
                  <button aria-label={t("teams.acceptLabel", { name })} title={t("teams.accept")} onClick={() => onRespond(req, true)}
                    className="p-1 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"><Check className="w-3.5 h-3.5" aria-hidden="true" /></button>
                  <button aria-label={t("teams.rejectLabel", { name })} title={t("teams.reject")} onClick={() => onRespond(req, false)}
                    className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"><X className="w-3.5 h-3.5" aria-hidden="true" /></button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!isStaff && (
        <div className="mt-2 text-xs text-center">
          {isMember ? (
            <p className="text-green-700 dark:text-green-400 py-1"><Meta icon={Check}>{t("teams.youAreMember")}</Meta></p>
          ) : hasPendingRequest ? (
            <p className="text-amber-800 dark:text-amber-400 py-1 bg-amber-50 dark:bg-amber-950/50 rounded-lg"><Meta icon={Hourglass}>{t("teams.requestPending")}</Meta></p>
          ) : !isFull ? (
            <button onClick={onRequestJoin} className="btn-secondary w-full justify-center text-xs"><Plus className="w-3.5 h-3.5" aria-hidden="true" />{t("teams.requestJoin")}</button>
          ) : (
            <p className="text-slate-500 py-1 dark:text-slate-400">{t("teams.full")}</p>
          )}
        </div>
      )}
    </article>
  );
}
