// Beslenme hedefleri (karar 0029, research/rules/beslenme.json): gün tipine göre karbonhidrat ve her gün protein,
// g/kg × sabah kilosu. Hedef bir rehber aralık; alımla karşılaştırılmaz (öğün kaydı yok), eşik ya da uyarı değil.
// Düşük enerji yeterliliği (REDs) hesaplanmaz: enerji alımı ve yağsız kütle kaydedilmiyor (enerji-yeterliligi).

import { addIsoDays, type DayValue } from './recovery.ts';
import type { SessionKind } from './region-load.ts';

export const dayTypes = ['rest', 'training', 'high'] as const;
export type DayType = (typeof dayTypes)[number];

/** rules/beslenme.json → karbonhidrat-gun-tipi (g/kg/gün) */
export const carbTargets: Readonly<Record<DayType, readonly [number, number]>> = {
  rest: [3, 5],
  training: [5, 7],
  high: [8, 10],
};

/** rules/beslenme.json → karbonhidrat-gun-tipi: yoğun gün koşulu. */
export const highDayRule = { minutesAtLeast: 180, kinds: ['game'] as readonly SessionKind[] } as const;

/** rules/beslenme.json → protein-gunluk */
export const proteinTarget = { range: [1.2, 2.0] as readonly [number, number], perMeal: 0.3, mealIntervalHours: [4, 5] } as const;

/** Hedefte kullanılan kilo penceresi (gün): son 7 günün sabah kilosu ortalaması. */
export const targetWeightDays = 7;

/** Sabah kilosu girişi sınırı (kg); veritabanındaki CHECK ile aynı, bilimsel eşik değil. */
export const weightLimits = { min: 30, max: 250 } as const;

export function isValidWeight(kg: number): boolean {
  return Number.isFinite(kg) && kg >= weightLimits.min && kg <= weightLimits.max;
}

/** O günün seanslarından gün tipi: seans yoksa dinlenme, maç ya da toplam ≥ 180 dk ise yoğun, değilse antrenman. */
export function inferDayType(sessions: readonly { kind: SessionKind; durationMin: number }[]): DayType {
  if (sessions.length === 0) return 'rest';
  const minutes = sessions.reduce((a, s) => a + s.durationMin, 0);
  if (minutes >= highDayRule.minutesAtLeast || sessions.some((s) => highDayRule.kinds.includes(s.kind))) return 'high';
  return 'training';
}

export interface TargetWeight {
  kg: number;
  /** 'average': son 7 günün ortalaması; 'latest': 7 günde ölçüm yok, en son ölçüm. */
  basis: 'average' | 'latest';
  n: number;
  /** En son ölçümün günü. */
  latestDate: string;
}

/** Hedefte kullanılacak kilo; hiç geçerli ölçüm yoksa null. Bugünden sonraki ölçümler sayılmaz. */
export function targetWeight(weights: readonly DayValue[], today: string): TargetWeight | null {
  const valid = weights
    .filter((w): w is { date: string; value: number } => w.value !== null && isValidWeight(w.value) && w.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const latest = valid.at(-1);
  if (!latest) return null;
  const from = addIsoDays(today, -(targetWeightDays - 1));
  const recent = valid.filter((w) => w.date >= from);
  if (recent.length === 0) return { kg: latest.value, basis: 'latest', n: 1, latestDate: latest.date };
  return { kg: recent.reduce((a, w) => a + w.value, 0) / recent.length, basis: 'average', n: recent.length, latestDate: latest.date };
}

export interface NutritionTargets {
  dayType: DayType;
  carbsPerKg: readonly [number, number];
  proteinPerKg: readonly [number, number];
  proteinPerMealPerKg: number;
  /** Gram olarak (kilo varsa); yoksa null ve yalnız g/kg gösterilir. */
  carbsG: [number, number] | null;
  proteinG: [number, number] | null;
  proteinPerMealG: number | null;
}

export function nutritionTargets(dayType: DayType, weightKg: number | null): NutritionTargets {
  const carbsPerKg = carbTargets[dayType];
  const proteinPerKg = proteinTarget.range;
  const kg = weightKg !== null && isValidWeight(weightKg) ? weightKg : null;
  const grams = (r: readonly [number, number]): [number, number] | null => (kg === null ? null : [Math.round(r[0] * kg), Math.round(r[1] * kg)]);
  return {
    dayType,
    carbsPerKg,
    proteinPerKg,
    proteinPerMealPerKg: proteinTarget.perMeal,
    carbsG: grams(carbsPerKg),
    proteinG: grams(proteinPerKg),
    proteinPerMealG: kg === null ? null : Math.round(proteinTarget.perMeal * kg),
  };
}
