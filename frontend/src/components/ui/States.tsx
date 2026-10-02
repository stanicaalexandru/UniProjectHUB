import { Loader2 } from "lucide-react";

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

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
      {icon && <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>}
      <div className="font-medium text-slate-700 dark:text-slate-300">{title}</div>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
