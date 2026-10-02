"use client";
import { useFormat } from "@/i18n";

// Momentul relativ ("acum 2 ore"), cu data si ora exacte la trecerea mouse-ului
export function RelativeTime({ value, className }: { value?: string | Date | null; className?: string }) {
  const format = useFormat();
  if (!value) return null;
  return <time dateTime={new Date(value).toISOString()} title={format.dateTime(value)} className={className}>{format.relative(value)}</time>;
}
