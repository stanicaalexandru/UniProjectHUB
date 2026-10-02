import { Loader2, type LucideIcon } from "lucide-react";

// Stari comune ale paginilor: incarcare si lista goala

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-slate-500 dark:text-slate-400" role="status">
      <Spinner className="w-5 h-5" /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
      {Icon && <Icon className="w-8 h-8 mx-auto mb-3 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden="true" />}
      <div className="font-medium text-slate-700 dark:text-slate-300">{title}</div>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
