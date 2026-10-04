// Seans yükü = RPE × süre (dakika), keyfi birim (AU). rules/yuk.json → seans-yuku.
// Yük veritabanında saklanmaz; her gösterimde buradan hesaplanır.

import { isOnScale, rpeScale } from './scales.ts';

/** Seans süresinin veri girişi sınırı (dakika). Veritabanındaki CHECK ile aynı; bilimsel eşik değildir. */
export const durationLimits = { min: 1, max: 600 } as const;

/** RPE veya süre geçersizse null döner; uydurma sayı üretmez. */
export function sessionLoad(rpe: number, durationMin: number): number | null {
  if (!isOnScale(rpeScale, rpe) || !isOnScale(durationLimits, durationMin)) return null;
  return rpe * durationMin;
}
