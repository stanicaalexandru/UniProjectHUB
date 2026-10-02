// Semnul aplicatiei: trei bare decalate, ca intr-o diagrama Gantt. Aceeasi forma e desenata si in
// favicon (app/icon.svg) si pe coperta rapoartelor PDF (reports/reportPdf.ts).
export const LOGO_BARS = [
  { x: 7, y: 9, w: 11 },
  { x: 11, y: 14, w: 14 },
  { x: 16, y: 19, w: 9 },
] as const;

export function LogoMark({ size = 32, light = false, className = "" }: { size?: number; light?: boolean; className?: string }) {
  const bg = light ? "#ffffff" : "#1e3a5f";
  const bar = light ? "#1e3a5f" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`flex-shrink-0 ${className}`} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={bg} />
      {LOGO_BARS.map(b => <rect key={b.y} x={b.x} y={b.y} width={b.w} height="4" rx="2" fill={bar} />)}
    </svg>
  );
}
