// Senkron akışı: hangi günler çekilecek, hangi tip hangi uç noktadan, satırlar nereye yazılacak.
// Ağ (GoogleHealthClient) ve veritabanı (SyncStore) dışarıdan verilir; burada yalnız karar ve dönüşüm var.

import { GoogleApiError, type GoogleHealthClient, WEARABLES_FAMILY } from './client.ts';
import { addDays, chunkRange } from './dates.ts';
import {
  type DailyListType,
  type DailyRollupType,
  type DailyRow,
  type ExerciseRow,
  parseDailyListPoint,
  parseDailyRollupPoint,
  parseExercise,
  parseSleep,
  type SleepRow,
} from './parse.ts';

// İlk bağlanışta geriye dönük çekilen gün sayısı (kişisel baseline için ilk veri).
export const BACKFILL_DAYS = 90;
// Her senkronda son günler yeniden çekilir: cihaz geç eşitler, uyku sonradan işlenir.
export const LOOKBACK_DAYS = 7;

export interface SyncStore {
  upsertDaily(rows: DailyRow[]): Promise<void>;
  upsertSleep(rows: SleepRow[]): Promise<void>;
  upsertExercise(rows: ExerciseRow[]): Promise<void>;
}

export interface SyncWindow {
  from: string;
  to: string; // hariç
}

export interface SyncResult {
  window: SyncWindow;
  counts: { daily: number; sleep: number; exercise: number };
  errors: Array<{ type: string; code: string }>;
}

// [from, to): bugün dahil. Uzun bir kopukluktan sonra bile en fazla BACKFILL_DAYS gün.
export function planWindow(syncedThrough: string | null, today: string): SyncWindow {
  const earliest = addDays(today, -(BACKFILL_DAYS - 1));
  const from = syncedThrough ? addDays(syncedThrough, -LOOKBACK_DAYS) : earliest;
  return { from: from < earliest ? earliest : from > today ? today : from, to: addDays(today, 1) };
}

const DAILY_LIST_TYPES: DailyListType[] = [
  'daily-heart-rate-variability',
  'daily-resting-heart-rate',
  'daily-oxygen-saturation',
  'daily-respiratory-rate',
  'daily-sleep-temperature-derivations',
];

// Gün içi nabız ham çekilmez: Google'ın günlük özeti (en düşük / ortalama / en yüksek) kullanılır.
// Aralık sınırı: heart-rate ve total-calories 14 gün, diğerleri 90 gün (discovery belgesi).
const DAILY_ROLLUP_TYPES: Array<{ type: DailyRollupType; maxDays: number }> = [
  { type: 'heart-rate', maxDays: 14 },
  { type: 'total-calories', maxDays: 14 },
  { type: 'steps', maxDays: 90 },
  { type: 'distance', maxDays: 90 },
  { type: 'active-zone-minutes', maxDays: 90 },
];

// `swim-lengths-data` bilerek yok: yüzme olmadan da kayıt üretiyor (LESSONS).
export const SYNCED_TYPES = [
  ...DAILY_LIST_TYPES,
  ...DAILY_ROLLUP_TYPES.map((t) => t.type),
  'sleep',
  'exercise',
] as const;

function dateFilter(field: string, window: SyncWindow): string {
  return `${field} >= "${window.from}" AND ${field} < "${window.to}"`;
}

// Aynı anahtar iki kez gelirse sonuncusu kalır (tek upsert'te aynı satıra iki kez dokunulamaz).
function lastByKey<T>(rows: T[], key: (row: T) => string): T[] {
  return [...new Map(rows.map((r) => [key(r), r])).values()];
}

function errorCode(err: unknown): string {
  if (err instanceof GoogleApiError) return err.code;
  return 'internal';
}

export async function syncWindow(
  client: GoogleHealthClient,
  store: SyncStore,
  window: SyncWindow,
): Promise<SyncResult> {
  const result: SyncResult = { window, counts: { daily: 0, sleep: 0, exercise: 0 }, errors: [] };

  const run = async (type: string, task: () => Promise<void>) => {
    try {
      await task();
    } catch (err) {
      // Yetki düştüyse (401) diğer tipleri denemek boşuna; çağıran yeniden bağlanmayı ister.
      if (err instanceof GoogleApiError && err.status === 401) throw err;
      result.errors.push({ type, code: errorCode(err) });
    }
  };

  for (const type of DAILY_LIST_TYPES) {
    await run(type, async () => {
      const field = `${type.replaceAll('-', '_')}.date`;
      const points = await client.list(type, dateFilter(field, window), { pageSize: 1000 });
      const rows = lastByKey(
        points.map((p) => parseDailyListPoint(type, p)).filter((r): r is DailyRow => r !== null),
        (r) => r.local_date,
      );
      if (rows.length > 0) await store.upsertDaily(rows);
      result.counts.daily += rows.length;
    });
  }

  for (const { type, maxDays } of DAILY_ROLLUP_TYPES) {
    await run(type, async () => {
      const points = [];
      for (const [from, to] of chunkRange(window.from, window.to, maxDays)) {
        points.push(...(await client.dailyRollUp(type, from, to, WEARABLES_FAMILY)));
      }
      const rows = lastByKey(
        points.map((p) => parseDailyRollupPoint(type, p)).filter((r): r is DailyRow => r !== null),
        (r) => r.local_date,
      );
      if (rows.length > 0) await store.upsertDaily(rows);
      result.counts.daily += rows.length;
    });
  }

  await run('sleep', async () => {
    // Uyku yalnız bitiş zamanıyla süzülebilir; kaynak ailesi verilemez (discovery belgesi).
    const points = await client.list('sleep', dateFilter('sleep.interval.civil_end_time', window), { pageSize: 25 });
    const rows = lastByKey(
      points.map(parseSleep).filter((r): r is SleepRow => r !== null),
      (r) => r.source_id,
    );
    if (rows.length > 0) await store.upsertSleep(rows);
    result.counts.sleep = rows.length;
  });

  await run('exercise', async () => {
    const points = await client.list('exercise', dateFilter('exercise.interval.civil_start_time', window), {
      pageSize: 25,
    });
    const rows = lastByKey(
      points.map(parseExercise).filter((r): r is ExerciseRow => r !== null),
      (r) => r.source_id,
    );
    if (rows.length > 0) await store.upsertExercise(rows);
    result.counts.exercise = rows.length;
  });

  return result;
}

export interface StatusAfterSync {
  outcome: 'ok' | 'partial' | 'error';
  // Yalnız tüm tipler başarılıysa ilerler; yoksa sonraki senkron aynı pencereyi yeniden dener.
  // (Önce kısmi hatada da ilerliyordu: ilk senkronda başarısız olan tiplerin eski günleri hiç gelmedi.)
  advance: { synced_through: string; synced_from: string } | null;
  lastError: string | null;
}

export function statusAfterSync(result: SyncResult, today: string, syncedFrom: string | null): StatusAfterSync {
  const lastError = result.errors.length > 0
    ? result.errors.map((e) => `${e.type}:${e.code}`).join(',').slice(0, 200)
    : null;
  if (result.errors.length > 0) {
    return { outcome: result.errors.length >= SYNCED_TYPES.length ? 'error' : 'partial', advance: null, lastError };
  }
  return {
    outcome: 'ok',
    advance: {
      synced_through: today,
      synced_from: syncedFrom && syncedFrom < result.window.from ? syncedFrom : result.window.from,
    },
    lastError: null,
  };
}
