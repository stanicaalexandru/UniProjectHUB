"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useT, useFormat, useUserName } from "@/i18n";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

export type Comment = { id: string; content: string; authorId?: string; author?: User | null; createdAt: string };

// Comentariile proiectului; echipa si coordonatorul sunt notificati de server la fiecare comentariu nou
export function CommentsTab({ projectId, user, comments, onAdded, onError }: {
  projectId: string; user: User | null; comments: Comment[]; onAdded: (c: Comment) => void; onError: (e: unknown) => void;
}) {
  const { t } = useT();
  const format = useFormat();
  const displayName = useUserName();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Lista porneste de la cel mai recent comentariu
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [comments.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      onAdded(await apiFetch(`/projects/${projectId}/comments`, { method: "POST", body: JSON.stringify({ content: text.trim() }) }));
      setText("");
    } catch (e) { onError(e); }
    finally { setSending(false); }
  };

  return (
    <div className="card">
      <div ref={listRef} className="p-4 space-y-4 max-h-96 overflow-y-auto" aria-live="polite">
        {comments.length === 0 ? (
          <p className="text-center py-10 text-slate-500 text-sm dark:text-slate-400"><span className="block text-4xl mb-3" aria-hidden="true">💬</span>{t("projectDetail.noComments")}</p>
        ) : comments.map(c => {
          const isMe = c.author?.id === user?.id || c.authorId === user?.id;
          return (
            <div key={c.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
              <Avatar user={c.author} />
              <div className={`max-w-[80%] sm:max-w-sm flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold dark:text-slate-300">{displayName(c.author)}</span>
                  {c.author?.role && <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded dark:text-slate-400">{t(`roles.${c.author.role}`)}</span>}
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isMe ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}>{c.content}</div>
                <span className="text-xs text-slate-500 mt-1 dark:text-slate-400">{format.dateTime(c.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 p-4">
        <div className="flex gap-3 items-end">
          <Avatar user={user} className="hidden sm:flex" />
          <textarea value={text} onChange={e => setText(e.target.value)} rows={2} aria-label={t("projectDetail.commentLabel")}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={t("projectDetail.commentPlaceholder")} className="input resize-none min-h-10 max-h-32 flex-1" />
          <button aria-label={t("projectDetail.sendComment")} title={t("projectDetail.sendComment")} onClick={send} disabled={!text.trim() || sending} className="btn-primary p-2.5 flex-shrink-0 disabled:opacity-50">
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 sm:ml-11 dark:text-slate-400">{t("projectDetail.commentsVisible")}</p>
      </div>
    </div>
  );
}
