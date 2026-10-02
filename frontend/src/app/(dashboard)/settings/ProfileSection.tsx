"use client";
import { useState } from "react";
import { Camera } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useT, useErrorMessage } from "@/i18n";
import { useToast } from "@/components/ui/Feedback";
import { Section } from "@/components/ui/Section";
import { TextField, TextAreaField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { User } from "@/types";

export function ProfileSection({ user, onUserChange }: { user: User; onUserChange: (u: User) => void }) {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: user.firstName || "", lastName: user.lastName || "", faculty: user.faculty || "", department: user.department || "",
    bio: user.bio || "", phone: user.phone || "", studyYear: user.studyYear ? String(user.studyYear) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const updated = await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...form, studyYear: form.studyYear ? Number(form.studyYear) : undefined }),
      });
      // Raspunsul PATCH nu contine telefonul (e ascuns in afara /users/me), deci il luam din formular
      onUserChange({ ...user, ...updated, phone: form.phone });
      toast.success(t("settings.profileSaved"));
    } catch (err) { setError(err); }
    finally { setSaving(false); }
  };

  // Poza de profil e trimisa ca data URL; serverul verifica tipul si dimensiunea
  const uploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const avatar = reader.result as string;
      try {
        await apiFetch(`/users/${user.id}/avatar`, { method: "POST", body: JSON.stringify({ avatar }) });
        onUserChange({ ...user, avatar });
        toast.success(t("settings.avatarSaved"));
      } catch (err) { setError(err); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <Section title={t("settings.profileTitle")}>
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <label className="cursor-pointer group relative flex-shrink-0 rounded-full focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
            <span className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xl font-bold text-blue-800 dark:text-blue-300 overflow-hidden" aria-hidden="true">
              {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`}
            </span>
            <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" aria-hidden="true">
              <Camera className="w-4 h-4 text-white" />
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={uploadAvatar} aria-label={t("settings.changeAvatar")} />
          </label>
          <div className="min-w-0">
            <div className="font-semibold dark:text-slate-100 truncate">{form.firstName} {form.lastName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t(`roles.${user.role}`)} · {form.faculty || t("settings.noFaculty")}</div>
            <div className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{t("settings.avatarHint")}</div>
          </div>
        </div>
        {error ? <Alert>{errorMessage(error)}</Alert> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField label={t("auth.firstName")} autoComplete="given-name" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
          <TextField label={t("auth.lastName")} autoComplete="family-name" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
        </div>
        <TextField label={t("auth.email")} value={user.email} disabled className="opacity-60 cursor-not-allowed" hint={t("settings.emailHint")} />
        <TextField label={t("profile.faculty")} value={form.faculty} onChange={e => set("faculty", e.target.value)} placeholder={t("settings.facultyPlaceholder")} />
        <TextField label={t("profile.department")} value={form.department} onChange={e => set("department", e.target.value)} placeholder={t("settings.departmentPlaceholder")} />
        <TextField label={t("profile.studyYear")} type="number" min={1} max={6} value={form.studyYear} onChange={e => set("studyYear", e.target.value)} placeholder="3" />
        <TextField label={t("profile.phone")} type="tel" autoComplete="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="07xx xxx xxx" hint={t("settings.phoneHint")} />
        <TextAreaField label={t("settings.bio")} value={form.bio} onChange={e => set("bio", e.target.value)} className="min-h-16" placeholder={t("settings.bioPlaceholder")} />
        <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
          {saving ? t("common.saving") : t("settings.saveChanges")}
        </button>
      </form>
    </Section>
  );
}
