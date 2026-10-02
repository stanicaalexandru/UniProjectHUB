type Person = { firstName?: string; lastName?: string; avatar?: string | null } | null | undefined;

const SIZES = { xs: "w-6 h-6 text-[10px]", sm: "w-7 h-7 text-xs", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm", xl: "w-16 h-16 text-xl" };

// Poza de profil sau initialele; decorativa (numele apare mereu langa ea)
export function Avatar({ user, size = "md", className = "" }: { user: Person; size?: keyof typeof SIZES; className?: string }) {
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "?";
  return (
    <div className={`${SIZES[size]} rounded-full ${toneOf(user)} flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden ${className}`} aria-hidden="true">
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

// Culoarea initialelor se alege dupa nume, ca aceeasi persoana sa aiba mereu aceeasi culoare
const TONES = ["bg-tone-blue", "bg-tone-green", "bg-tone-amber", "bg-tone-rose", "bg-tone-violet", "bg-tone-orange"];
const toneOf = (p: Person) => {
  const name = `${p?.firstName ?? ""}${p?.lastName ?? ""}`;
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
};

// Avatarele suprapuse ale membrilor; primele `max`, apoi "+N". Numele complete sunt in eticheta grupului.
export function AvatarStack({ people, max = 3, label }: { people: Person[]; max?: number; label: string }) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const names = people.map(p => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim()).join(", ");
  return (
    <div className="flex items-center" role="img" aria-label={`${label}: ${names}`} title={names}>
      {shown.map((p, i) => (
        <span key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden ${i > 0 ? "-ml-2" : ""} ${toneOf(p)}`}>
          {p?.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : `${p?.firstName?.[0] ?? ""}${p?.lastName?.[0] ?? ""}` || "?"}
        </span>
      ))}
      {rest > 0 && <span className="-ml-2 w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">+{rest}</span>}
    </div>
  );
}
