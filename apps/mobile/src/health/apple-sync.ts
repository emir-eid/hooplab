// Apple Health senkronu (karar 0061 sıra 3d). Yalnız apple_health profilinde ve iPhone'da çalışır; sahibinin
// (google_health) uygulamasında HealthKit kütüphanesi hiç yüklenmez, izin istenmez, hiçbir şey okunmaz.
//
// Akış: HealthKit'ten pencerenin örnekleri okunur → apple-aggregate günlük / gecelik değerleri hesaplar →
// healthkit-ingest'e yüklenir. Ham örnek telefondan çıkmaz. Her yükleme bir penceredir: sunucu pencerede olup
// gönderilmeyen Apple satırını siler, böylece HealthKit'te silinen kayıt buluttan da kalkar.
//
// Ne zaman: uygulama açılınca ve ön plana gelince (yakalama), HealthKit yeni veri bildirince (observer, saatlik
// arka plan teslimatı). İlk yüklemede 89 gün geri gidilir (sunucu sınırı 90; yerel / UTC farkına pay), parça parça
// ve kaldığı yerden; sonra son eşitlemeden bu yana günler ve saatin geç eşitlediği son RECENT_DAYS gün.
//
// Not (karar 0061'den sapma, aynı commit'te kayıtlı): "anchored sorgu ile yalnız yeni veri" yerine pencere yeniden
// hesaplanır. Gecelik ortalama zaten gecenin bütün örneklerini ister ve silinen örnek tarih taşımaz; pencere
// yöntemi ikisini de tek yoldan çözer. Observer yalnız tetikleyicidir.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { fetchDataSource } from '@/data/profile';
import { demoStore } from '@/demo/demo-mode';
import {
  addDays,
  buildIngestBody,
  buildSleepSessions,
  deviceClock,
  syncWindows,
  type DayStats,
  type HourEnergyIn,
  type IngestBody,
  type SleepSampleIn,
  type ValueSampleIn,
  type WorkoutIn,
} from '@/health/apple-aggregate';
import { supabase } from '@/lib/supabase';

/** İlk yüklemenin geri gittiği gün sayısı (healthkit-ingest MAX_DAYS_BACK = 90, bir gün pay). */
export const BACKFILL_DAYS = 89;
/** Her eşitlemede yeniden hesaplanan son günler: saat geç eşitler, kayıt sonradan silinebilir. */
export const RECENT_DAYS = 3;

const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis';
const SDNN = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN';
const HEART_RATE = 'HKQuantityTypeIdentifierHeartRate';
const RESPIRATORY = 'HKQuantityTypeIdentifierRespiratoryRate';
const RESTING_HR = 'HKQuantityTypeIdentifierRestingHeartRate';
const STEPS = 'HKQuantityTypeIdentifierStepCount';
const DISTANCE = 'HKQuantityTypeIdentifierDistanceWalkingRunning';
const ACTIVE = 'HKQuantityTypeIdentifierActiveEnergyBurned';
const BASAL = 'HKQuantityTypeIdentifierBasalEnergyBurned';
const WORKOUT = 'HKWorkoutTypeIdentifier';

/** İzin ekranında sorulan tipler: yalnız bu senkronun okuduğu tipler. */
export const readTypes = [SLEEP, SDNN, HEART_RATE, RESPIRATORY, RESTING_HR, STEPS, DISTANCE, ACTIVE, BASAL, WORKOUT] as const;
/** Yeni veri bildirimi istenen tipler (her biri saatte en çok bir kez uyandırır). */
const observedTypes = [SLEEP, SDNN, RESTING_HR, ACTIVE, WORKOUT] as const;

export interface AppleSyncState {
  /** Yarım kalan yüklemenin sıradaki penceresinin başı. */
  cursor: string | null;
  /** Son tam eşitlemenin yerel günü. */
  syncedThrough: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
}

const emptyState: AppleSyncState = { cursor: null, syncedThrough: null, lastSuccessAt: null, lastError: null };

export type SyncReason = 'foreground' | 'background' | 'manual';
export type SyncOutcome = 'done' | 'skipped' | 'unavailable' | 'locked' | 'failed';

type HealthKit = typeof import('@kingstinct/react-native-healthkit');

export const appleSyncSupported = Platform.OS === 'ios';

function stateKey(userId: string): string {
  return `hooplab.apple-sync.v1:${userId}`;
}

export async function loadAppleSyncState(userId: string): Promise<AppleSyncState> {
  try {
    const raw = await AsyncStorage.getItem(stateKey(userId));
    return raw ? { ...emptyState, ...(JSON.parse(raw) as Partial<AppleSyncState>) } : emptyState;
  } catch {
    return emptyState;
  }
}

async function saveState(userId: string, state: AppleSyncState): Promise<void> {
  try {
    await AsyncStorage.setItem(stateKey(userId), JSON.stringify(state));
  } catch {
    // Durum kaydedilemezse sonraki eşitleme baştan dener; veri kaybı olmaz.
  }
  notify();
}

