// Comutator pornit/oprit, anuntat corect de cititoarele de ecran (role="switch")
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 text-left disabled:opacity-60">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <span className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`} aria-hidden="true">
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
