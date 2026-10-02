import { ForbiddenException } from '@nestjs/common';
import { appError } from './errors';

// Modul demo public (SHOWCASE_MODE=true): datele se reincarca periodic din seed, iar conturile demo
// (adrese example.com) sunt folosite de toti vizitatorii, deci nu li se pot schimba parola, PIN-ul sau sterge.
export const isShowcase = () => process.env.SHOWCASE_MODE === 'true';

export const isSharedDemoAccount = (email?: string | null) =>
  isShowcase() && /@(student\.)?example\.com$/i.test(email ?? '');

export function assertNotSharedDemoAccount(user: { email?: string | null }) {
  if (isSharedDemoAccount(user.email)) throw new ForbiddenException(appError('DEMO_ACCOUNT_LOCKED'));
}
