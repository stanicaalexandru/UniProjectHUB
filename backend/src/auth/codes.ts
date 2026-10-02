import { randomInt, createHash, timingSafeEqual } from 'crypto';

// Coduri de 6 cifre pentru confirmarea emailului si resetarea parolei.
// - randomInt e criptografic sigur (Math.random nu e)
// - in baza de date se pastreaza doar hash-ul, ca un acces la DB sa nu dezvaluie coduri valabile
// - dupa MAX_CODE_ATTEMPTS incercari gresite codul se anuleaza, altfel cele 1.000.000 de combinatii s-ar putea incerca pe rand
export const CODE_TTL_MS = 15 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function secretMatches(value: string | undefined, storedHash: string | null | undefined): boolean {
  if (!value || !storedHash) return false;
  const a = Buffer.from(hashSecret(value));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}
