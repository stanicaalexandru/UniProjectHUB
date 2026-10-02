// Date comune pentru paginile legale. Numele si emailul operatorului vin din .env.local
// (care nu se urca pe git), ca sa nu apara in codul sursa public.
export const LEGAL = {
  operatorName: (process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME || null) as string | null,
  contactEmail: process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL || "contact@example.com",
  // De completat cand aplicatia va fi publicata (ex. "Hetzner Online GmbH, Germania")
  hostingProvider: (process.env.NEXT_PUBLIC_LEGAL_HOSTING_PROVIDER || null) as string | null,
  // Serviciul prin care pleaca emailurile aplicatiei (ex. "Brevo (Sendinblue SAS, Franța)")
  emailProvider: (process.env.NEXT_PUBLIC_LEGAL_EMAIL_PROVIDER || null) as string | null,
  // Demo public: conturile si datele create de vizitatori se sterg automat
  showcase: process.env.NEXT_PUBLIC_SHOWCASE === "true",
};

export const LAST_UPDATED = { ro: "29 septembrie 2026", en: "29 September 2026" };
