// Sabah check-in toplamı: beş maddenin toplamı, 5-25 (rules/iyi-olus.json → checkin-olcek; zhang-2026).
// Kişisel kıyas: bugünkü toplamın önceki 28 gündeki kendi check-in'lerine göre z-skoru
// (rules/iyi-olus.json → checkin-kisisel, karar 0028). Popülasyon eşiği yok; günün durumuna girmez.

import { addIsoDays } from './recovery.ts';
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

/** rules/iyi-olus.json → checkin-kisisel */
export const checkinBaseline = { baselineDays: 28, minValues: 12, zNoteMax: -1 } as const;

export interface CheckinDay {
  date: string;
  answers: Partial<WellnessAnswers>;
}

export interface ItemDrop {
  item: WellnessItem;
  /** Önceki 28 gündeki ortalaması. */
  mean: number;
  today: number;
  /** mean − today; pozitifse bugün düşük. */
  drop: number;
}

export interface CheckinReading {
  date: string;
  /** Bugünkü toplam; bugün eksiksiz check-in yoksa null. */
  total: number | null;
  /** Başlangıçtaki geçerli check-in sayısı (bugün hariç, önceki 28 gün). */
  baselineN: number;
  baselineMean: number | null;
  baselineSd: number | null;
  /** (toplam − ortalama) / SD. Bugün check-in yoksa, başlangıç yetersizse veya SD 0 ise null. */
  z: number | null;
  /** z ≤ −1: "alıştığından belirgin düşük" notu. */
  low: boolean;
  /** Bugün kendi ortalamasının altında kalan maddeler, en çok düşenden başlayarak. z hesaplanamazsa boş. */
  drops: ItemDrop[];
}

const avg = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function readCheckin(days: readonly CheckinDay[], today: string): CheckinReading {
  const from = addIsoDays(today, -checkinBaseline.baselineDays);
  const to = addIsoDays(today, -1);
  const seen = new Set<string>();
  const base: WellnessAnswers[] = [];
  let todayAnswers: WellnessAnswers | null = null;
  for (const d of [...days].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    if (seen.has(d.date) || !isCompleteWellness(d.answers)) continue;
    seen.add(d.date);
    if (d.date === today) todayAnswers = d.answers;
    else if (d.date >= from && d.date <= to) base.push(d.answers);
  }

  const total = todayAnswers ? wellnessTotal(todayAnswers) : null;
  const empty: CheckinReading = { date: today, total, baselineN: base.length, baselineMean: null, baselineSd: null, z: null, low: false, drops: [] };
  if (base.length < checkinBaseline.minValues) return empty;

  const totals = base.map((a) => wellnessTotal(a)!);
  const m = avg(totals);
  const sd = Math.sqrt(totals.reduce((acc, x) => acc + (x - m) ** 2, 0) / (totals.length - 1));
  const withBand = { ...empty, baselineMean: m, baselineSd: sd };
  if (total === null || !todayAnswers || sd === 0) return withBand;

  const z = (total - m) / sd;
  const answers = todayAnswers;
  const drops = wellnessItems
    .map((item) => {
      const itemMean = avg(base.map((a) => a[item]));
      return { item, mean: itemMean, today: answers[item], drop: itemMean - answers[item] };
    })
    .filter((d) => d.drop > 0)
    .sort((a, b) => b.drop - a.drop || wellnessItems.indexOf(a.item) - wellnessItems.indexOf(b.item));
  return { ...withBand, z, low: z <= checkinBaseline.zNoteMax, drops };
}
