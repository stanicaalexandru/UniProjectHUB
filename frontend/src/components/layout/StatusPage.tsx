import { LogoMark } from "@/components/ui/Logo";

// Pagina afisata cand nu se poate arata continutul cerut (404, eroare neasteptata)
export function StatusPage({ code, title, text, children }: { code?: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <LogoMark size={48} className="mx-auto mb-8" />
        {code && <p className="text-sm font-semibold tracking-widest text-tone-amber mb-2" aria-hidden="true">{code}</p>}
        <h1 className="text-3xl font-bold text-blue-700 dark:text-slate-100 mb-3">{title}</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">{text}</p>
        <div className="flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </main>
  );
}
