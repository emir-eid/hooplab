// Antrenman yükü: günlük ve haftalık yük, EWMA akut / kronik yük ve oranı, monotonluk ve gerilim
// (rules/yuk.json, karar 0025). Oran sakatlık tahmini değildir; yalnız "alıştığın seviyeye göre" bağlamdır.
// Tarihler "YYYY-AA-GG" sporcunun yerel takvim günleri; saat dilimi çağıranın işidir (karar 0015).
// İlk kayıttan önceki günler bilinmiyor sayılır (0 sayılmaz); ilk kayıttan sonra seans olmayan gün 0 yüktür.

import { addIsoDays } from './recovery.ts';
import { sessionLoad } from './session-load.ts';

/** rules/yuk.json → yuk-haftalik */
export const loadWeek = { days: 7, averageWeeks: 4 } as const;

/** rules/yuk.json → yuk-ewma: λ = 2 / (N + 1) */
export const loadEwma = { acuteN: 7, chronicN: 28 } as const;

/** rules/yuk.json → yuk-orani */
export const loadRatioRule = { minHistoryDays: 28 } as const;

/** rules/yuk.json → yuk-artis-notu */
export const loadSpikeRule = { ratioMin: 1.5 } as const;

/** rules/yuk.json → yuk-monotonluk */
export const monotonyRule = { windowDays: 7 } as const;

export function ewmaLambda(n: number): number {
  return 2 / (n + 1);
}

export interface LoadSession {
  /** Seansın yerel günü. */
  date: string;
  rpe: number;
  durationMin: number;
}

export interface DayLoad {
  date: string;
  load: number;
}

export interface TrainingLoadReading {
  /** Hesabın ait olduğu gün: bugün kayıt varsa bugün, yoksa dün (sabah henüz girilmemiş seans oranı düşürmesin). */
  asOf: string;
  /** İlk kayıt günü; kayıt yoksa null. */
  historyStart: string | null;
  /** historyStart ile asOf arası gün sayısı (ikisi dahil); kayıt yoksa 0. */
  historyDays: number;
  /** asOf'ta biten son 7 günün toplamı (AU). */
  week: number | null;
  /** Ondan önceki 7 günün toplamı (AU). */
  previousWeek: number | null;
  /** Haftadan haftaya değişim (kesir; 0,25 = %25 artış). Önceki hafta 0 ise null. */
  weekChange: number | null;
  /** Son 28 günün haftalık ortalaması (AU / hafta). */
  weeklyAverage: number | null;
  /** EWMA akut ve kronik yük (AU / gün). */
  acute: number | null;
  chronic: number | null;
  /** Akut / kronik; yalnız bağlam. 28 günlük geçmiş yoksa veya kronik 0 ise null. */
  ratio: number | null;
  /** Oran ≥ 1,5: "alıştığından belirgin fazla" bilgi notu (tahmin). */
  spike: boolean;
  /** Son 7 günün ortalaması / örneklem SD'si. SD 0 ise null. */
  monotony: number | null;
  /** Son 7 günün toplamı × monotonluk (AU). */
  strain: number | null;
  /** historyStart'tan asOf'a günlük yük (en fazla son 28 gün; grafik için). */
  daily: DayLoad[];
}

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && addIsoDays(date, 0) === date;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/** Örneklem standart sapması (n − 1). */
function sampleSd(xs: readonly number[]): number {
  const m = sum(xs) / xs.length;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/**
 * [from, to] aralığında her gün için yük toplamı; seans olmayan gün 0. Geçersiz seans (RPE veya süre
 * ölçek dışı, tarih bozuk) atlanır.
 */
export function dailyLoads(sessions: readonly LoadSession[], from: string, to: string): DayLoad[] {
  if (!isIsoDate(from) || !isIsoDate(to)) throw new Error(`geçersiz gün: ${from} / ${to}`);
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    if (!isIsoDate(s.date) || s.date < from || s.date > to) continue;
    const load = sessionLoad(s.rpe, s.durationMin);
    if (load === null) continue;
    byDay.set(s.date, (byDay.get(s.date) ?? 0) + load);
  }
  const out: DayLoad[] = [];
  for (let d = from; d <= to; d = addIsoDays(d, 1)) out.push({ date: d, load: byDay.get(d) ?? 0 });
  return out;
}

