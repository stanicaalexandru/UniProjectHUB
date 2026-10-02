"use client";
import { Check, X } from "lucide-react";
import { useT } from "@/i18n";
import type { ProjectStatus } from "@/types";

// Traseul obisnuit al unui proiect. Respins opreste traseul dupa propunere; arhivat inseamna traseu incheiat.
const FLOW: ProjectStatus[] = ["draft", "proposed", "approved", "in_progress", "review", "completed"];

export function ProjectStepper({ status }: { status: ProjectStatus }) {
  const { t } = useT();
  const rejected = status === "rejected";
  const steps: ProjectStatus[] = rejected ? ["draft", "proposed", "rejected"] : FLOW;
  const current = status === "archived" ? FLOW.length : steps.indexOf(status);

  return (
    <ol className="flex items-start" aria-label={t("projectDetail.stepsLabel")}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const failed = active && rejected;
        return (
          <li key={step} aria-current={active ? "step" : undefined}
            className={`flex-1 relative text-center text-xs ${active ? "font-semibold text-blue-700 dark:text-blue-300" : done ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
            {i > 0 && <span className={`absolute top-2.5 right-1/2 w-full h-0.5 ${done || active ? "bg-tone-green" : "bg-slate-200 dark:bg-slate-700"}`} aria-hidden="true" />}
            <span className={`relative z-10 mx-auto mb-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
              failed ? "bg-tone-rose text-white"
              : done ? "bg-tone-green text-white"
              : active ? "bg-white dark:bg-slate-900 border-4 border-blue-700 dark:border-blue-300"
              : "bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700"}`} aria-hidden="true">
              {failed ? <X className="w-3 h-3" strokeWidth={3} /> : done ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
            </span>
            <span className="block px-0.5 leading-tight">{t(`projectStatus.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
