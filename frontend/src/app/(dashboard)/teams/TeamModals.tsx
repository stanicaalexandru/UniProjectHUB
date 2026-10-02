"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { Team, User } from "@/types";

// Formular comun: trimite cererea, afiseaza eroarea in fereastra si o inchide la succes
function useSubmit(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submit = async (request: () => Promise<unknown>) => {
    setBusy(true); setError(null);
    try { await request(); onDone(); } catch (e) { setError(e); setBusy(false); }
  };
  return { busy, error, submit };
}

function Footer({ onCancel, busy, label, disabled }: { onCancel: () => void; busy: boolean; label: string; disabled?: boolean }) {
  const { t } = useT();
  return (
    <div className="flex flex-wrap justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="btn-secondary">{t("common.cancel")}</button>
      <button type="submit" disabled={busy || disabled} className="btn-primary disabled:opacity-50">{busy ? t("common.saving") : label}</button>
    </div>
  );
}

export function CreateTeamModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState({ name: "", description: "", maxMembers: 5 });
  const { busy, error, submit } = useSubmit(onDone);
  return (
    <Modal title={t("teams.newTeam")} onClose={onClose}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit(() => apiFetch("/teams", { method: "POST", body: JSON.stringify(form) })); }}>
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <TextField label={t("teams.name")} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t("teams.namePlaceholder")} />
        <TextAreaField label={t("teams.description")} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="min-h-16" />
        <TextField label={t("teams.maxMembers")} type="number" min={2} max={10} value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: +e.target.value })} className="w-24" />
        <Footer onCancel={onClose} busy={busy} label={t("teams.create")} />
      </form>
    </Modal>
  );
}

// Profesorul adauga direct un student; studentul e notificat de server
export function AddMemberModal({ team, students, onClose, onDone }: { team: Team; students: User[]; onClose: () => void; onDone: () => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [userId, setUserId] = useState("");
  const { busy, error, submit } = useSubmit(onDone);
  return (
    <Modal title={t("teams.addMemberTitle", { team: team.name })} onClose={onClose}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit(() => apiFetch(`/teams/${team.id}/members`, { method: "POST", body: JSON.stringify({ userId }) })); }}>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t("teams.addMemberIntro")}</p>
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <SelectField label={t("teams.student")} required value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="">{t("teams.chooseStudent")}</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.email})</option>)}
        </SelectField>
        <Footer onCancel={onClose} busy={busy} label={t("teams.addToTeam")} disabled={!userId} />
      </form>
    </Modal>
  );
}

// Cererea de inscriere a unui student; liderul echipei e notificat de server
export function JoinRequestModal({ team, onClose, onDone }: { team: Team; onClose: () => void; onDone: () => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const [message, setMessage] = useState("");
  const { busy, error, submit } = useSubmit(onDone);
  return (
    <Modal title={t("teams.requestTitle", { team: team.name })} onClose={onClose}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit(() => apiFetch(`/teams/${team.id}/request-join`, { method: "POST", body: JSON.stringify({ message }) })); }}>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t("teams.requestIntro")}</p>
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <TextAreaField label={`${t("teams.message")} (${t("common.optional")})`} value={message} onChange={e => setMessage(e.target.value)} className="min-h-20" placeholder={t("teams.messagePlaceholder")} />
        <Footer onCancel={onClose} busy={busy} label={t("teams.sendRequest")} />
      </form>
    </Modal>
  );
}
