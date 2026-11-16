// Beslenme hedefleri (karar 0029, research/rules/beslenme.json): gün tipine göre karbonhidrat ve her gün protein,
// g/kg × sabah kilosu. Hedef bir rehber aralık; alımla karşılaştırılmaz (öğün kaydı yok), eşik ya da uyarı değil.
// Düşük enerji yeterliliği (REDs) hesaplanmaz: enerji alımı ve yağsız kütle kaydedilmiyor (enerji-yeterliligi).

import { addIsoDays, type DayValue, type Sport } from './recovery.ts';
import type { SessionKind } from './region-load.ts';

export const dayTypes = ['rest', 'training', 'match', 'high'] as const;
export type DayType = (typeof dayTypes)[number];

/** rules/beslenme.json → karbonhidrat-gun-tipi (g/kg/gün). Maç çevresi: maçtan önceki gün, maç günü, sonraki gün (karar 0046). */
export const carbTargets: Readonly<Record<DayType, readonly [number, number]>> = {
  rest: [3, 5],
  training: [5, 7],
  match: [6, 8],
  high: [8, 10],
};

/** rules/beslenme.json → karbonhidrat-gun-tipi: yoğun gün koşulu (seansların toplam süresi). */
export const highDayRule = { minutesAtLeast: 180 } as const;

/**
 * rules/beslenme.json → karbonhidrat-gun-tipi-fitness (karar 0061 sıra 4): maç çevresi yok; genel fitness
 * programında antrenman günü dinlenmeyle aynı aralıkta, günde 2-3 saat yoğun antrenmanda 5-8.
 */
export const fitnessDayTypes = ['rest', 'training', 'high'] as const;
export const carbTargetsFitness: Readonly<Record<(typeof fitnessDayTypes)[number], readonly [number, number]>> = {
  rest: [3, 5],
  training: [3, 5],
  high: [5, 8],
};
export const highDayRuleFitness = { minutesAtLeast: 120 } as const;

/** Spora göre gün tipleri, karbonhidrat aralıkları ve yoğun gün koşulu. */
export const nutritionBySport = {
  basketbol: { dayTypes: dayTypes as readonly DayType[], carbTargets: carbTargets as Readonly<Partial<Record<DayType, readonly [number, number]>>>, highDayRule },
  fitness: { dayTypes: fitnessDayTypes as readonly DayType[], carbTargets: carbTargetsFitness as Readonly<Partial<Record<DayType, readonly [number, number]>>>, highDayRule: highDayRuleFitness },
} as const;

/**
 * rules/beslenme.json → karbonhidrat-gun-tipi: maç çevresi. Maç seansı kaydı o günü maç günü yapar;
 * maçtan bir gün önce ve bir gün sonra da maç çevresidir (mac-oncesi-gun, mac-sonrasi).
 */
export const matchDayRule = { kinds: ['game'] as readonly SessionKind[], offsets: [-1, 0, 1] as readonly number[] } as const;

/** Gün tipi için maç bilgisi: bugün maç var mı (takvim ya da işaret), dün ya da yarın maç var mı. */
export interface MatchDayFlags {
  today?: boolean;
  /** Dün maç vardı ya da yarın maç var (matchDayRule.offsets). */
  adjacent?: boolean;
}

/** rules/beslenme.json → protein-gunluk. noAddedGainAbove: meta-analizde bu değerin üstü ek kas kazanımı getirmedi (açıklamada anılır, tavan değil). */
export const proteinTarget = {
  range: [1.2, 2.0] as readonly [number, number],
  perMeal: 0.3,
  mealIntervalHours: [4, 5],
  noAddedGainAbove: 1.6,
} as const;

/** rules/beslenme.json → karbonhidrat-gun-tipi (weight_days): hedefte son 7 günün sabah kilosu ortalaması. */
export const targetWeightDays = 7;

/** Sabah kilosu girişi sınırı (kg); veritabanındaki CHECK ile aynı, bilimsel eşik değil. */
export const weightLimits = { min: 30, max: 250 } as const;

export function isValidWeight(kg: number): boolean {
  return Number.isFinite(kg) && kg >= weightLimits.min && kg <= weightLimits.max;
}

/**
 * Gün tipi, bu sırayla (karbonhidrat-gun-tipi, karar 0046): bugün maç varsa (takvim, işaret ya da maç seansı kaydı)
 * maç çevresi; seansların toplamı ≥ 180 dk ise yoğun; dün ya da yarın maç varsa maç çevresi; seans varsa antrenman;
 * yoksa dinlenme. Maç sabahı maç seansı henüz kaydedilmemiş olsa da gün maç çevresidir (mac-gunu).
 */
export function inferDayType(
  sessions: readonly { kind: SessionKind; durationMin: number }[],
  match: MatchDayFlags = {},
  sport: Sport = 'basketbol',
): DayType {
  if (sport === 'fitness') {
    // Fitness'ta maç çevresi yok (karbonhidrat-gun-tipi-fitness): maç bilgisi ve maç seansı gün tipini değiştirmez.
    const total = sessions.reduce((a, s) => a + s.durationMin, 0);
    if (total >= highDayRuleFitness.minutesAtLeast) return 'high';
    return sessions.length === 0 ? 'rest' : 'training';
  }
  if (match.today || sessions.some((s) => matchDayRule.kinds.includes(s.kind))) return 'match';
  const minutes = sessions.reduce((a, s) => a + s.durationMin, 0);
  if (minutes >= highDayRule.minutesAtLeast) return 'high';
  if (match.adjacent) return 'match';
  return sessions.length === 0 ? 'rest' : 'training';
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

export function nutritionTargets(dayType: DayType, weightKg: number | null, sport: Sport = 'basketbol'): NutritionTargets {
  // Fitness'ta maç çevresi gün tipi yok; eski bir kayıtta kalmışsa antrenman günü sayılır.
  const carbsPerKg = sport === 'fitness' ? carbTargetsFitness[dayType === 'match' ? 'training' : dayType] : carbTargets[dayType];
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