// Ben ekranı durumu dinler.
const listeners = new Set<() => void>();
export function onAppleSyncChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  for (const fn of listeners) fn();
}

/** Bir sonraki eşitlemenin ilk günü. */
export function syncStart(state: AppleSyncState, today: string): string {
  const earliest = addDays(today, -BACKFILL_DAYS);
  let start: string;
  if (state.cursor) start = state.cursor;
  else if (state.syncedThrough) {
    const recent = addDays(today, -(RECENT_DAYS - 1));
    const since = addDays(state.syncedThrough, -(RECENT_DAYS - 1));
    start = since < recent ? since : recent;
  } else start = earliest;
  return start < earliest ? earliest : start;
}

/** YYYY-MM-DD'nin yerel gece yarısı. */
function localMidnight(date: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function value(q: { quantity: number; unit: string } | undefined, toBase: Record<string, number>): number | null {
  if (!q || !Number.isFinite(q.quantity)) return null;
  const f = toBase[q.unit];
  return f === undefined ? null : q.quantity * f;
}
const KCAL = { kcal: 1, Cal: 1, kJ: 1 / 4.184 };
const METERS = { m: 1, km: 1000, mi: 1609.344 };
const SECONDS = { s: 1, min: 60, hr: 3600 };

async function dayStats(hk: HealthKit, from: string, to: string): Promise<DayStats> {
  const anchor = localMidnight(from);
  const filter = { date: { startDate: anchor, endDate: localMidnight(addDays(to, 1)) } };
  const collect = async (type: string, stat: 'cumulativeSum' | 'discreteAverage', unit: string) => {
    const out = new Map<string, number>();
    // Tip ve birim çiftleri aşağıda sabit; kütüphanenin tip başına birim tipi burada genişletilir (fonksiyon bağlı).
    const query = hk.queryStatisticsCollectionForQuantity as (...args: unknown[]) => ReturnType<typeof hk.queryStatisticsCollectionForQuantity>;
    const rows = await query(type, [stat], anchor, { day: 1 }, { filter, unit });
    for (const r of rows) {
      const q = stat === 'cumulativeSum' ? r.sumQuantity : r.averageQuantity;
      if (r.startDate && q && Number.isFinite(q.quantity)) out.set(deviceClock.date(r.startDate), q.quantity);
    }
    return out;
  };
  return {
    restingHrBpm: await collect(RESTING_HR, 'discreteAverage', 'count/min'),
    steps: await collect(STEPS, 'cumulativeSum', 'count'),
    distanceM: await collect(DISTANCE, 'cumulativeSum', 'm'),
    activeKcal: await collect(ACTIVE, 'cumulativeSum', 'kcal'),
    basalKcal: await collect(BASAL, 'cumulativeSum', 'kcal'),
  };
}

async function hourlyEnergy(hk: HealthKit, from: string, to: string): Promise<HourEnergyIn[]> {
  const anchor = localMidnight(from);
  const filter = { date: { startDate: anchor, endDate: localMidnight(addDays(to, 1)) } };
  const sums = new Map<number, number>();
  for (const type of [ACTIVE, BASAL] as const) {
    const rows = await hk.queryStatisticsCollectionForQuantity(type, ['cumulativeSum'], anchor, { hour: 1 }, { filter, unit: 'kcal' });
    for (const r of rows) {
      const q = r.sumQuantity?.quantity;
      if (r.startDate && q !== undefined && Number.isFinite(q)) sums.set(r.startDate.getTime(), (sums.get(r.startDate.getTime()) ?? 0) + q);
    }
  }
  return [...sums].map(([t, kcal]) => ({ hourStart: new Date(t), kcal }));
}

async function samplesIn(hk: HealthKit, type: typeof SDNN | typeof HEART_RATE | typeof RESPIRATORY, unit: string, start: Date, end: Date) {
  const rows = await hk.queryQuantitySamples(type, { limit: 0, unit, filter: { date: { startDate: start, endDate: end } } });
  return rows.map((s): ValueSampleIn => ({ start: s.startDate, end: s.endDate, value: s.quantity }));
}

async function workouts(hk: HealthKit, from: string, to: string): Promise<WorkoutIn[]> {
  const list = await hk.queryWorkoutSamples({ limit: 0, filter: { date: { startDate: localMidnight(from), endDate: localMidnight(addDays(to, 1)) } } });
  const out: WorkoutIn[] = [];
  for (const w of list) {
    const hr = await w.getStatistic(HEART_RATE, 'count/min').catch(() => undefined);
    const energy = await w.getStatistic(ACTIVE, 'kcal').catch(() => undefined);
    out.push({
      uuid: w.uuid,
      start: w.startDate,
      end: w.endDate,
      activityType: Number(w.workoutActivityType),
      durationS: value(w.duration, SECONDS) ?? (w.endDate.getTime() - w.startDate.getTime()) / 1000,
      energyKcal: energy?.sumQuantity?.quantity ?? value(w.totalEnergyBurned, KCAL),
      distanceM: value(w.totalDistance, METERS),
      avgHrBpm: hr?.averageQuantity?.quantity ?? null,
    });
  }
  return out;
}

/** Bir pencerenin HealthKit okuması ve gövdesi. Nabız yalnız ana uyku pencerelerinde okunur (gündüz örneği çok). */
async function readWindow(hk: HealthKit, from: string, to: string): Promise<IngestBody> {
  // Pencerenin ilk gününe uyanılan uyku bir önceki akşam başlar.
  const sleepStart = new Date(localMidnight(from).getTime() - 18 * 3600_000);
  const sleepEnd = localMidnight(addDays(to, 1));
  const raw = await hk.queryCategorySamples(SLEEP, { limit: 0, filter: { date: { startDate: sleepStart, endDate: sleepEnd } } });
  const sleep: SleepSampleIn[] = raw.map((s) => ({
    uuid: s.uuid,
    start: s.startDate,
    end: s.endDate,
    value: Number(s.value),
    source: s.sourceRevision?.source?.bundleIdentifier ?? 'bilinmiyor',
  }));

  const sdnn: ValueSampleIn[] = [];
  const heartRate: ValueSampleIn[] = [];
  const respiratory: ValueSampleIn[] = [];
  for (const night of buildSleepSessions(sleep, deviceClock)) {
    if (night.isNap || night.localDate < from || night.localDate > to) continue;
    const start = new Date(night.startTime);
    const end = new Date(night.endTime);
    sdnn.push(...(await samplesIn(hk, SDNN, 'ms', start, end)));
    heartRate.push(...(await samplesIn(hk, HEART_RATE, 'count/min', start, end)));
    respiratory.push(...(await samplesIn(hk, RESPIRATORY, 'count/min', start, end)));
  }

  return buildIngestBody(
    {
      from,
      to,
      sleep,
      sdnn,
      heartRate,
      respiratory,
      stats: await dayStats(hk, from, to),
      hours: await hourlyEnergy(hk, from, to),
      workouts: await workouts(hk, from, to),
    },
    deviceClock,
  );
}

async function upload(body: IngestBody): Promise<string | null> {
  if (!supabase) return 'no_client';
  const { error } = await supabase.functions.invoke('healthkit-ingest', { body });
  if (!error) return null;
  // Yanıtta değer yok, yalnız hata kodu ve alan yolları; durum satırına kod yazılır.
  const context = (error as { context?: { status?: number } }).context;
  return `upload_${context?.status ?? 'network'}`;
}

let running: Promise<SyncOutcome> | null = null;

/** Tek seferde bir eşitleme; aynı anda gelen istekler aynı sonucu bekler. */
export function syncAppleHealth(reason: SyncReason): Promise<SyncOutcome> {
  running ??= run(reason).finally(() => {
    running = null;
  });
  return running;
}

export function appleSyncRunning(): boolean {
  return running !== null;
}

async function run(reason: SyncReason): Promise<SyncOutcome> {
  if (!appleSyncSupported || demoStore() || !supabase) return 'skipped';
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return 'skipped';
  if ((await fetchDataSource()) !== 'apple_health') return 'skipped';
  notify();

  const hk = await import('@kingstinct/react-native-healthkit');
  if (!hk.isHealthDataAvailable()) return 'unavailable';
  // Telefon kilitliyken HealthKit verisi okunamaz; açılınca yakalama senkronu tamamlar.
  if (!hk.isProtectedDataAvailable()) return 'locked';

  let state = await loadAppleSyncState(userId);
  try {
    // İzin ekranı yalnız ön planda: iOS her tipi bir kez sorar, sonra çağrı hemen döner.
    if (reason !== 'background') {
      await hk.requestAuthorization({ toRead: [...readTypes] });
      await hk.configureBackgroundTypes([...observedTypes], hk.UpdateFrequency.hourly);
    }
    const today = deviceClock.date(new Date());
    for (const w of syncWindows(today, syncStart(state, today))) {
      const error = await upload(await readWindow(hk, w.from, w.to));
      if (error) {
        state = { ...state, lastError: error };
        await saveState(userId, state);
        return 'failed';
      }
      state = { ...state, cursor: addDays(w.to, 1) };
      await saveState(userId, state);
    }
    state = { cursor: null, syncedThrough: today, lastSuccessAt: new Date().toISOString(), lastError: null };
    await saveState(userId, state);
    return 'done';
  } catch (err) {
    state = { ...state, lastError: err instanceof Error ? 'healthkit' : 'unknown' };
    await saveState(userId, state);
    return 'failed';
  }
}

/** HealthKit yeni veri bildirince eşitler. Yalnız Apple profilinde çağrılır; kaldırma fonksiyonu döner. */
export async function subscribeAppleObservers(): Promise<() => void> {
  const hk = await import('@kingstinct/react-native-healthkit');
  let timer: ReturnType<typeof setTimeout> | null = null;
  // Birkaç tip birlikte bildirir; tek eşitlemede toplanır.
  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncAppleHealth('background'), 2000);
  };
  const subs = observedTypes.map((type) => hk.subscribeToChanges(type, trigger));
  return () => {
    if (timer) clearTimeout(timer);
    for (const s of subs) s.remove();
  };
}
