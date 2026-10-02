"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Folder, MessagesSquare, Users, Video, type LucideIcon } from "lucide-react";
import { apiFetch, apiFetchAll, downloadFile, startVideoCall } from "@/lib/api";
import { projectMembers, visibleProjects } from "@/lib/projects";
import { canAccessTeam } from "@/lib/permissions";
import { useToast, useConfirm } from "@/components/ui/Feedback";
import { useRole } from "@/hooks/useRole";
import { useT, useErrorMessage } from "@/i18n";
import { MessageItem } from "./MessageItem";
import { MessageComposer } from "./MessageComposer";
import type { ActiveRoom, Attachment, ChatMessage, RoomType } from "./chatTypes";
import type { Project, Team, User } from "@/types";
import { BackButton } from "@/components/ui/BackButton";

const POLL_MS = 3000;
const listOf = <T,>(r: PromiseSettledResult<unknown>): T[] | null =>
  r.status !== "fulfilled" ? null : Array.isArray(r.value) ? r.value : ((r.value as { data?: T[] })?.data ?? []);

function RoomButton({ active, icon: Icon, label, count, onClick }: { active: boolean; icon: LucideIcon; label: string; count?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-current={active ? "true" : undefined}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left mb-0.5 ${active ? "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-500 dark:text-slate-400">{count}</span>}
    </button>
  );
}

