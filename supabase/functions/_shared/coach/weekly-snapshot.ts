// Haftalık koç yorumunun anlık değer şeması (karar 0052): uygulama ve coach-weekly aynı dosyayı kullanır.
// Yalnız snapshot.ts'e bağlıdır (uygulama paketine belge ve denetçi kodu girmesin). Veri doğrulama aralıkları
// günlük şemanınkiyle aynı (snapshotLimits); bilimsel eşik değil.

import {
  bandPositions,
  bodyRegions,
  bodySides,
  Checker,
  dayLevels,
  metricRules,
  rangePositions,
  snapshotLimits,
  type BandPosition,
  type BandValue,
  type BodyRegion,
  type BodySide,
  type DayLevel,
  type MetricKey,
  type Obj,
  type RangePosition,
} from './snapshot.ts';

export const weeklySnapshotVersion = 1;

/** Haftanın HRV'si ya da uyku nabzı: haftanın 7 günlük ortalaması ve haftadan önceki 28 günün bandı (karar 0040). */
export interface WeekBand {
  mean: number | null;
  band: BandValue | null;
  position: BandPosition | null;
}

export type LevelCounts = Record<DayLevel, number>;
export type PositionCounts = Record<RangePosition, number>;

export interface WeeklySnapshot {
  version: typeof weeklySnapshotVersion;
  /** Haftanın pazartesisi (YYYY-MM-DD). Modele gitmez; kayıt anahtarıdır. */
  weekStart: string;
  /** Günlerin durumu sayıları (toplam 7). */
  status: LevelCounts;
  hrv?: WeekBand;
  rhr?: WeekBand;
  sleep?: { meanHours: number | null; nights: number; short: boolean | null };
  /** Gece notu düşen gece sayıları (tanı değil; karar 0039). */
  signs?: { respiration: number; rhr: number; spo2: number; skinTemp: number };
  checkin?: { days: number; meanTotal: number | null; baselineMean: number | null; lowDays: number };
  load?: {
    week: number | null;
    previousWeek: number | null;
    weekChange: number | null;
    weeklyAverage: number | null;
    ratio: number | null;
    spike: boolean;
    monotony: number | null;
    strain: number | null;
    sessions: number;
    games: number;
    minutesPlayed: number | null;
  };
  pain?: readonly { region: BodyRegion; side: BodySide; maxPain: number; days: number; daysAbove: number }[];
  nutrition?: { mealDays: number; carbs: PositionCounts; protein: PositionCounts; noTarget: number; matchDays: number; sweatTests: number };
  fluid?: { meanL: number | null; days: number };
}

/** Haftalık belgedeki ölçümler: günlük özetin anahtarlarıyla aynı (kuralları ve uygulamadaki dayanak sayfaları ortak). */
export const weeklyMetricKeys = ['status', 'hrv', 'rhr', 'sleep', 'signs', 'checkin', 'load', 'pain', 'nutrition', 'fluid'] as const satisfies readonly MetricKey[];
export type WeeklyMetricKey = (typeof weeklyMetricKeys)[number];

/** Ölçüm → kural kimlikleri; gece notlarına tek gece solunum da girer. */
export const weeklyRules: Readonly<Record<WeeklyMetricKey, readonly string[]>> = {
  ...metricRules,
  signs: [...metricRules.signs, 'solunum-tek-gece'],
};

// --- Doğrulama ---

const weekLimits = { days: [0, 7], sessions: [0, 100], minutes: [0, 7 * 60 * 4] } as const;

function parseWeekBand(c: Checker, value: unknown, path: string, limits: readonly [number, number]): WeekBand | null {
  const o = c.object(value, path, ['mean', 'band', 'position']);
  if (!o) return null;
  let band: BandValue | null = null;
  if (o.band !== null) {
    const b = c.object(o.band, `${path}.band`, ['low', 'high']);
    if (b) {
      band = { low: c.number(b.low, `${path}.band.low`, ...limits), high: c.number(b.high, `${path}.band.high`, ...limits) };
      if (band.low > band.high) c.fail(`${path}.band`, 'alt sınır üst sınırdan büyük');
    }
  }
  return {
    mean: c.nullableNumber(o.mean, `${path}.mean`, ...limits),
    band,
    position: c.nullableOneOf(o.position, `${path}.position`, bandPositions),
  };
}

