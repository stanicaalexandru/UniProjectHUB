import type { User } from "@/types";

export type Attachment = { filename: string; originalName: string; mimeType?: string; size: number };
export type ChatMessage = {
  id: string;
  content: string;
  senderId?: string;
  sender?: User | null;
  parent?: ChatMessage | null;
  attachments?: Attachment[];
  reactions?: Record<string, string[]>;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: string;
};
export type RoomType = "team" | "project";
export type ActiveRoom = { id: string; name: string; entityId: string; type: RoomType };

// Textul de dupa ultimul "@" (litere, inclusiv cu diacritice), pentru lista de mentiuni
export const MENTION_TRIGGER = /@([\p{L}\p{N}_]*)$/u;

// Imparte textul in bucati simple si mentiuni (@Prenume Nume) ale membrilor cunoscuti
export function splitMentions(text: string, names: string[]): (string | { mention: string })[] {
  const sorted = [...names].sort((a, b) => b.length - a.length); // numele lungi primele (ex. "Ion Pop" inainte de "Ion")
  const parts: (string | { mention: string })[] = [];
  let rest = text;
  while (rest.length > 0) {
    let best: { idx: number; name: string } | null = null;
    for (const name of sorted) {
      const idx = rest.indexOf(`@${name}`);
      if (idx !== -1 && (!best || idx < best.idx)) best = { idx, name };
    }
    if (!best) { parts.push(rest); break; }
    if (best.idx > 0) parts.push(rest.slice(0, best.idx));
    parts.push({ mention: `@${best.name}` });
    rest = rest.slice(best.idx + best.name.length + 1);
  }
  return parts;
}
