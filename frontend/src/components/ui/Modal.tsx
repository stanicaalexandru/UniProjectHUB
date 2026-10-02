"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useT } from "@/i18n";

// Fereastra modala comuna: titlu legat prin aria-labelledby, inchidere cu Escape sau click pe fundal,
// focus mutat in fereastra la deschidere si readus la elementul anterior la inchidere
export function Modal({ title, subtitle, onClose, children, footer, size = "md" }: {
  title: React.ReactNode; subtitle?: React.ReactNode; onClose: () => void; children: React.ReactNode;
  footer?: React.ReactNode; size?: "md" | "lg" | "xl";
}) {
  const { t } = useT();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); previous?.focus?.(); };
  }, [onClose]);

  const width = size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} tabIndex={-1} className={`modal ${width} outline-none`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t("common.close")} className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
