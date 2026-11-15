// HealthKit denemesi (karar 0061, uygulama sırası 2): kütüphane SDK 58 / RN 0.88'de izin isteyip okuyabiliyor mu?
// Yalnız sayar: tip başına son 7 günün örnek sayısı, en son örneğin zamanı ve sorgu süresi. Değer göstermez,
// saklamaz, hiçbir yere göndermez. Kütüphane yalnız bu fonksiyon çağrılınca yüklenir (açılışta yüklenmez).

/** Sayılan pencere (gün). Eşik değil, deneme penceresi. */
export const probeDays = 7;

/** 0061'de okunacak tipler; izin ekranı bunların hepsini sorar. */
export const quantityTypes = [
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRespiratoryRate',
  'HKQuantityTypeIdentifierAppleSleepingWristTemperature',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKQuantityTypeIdentifierStepCount',
] as const;

export const categoryTypes = ['HKCategoryTypeIdentifierSleepAnalysis', 'HKCategoryTypeIdentifierMenstrualFlow'] as const;

export const workoutType = 'HKWorkoutTypeIdentifier' as const;

export interface ProbeRow {
  type: string;
  /** Pencere içindeki örnek sayısı; okunamadıysa null. */
  count: number | null;
  /** En son örneğin bitiş zamanı (ISO); örnek yoksa null. */
  latest: string | null;
  ms: number;
  error: string | null;
}

export interface ProbeResult {
  available: boolean;
  protectedDataAvailable: boolean;
  authorized: boolean | null;
  authError: string | null;
  rows: ProbeRow[];
}

/** Kısa ad: "HKQuantityTypeIdentifierStepCount" → "StepCount". */
export function shortType(type: string): string {
  return type.replace(/^HK(Quantity|Category)TypeIdentifier/, '').replace(/^HKWorkoutTypeIdentifier$/, 'Workout');
}

/** Örneklerin en geç bitiş zamanı; boşsa null. */
export function latestEnd(samples: readonly { endDate: Date }[]): string | null {
  let max: number | null = null;
  for (const s of samples) {
    const t = s.endDate.getTime();
    if (!Number.isNaN(t) && (max === null || t > max)) max = t;
  }
  return max === null ? null : new Date(max).toISOString();
}

function message(err: unknown): string {
  return err instanceof Error ? err.message.slice(0, 160) : 'bilinmeyen hata';
}

async function timed(type: string, run: () => Promise<readonly { endDate: Date }[]>): Promise<ProbeRow> {
  const t0 = Date.now();
  try {
    const samples = await run();
    return { type, count: samples.length, latest: latestEnd(samples), ms: Date.now() - t0, error: null };
  } catch (err) {
    return { type, count: null, latest: null, ms: Date.now() - t0, error: message(err) };
  }
}

export async function runHealthKitProbe(now: Date): Promise<ProbeResult> {
  const hk = await import('@kingstinct/react-native-healthkit');
  const available = hk.isHealthDataAvailable();
  const protectedDataAvailable = hk.isProtectedDataAvailable();
  if (!available) return { available, protectedDataAvailable, authorized: null, authError: null, rows: [] };

  let authorized: boolean | null = null;
  let authError: string | null = null;
  try {
    authorized = await hk.requestAuthorization({ toRead: [...quantityTypes, ...categoryTypes, workoutType] });
  } catch (err) {
    authError = message(err);
  }

  const filter = { date: { startDate: new Date(now.getTime() - probeDays * 86_400_000), endDate: now } };
  const rows: ProbeRow[] = [];
  for (const type of quantityTypes) {
    rows.push(await timed(type, () => hk.queryQuantitySamples(type, { limit: 0, filter })));
  }
  for (const type of categoryTypes) {
    rows.push(await timed(type, () => hk.queryCategorySamples(type, { limit: 0, filter })));
  }
  rows.push(await timed(workoutType, () => hk.queryWorkoutSamples({ limit: 0, filter })));
  return { available, protectedDataAvailable, authorized, authError, rows };
}