const day = (c: Checker, v: unknown, path: string) => c.number(v, path, ...weekLimits.days, { integer: true });

function counts<T extends string>(c: Checker, value: unknown, path: string, keys: readonly T[]): Record<T, number> {
  const o = c.object(value, path, keys) ?? {};
  return Object.fromEntries(keys.map((k) => [k, day(c, (o as Obj)[k], `${path}.${k}`)])) as Record<T, number>;
}

const parsers: { [K in Exclude<WeeklyMetricKey, 'status'>]: (c: Checker, v: unknown, p: string) => WeeklySnapshot[K] | null } = {
  hrv: (c, v, p) => parseWeekBand(c, v, p, snapshotLimits.hrvMs as unknown as [number, number]),
  rhr: (c, v, p) => parseWeekBand(c, v, p, snapshotLimits.rhrBpm as unknown as [number, number]),
  sleep: (c, v, p) => {
    const o = c.object(v, p, ['meanHours', 'nights', 'short']);
    if (!o) return null;
    return {
      meanHours: c.nullableNumber(o.meanHours, `${p}.meanHours`, ...(snapshotLimits.sleepHours as unknown as [number, number])),
      nights: day(c, o.nights, `${p}.nights`),
      short: c.nullableBoolean(o.short, `${p}.short`),
    };
  },
  signs: (c, v, p) => counts(c, v, p, ['respiration', 'rhr', 'spo2', 'skinTemp'] as const),
  checkin: (c, v, p) => {
    const o = c.object(v, p, ['days', 'meanTotal', 'baselineMean', 'lowDays']);
    if (!o) return null;
    const total = snapshotLimits.checkinTotal as unknown as [number, number];
    return {
      days: day(c, o.days, `${p}.days`),
      meanTotal: c.nullableNumber(o.meanTotal, `${p}.meanTotal`, ...total),
      baselineMean: c.nullableNumber(o.baselineMean, `${p}.baselineMean`, ...total),
      lowDays: day(c, o.lowDays, `${p}.lowDays`),
    };
  },
  load: (c, v, p) => {
    const keys = ['week', 'previousWeek', 'weekChange', 'weeklyAverage', 'ratio', 'spike', 'monotony', 'strain', 'sessions', 'games', 'minutesPlayed'];
    const o = c.object(v, p, keys);
    if (!o) return null;
    const au = snapshotLimits.loadAu as unknown as [number, number];
    return {
      week: c.nullableNumber(o.week, `${p}.week`, ...au),
      previousWeek: c.nullableNumber(o.previousWeek, `${p}.previousWeek`, ...au),
      weekChange: c.nullableNumber(o.weekChange, `${p}.weekChange`, ...(snapshotLimits.weekChange as unknown as [number, number])),
      weeklyAverage: c.nullableNumber(o.weeklyAverage, `${p}.weeklyAverage`, ...au),
      ratio: c.nullableNumber(o.ratio, `${p}.ratio`, ...(snapshotLimits.ratio as unknown as [number, number])),
      spike: c.boolean(o.spike, `${p}.spike`),
      monotony: c.nullableNumber(o.monotony, `${p}.monotony`, ...(snapshotLimits.monotony as unknown as [number, number])),
      strain: c.nullableNumber(o.strain, `${p}.strain`, ...(snapshotLimits.strainAu as unknown as [number, number])),
      sessions: c.number(o.sessions, `${p}.sessions`, ...weekLimits.sessions, { integer: true }),
      games: c.number(o.games, `${p}.games`, ...weekLimits.sessions, { integer: true }),
      minutesPlayed: c.nullableNumber(o.minutesPlayed, `${p}.minutesPlayed`, ...weekLimits.minutes, { integer: true }),
    };
  },
  pain: (c, v, p) =>
    c.array(v, p, bodyRegions.length * bodySides.length).flatMap((item, i) => {
      const o = c.object(item, `${p}[${i}]`, ['region', 'side', 'maxPain', 'days', 'daysAbove']);
      if (!o) return [];
      return [
        {
          region: c.oneOf(o.region, `${p}[${i}].region`, bodyRegions),
          side: c.oneOf(o.side, `${p}[${i}].side`, bodySides),
          maxPain: c.number(o.maxPain, `${p}[${i}].maxPain`, ...(snapshotLimits.nrs as unknown as [number, number]), { integer: true }),
          days: day(c, o.days, `${p}[${i}].days`),
          daysAbove: day(c, o.daysAbove, `${p}[${i}].daysAbove`),
        },
      ];
    }),
  nutrition: (c, v, p) => {
    const o = c.object(v, p, ['mealDays', 'carbs', 'protein', 'noTarget', 'matchDays', 'sweatTests']);
    if (!o) return null;
    return {
      mealDays: day(c, o.mealDays, `${p}.mealDays`),
      carbs: counts(c, o.carbs, `${p}.carbs`, rangePositions),
      protein: counts(c, o.protein, `${p}.protein`, rangePositions),
      noTarget: day(c, o.noTarget, `${p}.noTarget`),
      matchDays: day(c, o.matchDays, `${p}.matchDays`),
      sweatTests: c.number(o.sweatTests, `${p}.sweatTests`, ...weekLimits.sessions, { integer: true }),
    };
  },
  fluid: (c, v, p) => {
    const o = c.object(v, p, ['meanL', 'days']);
    if (!o) return null;
    return { meanL: c.nullableNumber(o.meanL, `${p}.meanL`, ...(snapshotLimits.liters as unknown as [number, number])), days: day(c, o.days, `${p}.days`) };
  },
};

