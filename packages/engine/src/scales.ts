// Kullanıcı girdisi ölçekleri. Her değer research/rules içindeki bir kurala karşılık gelir;
// test/rules-sync.test.ts ikisinin aynı kaldığını denetler. Veritabanındaki CHECK'ler de bu aralıkları kullanır.

/** Sabah check-in maddeleri (rules/iyi-olus.json → checkin-olcek). Sıra formdaki sıradır. */
export const wellnessItems = ['sleep_quality', 'fatigue', 'soreness', 'stress', 'mood'] as const;
export type WellnessItem = (typeof wellnessItems)[number];

/** Her madde 1-5 tam sayı; tüm maddelerde 5 = en iyi (karar 0017). */
export const wellnessScale = { min: 1, max: 5, step: 1 } as const;

/** Seans RPE, değiştirilmiş CR-10 (rules/yuk.json → seans-rpe-olcek). */
export const rpeScale = { min: 0, max: 10, step: 1 } as const;

/** Sözel çapası olan RPE değerleri; diğerlerinin karşılığı yok (Foster 2001, haddad-2017 tablo 1). */
export const rpeAnchors = [0, 1, 2, 3, 4, 5, 7, 10] as const;
export type RpeAnchor = (typeof rpeAnchors)[number];

/** Ağrı haritası, NRS-11 (rules/agri.json → agri-olcek). 0 = yok, 10 = en kötü. */
export const painScale = { min: 0, max: 10, step: 1 } as const;

interface IntScale {
  readonly min: number;
  readonly max: number;
}

/** Değer ölçeğin içinde bir tam sayı mı? */
export function isOnScale(scale: IntScale, value: number): boolean {
  return Number.isInteger(value) && value >= scale.min && value <= scale.max;
}
