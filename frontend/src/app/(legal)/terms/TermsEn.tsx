import Link from "next/link";
import { LEGAL, LAST_UPDATED } from "../legal";

export function TermsEn() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <>
      <h1>Terms and Conditions</h1>
      <p className="!text-slate-600 dark:!text-slate-400">Last updated: {LAST_UPDATED.en}</p>

      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-6">
        <p className="!mb-0 !text-amber-900 dark:!text-amber-200">
          <strong className="!text-amber-900 dark:!text-amber-100">In short:</strong> UniProject Hub is an academic and
          portfolio project, offered free of charge, not for profit and without any guarantee of availability. It is
          not an official service of any university. Keep copies of your important documents.
        </p>
      </div>

      <h2>1. About the platform</h2>
      <p>
        UniProject Hub was developed by <strong>{LEGAL.operatorName ?? "its author"}</strong> as a bachelor thesis and
        is currently maintained as a portfolio project. The platform is free, with no subscriptions, payments or ads.
        It is not affiliated with any university and is not a commercial service.
      </p>

      <h2>2. Accepting the terms</h2>
      <p>
        By creating an account you confirm that you have read and accept these terms and the{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the platform.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You must be at least 16 years old to create an account.</li>
        <li>The information you provide when signing up, including your role (student or professor), must be real.
          Professor accounts are activated only after approval by an administrator.</li>
        <li>You are responsible for keeping your password and PIN confidential.</li>
        <li>If you notice unauthorized use of your account, let us know at {mail}.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>By using the platform, you agree not to:</p>
      <ul>
        <li>upload content that is illegal, offensive, infringes copyright or contains malware;</li>
        <li>upload other people’s personal data without the right to do so;</li>
        <li>try to access accounts, projects or data that are not yours, or to bypass security measures;</li>
        <li>overload the platform (for example with mass automated requests or spam);</li>
        <li>impersonate another person, or a member of the teaching staff if you are not one;</li>
        <li>record or share video calls without the consent of all participants.</li>
      </ul>
      <p>Video calls take place on the external Jitsi Meet service, which has its own terms of use.</p>

      <h2>5. Your content</h2>
      <p>
        The documents, messages and other materials you upload remain yours. You only grant us the limited right to
        store and display them on the platform, strictly to make it work: for example, so that your team members and
        the project coordinator can see them. You are responsible for the content you upload.
      </p>

      <h2>6. Evaluations and grades</h2>
      <p>
        Evaluations, grades and automatic analyses on the platform are informative and help organize projects. They
        <strong> do not replace</strong> the official grade records or the decisions of the educational institution.
      </p>

      <h2>7. Availability</h2>
      <p>
        As an academic project, the platform is provided “as is”. We do not guarantee that it will work without
        interruptions or errors, that data will be kept indefinitely, or that the service will remain available. The
        platform may be changed, suspended or shut down at any time. Do not rely on it as the only storage for
        important documents.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the extent permitted by law, the author is not liable for data loss, project delays or other damage resulting
        from using or being unable to use the platform. Nothing in these terms limits rights that the law does not
        allow to be limited.
      </p>

      <h2>9. Suspension and closure of accounts</h2>
      <p>
        You can delete your account at any time from the Settings page, as described in the{" "}
        <Link href="/privacy">Privacy Policy</Link> (section 7.1). Accounts that break these terms may be suspended or
        deleted, and where possible we will notify you by email beforehand.
      </p>

      <h2>10. Changes to the terms</h2>
      <p>
        We may update these terms. The date of the last update appears at the top of the page, and important changes
        are announced by email or through a notification in the application. If you keep using the platform after a
        change, you accept the new terms.
      </p>

      <h2>11. Governing law</h2>
      <p>These terms are governed by Romanian law.</p>

      <h2>12. Contact</h2>
      <p>For questions about these terms, write to {mail}.</p>
    </>
  );
}
