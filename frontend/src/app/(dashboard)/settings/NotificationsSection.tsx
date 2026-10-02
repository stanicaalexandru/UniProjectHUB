"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { useToast } from "@/components/ui/Feedback";
import { Section } from "@/components/ui/Section";
import { Switch } from "@/components/ui/Switch";
import type { User } from "@/types";

const DEFAULTS = { push: true, risk: true, chat: true, evals: true, email: false };
type Prefs = typeof DEFAULTS;
const LABELS: Record<keyof Prefs, "settings.notifPush" | "settings.notifRisk" | "settings.notifChat" | "settings.notifEvals" | "settings.notifEmail"> = {
  push: "settings.notifPush", risk: "settings.notifRisk", chat: "settings.notifChat", evals: "settings.notifEvals", email: "settings.notifEmail",
};

// Preferintele se salveaza imediat la fiecare comutare
export function NotificationsSection({ user, onUserChange }: { user: User; onUserChange: (u: User) => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [prefs, setPrefs] = useState<Prefs>({ ...DEFAULTS, ...user.notificationPreferences });
  const [saving, setSaving] = useState(false);

  const toggle = async (key: keyof Prefs, value: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await apiFetch(`/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ notificationPreferences: next }) });
      onUserChange({ ...user, notificationPreferences: next });
    } catch (err) {
      setPrefs(previous);
      toast.error(errorMessage(err));
    }
    setSaving(false);
  };

  return (
    <Section title={t("settings.notificationsTitle")} aside={saving ? <span className="text-xs text-slate-500 dark:text-slate-400" role="status">{t("common.saving")}</span> : undefined}>
      {(Object.keys(LABELS) as (keyof Prefs)[]).map(key => (
        <Switch key={key} checked={prefs[key]} onChange={v => toggle(key, v)} label={t(LABELS[key])} />
      ))}
    </Section>
  );
}
