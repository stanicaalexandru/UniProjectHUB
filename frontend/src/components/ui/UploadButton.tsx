import { Upload } from "lucide-react";

export const ACCEPTED_FILES = ".pdf,.docx,.pptx,.xlsx,.zip,.txt,.md,.jpg,.png";

// Eticheta care deschide selectorul de fisiere; inputul ramane accesibil de la tastatura (vizibil doar pentru cititoare)
export function UploadButton({ label, busy, onFile, inputRef, variant = "primary" }: {
  label: string; busy?: boolean; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>; variant?: "primary" | "dashed";
}) {
  const look = variant === "primary"
    ? "btn-primary"
    : "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-dashed border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors";
  return (
    <label className={`${look} cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${busy ? "opacity-60" : ""}`}>
      <Upload className={variant === "primary" ? "w-4 h-4" : "w-3.5 h-3.5"} aria-hidden="true" />
      {label}
      <input ref={inputRef} type="file" className="sr-only" onChange={onFile} accept={ACCEPTED_FILES} disabled={busy} />
    </label>
  );
}
