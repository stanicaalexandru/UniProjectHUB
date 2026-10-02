"use client";
import { Hourglass, MailCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, PENDING_EMAIL_KEY } from "@/lib/api";
import { SHOWCASE, useServerInfo } from "@/lib/showcase";
import { useT, useErrorMessage } from "@/i18n";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { TextField, SelectField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import type { AuthSession } from "@/types";

type Step = "form" | "verify" | "pending";
const RESEND_COOLDOWN = 60;

export default function RegisterPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const serverInfo = useServerInfo();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", faculty: "", role: "student" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Pasul de verificare
  const [step, setStep] = useState<Step>("form");
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Numaratoare pentru butonul de retrimitere
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "verify") codeInputRef.current?.focus();
  }, [step]);

  // Venit de la autentificare cu un cont neconfirmat: codul nou a fost deja trimis, afisam direct confirmarea
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("verify") !== "1") return;
    let pending: string | null = null;
    try { pending = sessionStorage.getItem(PENDING_EMAIL_KEY); sessionStorage.removeItem(PENDING_EMAIL_KEY); } catch {}
    if (!pending) return;
    setForm(f => ({ ...f, email: pending! }));
    setStep("verify");
    setResendCooldown(RESEND_COOLDOWN);
    setResendMessage(t("auth.codeResent"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- doar la prima incarcare
  }, []);

  const startSession = (session: AuthSession) => {
    localStorage.setItem("access_token", session.accessToken);
    localStorage.setItem("refresh_token", session.refreshToken);
    localStorage.setItem("user", JSON.stringify(session.user));
    router.push("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError(t("auth.passwordsDontMatch")); return; }
    if (form.password.length < 8) { setError(t("auth.passwordTooShort")); return; }
    if (!acceptedTerms) { setError(t("auth.mustAcceptTerms")); return; }
    setLoading(true); setError("");
    try {
      const { firstName, lastName, email, password, role, faculty } = form;
      const data: AuthSession | { email: string } = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ firstName, lastName, email, password, role, faculty, acceptedTerms }) });
      // Demo fara server de email: contul e activ imediat si serverul deschide direct sesiunea
      if ("accessToken" in data) { startSession(data); return; }
      // Altfel trece la ecranul de confirmare cu codul primit pe email
      setStep("verify");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setError(t("auth.codeMustBe6")); return; }
    setLoading(true); setError("");
    try {
      const data: AuthSession | { pendingApproval: true } = await apiFetch("/auth/verify-email", { method: "POST", body: JSON.stringify({ email: form.email, code }) });
      // Conturile de profesor nu primesc sesiune pana nu le aproba un administrator
      if ("pendingApproval" in data) { setStep("pending"); setLoading(false); return; }
      startSession(data);
    } catch (err) { setError(errorMessage(err)); setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(""); setResendMessage("");
    try {
      await apiFetch("/auth/resend-code", { method: "POST", body: JSON.stringify({ email: form.email }) });
      setResendMessage(t("auth.codeResent"));
      setResendCooldown(RESEND_COOLDOWN);
      setTimeout(() => setResendMessage(""), 4000);
    } catch (err) { setError(errorMessage(err)); }
  };

  const subtitle = step === "form" ? t("auth.registerSubtitle") : step === "pending" ? t("auth.pendingSubtitle") : t("auth.verifySubtitle");
  const linkClass = "text-blue-700 dark:text-blue-400 font-medium underline";

  return (
    <AuthLayout subtitle={subtitle} wide>
      {error && <Alert className="mb-4">{error}</Alert>}

      {step === "pending" && (
        <div className="text-center" role="status">
          <Hourglass className="w-9 h-9 mx-auto mb-3 text-amber-600 dark:text-amber-400" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-2">{t("auth.pendingTitle")}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{t("auth.pendingText")}</p>
          <Link href="/login" className="btn-primary w-full justify-center py-2.5">{t("auth.goToLogin")}</Link>
        </div>
      )}

      {step === "form" && (
        <>
          <h2 className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-6">{t("auth.registerTitle")}</h2>
          {SHOWCASE && <Alert kind="info" className="mb-4">{serverInfo?.emailEnabled === false ? t("showcase.registerNoticeNoEmail") : t("showcase.registerNotice")}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label={t("auth.firstName")} autoComplete="given-name" required value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder={t("auth.firstNamePlaceholder")} />
              <TextField label={t("auth.lastName")} autoComplete="family-name" required value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder={t("auth.lastNamePlaceholder")} />
            </div>
            <TextField label={t("auth.email")} type="email" autoComplete="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder={t("auth.emailPlaceholder")} />
            <SelectField label={t("auth.role")} value={form.role} onChange={e => set("role", e.target.value)}
              hint={form.role === "professor" ? (SHOWCASE ? t("showcase.professorNote") : t("auth.professorNote")) : undefined}>
              <option value="student">{t("auth.roleStudent")}</option>
              <option value="professor">{t("auth.roleProfessor")}</option>
            </SelectField>
            <TextField label={t("auth.faculty")} value={form.faculty} onChange={e => set("faculty", e.target.value)} placeholder={t("auth.facultyPlaceholder")} />
            <TextField label={t("auth.passwordHint")} type="password" autoComplete="new-password" required value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" />
            <TextField label={t("auth.confirmPassword")} type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="••••••••" />
            <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" required checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded flex-shrink-0" />
              <span>
                {t("auth.acceptTermsPrefix")}{" "}
                <Link href="/terms" target="_blank" className={linkClass}>{t("auth.acceptTermsTerms")}</Link>
                {" "}{t("auth.acceptTermsAnd")}{" "}
                <Link href="/privacy" target="_blank" className={linkClass}>{t("auth.acceptTermsPrivacy")}</Link> *
              </span>
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">{loading ? t("auth.creating") : t("auth.createAccount")}</button>
          </form>
          <p className="text-center text-sm text-slate-600 mt-4 dark:text-slate-400">
            {t("auth.haveAccount")} <Link href="/login" className="text-blue-700 dark:text-blue-400 font-medium hover:underline">{t("auth.loginLink")}</Link>
          </p>
        </>
      )}

      {step === "verify" && (
        <>
          <div className="text-center mb-6">
            <MailCheck className="w-9 h-9 mx-auto mb-3 text-blue-700 dark:text-blue-400" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-2">{t("auth.verifyTitle")}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("auth.verifyIntro")}<br />
              <span className="font-semibold text-slate-700 dark:text-slate-300">{form.email}</span>
            </p>
          </div>

          {resendMessage && <Alert kind="success" className="mb-4">{resendMessage}</Alert>}

          <form onSubmit={handleVerify} className="space-y-4">
            <TextField ref={codeInputRef} label={t("auth.verificationCode")} required inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em] font-bold py-3" placeholder="000000" />
            <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
              {loading ? t("auth.verifying") : t("auth.confirmAccount")}
            </button>
          </form>

          <div className="text-center mt-5 space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t("auth.noCode")}{" "}
              {resendCooldown > 0 ? (
                <span>{t("auth.resendIn", { seconds: resendCooldown })}</span>
              ) : (
                <button type="button" onClick={handleResend} className="text-blue-700 dark:text-blue-400 font-medium hover:underline">{t("auth.resendCode")}</button>
              )}
            </p>
            <button type="button" onClick={() => { setStep("form"); setCode(""); setError(""); }} className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              {t("auth.changeEmail")}
            </button>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
