// Eticheta colorata pentru statusuri, roluri, prioritati (culorile vin din lib/constants)
export function Badge({ color, children, className = "" }: { color?: string; children: React.ReactNode; className?: string }) {
  return <span className={`badge ${color ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"} ${className}`}>{children}</span>;
}
