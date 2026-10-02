"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { Section } from "@/components/ui/Section";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

// Stergerea contului (GDPR art. 17): confirmata cu parola, explica ce se sterge si ce ramane anonimizat
export function DeleteAccountSection() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const close = () => { if (deleting) return; setOpen(false); setPassword(""); setError(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true); setError(null);
    try {
      await apiFetch("/users/me", { method: "DELETE", body: JSON.stringify({ password }) });
      // Contul nu mai exista: se sterg toate datele locale, inclusiv preferintele
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) { setError(err); setDeleting(false); }
  };

  return (
    <>
      <Section title={t("settings.dangerZone")} tone="danger" bodyClassName="p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t("settings.deleteAccount")}</div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t("settings.deleteAccountHint")}</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn-danger">{t("settings.deleteAccountButton")}</button>
      </Section>

      {open && (
        <Modal title={<span className="text-red-700 dark:text-red-400">{t("settings.deleteConfirmTitle")}</span>} onClose={close}>
          <form onSubmit={submit} className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("settings.deletedHeading")}</div>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>{t("settings.deleted1")}</li>
                <li>{t("settings.deleted2")}</li>
                <li>{t("settings.deleted3")}</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{t("settings.keptHeading")}</div>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>{t("settings.kept1")}</li>
                <li>{t("settings.kept2")}</li>
              </ul>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{t("settings.leaderNote")}</p>
            </div>
            <TextField label={t("settings.confirmWithPassword")} type="password" required autoFocus autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
            {error ? <Alert>{errorMessage(error)}</Alert> : null}
            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={close} disabled={deleting} className="btn-secondary">{t("common.cancel")}</button>
              <button type="submit" disabled={deleting || !password} className="inline-flex items-center px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg disabled:opacity-60">
                {deleting ? t("settings.deleting") : t("settings.deleteForever")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
