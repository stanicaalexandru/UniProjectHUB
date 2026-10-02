"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { useToast } from "@/components/ui/Feedback";
import { Section } from "@/components/ui/Section";
import { TextField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { isSharedDemoAccount } from "@/lib/showcase";
import type { User } from "@/types";

function PasswordForm({ user }: { user: User }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = (k: keyof typeof passwords, v: string) => setPasswords(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { setError(t("auth.passwordsDontMatch")); return; }
    if (passwords.next.length < 8) { setError(t("auth.passwordTooShort")); return; }
    setSaving(true); setError(null);
    try {
      await apiFetch(`/users/${user.id}/change-password`, { method: "PATCH", body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }) });
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success(t("settings.passwordChanged"));
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <Alert>{errorMessage(error)}</Alert> : null}
      <TextField label={t("settings.currentPassword")} type="password" autoComplete="current-password" required value={passwords.current} onChange={e => set("current", e.target.value)} placeholder="••••••••" />
      <TextField label={t("auth.newPassword")} type="password" autoComplete="new-password" required value={passwords.next} onChange={e => set("next", e.target.value)} placeholder={t("auth.newPasswordPlaceholder")} />
      <TextField label={t("auth.confirmPassword")} type="password" autoComplete="new-password" required value={passwords.confirm} onChange={e => set("confirm", e.target.value)} placeholder={t("auth.confirmPasswordPlaceholder")} />
      <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
        {saving ? t("common.saving") : t("settings.changePassword")}
      </button>
    </form>
  );
}

// PIN-ul e al doilea pas la autentificare; orice modificare se confirma cu parola curenta
function PinForm({ user, onUserChange }: { user: User; onUserChange: (u: User) => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [form, setForm] = useState({ password: "", pin: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const enabled = !!user.isPinEnabled;

  const run = async (request: () => Promise<unknown>, isPinEnabled: boolean, message: string) => {
    setSaving(true); setError(null);
    try {
      await request();
      onUserChange({ ...user, isPinEnabled });
      setForm({ password: "", pin: "" });
      toast.success(message);
    } catch (err) { setError(err); }
    setSaving(false);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => apiFetch("/users/me/pin", { method: "PUT", body: JSON.stringify({ currentPassword: form.password, pin: form.pin }) }), true, t("settings.pinSaved"));
  };
  const remove = () =>
    run(() => apiFetch("/users/me/pin", { method: "DELETE", body: JSON.stringify({ password: form.password }) }), false, t("settings.pinRemoved"));

  return (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold dark:text-slate-200">{t("settings.pinTitle")}</h3>
        <span className={`text-xs font-semibold ${enabled ? "text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-400"}`}>
          {enabled ? t("settings.pinOn") : t("settings.pinOff")}
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{t("settings.pinIntro")}</p>
      <form onSubmit={save} className="space-y-3">
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <TextField label={t("settings.currentPassword")} type="password" autoComplete="current-password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        <TextField label={enabled ? t("settings.newPin") : t("settings.pin")} type="password" inputMode="numeric" autoComplete="off" value={form.pin}
          onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }))} className="text-center tracking-widest" />
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving || form.pin.length < 4 || !form.password} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {enabled ? t("settings.changePin") : t("settings.enablePin")}
          </button>
          {enabled && (
            <button type="button" onClick={remove} disabled={saving || !form.password} className="btn-secondary justify-center disabled:opacity-50">{t("settings.disablePin")}</button>
          )}
        </div>
      </form>
    </div>
  );
}

export function SecuritySection({ user, onUserChange }: { user: User; onUserChange: (u: User) => void }) {
  const { t } = useT();
  return (
    <Section title={t("settings.securityTitle")}>
      {isSharedDemoAccount(user.email) ? <Alert kind="info">{t("showcase.lockedSettings")}</Alert> : (
        <>
          <PasswordForm user={user} />
          <PinForm user={user} onUserChange={onUserChange} />
        </>
      )}
    </Section>
  );
}
