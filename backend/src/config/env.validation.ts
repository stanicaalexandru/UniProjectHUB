// Verificarea variabilelor de mediu la pornire: mai bine refuzam sa pornim decat sa rulam cu secrete slabe.
// Fara asta, un JWT_SECRET lipsa ducea la o valoare implicita cunoscuta, cu care oricine putea semna token-uri de admin.
const PLACEHOLDER = /your-|change-in-prod|uniproject-secret|changeme/i;

export function validateEnv(env: Record<string, unknown>) {
  const errors: string[] = [];
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const v = String(env[key] ?? '');
    if (v.length < 32) errors.push(`${key} trebuie sa aiba minim 32 de caractere`);
    else if (PLACEHOLDER.test(v)) errors.push(`${key} are inca valoarea din .env.example`);
  }
  if (env.JWT_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) errors.push('JWT_SECRET si JWT_REFRESH_SECRET trebuie sa fie diferite');
  for (const key of ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME']) {
    if (!env[key]) errors.push(`${key} lipseste`);
  }
  if (env.NODE_ENV === 'production' && !env.FRONTEND_URL) errors.push('FRONTEND_URL este obligatoriu in productie (CORS)');
  if (errors.length) {
    throw new Error(`Configurare invalida in .env:\n - ${errors.join('\n - ')}\nGenereaza un secret cu: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
  }
  return env;
}
