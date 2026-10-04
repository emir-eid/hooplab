// Sabah check-in toplamı: beş maddenin toplamı, 5-25 (rules/iyi-olus.json → checkin-olcek; zhang-2026).
// Toplam yalnız özet içindir; yorum kişisel baseline'a göre Faz 2'de yapılır (saw-2016).

import { isOnScale, wellnessItems, wellnessScale, type WellnessItem } from './scales.ts';

export type WellnessAnswers = Record<WellnessItem, number>;

export const wellnessTotalRange = {
  min: wellnessItems.length * wellnessScale.min,
  max: wellnessItems.length * wellnessScale.max,
} as const;

/** Eksik veya ölçek dışı madde varsa null; kısmi toplam üretilmez. */
export function wellnessTotal(answers: Partial<WellnessAnswers>): number | null {
  let total = 0;
  for (const item of wellnessItems) {
    const value = answers[item];
    if (value === undefined || !isOnScale(wellnessScale, value)) return null;
    total += value;
  }
  return total;
}

/** Formdaki tüm maddeler cevaplandı mı? Tip daraltır. */
export function isCompleteWellness(answers: Partial<WellnessAnswers>): answers is WellnessAnswers {
  return wellnessTotal(answers) !== null;
}
