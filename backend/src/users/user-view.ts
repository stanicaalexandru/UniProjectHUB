import { instanceToPlain } from 'class-transformer';
import { User } from './entities/user.entity';

// Datele unui user asa cum le vede el insusi: fara secrete (@Exclude), dar cu campurile strict personale
// (telefon, starea PIN-ului, preferinte, favorite, data acceptarii termenilor), ascunse in raspunsurile despre alti useri
export function toSelfView(user: User) {
  return {
    ...instanceToPlain(user),
    phone: user.phone ?? null,
    isPinEnabled: !!user.isPinEnabled,
    notificationPreferences: user.notificationPreferences ?? {},
    favoriteProjects: user.favoriteProjects ?? [],
    termsAcceptedAt: user.termsAcceptedAt ?? null,
  };
}
