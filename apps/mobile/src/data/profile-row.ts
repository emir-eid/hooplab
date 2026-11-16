// Profil satırı (karar 0061): veritabanındaki profiles satırından uygulamanın kullandığı biçime. Saf modül; sorgu
// profile.ts'te. Bilinmeyen ya da eksik değer sahibinin profiline (Google Health · basketbol) düşer: profil
// okunamazsa sahibinin ekranı hiç değişmez, Apple yolu yalnız açıkça apple_health yazan satırla açılır.

import type { DataSource } from '@hooplab/engine';

export type Sport = 'basketbol' | 'fitness';

export interface Profile {
  dataSource: DataSource;
  sport: Sport;
}

/** Sahibinin profili; profil okunamazken ve demo modunda da bu kullanılır. */
export const defaultProfile: Profile = { dataSource: 'google_health', sport: 'basketbol' };

export interface ProfileRow {
  data_source?: unknown;
  sport?: unknown;
}

export function toProfile(row: ProfileRow | null | undefined): Profile {
  return {
    dataSource: row?.data_source === 'apple_health' ? 'apple_health' : 'google_health',
    sport: row?.sport === 'fitness' ? 'fitness' : 'basketbol',
  };
}
