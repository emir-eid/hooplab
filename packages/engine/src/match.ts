// Maç takvimi ve maç çevresi (karar 0046, research/rules/mac.json): maçtan önceki gün (MD-1), maç günü (MD) ve
// maçtan sonraki gün (MD+1). Günün durumu değişmez; burada yalnız bağlam ve maç saatine göre zamanlama hesaplanır.
// Kişisel doz yok: gram ve mililitre kaynaktaki g/kg ve mL/kg aralığı × sabah kilosu (beslenme hedefiyle aynı kilo).

import { isValidWeight } from './nutrition.ts';
import { addIsoDays } from './recovery.ts';

export const venues = ['home', 'away'] as const;
export type Venue = (typeof venues)[number];

export interface Match {
  /** Yerel tarih "YYYY-AA-GG". */
  date: string;
  /** Başlama saati "SS:DD" (maçın oynandığı yerin saati); bilinmiyorsa null. */
  startTime: string | null;
  venue: Venue | null;
}

/** rules/mac.json → mac-oncesi-ogun */
export const preMatchMealRule = {
  mealHoursBefore: [3, 4] as readonly [number, number],
  mealCarbsPerKg: [1, 3] as readonly [number, number],
  fluidHoursBefore: [2, 4] as readonly [number, number],
  fluidMlPerKg: [5, 7] as readonly [number, number],
} as const;

/** rules/mac.json → mac-gunu-sekerleme */
export const matchNapRule = {
  minutes: [30, 60] as readonly [number, number],
  window: ['12:30', '16:50'] as readonly [string, string],
  wakeBeforeHours: 1,
} as const;

/** rules/mac.json → mac-sonrasi */
export const postMatchRule = {
  nightStart: '18:00',
  sleepShorterMin: { night: 80, day: 20 },
  postCarbsPerKgPerHour: 1,
  postCarbsHours: 4,
  performanceHours: [24, 48] as readonly [number, number],
  sorenessHours: [24, 48] as readonly [number, number],
} as const;

/** Maç saati girişi: 15 dakikalık adım (gösterim tercihi, eşik değil). Varsayılan akşam maçı. */
export const matchTimeStepMinutes = 15;
export const defaultMatchTime = '19:00';

const clockPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidClock(clock: string): boolean {
  return clockPattern.test(clock);
}

/** "SS:DD" → günün dakikası. */
export function clockMinutes(clock: string): number {
  const m = clockPattern.exec(clock);
  if (!m) throw new Error(`geçersiz saat: ${clock}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Günün dakikası → "SS:DD"; gün dışına taşarsa null. */
export function minutesClock(minutes: number): string | null {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Saati bir adım ileri / geri; gün içinde döner (23:45 → 00:00). */
export function stepClock(clock: string, direction: 1 | -1, step = matchTimeStepMinutes): string {
  const day = 24 * 60;
  const next = (((clockMinutes(clock) + direction * step) % day) + day) % day;
  return minutesClock(next)!;
}

export interface MatchesAround {
  yesterday: Match | null;
  today: Match | null;
  tomorrow: Match | null;
}

/** Bugünün, dünün ve yarının maçı (günde en fazla bir maç). */
export function matchesAround(today: string, matches: readonly Match[]): MatchesAround {
  const on = (date: string) => matches.find((m) => m.date === date) ?? null;
  return { yesterday: on(addIsoDays(today, -1)), today: on(today), tomorrow: on(addIsoDays(today, 1)) };
}

/** Akşam maçı mı (başlama 18:00 ve sonrası, mac-sonrasi); saat bilinmiyorsa null. */
export function isNightMatch(match: Match): boolean | null {
  if (match.startTime === null || !isValidClock(match.startTime)) return null;
  return clockMinutes(match.startTime) >= clockMinutes(postMatchRule.nightStart);
}

/** Maç gecesi uykuda beklenen kısalma (dakika, grup ortalaması); saat bilinmiyorsa null. Eşik değil. */
export function expectedSleepLossMin(match: Match): number | null {
  const night = isNightMatch(match);
  if (night === null) return null;
  return night ? postMatchRule.sleepShorterMin.night : postMatchRule.sleepShorterMin.day;
}

export interface ClockRange {
  from: string;
  to: string;
}

export interface PreMatchPlan {
  /** Ana öğün: başlamadan 4-3 saat önce. */
  meal: ClockRange;
  /** Öğünün karbonhidratı (g); kilo yoksa null, yalnız g/kg gösterilir. */
  mealCarbsG: [number, number] | null;
  /** Sıvı: başlamadan 4-2 saat önce. */
  fluid: ClockRange;
  /** Sıvı (mL, 10'a yuvarlı); kilo yoksa null. */
  fluidMl: [number, number] | null;
  /** Şekerleme penceresi; maç saatine sığmıyorsa null. */
  nap: ClockRange | null;
}

function before(start: number, hours: readonly [number, number]): ClockRange | null {
  const from = minutesClock(start - hours[1] * 60);
  const to = minutesClock(start - hours[0] * 60);
  return from && to ? { from, to } : null;
}

/**
 * Maç saatine göre öğün, sıvı ve şekerleme zamanlaması (mac-oncesi-ogun, mac-gunu-sekerleme).
 * Saat bilinmiyorsa ya da pencere gece yarısından önceye taşıyorsa null.
 */
export function preMatchPlan(match: Match, weightKg: number | null): PreMatchPlan | null {
  if (match.startTime === null || !isValidClock(match.startTime)) return null;
  const start = clockMinutes(match.startTime);
  const meal = before(start, preMatchMealRule.mealHoursBefore);
  const fluid = before(start, preMatchMealRule.fluidHoursBefore);
  if (!meal || !fluid) return null;
  const kg = weightKg !== null && isValidWeight(weightKg) ? weightKg : null;
  const carbs = preMatchMealRule.mealCarbsPerKg;
  const ml = preMatchMealRule.fluidMlPerKg;
  const round10 = (x: number) => Math.round(x / 10) * 10;
  return {
    meal,
    mealCarbsG: kg === null ? null : [Math.round(carbs[0] * kg), Math.round(carbs[1] * kg)],
    fluid,
    fluidMl: kg === null ? null : [round10(ml[0] * kg), round10(ml[1] * kg)],
    nap: napWindow(start),
  };
}

/** Şekerleme penceresi: 12:30'dan, en geç 16:50'ye ve maçtan 1 saat öncesine kadar; en kısa şekerleme sığmıyorsa null. */
function napWindow(start: number): ClockRange | null {
  const from = clockMinutes(matchNapRule.window[0]);
  const to = Math.min(clockMinutes(matchNapRule.window[1]), start - matchNapRule.wakeBeforeHours * 60);
  if (to - from < matchNapRule.minutes[0]) return null;
  return { from: minutesClock(from)!, to: minutesClock(to)! };
}

/** Maç sonrası karbonhidrat (g/saat, kaç saat); kilo yoksa grams null. */
export function postMatchCarbs(weightKg: number | null): { gramsPerHour: number | null; hours: number } {
  const kg = weightKg !== null && isValidWeight(weightKg) ? weightKg : null;
  return {
    gramsPerHour: kg === null ? null : Math.round(postMatchRule.postCarbsPerKgPerHour * kg),
    hours: postMatchRule.postCarbsHours,
  };
}
