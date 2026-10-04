// Toparlanma: HRV ve dinlenik nabzın kişisel bandı, 7 gecelik uyku ve günün durumu (rules/toparlanma.json, karar 0021).
// Tarihler "YYYY-AA-GG" takvim günleri; saat dilimi çağıranın işidir (sporcunun yerel günü, karar 0015).
// Veri yetersizse sonuç null döner; eksik günler sıfır sayılmaz, uydurma sayı üretilmez.

/** rules/toparlanma.json → toparlanma-bant */
export const recoveryBand = { rollingDays: 7, baselineDays: 28, sdMultiplier: 0.5 } as const;

/** rules/toparlanma.json → toparlanma-veri-yeterliligi */
export const recoveryMinValues = { rolling: 3, baseline: 12 } as const;

/** rules/toparlanma.json → uyku-kisa */
export const shortSleep = { minHours: 7, rollingNights: 7 } as const;

/** rules/toparlanma.json → hrv-olcu: bant ln üzerinden hesaplanır. */
export const hrvTransform = 'ln' as const;

/** Veri çekmek için gereken en eski gün: başlangıç penceresinin ilk günü. */
export const recoveryLookbackDays = recoveryBand.rollingDays + recoveryBand.baselineDays - 1;

export interface DayValue {
  date: string;
  value: number | null;
}

export type BandPosition = 'below' | 'within' | 'above';

export interface Band {
  mean: number;
  low: number;
  high: number;
  /** Başlangıç penceresindeki geçerli değer sayısı. */
  n: number;
}

export interface MetricReading {
  /** Son 7 günün ortalaması (gösterim biriminde: ms veya atım/dk). Yetersizse null. */
  rolling: number | null;
  rollingN: number;
  band: Band | null;
  baselineN: number;
  position: BandPosition | null;
  /** Penceredeki en yeni tek gün; "tek gece" olarak gösterilir, durumu belirlemez. */
  latest: { date: string; value: number } | null;
}

/** "2026-10-04" + n gün. Takvim günü; UTC üzerinden hesaplanır, saat dilimi kaymaz. */
export function addIsoDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && addIsoDays(date, 0) === date;
}

