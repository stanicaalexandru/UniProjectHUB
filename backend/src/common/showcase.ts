import { ForbiddenException } from '@nestjs/common';
import { appError } from './errors';

// Modul demo public (SHOWCASE_MODE=true): datele se reincarca periodic din seed, iar conturile demo
// (adrese example.com) sunt folosite de toti vizitatorii, deci nu li se pot schimba parola, PIN-ul sau sterge.
export const isShowcase = () => process.env.SHOWCASE_MODE === 'true';

// Emailurile se trimit doar daca exista un cont SMTP configurat (MAIL_USER)
export const isMailConfigured = () => !!process.env.MAIL_USER;

// In demo, fara server de email, conturile noi sunt active imediat (fara cod de confirmare).
// Cand se configureaza emailul (MAIL_*), confirmarea prin cod revine automat.
export const skipsEmailVerification = () => isShowcase() && !isMailConfigured();

export const isSharedDemoAccount = (email?: string | null) =>
  isShowcase() && /@(student\.)?example\.com$/i.test(email ?? '');

export function assertNotSharedDemoAccount(user: { email?: string | null }) {
  if (isSharedDemoAccount(user.email)) throw new ForbiddenException(appError('DEMO_ACCOUNT_LOCKED'));
}