export type WeeklySnapshotResult = { ok: true; snapshot: WeeklySnapshot } | { ok: false; errors: string[] };

const isMonday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay() === 1;

/** İstek gövdesini doğrular. Hata varsa hepsini döndürür; kısmen geçerli veri kabul edilmez. */
export function parseWeeklySnapshot(input: unknown): WeeklySnapshotResult {
  const c = new Checker();
  const o = c.object(input, 'snapshot', ['version', 'weekStart', ...weeklyMetricKeys]);
  if (!o) return { ok: false, errors: c.errors };
  if (o.version !== weeklySnapshotVersion) c.fail('snapshot.version', `${weeklySnapshotVersion} olmalı`);
  const weekStart = c.isoDate(o.weekStart, 'snapshot.weekStart');
  if (weekStart && !isMonday(weekStart)) c.fail('snapshot.weekStart', 'pazartesi olmalı');
  const status = counts(c, o.status, 'snapshot.status', dayLevels);
  if (Object.values(status).reduce((a, b) => a + b, 0) !== 7) c.fail('snapshot.status', 'günlerin toplamı 7 olmalı (yalnız biten hafta)');
  const snapshot: WeeklySnapshot = { version: weeklySnapshotVersion, weekStart, status };
  for (const key of weeklyMetricKeys) {
    if (key === 'status' || o[key] === undefined) continue;
    const parsed = parsers[key](c, o[key], `snapshot.${key}`);
    if (parsed !== null) (snapshot as unknown as Obj)[key] = parsed;
  }
  return c.errors.length ? { ok: false, errors: c.errors } : { ok: true, snapshot };
}

/** Hafta bitmiş olmalı: pazar, sunucunun UTC gününden en fazla bir gün ileride olabilir (saat dilimi payı). */
export function isCompletedWeek(weekStart: string, now: Date): boolean {
  const sunday = Date.parse(`${weekStart}T00:00:00Z`) + 6 * 86_400_000;
  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return sunday < today + 86_400_000;
}
