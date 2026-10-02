import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const STYLES = {
  error: { box: "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300", Icon: AlertTriangle, role: "alert" },
  success: { box: "bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300", Icon: CheckCircle2, role: "status" },
  info: { box: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300", Icon: Info, role: "status" },
} as const;

// Mesaj in pagina (eroare, succes, informatie); anuntat de cititoarele de ecran
export function Alert({ kind = "error", children, className = "", onDismiss, dismissLabel }: {
  kind?: keyof typeof STYLES; children: React.ReactNode; className?: string; onDismiss?: () => void; dismissLabel?: string;
}) {
  const { box, Icon, role } = STYLES[kind];
  return (
    <div role={role} className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 text-sm ${box} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
      {onDismiss && <button type="button" onClick={onDismiss} className="text-xs underline flex-shrink-0">{dismissLabel ?? "OK"}</button>}
    </div>
  );
}
