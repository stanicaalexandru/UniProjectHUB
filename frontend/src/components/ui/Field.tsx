"use client";
import { useId } from "react";

// Campuri de formular cu eticheta legata corect de camp (htmlFor/id), ca cititoarele de ecran sa anunte eticheta

// wrapperClassName stilizeaza containerul; className ajunge pe campul propriu-zis
type Common = { label: string; hint?: string; wrapperClassName?: string };

export function TextField({ label, hint, wrapperClassName = "", className = "", ...props }: Common & React.ComponentProps<"input">) {
  const id = useId();
  return (
    <div className={wrapperClassName}>
      <label htmlFor={id} className="label">{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} className={`input ${className}`} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ label, hint, wrapperClassName = "", className = "", ...props }: Common & React.ComponentProps<"textarea">) {
  const id = useId();
  return (
    <div className={wrapperClassName}>
      <label htmlFor={id} className="label">{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      <textarea id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} className={`input resize-none ${className}`} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, hint, wrapperClassName = "", className = "", children, ...props }: Common & React.ComponentProps<"select">) {
  const id = useId();
  return (
    <div className={wrapperClassName}>
      <label htmlFor={id} className="label">{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      <select id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} className={`input ${className}`}>{children}</select>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
