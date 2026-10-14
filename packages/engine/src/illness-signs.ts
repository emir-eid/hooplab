// Gece işaretleri: uyku nabzı, SpO2 ve cilt sıcaklığının tanı koymayan notları (rules/hastalik-isaretleri.json,
// karar 0039). Solunumun tek gece notu (karar 0028) recovery.ts'te. Hiçbiri günün durumuna girmez; not çıkınca uygulama
// yalnız sabit yönlendirme metni gösterir (CLAUDE.md §3: tanı yok, yönlendirme var).
// Tarihler "YYYY-AA-GG" takvim günleri. Hesaplanamıyorsa sonuç null; eksik gece sıfır sayılmaz.

import { addIsoDays, type DayValue } from './recovery.ts';

/** rules/hastalik-isaretleri.json → gece-nabzi-yuksek */
export const nightRhrRule = { aboveBaselineMedian: 4, consecutiveNights: 2, baselineDays: 28, minBaselineNights: 7 } as const;

/** rules/hastalik-isaretleri.json → gece-spo2-dusuk */
export const nightSpo2Rule = {
  belowPct: 93.5,
  belowBaselineMedian: 3,
  nightsRequired: 2,
  nightsWindow: 3,
  baselineDays: 28,
  minBaselineNights: 7,
} as const;

/** rules/hastalik-isaretleri.json → cilt-sicakligi-yuksek */
export const skinTempRule = { aboveBaseline: 0.3, consecutiveNights: 2 } as const;

export interface NightValue {
  date: string;
  value: number;
}

export interface NightRhrSign {
  /** Son iki gece medyanın en az 4 atım/dk üstünde. Yakın tarihli ardışık iki gece ya da yeterli taban yoksa null. */
  flagged: boolean | null;
  /** Değerlendirilen geceler (eskiden yeniye). */
  nights: NightValue[];
  baselineMedian: number | null;
  baselineN: number;
}

export type Spo2Reason = 'below_floor' | 'below_baseline';

export interface NightSpo2Sign {
  /** Son üç gecenin en az ikisinde mutlak sınırın ya da kişisel medyanın 3 puan altının altında. Yakın gece yoksa null. */
  flagged: boolean | null;
  reasons: Spo2Reason[];
  /** Penceredeki geceler (eskiden yeniye). */
  nights: NightValue[];
  /** Kişisel medyan; yetersizse null ve yalnız mutlak sınıra bakılır. */
  baselineMedian: number | null;
  baselineN: number;
}

export interface SkinTempNight {
  date: string;
  /** Gece cilt sıcaklığı − cihazın o gece için verdiği taban (°C). */
  deviation: number;
}

export interface SkinTempSign {
  /** Son iki gece sapma en az +0,3 °C. Yakın tarihli ardışık iki gece yoksa null. */
  flagged: boolean | null;
  nights: SkinTempNight[];
}

export interface IllnessSigns {
  rhr: NightRhrSign;
  spo2: NightSpo2Sign;
  skinTemp: SkinTempSign;
}

export interface SkinTempValue {
  date: string;
  nightly: number | null;
  baseline: number | null;
}

/** Kayan nokta farkları (36,6 − 36,3 = 0,30000000000000426) sınırda yanlış sonuç vermesin; cihaz değerleri en çok 3 basamak. */
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** Geçerli (sonlu, pozitif) değerler, tarihe göre tekil ve sıralı. Aynı gün iki kez gelirse sonuncusu. */
function valid(series: readonly DayValue[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of series) if (d.value !== null && Number.isFinite(d.value) && d.value > 0) out.set(d.date, d.value);
  return out;
}

/** En yeni gece bugün ya da dün mü (solunum notuyla aynı: eski bir gece "son gece" sayılmaz). */
function latestRecent(byDate: ReadonlyMap<string, unknown>, today: string): string | null {
  for (const date of [today, addIsoDays(today, -1)]) if (byDate.has(date)) return date;
  return null;
}

/** `last` gecesiyle biten ardışık `count` gece; biri eksikse null. */
function consecutive<T>(byDate: ReadonlyMap<string, T>, last: string, count: number): { date: string; value: T }[] | null {
  const out: { date: string; value: T }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = addIsoDays(last, -i);
    const value = byDate.get(date);
    if (value === undefined) return null;
    out.push({ date, value });
  }
  return out;
}

