// Profil satırı (karar 0061): veritabanındaki profiles satırından uygulamanın kullandığı biçime. Saf modül; sorgu
// profile.ts'te. Bilinmeyen ya da eksik değer sahibinin profiline (Google Health · basketbol) düşer: profil
// okunamazsa sahibinin ekranı hiç değişmez, Apple yolu yalnız açıkça apple_health yazan satırla açılır.
// İlk giriş soruları (sıra 4c): cinsiyet, döngü takibi, hormonal korunma; yalnız açıkça boş answered_at soruları açar.

import type { DataSource, Sport } from '@hooplab/engine';

export type { Sport };

export type Sex = 'kadin' | 'erkek';
export type Contraception = 'yok' | 'var' | 'belirtmek_istemiyorum';

export interface Profile {
  dataSource: DataSource;
  sport: Sport;
  /** Boş: belirtilmemiş. Döngü özellikleri yalnız 'kadin' iken anlamlı (veritabanı CHECK'i). */
  sex: Sex | null;
  cycleTracking: boolean;
  contraception: Contraception | null;
  /** İlk giriş soruları yanıtlandı ya da geçildi mi? Okunamazsa evet sayılır: kimse soru ekranında kilitlenmez. */
  answered: boolean;
}

/** Sahibinin profili; profil okunamazken ve demo modunda da bu kullanılır. */
export const defaultProfile: Profile = {
  dataSource: 'google_health',
  sport: 'basketbol',
  sex: null,
  cycleTracking: false,
  contraception: null,
  answered: true,
};

export interface ProfileRow {
  data_source?: unknown;
  sport?: unknown;
  sex?: unknown;
  cycle_tracking?: unknown;
  hormonal_contraception?: unknown;
  answered_at?: unknown;
}

const contraceptions: readonly Contraception[] = ['yok', 'var', 'belirtmek_istemiyorum'];

export function toProfile(row: ProfileRow | null | undefined): Profile {
  const sex: Sex | null = row?.sex === 'kadin' || row?.sex === 'erkek' ? row.sex : null;
  const female = sex === 'kadin';
  return {
    dataSource: row?.data_source === 'apple_health' ? 'apple_health' : 'google_health',
    sport: row?.sport === 'fitness' ? 'fitness' : 'basketbol',
    sex,
    cycleTracking: female && row?.cycle_tracking === true,
    contraception: female && contraceptions.includes(row?.hormonal_contraception as Contraception) ? (row!.hormonal_contraception as Contraception) : null,
    // Yalnız satırda açıkça boş (null) yazıyorsa sorulmamış; sütun yoksa ya da satır yoksa sorulmuş sayılır.
    answered: row?.answered_at !== null,
  };
}

/** Soruların yanıtı. Döngü soruları yalnız Apple profilinde sorulur (döngü verisi HealthKit'ten, karar 0061). */
export interface ProfileAnswers {
  sex: Sex | null;
  cycleTracking: boolean;
  contraception: Contraception | null;
}

/** Ekrandaki yanıttan veritabanı güncellemesine; CHECK'lerle uyumlu (döngü ve korunma yalnız kadın profilinde). */
export function profileUpdate(a: ProfileAnswers, nowIso: string) {
  const female = a.sex === 'kadin';
  const cycle = female && a.cycleTracking;
  return {
    sex: a.sex,
    cycle_tracking: cycle,
    hormonal_contraception: cycle ? a.contraception : null,
    answered_at: nowIso,
  };
}