export default function ChatPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useRole();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [room, setRoom] = useState<ActiveRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageId = useRef<string | undefined>(undefined);

  // Echipele si proiectele (pentru lista de conversatii si membrii fiecareia)
  const loadMembership = useCallback(async () => {
    const [teamsRes, projectsRes] = await Promise.allSettled([apiFetch("/teams"), apiFetchAll("/projects")]);
    const teamList = listOf<Team>(teamsRes);
    const projectList = listOf<Project>(projectsRes);
    if (teamList) setTeams(teamList);
    if (projectList) setProjects(visibleProjects(projectList, JSON.parse(localStorage.getItem("user") || "null")));
  }, []);

  useEffect(() => { loadMembership().finally(() => setLoading(false)); }, [loadMembership]);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const data = await apiFetch(`/chat/rooms/${roomId}/messages?limit=50`);
      setMessages(Array.isArray(data) ? [...data].reverse() : []);
    } catch {}
  }, []);

  // Mesajele se reincarca periodic cat timp conversatia e deschisa
  const roomId = room?.id;
  useEffect(() => {
    if (!roomId) return;
    lastMessageId.current = undefined;
    loadMessages(roomId);
    loadMembership();
    const timer = setInterval(() => loadMessages(roomId), POLL_MS);
    return () => clearInterval(timer);
  }, [roomId, loadMessages, loadMembership]);

  // Derulare la ultimul mesaj doar cand apare un mesaj nou, nu la fiecare reincarcare
  useEffect(() => {
    const last = messages[messages.length - 1]?.id;
    if (last && last !== lastMessageId.current) {
      lastMessageId.current = last;
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const openRoom = async (entityId: string, type: RoomType, name: string, memberIds: string[] = []) => {
    try {
      const created = await apiFetch("/chat/rooms", { method: "POST", body: JSON.stringify({ entityId, type, memberIds }) });
      setReplyTo(null);
      setRoom({ id: created.id, name, entityId, type });
    } catch (e) { toast.error(errorMessage(e)); }
  };

  // Membrii conversatiei (fara userul curent), luati din echipa sau proiect
  const members: User[] = (() => {
    if (!room) return [];
    const list = room.type === "team"
      ? [...(teams.find(team => team.id === room.entityId)?.members ?? []).map(m => m.user),
         ...projects.filter(p => p.teamId === room.entityId).map(p => p.coordinator)]
      : projectMembers(projects.find(p => p.id === room.entityId));
    // Fara duplicate si fara userul curent
    const byId = new Map(list.filter((u): u is User => !!u?.id && u.id !== user?.id).map(u => [u.id, u]));
    return [...byId.values()];
  })();
  const memberNames = [...members, ...(user ? [user] : [])].map(u => `${u.firstName} ${u.lastName}`);

  const run = async (action: () => Promise<unknown>) => {
    try { await action(); if (room) await loadMessages(room.id); return true; }
    catch (e) { toast.error(errorMessage(e)); return false; }
  };
  const editMessage = (id: string, content: string) => run(() => apiFetch(`/chat/messages/${id}`, { method: "PATCH", body: JSON.stringify({ content }) }));
  const reactTo = (id: string, emoji: string) => run(() => apiFetch(`/chat/messages/${id}/reactions`, { method: "POST", body: JSON.stringify({ emoji }) }));
  const deleteMessage = async (id: string) => {
    if (!(await confirm({ title: t("chat.deleteTitle"), message: t("chat.deleteText"), confirmLabel: t("common.delete"), danger: true }))) return;
    await run(() => apiFetch(`/chat/messages/${id}`, { method: "DELETE" }));
  };
  const download = (att: Attachment) => downloadFile(`/chat/attachments/${att.filename}`, att.originalName || att.filename).catch(e => toast.error(errorMessage(e)));

  // Conversatiile echipelor: doar ale celor din care faci parte sau ale caror proiecte le coordonezi
  const myTeams = teams.filter(team => canAccessTeam(team, user, projects));

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Lista de conversatii; pe telefon se afiseaza fie lista, fie conversatia deschisa */}
      <nav aria-label={t("chat.roomsLabel")} className={`${room ? "hidden md:flex" : "flex"} w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start gap-2">
          <BackButton />
          <div>
            <h1 className="text-sm font-bold dark:text-slate-100">{t("nav.chat")}</h1>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{t("chat.subtitle")}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {myTeams.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide px-2 mb-1 dark:text-slate-400">{t("teams.title")}</h2>
              {myTeams.map(team => {
                const memberIds = team.members?.map(m => m.user?.id).filter((id): id is string => !!id) ?? [];
                return <RoomButton key={team.id} active={room?.entityId === team.id} icon={Users} label={team.name} count={memberIds.length}
                  onClick={() => openRoom(team.id, "team", team.name, memberIds)} />;
              })}
            </div>
          )}
          {projects.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide px-2 mb-1 dark:text-slate-400">{t("projects.title")}</h2>
              {projects.map(p => <RoomButton key={p.id} active={room?.entityId === p.id} icon={Folder} label={p.title} onClick={() => openRoom(p.id, "project", p.title)} />)}
            </div>
          )}
          {!loading && myTeams.length === 0 && projects.length === 0 && (
            <p className="text-center py-8 text-slate-500 text-xs dark:text-slate-400">{t("chat.noRooms")}</p>
          )}
        </div>
      </nav>

      <section className={`${room ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden min-w-0`} aria-label={room ? room.name : undefined}>
        {!room ? (
          <div className="flex-1 flex items-center justify-center p-4 text-center">
            <div>
              <MessagesSquare className="w-10 h-10 mx-auto mb-4 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden="true" />
              <div className="text-slate-700 dark:text-slate-300 font-semibold mb-2">{t("chat.pickRoom")}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{t("chat.pickRoomHint")}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-3 sm:px-4 gap-3 flex-shrink-0">
              <button onClick={() => setRoom(null)} className="md:hidden p-1 text-slate-600 dark:text-slate-400" aria-label={t("chat.backToRooms")}><ArrowLeft className="w-5 h-5" aria-hidden="true" /></button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold dark:text-slate-100 truncate">{room.name}</h2>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t("common.members", { count: members.length + 1 })}
                  <span className="ml-2 text-green-700 dark:text-green-400"><span aria-hidden="true">● </span>{t("chat.live")}</span>
                </div>
              </div>
              <button type="button" onClick={() => startVideoCall(room.id).catch(e => toast.error(errorMessage(e)))} className="btn-secondary text-xs" title={t("chat.videoHint")}>
                <Video className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">{t("projectDetail.videoCall")}</span>
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm dark:text-slate-400">{t("chat.noMessages")}</div>
              ) : (
                <ol className="space-y-3" aria-live="polite" aria-relevant="additions">
                  {messages.map(msg => (
                    <MessageItem key={msg.id} msg={msg} currentUserId={user?.id} memberNames={memberNames}
                      isMe={msg.sender?.id === user?.id || msg.senderId === user?.id}
                      onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                      onEdit={content => editMessage(msg.id, content)}
                      onDelete={() => deleteMessage(msg.id)}
                      onReact={emoji => reactTo(msg.id, emoji)}
                      onDownload={download} />
                  ))}
                </ol>
              )}
            </div>

            <MessageComposer roomId={room.id} members={members} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSent={() => loadMessages(room.id)} inputRef={inputRef} />
          </>
        )}
      </section>
    </div>
  );
}
