"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useT } from "@/i18n";

// Notificari scurte (toast) si ferestre de confirmare in stilul aplicatiei,
// in locul ferestrelor native alert()/confirm() ale browserului.

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };
type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };

const ToastContext = createContext<{ show: (kind: ToastKind, message: string) => void } | null>(null);
const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

const TOAST_STYLE: Record<ToastKind, { box: string; icon: React.ReactNode }> = {
  success: { box: "border-green-200 dark:border-green-900", icon: <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" aria-hidden="true" /> },
  error: { box: "border-red-200 dark:border-red-900", icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" /> },
  info: { box: "border-blue-200 dark:border-blue-900", icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" /> },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((item) => item.id !== id)), []);
  const show = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4500);
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => setConfirmState({ ...options, resolve })), []);

  const close = (value: boolean) => { confirmState?.resolve(value); setConfirmState(null); };

  return (
    <ToastContext.Provider value={{ show }}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        {/* aria-live: cititoarele de ecran anunta mesajele fara sa mute focusul */}
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))]" aria-live="polite" role="status">
          {toasts.map((toast) => (
            <div key={toast.id} className={`flex items-start gap-3 bg-white dark:bg-slate-900 border ${TOAST_STYLE[toast.kind].box} rounded-xl shadow-lg px-4 py-3`}>
              {TOAST_STYLE[toast.kind].icon}
              <p className="flex-1 text-sm text-slate-800 dark:text-slate-100">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} aria-label={t("common.closeNotification")} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        {confirmState && <ConfirmDialog {...confirmState} onClose={close} />}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

function ConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onClose }: ConfirmOptions & { onClose: (v: boolean) => void }) {
  const { t } = useT();
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal max-w-md" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={message ? "confirm-message" : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 id="confirm-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {message && <p id="confirm-message" className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" onClick={() => onClose(false)} className="btn-secondary">{cancelLabel ?? t("common.cancel")}</button>
          <button type="button" ref={confirmRef} onClick={() => onClose(true)}
            className={danger ? "inline-flex items-center px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg" : "btn-primary"}>
            {confirmLabel ?? t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast trebuie folosit in interiorul FeedbackProvider");
  return {
    success: (message: string) => ctx.show("success", message),
    error: (message: string) => ctx.show("error", message),
    info: (message: string) => ctx.show("info", message),
  };
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm trebuie folosit in interiorul FeedbackProvider");
  return ctx;
}
