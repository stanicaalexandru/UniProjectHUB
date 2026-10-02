"use client";
import { KeyRound, LockKeyhole, MailCheck, type LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, PENDING_EMAIL_KEY } from "@/lib/api";
import { SHOWCASE, DEMO_ACCOUNTS, DEMO_PASSWORD, useServerInfo } from "@/lib/showcase";
import { useT, useErrorMessage } from "@/i18n";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { TextField } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/States";
import type { AuthSession, LoginResponse } from "@/types";

type Step = "credentials" | "pin" | "forgot" | "reset";

export default function LoginPage() {
  const { t } = useT();
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [pin, setPin] = useState("");
  const [pinToken, setPinToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [slow, setSlow] = useState(false);
  // Fara server de email (demo) resetarea parolei prin cod nu e posibila
  const serverInfo = useServerInfo();
  const canResetPassword = serverInfo?.emailEnabled !== false;

  // Redirectionat aici dupa ce sesiunea a expirat (vezi authFetch)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired") === "1") setError(t("auth.sessionExpired"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- doar la prima incarcare
  }, []);

  const go = (next: Step) => { setStep(next); setError(""); setNotice(""); };

  const completeLogin = (session: AuthSession) => {
    localStorage.setItem("access_token", session.accessToken);
    localStorage.setItem("refresh_token", session.refreshToken);
    localStorage.setItem("user", JSON.stringify(session.user));
    if (rememberMe) localStorage.setItem("remember_me", "true");
    router.push("/dashboard");
  };

  // Executa o actiune a formularului cu stare de incarcare si mesaj de eroare tradus
  // Serverul demo gratuit "adoarme" cand nu e folosit: daca raspunsul intarzie, explicam de ce
  const run = async (action: () => Promise<void>) => {
    setLoading(true); setError(""); setNotice(""); setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try { await action(); } catch (err) { setError(errorMessage(err)); }
    clearTimeout(slowTimer);
    setSlow(false);
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  const loginAsDemo = (demoEmail: string) => {
    setEmail(demoEmail); setPassword(DEMO_PASSWORD);
    login(demoEmail, DEMO_PASSWORD);
  };

  const login = (email: string, password: string) => {
    run(async () => {
      let data: LoginResponse;
      try {
        data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      } catch (err) {
        // Cont neconfirmat (parola corecta): trimitem un cod nou si mergem direct la ecranul de confirmare
        if ((err as { code?: string }).code === "EMAIL_NOT_VERIFIED") {
          await apiFetch("/auth/resend-code", { method: "POST", body: JSON.stringify({ email }) }).catch(() => {});
          try { sessionStorage.setItem(PENDING_EMAIL_KEY, email); } catch {}
          router.push("/register?verify=1");
          return;
        }
        throw err;
      }
      // Cont cu PIN: parola a fost acceptata, dar sesiunea se deschide abia dupa verificarea PIN-ului
      if ("pinRequired" in data) { setPinToken(data.pinToken); setPin(""); setStep("pin"); return; }
      completeLogin(data);
    });
  };

  const handlePin = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      try {
        completeLogin(await apiFetch("/auth/login/pin", { method: "POST", body: JSON.stringify({ pinToken, pin }) }));
      } catch (err) { setPin(""); throw err; }
    });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      await apiFetch("/users/forgot-password", { method: "POST", body: JSON.stringify({ email: resetEmail }) });
      setStep("reset");
    });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError(t("auth.passwordsDontMatch")); return; }
    if (newPassword.length < 8) { setError(t("auth.passwordTooShort")); return; }
    run(async () => {
      await apiFetch("/users/reset-password", { method: "POST", body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword }) });
      setEmail(resetEmail); setResetCode(""); setNewPassword(""); setConfirmPassword("");
      setStep("credentials");
      setNotice(t("auth.resetSuccess"));
    });
  };

  const header = (Icon: LucideIcon, title: string, intro: React.ReactNode) => (
    <div className="text-center mb-6">
      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl flex items-center justify-center mx-auto mb-3"><Icon className="w-6 h-6" aria-hidden="true" /></div>
      <h2 className="text-slate-800 dark:text-slate-100 text-xl font-bold">{title}</h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{intro}</p>
    </div>
  );

  return (
    <AuthLayout subtitle={t("app.tagline")}>
      {step === "credentials" && (
        <>
          <h2 className="text-slate-800 dark:text-slate-100 text-xl font-bold mb-6">{t("auth.loginTitle")}</h2>
          {notice && <Alert kind="success" className="mb-4">{notice}</Alert>}
          {error && <Alert className="mb-4">{error}</Alert>}
          {slow && <Alert kind="info" className="mb-4">{t("showcase.waking")}</Alert>}
          {SHOWCASE && (
            <section className="mb-5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4" aria-labelledby="demo-title">
              <h3 id="demo-title" className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">{t("showcase.title")}</h3>
              <p className="text-xs text-blue-900/80 dark:text-blue-200/80 mb-3">{t("showcase.intro")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(a => (
                  <button key={a.key} type="button" disabled={loading} onClick={() => loginAsDemo(a.email)} className="btn-secondary justify-center text-xs">
                    {t(`showcase.loginAs.${a.key}`)}
                  </button>
                ))}
              </div>
            </section>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <TextField label={t("auth.email")} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
            <TextField label={t("auth.password")} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> {t("auth.rememberMe")}
              </label>
              {canResetPassword && <button type="button" onClick={() => { setResetEmail(email); go("forgot"); }} className="text-blue-700 dark:text-blue-400 hover:underline text-xs">{t("auth.forgotPassword")}</button>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base">
              {loading ? <><Spinner /> {t("auth.loggingIn")}</> : t("auth.loginButton")}
            </button>
          </form>
          <p className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
            {t("auth.noAccount")} <Link href="/register" className="text-blue-700 dark:text-blue-400 font-medium hover:underline">{t("auth.registerLink")}</Link>
          </p>
        </>
      )}

      {step === "pin" && (
        <>
          {header(LockKeyhole, t("auth.pinTitle"), t("auth.pinIntro", { email }))}
          {error && <Alert className="mb-4">{error}</Alert>}
          <form onSubmit={handlePin} className="space-y-4">
            <TextField label={t("auth.pinLabel")} type="password" inputMode="numeric" autoComplete="one-time-code" value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center tracking-widest text-2xl" placeholder="••••" autoFocus required />
            <button type="submit" disabled={loading || pin.length < 4} className="btn-primary w-full justify-center py-2.5 text-base disabled:opacity-50">
              {loading ? t("auth.verifying") : t("auth.pinConfirm")}
            </button>
            <button type="button" onClick={() => { setPin(""); setPinToken(""); go("credentials"); }} className="btn-secondary w-full justify-center">{t("auth.backToLogin")}</button>
          </form>
        </>
      )}

      {step === "forgot" && (
        <>
          {header(KeyRound, t("auth.resetTitle"), t("auth.resetIntro"))}
          {error && <Alert className="mb-4">{error}</Alert>}
          <form onSubmit={handleForgot} className="space-y-4">
            <TextField label={t("auth.email")} type="email" autoComplete="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder={t("auth.emailPlaceholder")} required />
            <button type="submit" disabled={loading || !resetEmail} className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
              {loading ? t("auth.sending") : t("auth.sendCode")}
            </button>
            <button type="button" onClick={() => go("credentials")} className="btn-secondary w-full justify-center">{t("auth.backToLogin")}</button>
          </form>
        </>
      )}

      {step === "reset" && (
        <>
          {header(MailCheck, t("auth.enterCodeTitle"), t("auth.codeSentTo", { email: resetEmail }))}
          {error && <Alert className="mb-4">{error}</Alert>}
          <form onSubmit={handleReset} className="space-y-4">
            <TextField label={t("auth.resetCode")} inputMode="numeric" autoComplete="one-time-code" value={resetCode}
              onChange={e => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-center tracking-widest text-xl" placeholder="000000" required />
            <TextField label={t("auth.newPassword")} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t("auth.newPasswordPlaceholder")} required />
            <TextField label={t("auth.confirmPassword")} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t("auth.confirmPasswordPlaceholder")} required />
            <button type="submit" disabled={loading || resetCode.length !== 6 || !newPassword} className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
              {loading ? t("auth.resetting") : t("auth.resetButton")}
            </button>
            <button type="button" onClick={() => go("forgot")} className="btn-secondary w-full justify-center">{t("auth.sendAnotherCode")}</button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