/**
 * Normalleştirilmiş EWMA: ağırlıklar λ(1 − λ)^k (k = gün önce), ilk kayıt gününden itibaren toplamı 1 olacak
 * şekilde bölünür. Kayıt öncesi günler 0 sayılmaz; uzun geçmişte özyinelemeli formülle aynıdır (karar 0025).
 */
export function ewma(loads: readonly number[], n: number): number | null {
  if (loads.length === 0) return null;
  const lambda = ewmaLambda(n);
  let num = 0;
  let den = 0;
  for (const x of loads) {
    num = lambda * x + (1 - lambda) * num;
    den = lambda + (1 - lambda) * den;
  }
  return num / den;
}

export function readTrainingLoad(
  sessions: readonly LoadSession[],
  today: string,
  opts: { historyStart?: string } = {},
): TrainingLoadReading {
  if (!isIsoDate(today)) throw new Error(`geçersiz gün: ${today}`);
  const valid = sessions.filter((s) => isIsoDate(s.date) && s.date <= today && sessionLoad(s.rpe, s.durationMin) !== null);
  const asOf = valid.some((s) => s.date === today) ? today : addIsoDays(today, -1);

  const firstSession = valid.reduce<string | null>((min, s) => (min === null || s.date < min ? s.date : min), null);
  const startCandidates = [opts.historyStart, firstSession].filter((d): d is string => d !== undefined && d !== null && isIsoDate(d));
  const historyStart = startCandidates.length ? startCandidates.sort()[0]! : null;

  const empty: TrainingLoadReading = {
    asOf,
    historyStart,
    historyDays: 0,
    week: null,
    previousWeek: null,
    weekChange: null,
    weeklyAverage: null,
    acute: null,
    chronic: null,
    ratio: null,
    spike: false,
    monotony: null,
    strain: null,
    daily: [],
  };
  if (historyStart === null || historyStart > asOf) return empty;

  const days = dailyLoads(valid, historyStart, asOf);
  const loads = days.map((d) => d.load);
  const historyDays = days.length;
  const lastN = (n: number, skip = 0) => (historyDays >= n + skip ? loads.slice(historyDays - skip - n, historyDays - skip) : null);

  const weekLoads = lastN(loadWeek.days);
  const week = weekLoads ? sum(weekLoads) : null;
  const prevLoads = lastN(loadWeek.days, loadWeek.days);
  const previousWeek = prevLoads ? sum(prevLoads) : null;
  const weekChange = week !== null && previousWeek !== null && previousWeek > 0 ? (week - previousWeek) / previousWeek : null;
  const monthLoads = lastN(loadWeek.days * loadWeek.averageWeeks);
  const weeklyAverage = monthLoads ? sum(monthLoads) / loadWeek.averageWeeks : null;

  const acute = ewma(loads, loadEwma.acuteN);
  const chronic = ewma(loads, loadEwma.chronicN);
  const ratio =
    historyDays >= loadRatioRule.minHistoryDays && acute !== null && chronic !== null && chronic > 0 ? acute / chronic : null;

  const monoLoads = lastN(monotonyRule.windowDays);
  let monotony: number | null = null;
  let strain: number | null = null;
  if (monoLoads) {
    const sd = sampleSd(monoLoads);
    if (sd > 0) {
      monotony = sum(monoLoads) / monoLoads.length / sd;
      strain = sum(monoLoads) * monotony;
    }
  }

  return {
    asOf,
    historyStart,
    historyDays,
    week,
    previousWeek,
    weekChange,
    weeklyAverage,
    acute,
    chronic,
    ratio,
    spike: ratio !== null && ratio >= loadSpikeRule.ratioMin,
    monotony,
    strain,
    daily: days.slice(-loadWeek.days * loadWeek.averageWeeks),
  };
}
