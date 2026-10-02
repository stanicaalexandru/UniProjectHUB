"use client";
import { useRef, useState } from "react";
import { CornerUpLeft, FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage, useFormat, useUserName } from "@/i18n";
import { useToast } from "@/components/ui/Feedback";
import { Avatar } from "@/components/ui/Avatar";
import { MENTION_TRIGGER, type Attachment, type ChatMessage } from "./chatTypes";
import type { User } from "@/types";

const MAX_FILE = 10 * 1024 * 1024;

// Campul de scriere: raspuns la un mesaj, atasament, mentiuni cu @ si trimitere cu Enter
export function MessageComposer({ roomId, members, replyTo, onCancelReply, onSent, inputRef }: {
  roomId: string; members: User[]; replyTo: ChatMessage | null; onCancelReply: () => void; onSent: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const format = useFormat();
  const displayName = useUserName();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const candidates = mentionQuery === null ? [] : members
    .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5);

  const handleChange = (value: string) => {
    setInput(value);
    const match = value.match(MENTION_TRIGGER);
    setMentionQuery(match ? match[1] : null);
    setMentionIndex(0);
  };

  const insertMention = (u: User) => {
    setInput(input.replace(MENTION_TRIGGER, `@${u.firstName} ${u.lastName} `));
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  // Membrii conversatiei si cei mentionati (@Prenume Nume) sunt notificati de server
  const send = async () => {
    const content = input.trim();
    if (!content && !attachment) return;
    const body = { content, parentId: replyTo?.id, attachments: attachment ? [attachment] : undefined };
    const previous = { input, attachment };
    setInput(""); setAttachment(null); setMentionQuery(null); onCancelReply();
    try {
      await apiFetch(`/chat/rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify(body) });
      onSent();
    } catch (e) {
      // Mesajul nu a plecat: il punem inapoi in camp, ca sa nu se piarda
      setInput(previous.input); setAttachment(previous.attachment);
      toast.error(errorMessage(e));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (candidates.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => (i + 1) % candidates.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => (i - 1 + candidates.length) % candidates.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(candidates[mentionIndex]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Fisierul se incarca imediat; detaliile lui se trimit odata cu mesajul
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > MAX_FILE) { toast.error(t("chat.fileTooLarge")); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      setAttachment(await apiFetch("/chat/upload", { method: "POST", body: fd }));
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setUploading(false); }
  };

  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-l-2 border-blue-500 rounded-lg">
          <CornerUpLeft className="w-4 h-4 text-blue-700 flex-shrink-0 dark:text-blue-400" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("chat.replyingTo", { name: displayName(replyTo.sender) })}</div>
            <div className="text-xs text-slate-500 truncate dark:text-slate-400">{replyTo.content}</div>
          </div>
          <button onClick={onCancelReply} className="p-1 text-slate-500 hover:text-slate-700 rounded transition-colors flex-shrink-0 dark:text-slate-400" title={t("chat.cancelReply")} aria-label={t("chat.cancelReply")}><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}
      {attachment && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <FileText className="w-4 h-4 text-blue-700 flex-shrink-0 dark:text-blue-400" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">{attachment.originalName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{format.fileSize(attachment.size)}</div>
          </div>
          <button onClick={() => setAttachment(null)} className="p-1 text-slate-500 hover:text-slate-700 rounded transition-colors flex-shrink-0 dark:text-slate-400" title={t("chat.removeFile")} aria-label={t("chat.removeFile")}><X className="w-4 h-4" aria-hidden="true" /></button>
        </div>
      )}
      <div className="flex gap-2 relative">
        {candidates.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50" role="listbox" id="mention-list" aria-label={t("chat.mentionTitle")}>
            <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700 dark:text-slate-400" aria-hidden="true">{t("chat.mentionTitle")}</div>
            {candidates.map((u, i) => (
              <button key={u.id} id={`mention-${i}`} role="option" aria-selected={i === mentionIndex} onClick={() => insertMention(u)} onMouseEnter={() => setMentionIndex(i)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${i === mentionIndex ? "bg-blue-50 dark:bg-blue-950" : "hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                <Avatar user={u} size="sm" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium dark:text-slate-200 truncate">{u.firstName} {u.lastName}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`roles.${u.role}`)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <input ref={fileInputRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary p-2.5 aspect-square disabled:opacity-50" title={t("chat.attach")} aria-label={t("chat.attach")}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Paperclip className="w-4 h-4" aria-hidden="true" />}
        </button>
        <input ref={inputRef} value={input} onChange={e => handleChange(e.target.value)} onKeyDown={onKeyDown} className="input flex-1 min-w-0"
          placeholder={t("chat.placeholder")} aria-label={t("chat.messageLabel")}
          role="combobox" aria-expanded={candidates.length > 0} aria-controls="mention-list" aria-autocomplete="list"
          aria-activedescendant={candidates.length > 0 ? `mention-${mentionIndex}` : undefined} />
        <button aria-label={t("chat.send")} title={t("chat.send")} onClick={send} disabled={!input.trim() && !attachment} className="btn-primary p-2.5 aspect-square disabled:opacity-50">
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
