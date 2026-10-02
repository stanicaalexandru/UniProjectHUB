type Person = { firstName?: string; lastName?: string; avatar?: string | null } | null | undefined;

const SIZES = { xs: "w-6 h-6 text-[10px]", sm: "w-7 h-7 text-xs", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm", xl: "w-16 h-16 text-xl" };

// Poza de profil sau initialele; decorativa (numele apare mereu langa ea)
export function Avatar({ user, size = "md", className = "" }: { user: Person; size?: keyof typeof SIZES; className?: string }) {
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}` || "?";
  return (
    <div className={`${SIZES[size]} rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-800 dark:text-blue-300 flex-shrink-0 overflow-hidden ${className}`} aria-hidden="true">
      {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}
