// Taburi de filtrare; pe ecrane inguste se deruleaza orizontal in loc sa iasa din pagina

export function Tabs<T extends string>({ tabs, value, onChange, label, className = "mb-5" }: {
  tabs: { value: T; label: React.ReactNode; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto ${className}`}>
      {tabs.map(tab => (
        <button key={tab.value} role="tab" aria-selected={value === tab.value} onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${value === tab.value ? "border-blue-600 text-blue-700 dark:text-blue-400" : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"}`}>
          {tab.label}
          {tab.count ? <span className="ml-1.5 text-xs bg-amber-600 text-white px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
