import type { LucideIcon } from "lucide-react";

// Informatie scurta cu iconita in fata (coordonator, termen, echipa), folosita in liste si carduri
export function Meta({ icon: Icon, children, className = "" }: { icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}
