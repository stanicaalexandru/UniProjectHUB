// Card cu titlu, folosit pentru sectiunile paginilor (setari, detalii)
export function Section({ title, aside, children, className = "", bodyClassName = "p-5 space-y-4", tone = "default" }: {
  title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; tone?: "default" | "danger";
}) {
  const border = tone === "danger" ? "border-red-300 dark:border-red-900" : "border-slate-200 dark:border-slate-800";
  const headBorder = tone === "danger" ? "border-red-200 dark:border-red-900" : "border-slate-100 dark:border-slate-800";
  const titleColor = tone === "danger" ? "text-red-700 dark:text-red-400" : "dark:text-slate-100";
  return (
    <section className={`bg-white dark:bg-slate-900 border ${border} rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className={`px-5 py-4 border-b ${headBorder} flex items-center justify-between gap-3`}>
        <h2 className={`text-sm font-semibold ${titleColor}`}>{title}</h2>
        {aside}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
