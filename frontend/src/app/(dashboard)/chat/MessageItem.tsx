"use client";
import { useState } from "react";
import { Check, CornerUpLeft, Download, FileText, Pencil, Reply, SmilePlus, Trash2, X } from "lucide-react";
import { useT, useFormat, useUserName } from "@/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { splitMentions, type Attachment, type ChatMessage } from "./chatTypes";

const REACTION_EMOJIS = ["👍", "✅", "👀", "🎉", "❓"];
const iconButton = "p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors dark:text-slate-400";

export function MessageItem({ msg, isMe, currentUserId, memberNames, onReply, onEdit, onDelete, onReact, onDownload }: {
  msg: ChatMessage; isMe: boolean; currentUserId?: string; memberNames: string[];
  onReply: () => void; onEdit: (content: string) => Promise<boolean>; onDelete: () => void;
  onReact: (emoji: string) => void; onDownload: (att: Attachment) => void;
}) {
  const { t, locale } = useT();
  const format = useFormat();
  const displayName = useUserName();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactions = msg.reactions || {};

  const saveEdit = async () => {
    if (!editText.trim()) return;
    if (await onEdit(editText.trim())) setEditing(false);
  };
  const react = (emoji: string) => { setPickerOpen(false); onReact(emoji); };
  // Mesajele de azi arata doar ora; cele mai vechi si data
  const sent = new Date(msg.createdAt);
  const time = sent.toDateString() === new Date().toDateString()
    ? sent.toLocaleTimeString(locale === "ro" ? "ro-RO" : "en-GB", { hour: "2-digit", minute: "2-digit" })
    : format.dateTime(msg.createdAt);

  return (
    <li className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
      <Avatar user={msg.sender} />
      <div className={`max-w-[80%] sm:max-w-sm flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {!isMe && <span className="text-xs text-slate-500 mb-1 dark:text-slate-400">{displayName(msg.sender)}</span>}

        {msg.parent && (
          <div className={`flex items-start gap-1.5 mb-1 px-2.5 py-1.5 rounded-lg border-l-2 max-w-full ${isMe ? "bg-blue-50 dark:bg-blue-950/50 border-blue-400" : "bg-slate-100 dark:bg-slate-800/70 border-slate-400"}`}>
            <CornerUpLeft className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5 dark:text-slate-400" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate"><span className="sr-only">{t("chat.replyTo")} </span>{displayName(msg.parent.sender)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{msg.parent.isDeleted ? <em>{t("chat.deletedMessage")}</em> : msg.parent.content}</div>
            </div>
          </div>
        )}

        {editing ? (
          <div className="flex items-center gap-1.5 w-full">
            <input value={editText} onChange={e => setEditText(e.target.value)} autoFocus aria-label={t("chat.editLabel")}
              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }} className="input flex-1 text-sm py-1.5" />
            <button aria-label={t("common.save")} title={t("common.save")} onClick={saveEdit} className="p-1.5 text-green-700 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg transition-colors dark:text-green-400"><Check className="w-4 h-4" aria-hidden="true" /></button>
            <button aria-label={t("common.cancel")} title={t("common.cancel")} onClick={() => setEditing(false)} className={`${iconButton} p-1.5`}><X className="w-4 h-4" aria-hidden="true" /></button>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 relative ${isMe ? "flex-row-reverse" : ""}`}>
            {/* Actiunile apar la trecerea mouse-ului si la focus de la tastatura */}
            <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${isMe ? "flex-row-reverse" : ""}`}>
              <button onClick={onReply} className={`${iconButton} hover:text-green-700`} title={t("chat.reply")} aria-label={t("chat.reply")}><Reply className="w-3.5 h-3.5" aria-hidden="true" /></button>
              <button onClick={() => setPickerOpen(o => !o)} aria-expanded={pickerOpen} className={`${iconButton} hover:text-amber-700`} title={t("chat.react")} aria-label={t("chat.react")}><SmilePlus className="w-3.5 h-3.5" aria-hidden="true" /></button>
              {isMe && (
                <>
                  <button onClick={() => { setEditText(msg.content); setEditing(true); }} className={`${iconButton} hover:text-blue-700`} title={t("common.edit")} aria-label={t("chat.editMessage")}><Pencil className="w-3.5 h-3.5" aria-hidden="true" /></button>
                  <button onClick={onDelete} className={`${iconButton} hover:text-red-600`} title={t("common.delete")} aria-label={t("chat.deleteMessage")}><Trash2 className="w-3.5 h-3.5" aria-hidden="true" /></button>
                </>
              )}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              {msg.content && (
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${isMe ? "bg-blue-700 text-white" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"}`}>
                  {splitMentions(msg.content, memberNames).map((part, i) => typeof part === "string"
                    ? <span key={i}>{part}</span>
                    : <span key={i} className={`font-semibold ${isMe ? "text-blue-100 underline" : "text-blue-700 dark:text-blue-400"}`}>{part.mention}</span>)}
                </div>
              )}
              {(msg.attachments || []).map((att, i) => (
                <button key={i} onClick={() => onDownload(att)} aria-label={t("documents.downloadLabel", { name: att.originalName })}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-colors max-w-64 ${isMe ? "bg-blue-700 border-blue-600 hover:bg-blue-800 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-700 dark:text-slate-200"}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isMe ? "bg-blue-500/50" : "bg-slate-100 dark:bg-slate-700"}`} aria-hidden="true">
                    {att.mimeType?.startsWith("image/") ? <span className="text-base">🖼️</span> : <FileText className="w-4 h-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium truncate">{att.originalName}</span>
                    <span className={`block text-xs ${isMe ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>{format.fileSize(att.size)}</span>
                  </span>
                  <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-70" aria-hidden="true" />
                </button>
              ))}
            </div>
            {pickerOpen && (
              <div role="group" aria-label={t("chat.react")} className={`absolute top-full mt-1 flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg px-1.5 py-1 z-50 ${isMe ? "right-0" : "left-0"}`}>
                {REACTION_EMOJIS.map(emoji => (
                  <button key={emoji} aria-label={t("chat.reactWith", { emoji })} onClick={() => react(emoji)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-base">{emoji}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {Object.keys(reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, userIds]) => {
              const reacted = !!currentUserId && userIds.includes(currentUserId);
              return (
                <button key={emoji} onClick={() => onReact(emoji)} aria-pressed={reacted}
                  aria-label={t(reacted ? "chat.removeReaction" : "chat.addReaction", { emoji, count: userIds.length })}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${reacted ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}>
                  <span aria-hidden="true">{emoji}</span><span className="font-medium" aria-hidden="true">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
        <span className="text-xs text-slate-500 mt-1 dark:text-slate-400">{time}{msg.isEdited && <span className="ml-1 italic">({t("chat.edited")})</span>}</span>
      </div>
    </li>
  );
}
