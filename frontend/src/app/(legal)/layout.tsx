import { LegalHeader } from "./Localized";

// Paginile legale sunt publice (in afara grupului (dashboard)), ca sa poata fi citite inainte de inregistrare
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <LegalHeader />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="legal bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
          {children}
        </article>
      </main>
    </div>
  );
}