function mean(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Örneklem standart sapması (n − 1). */
function sampleSd(xs: readonly number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/** [from, to] aralığındaki geçerli (sonlu, pozitif) değerler; aynı gün iki kez gelirse ilki alınır. */
function valuesIn(series: readonly DayValue[], from: string, to: string): { date: string; value: number }[] {
  const seen = new Set<string>();
  const out: { date: string; value: number }[] = [];
  for (const { date, value } of series) {
    if (date < from || date > to || seen.has(date)) continue;
    if (value === null || !Number.isFinite(value) || value <= 0) continue;
    seen.add(date);
    out.push({ date, value });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Bir ölçümün 7 günlük ortalaması ve kişisel bandı. `log` true ise (HRV) ortalama ve bant ln üzerinden
 * hesaplanır, sonuç ms'ye geri çevrilir. Başlangıç penceresi 7 günlük pencereyle çakışmaz.
 */
export function readMetric(series: readonly DayValue[], today: string, opts: { log: boolean }): MetricReading {
  if (!isIsoDate(today)) throw new Error(`geçersiz gün: ${today}`);
  const f = opts.log ? Math.log : (x: number) => x;
  const inv = opts.log ? Math.exp : (x: number) => x;

  const rollingFrom = addIsoDays(today, -(recoveryBand.rollingDays - 1));
  const baselineTo = addIsoDays(rollingFrom, -1);
  const baselineFrom = addIsoDays(baselineTo, -(recoveryBand.baselineDays - 1));

  const recent = valuesIn(series, rollingFrom, today);
  const base = valuesIn(series, baselineFrom, baselineTo);

  const rollingT = recent.length >= recoveryMinValues.rolling ? mean(recent.map((x) => f(x.value))) : null;
  let bandT: { mean: number; low: number; high: number } | null = null;
  if (base.length >= recoveryMinValues.baseline) {
    const t = base.map((x) => f(x.value));
    const m = mean(t);
    const half = recoveryBand.sdMultiplier * sampleSd(t);
    bandT = { mean: m, low: m - half, high: m + half };
  }

  let position: BandPosition | null = null;
  if (rollingT !== null && bandT !== null) {
    position = rollingT < bandT.low ? 'below' : rollingT > bandT.high ? 'above' : 'within';
  }

  const last = recent.at(-1) ?? null;
  return {
    rolling: rollingT === null ? null : inv(rollingT),
    rollingN: recent.length,
    band: bandT === null ? null : { mean: inv(bandT.mean), low: inv(bandT.low), high: inv(bandT.high), n: base.length },
    baselineN: base.length,
    position,
    latest: last,
  };
}

export interface SleepReading {
  /** Son 7 gecenin ortalama uykusu (saat). Yetersizse null. */
  rollingHours: number | null;
  rollingN: number;
  short: boolean | null;
  lastNight: { date: string; minutes: number } | null;
}

/** Gece başına uykuda geçen dakika (şekerlemeler hariç, bitiş gününe göre) → 7 gecelik ortalama. */
export function readSleep(nights: readonly DayValue[], today: string): SleepReading {
  if (!isIsoDate(today)) throw new Error(`geçersiz gün: ${today}`);
  const from = addIsoDays(today, -(shortSleep.rollingNights - 1));
  const recent = valuesIn(nights, from, today);
  const hours = recent.length >= recoveryMinValues.rolling ? mean(recent.map((x) => x.value)) / 60 : null;
  const last = recent.at(-1) ?? null;
  return {
    rollingHours: hours,
    rollingN: recent.length,
    short: hours === null ? null : hours < shortSleep.minHours,
    lastNight: last === null ? null : { date: last.date, minutes: last.value },
  };
}

export type RecoverySignal = 'hrv_low' | 'hrv_high' | 'rhr_high' | 'sleep_short';
export type DayLevel = 'ready' | 'caution' | 'recover' | 'insufficient';

/** rules/toparlanma.json → gunun-durumu */
export const dayStatusRule = {
  recoverWhenAll: ['hrv_low', 'rhr_high'],
  cautionWhenAny: ['hrv_low', 'hrv_high', 'rhr_high', 'sleep_short'],
} as const satisfies { recoverWhenAll: readonly RecoverySignal[]; cautionWhenAny: readonly RecoverySignal[] };

export interface DayStatus {
  level: DayLevel;
  /** Durumu belirleyen işaretler, önem sırasıyla. 'insufficient' iken de uyku işareti gelebilir. */
  signals: RecoverySignal[];
}

export function recoverySignals(hrv: MetricReading, rhr: MetricReading, sleep: SleepReading): RecoverySignal[] {
  const s: RecoverySignal[] = [];
  if (hrv.position === 'below') s.push('hrv_low');
  if (hrv.position === 'above') s.push('hrv_high');
  if (rhr.position === 'above') s.push('rhr_high');
  if (sleep.short === true) s.push('sleep_short');
  return s;
}

/** HRV bandı yoksa durum üretilmez ('insufficient'); nabız veya uyku eksikse yalnız o işaret yok sayılır. */
export function dayStatus(hrv: MetricReading, rhr: MetricReading, sleep: SleepReading): DayStatus {
  const signals = recoverySignals(hrv, rhr, sleep);
  if (hrv.position === null) return { level: 'insufficient', signals };
  const has = (x: RecoverySignal) => signals.includes(x);
  if (dayStatusRule.recoverWhenAll.every(has)) return { level: 'recover', signals };
  if (dayStatusRule.cautionWhenAny.some(has)) return { level: 'caution', signals };
  return { level: 'ready', signals };
}

/** Bant oluşana kadar kaç geçerli gün daha gerekiyor (başlangıç penceresi için). */
export function baselineDaysMissing(reading: MetricReading): number {
  return Math.max(0, recoveryMinValues.baseline - reading.baselineN);
}
