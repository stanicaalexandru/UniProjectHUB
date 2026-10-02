import { BackButton } from "@/components/ui/BackButton";

// Structura comuna a paginilor din aplicatie: antet cu sageata inapoi, titlu si actiuni, apoi continutul care se deruleaza

export function PageHeader({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="page-header">
      <BackButton />
      <h1 className="text-base font-semibold flex-1 min-w-0 truncate -ml-2 dark:text-slate-100">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function PageBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 ${className}`}>{children}</div>;
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col overflow-hidden">{children}</div>;
}
