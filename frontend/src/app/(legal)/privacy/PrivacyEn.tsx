import Link from "next/link";
import { LEGAL, LAST_UPDATED, SENDS_EMAIL } from "../legal";

export function PrivacyEn() {
  const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="!text-slate-600 dark:!text-slate-400">Last updated: {LAST_UPDATED.en}</p>

      <p>
        UniProject Hub is a platform for managing student projects, built as an academic and portfolio project.
        This page explains what personal data we collect, why, how long we keep it and what rights you have under
        Regulation (EU) 2016/679 (GDPR).
      </p>

      <h2>1. Who is responsible for your data</h2>
      <p>
        The data controller is <strong>{LEGAL.operatorName ?? "the author of the application"}</strong>, a private
        individual and the author of the application. For any question or request about your data, write to {mail}.
      </p>

      <h2>2. What data we collect</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th scope="col">Category</th><th scope="col">Data</th><th scope="col">Required?</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Account data</td>
              <td>first name, last name, email address, password (stored only in hashed form, never in plain text), role (student / professor)</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Academic data</td>
              <td>faculty, department, year of study</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Optional profile data</td>
              <td>phone number, short description (bio), profile picture</td>
              <td>No</td>
            </tr>
            <tr>
              <td>Security data</td>
              <td>number of failed sign-in attempts, temporary confirmation or reset codes, session token, optional security PIN (stored hashed)</td>
              <td>Generated automatically</td>
            </tr>
            <tr>
              <td>Content you create</td>
              <td>projects, tasks, milestones, uploaded documents, chat messages and attachments, comments, evaluations and grades, notifications, project activity history</td>
              <td>Depends on use</td>
            </tr>
            <tr>
              <td>Automatic analyses</td>
              <td>progress and risk indicators computed by the platform’s analysis module from the data above</td>
              <td>Generated automatically</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        We do <strong>not</strong> use cookies, analytics tools, tracking pixels or ads, and we do not record IP
        addresses in the application logs. Automatic analyses run internally, on the application server, without
        sending data to external artificial-intelligence services.
      </p>

      <h2>3. Why we use the data and on what legal basis</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr><th scope="col">Purpose</th><th scope="col">Legal basis (GDPR)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Creating and managing your account; running projects, teams, chat and evaluations</td>
              <td>Performance of a contract: the terms of use you accept when signing up (Art. 6(1)(b))</td>
            </tr>
            <tr>
              <td>Sending account-confirmation, password-reset and notification emails</td>
              <td>Performance of a contract (Art. 6(1)(b))</td>
            </tr>
            <tr>
              <td>Protecting accounts: blocking repeated sign-in attempts, secure sessions</td>
              <td>Legitimate interest in keeping the platform secure (Art. 6(1)(f))</td>
            </tr>
            <tr>
              <td>Showing optional profile data (phone, bio, picture)</td>
              <td>Your consent (Art. 6(1)(a)), which you can withdraw at any time by clearing the field in Settings</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>We do not use the data for marketing and we do not make automated decisions with legal effects on you.</p>

      <h2>4. Who has access to the data</h2>
      <ul>
        <li>
          <strong>Other users of the platform</strong>: your name, email, role and the profile data you fill in
          (faculty, department, year of study, bio, picture) are visible to other signed-in users, so that teams and
          coordinators can work together. <strong>Your phone number is not shown to other users, including platform
          administrators.</strong> It is technically accessible only to the controller, through the database, and is
          not used for any purpose. A project’s content is visible only to its team members, its creator and its
          coordinating professor.
        </li>
        {SENDS_EMAIL && (
          <li>
            <strong>The email provider</strong>
            {LEGAL.emailProvider ? <> (<strong>{LEGAL.emailProvider}</strong>)</> : <> (by default <strong>Google Gmail</strong>)</>}:
            the application’s emails (account confirmation, password reset, welcome, notifications) pass through its
            servers, so it receives your email address, name and the message content. The provider may process data
            outside the European Economic Area under its own safeguards (standard contractual clauses).
          </li>
        )}
        <li>
          <strong>Jitsi Meet</strong> (the public meet.jit.si service, operated by 8x8 Inc.), <strong>only if you
          use the “Video call” button</strong>: the call opens on the Jitsi server, which receives your display name,
          the (random) room name, and the audio and video sent during the call. We do not record or store calls.
          Processing during the call is governed by the Jitsi privacy policy.
        </li>
        <li>
          <strong>The hosting provider</strong>
          {LEGAL.hostingProvider
            ? <>: <strong>{LEGAL.hostingProvider}</strong>, which host the application and the database. Like any hosting provider, they may keep visitors’ IP addresses for a short time in their security logs.</>
            : <>: the application runs on its own server. If it moves to a hosting provider, the provider will be listed here.</>}
        </li>
      </ul>
      <p>We do not sell, rent or pass your data to any other third party.</p>

      <h2>5. Where the data is stored</h2>
      <p>
        Account data and content are stored in a PostgreSQL database. Documents and chat attachments are saved as
        files on the application server’s disk, <strong>not</strong> in a cloud storage service.
      </p>

      <h2>6. What we store in your browser</h2>
      <p>The application does not use cookies. To keep you signed in, it saves in the browser’s local storage (<code>localStorage</code>):</p>
      <ul>
        <li><code>access_token</code> and <code>refresh_token</code>: the session tokens;</li>
        <li><code>user</code>: a copy of your profile data, for fast display;</li>
        <li><code>remember_me</code>: the “Remember me” preference;</li>
        <li><code>theme</code> and <code>locale</code>: your chosen theme (light / dark) and interface language.</li>
      </ul>
      <p>
        This information is strictly necessary for the service you request, so we do not ask for separate consent.
        The tokens, the profile copy and the “Remember me” preference are removed when you sign out; the theme and
        language stay in the browser, so you don’t have to choose them again, until you clear the site’s data.
        Everything is removed when you delete your account.
      </p>

      <h2>7. How long we keep the data</h2>
      <ul>
        <li>Account data and content you create: as long as the account is active.</li>
        <li>Confirmation and password-reset codes: they expire automatically after 15 minutes.</li>
        {LEGAL.showcase && <li><strong>Public demo:</strong> accounts created by visitors and all their content (projects, messages, files) are deleted automatically within 24 hours, when the demo data is reloaded. The demo accounts shown on the sign-in page are fictional.</li>}
      </ul>

      <h2>7.1. Deleting your account</h2>
      <p>
        You can delete your account at any time from <strong>Settings → Danger zone</strong>, confirming with your
        password. Deletion is immediate and permanent:
      </p>
      <ul>
        <li>
          <strong>Deleted</strong>: your account and profile data (name, email, phone, picture, bio, password, PIN),
          your notifications, join requests, invitations sent or received, and your team memberships.
        </li>
        <li>
          <strong>Kept, without your name</strong>: documents, tasks, comments and messages in your team’s projects,
          evaluations given and the activity history. They are part of the team’s work, so we keep them, but they are
          shown as belonging to a “Deleted user”.
        </li>
        <li>
          Some notifications received by other users before the deletion may contain your name in their text (for
          example, “X added a document”) until those users delete them.
        </li>
      </ul>
      <p>If you no longer have access to your account, you can request deletion at {mail}.</p>

      <h2>8. Your rights</h2>
      <p>Under the GDPR you have the right:</p>
      <ul>
        <li>to find out what data we hold about you and to receive a copy of it (right of access);</li>
        <li>to correct inaccurate data: you can change most of it directly on the Settings page;</li>
        <li>to request erasure of your data (“right to be forgotten”);</li>
        <li>to request restriction of processing or to object to processing based on legitimate interest;</li>
        <li>to receive your data in a structured format, so you can transfer it (portability);</li>
        <li>to withdraw consent for optional data, without affecting earlier processing;</li>
        <li>
          to lodge a complaint with the Romanian National Supervisory Authority for Personal Data Processing
          (<a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">dataprotection.ro</a>).
        </li>
      </ul>
      <p>To exercise your rights, write to {mail}. We reply within 30 days at most.</p>

      <h2>9. Security</h2>
      <p>
        Passwords and PINs are stored only as hashes (bcrypt), codes sent by email are stored only as hashes and
        expire after 15 minutes, and sessions use short-lived tokens.
        {SENDS_EMAIL && " Your email address is confirmed with a code before the account is activated."} After 5 wrong password or PIN attempts the account is temporarily locked,
        and the number of requests an IP address can make is limited. Optionally, you can enable a
        <strong> security PIN</strong> in Settings, requested at sign-in after your password. However, no method of
        transmission or storage is completely secure, and the platform is an academic and portfolio project, not a
        commercial service.
      </p>

      <h2>10. Minimum age</h2>
      <p>The platform is intended for students and teaching staff. You cannot create an account if you are under 16.</p>

      <h2>11. Changes to this policy</h2>
      <p>
        If we change this policy, we update the date above. For important changes, we will let you know by email or
        through a notification in the application.
      </p>

      <p className="mt-8">
        See also the <Link href="/terms">Terms and Conditions</Link>.
      </p>
    </>
  );
}