/** `firstNight`'tan önceki `days` gündeki değerler (taban). */
function baselineBefore(byDate: ReadonlyMap<string, number>, firstNight: string, days: number): number[] {
  const from = addIsoDays(firstNight, -days);
  const out: number[] = [];
  for (const [date, value] of byDate) if (date >= from && date < firstNight) out.push(value);
  return out;
}

/** Uyku nabzı (gece-nabzi-yuksek; NREM, karar 0041). Taban, değerlendirilen iki geceden önceki 28 günün medyanı. */
export function readNightRhr(series: readonly DayValue[], today: string): NightRhrSign {
  const byDate = valid(series);
  const last = latestRecent(byDate, today);
  const nights = last === null ? null : consecutive(byDate, last, nightRhrRule.consecutiveNights);
  if (nights === null) return { flagged: null, nights: [], baselineMedian: null, baselineN: 0 };
  const base = baselineBefore(byDate, nights[0]!.date, nightRhrRule.baselineDays);
  const evaluated = nights.map((n) => ({ date: n.date, value: n.value }));
  if (base.length < nightRhrRule.minBaselineNights) return { flagged: null, nights: evaluated, baselineMedian: null, baselineN: base.length };
  const m = median(base);
  return {
    flagged: evaluated.every((n) => round3(n.value - m) >= nightRhrRule.aboveBaselineMedian),
    nights: evaluated,
    baselineMedian: m,
    baselineN: base.length,
  };
}

/** Gece SpO2 ortalaması (gece-spo2-dusuk). Pencere en yeni geceyle biten 3 takvim gecesi; eksik gece sayılmaz. */
export function readNightSpo2(series: readonly DayValue[], today: string): NightSpo2Sign {
  const byDate = valid(series);
  const last = latestRecent(byDate, today);
  if (last === null) return { flagged: null, reasons: [], nights: [], baselineMedian: null, baselineN: 0 };
  const first = addIsoDays(last, -(nightSpo2Rule.nightsWindow - 1));
  const nights: NightValue[] = [];
  for (let i = nightSpo2Rule.nightsWindow - 1; i >= 0; i--) {
    const date = addIsoDays(last, -i);
    const value = byDate.get(date);
    if (value !== undefined) nights.push({ date, value });
  }
  const base = baselineBefore(byDate, first, nightSpo2Rule.baselineDays);
  const m = base.length >= nightSpo2Rule.minBaselineNights ? median(base) : null;
  const reasons: Spo2Reason[] = [];
  if (nights.filter((n) => n.value < nightSpo2Rule.belowPct).length >= nightSpo2Rule.nightsRequired) reasons.push('below_floor');
  if (m !== null && nights.filter((n) => round3(m - n.value) >= nightSpo2Rule.belowBaselineMedian).length >= nightSpo2Rule.nightsRequired) {
    reasons.push('below_baseline');
  }
  return { flagged: reasons.length > 0, reasons, nights, baselineMedian: m, baselineN: base.length };
}

/** Gece cilt sıcaklığının cihaz tabanından sapması (cilt-sicakligi-yuksek). */
export function readSkinTemp(series: readonly SkinTempValue[], today: string): SkinTempSign {
  const byDate = new Map<string, number>();
  for (const d of series) {
    if (d.nightly === null || d.baseline === null || !Number.isFinite(d.nightly) || !Number.isFinite(d.baseline)) continue;
    byDate.set(d.date, d.nightly - d.baseline);
  }
  const last = latestRecent(byDate, today);
  const nights = last === null ? null : consecutive(byDate, last, skinTempRule.consecutiveNights);
  if (nights === null) return { flagged: null, nights: [] };
  const evaluated = nights.map((n) => ({ date: n.date, deviation: n.value }));
  return { flagged: evaluated.every((n) => round3(n.deviation) >= skinTempRule.aboveBaseline), nights: evaluated };
}

export interface IllnessSignInputs {
  rhr: readonly DayValue[];
  spo2: readonly DayValue[];
  skinTemp: readonly SkinTempValue[];
}

export function readIllnessSigns(inputs: IllnessSignInputs, today: string): IllnessSigns {
  return { rhr: readNightRhr(inputs.rhr, today), spo2: readNightSpo2(inputs.spo2, today), skinTemp: readSkinTemp(inputs.skinTemp, today) };
}

/** Not çıkan işaretler, sabit sırayla. */
export type IllnessSignKey = 'rhr' | 'spo2' | 'skinTemp';

export function flaggedSigns(signs: IllnessSigns): IllnessSignKey[] {
  return (['rhr', 'spo2', 'skinTemp'] as const).filter((k) => signs[k].flagged === true);
}
