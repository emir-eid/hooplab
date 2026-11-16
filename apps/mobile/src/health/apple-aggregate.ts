// Apple Health: HealthKit örneklerinden healthkit-ingest gövdesini kuran saf hesaplar (karar 0061 sıra 3d).
// Telefon günlük / gecelik değerleri kendisi hesaplar; ham örnek buluta çıkmaz. Bu dosya HealthKit'i bilmez:
// girdiler düz nesnelerdir, bu yüzden Node testinde sentetik veriyle denetlenir.
//
// Ölçülerin tanımı kurallardan gelir (research/rules/toparlanma.json):
//   * hrv-olcu-apple: ana uyku penceresine düşen SDNN örneklerinin ortalaması; örnek yoksa boş.
//   * nabiz-olcu-apple: ana uyku penceresindeki nabız örneklerinin ortalaması; evreye ayrılmaz.
//   * enerji-harcamasi-tahmin-apple (enerji.json): aktif + bazal enerji.
// Buradaki sabitler sağlık eşiği değildir: uyku örneklerini oturuma toplama ve yükleme parçası biçimidir.

/** Yerel saat; testte sabit dilimli bir saat verilir, uygulamada telefonun saati. */
export interface LocalClock {
  /** YYYY-MM-DD */
  date(d: Date): string;
  hour(d: Date): number;
  /** UTC'ye göre fark (saniye, doğuya artı). */
  offsetS(d: Date): number;
}

export const deviceClock: LocalClock = {
  date: (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  hour: (d) => d.getHours(),
  offsetS: (d) => -d.getTimezoneOffset() * 60,
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** HealthKit uyku değerleri (HKCategoryValueSleepAnalysis). */
export const SleepValue = { inBed: 0, asleepUnspecified: 1, awake: 2, asleepCore: 3, asleepDeep: 4, asleepREM: 5 } as const;

export interface SleepSampleIn {
  uuid: string;
  start: Date;
  end: Date;
  value: number;
  /** Kaynağın paket kimliği (saat, telefon, başka uygulama). */
  source: string;
}

export interface ValueSampleIn {
  start: Date;
  end: Date;
  value: number;
}

export interface WorkoutIn {
  uuid: string;
  start: Date;
  end: Date;
  /** HKWorkoutActivityType sayısı. */
  activityType: number;
  durationS: number;
  energyKcal: number | null;
  distanceM: number | null;
  avgHrBpm: number | null;
}

/** Gün başına toplam / ortalama (HealthKit istatistik sorgusu, kaynaklar arası tekrar HealthKit'te ayıklanır). */
export interface DayStats {
  restingHrBpm: Map<string, number>;
  steps: Map<string, number>;
  distanceM: Map<string, number>;
  activeKcal: Map<string, number>;
  basalKcal: Map<string, number>;
}

/** Saat başına aktif + bazal enerji. */
export interface HourEnergyIn {
  hourStart: Date;
  kcal: number;
}

/** Aynı uykunun parçaları arasındaki en büyük boşluk (dakika). Gruplama biçimi, sağlık eşiği değil. */
export const SESSION_GAP_MIN = 60;
/** Bir yüklemenin kapsadığı en çok gün: saatlik enerji sınırına (240 saat) sığar. */
export const CHUNK_DAYS = 7;

const MIN = 60_000;
const ASLEEP: ReadonlySet<number> = new Set([SleepValue.asleepUnspecified, SleepValue.asleepCore, SleepValue.asleepDeep, SleepValue.asleepREM]);

export interface SleepSessionOut {
  sourceId: string;
  localDate: string;
  startTime: string;
  endTime: string;
  startUtcOffsetS: number;
  endUtcOffsetS: number;
  isNap: boolean;
  minutesInPeriod: number;
  minutesAsleep: number;
  minutesAwake: number;
  minutesCore: number;
  minutesDeep: number;
  minutesRem: number;
}

/** Ingest anahtarının biçimine (harf, rakam, . _ : -) uyan kimlik. */
function safeId(prefix: string, uuid: string): string {
  return `${prefix}-${uuid.replace(/[^A-Za-z0-9._:-]/g, '')}`.slice(0, 200);
}

function minutes(ms: number): number {
  return Math.min(1440, Math.max(0, Math.round(ms / MIN)));
}

/**
 * Uyku örneklerini oturumlara toplar. "Yatakta" kaydı sayılmaz (uyku değil). Birden çok kaynak aynı geceyi yazarsa
 * (saat ve telefon) gecenin en çok uyku yazan kaynağı kullanılır; böylece süreler iki kez sayılmaz. Oturumun günü
 * uyanılan yerel gündür; o günün en uzun uykusu ana uyku, diğerleri şekerlemedir.
 */
export function buildSleepSessions(samples: readonly SleepSampleIn[], clock: LocalClock): SleepSessionOut[] {
  const usable = samples
    .filter((s) => (ASLEEP.has(s.value) || s.value === SleepValue.awake) && s.end.getTime() > s.start.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const clusters: SleepSampleIn[][] = [];
  let clusterEnd = -Infinity;
  for (const s of usable) {
    const last = clusters[clusters.length - 1];
    if (last && s.start.getTime() - clusterEnd <= SESSION_GAP_MIN * MIN) {
      last.push(s);
      clusterEnd = Math.max(clusterEnd, s.end.getTime());
    } else {
      clusters.push([s]);
      clusterEnd = s.end.getTime();
    }
  }

  const sessions: (SleepSessionOut & { asleepMs: number })[] = [];
  for (const cluster of clusters) {
    const bySource = new Map<string, SleepSampleIn[]>();
    for (const s of cluster) bySource.set(s.source, [...(bySource.get(s.source) ?? []), s]);
    let best: SleepSampleIn[] = [];
    let bestAsleep = -1;
    for (const list of bySource.values()) {
      const asleep = list.filter((s) => ASLEEP.has(s.value)).reduce((t, s) => t + s.end.getTime() - s.start.getTime(), 0);
      if (asleep > bestAsleep) {
        best = list;
        bestAsleep = asleep;
      }
    }
    if (bestAsleep <= 0) continue;
    const start = new Date(Math.min(...best.map((s) => s.start.getTime())));
    const end = new Date(Math.max(...best.map((s) => s.end.getTime())));
    const sum = (values: readonly number[]) =>
      minutes(best.filter((s) => values.includes(s.value)).reduce((t, s) => t + s.end.getTime() - s.start.getTime(), 0));
    sessions.push({
      sourceId: safeId('hk', best[0]!.uuid),
      localDate: clock.date(end),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      startUtcOffsetS: clock.offsetS(start),
      endUtcOffsetS: clock.offsetS(end),
      isNap: false,
      minutesInPeriod: minutes(end.getTime() - start.getTime()),
      minutesAsleep: minutes(bestAsleep),
      minutesAwake: sum([SleepValue.awake]),
      minutesCore: sum([SleepValue.asleepCore]),
      minutesDeep: sum([SleepValue.asleepDeep]),
      minutesRem: sum([SleepValue.asleepREM]),
      asleepMs: bestAsleep,
    });
  }

  const main = new Map<string, number>();
  sessions.forEach((s, i) => {
    const current = main.get(s.localDate);
    if (current === undefined || s.asleepMs > sessions[current]!.asleepMs) main.set(s.localDate, i);
  });
  return sessions.map(({ asleepMs: _, ...s }, i) => ({ ...s, isNap: main.get(s.localDate) !== i }));
}

/** Pencereye başlangıcı düşen örneklerin ortalaması; örnek yoksa null (uydurma yok). */
export function meanInWindow(samples: readonly ValueSampleIn[], start: Date, end: Date): number | null {
  const a = start.getTime();
  const b = end.getTime();
  const inside = samples.filter((s) => s.start.getTime() >= a && s.start.getTime() <= b && Number.isFinite(s.value));
  if (inside.length === 0) return null;
  return inside.reduce((t, s) => t + s.value, 0) / inside.length;
}

function round(v: number | null | undefined, digits: number): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

/** HealthKit etkinlik tipi → Google Health'in tip adları (etiket ve seans türü önerisi aynı tablodan gelir). */
const ACTIVITY_NAMES: Record<number, string> = {
  6: 'BASKETBALL',
  11: 'CROSSFIT',
  13: 'BIKING',
  16: 'ELLIPTICAL',
  20: 'STRENGTH_TRAINING',
  24: 'HIKING',
  35: 'ROWING',
  37: 'RUNNING',
  41: 'SOCCER',
  46: 'SWIMMING',
  48: 'TENNIS',
  50: 'STRENGTH_TRAINING',
  52: 'WALKING',
  57: 'YOGA',
  59: 'STRENGTH_TRAINING',
  63: 'HIIT',
  73: 'SPORT',
};

export function exerciseTypeFor(activityType: number): string {
  return ACTIVITY_NAMES[activityType] ?? `APPLE_${Math.max(0, Math.trunc(activityType))}`;
}

export interface WorkoutOut {
  sourceId: string;
  localDate: string;
  startTime: string;
  endTime: string;
  startUtcOffsetS: number;
  exerciseType: string;
  activeDurationS: number;
  avgHrBpm: number | null;
  caloriesKcal: number | null;
  distanceM: number | null;
}

export function buildWorkouts(workouts: readonly WorkoutIn[], clock: LocalClock): WorkoutOut[] {
  return workouts
    .filter((w) => w.end.getTime() > w.start.getTime() && w.end.getTime() - w.start.getTime() <= 24 * 3600_000)
    .map((w) => ({
      sourceId: safeId('hk', w.uuid),
      localDate: clock.date(w.start),
      startTime: w.start.toISOString(),
      endTime: w.end.toISOString(),
      startUtcOffsetS: clock.offsetS(w.start),
      exerciseType: exerciseTypeFor(w.activityType),
      activeDurationS: Math.min(86_400, Math.max(0, Math.round(w.durationS))),
      avgHrBpm: round(w.avgHrBpm, 0),
      caloriesKcal: round(w.energyKcal, 0),
      distanceM: round(w.distanceM, 0),
    }));
}

export interface DayOut {
  localDate: string;
  hrvSleepSdnnMs?: number;
  sleepHrBpm?: number;
  restingHrBpm?: number;
  respiratoryRateBpm?: number;
  steps?: number;
  distanceM?: number;
  caloriesKcal?: number;
}

export interface HourOut {
  hourStart: string;
  localDate: string;
  localHour: number;
  kcal: number;
}

export interface IngestBody {
  window: { from: string; to: string };
  days: DayOut[];
  sleep: SleepSessionOut[];
  workouts: WorkoutOut[];
  hourlyEnergy: HourOut[];
}

export interface ChunkInput {
  from: string;
  to: string;
  sleep: readonly SleepSampleIn[];
  sdnn: readonly ValueSampleIn[];
  heartRate: readonly ValueSampleIn[];
  respiratory: readonly ValueSampleIn[];
  stats: DayStats;
  hours: readonly HourEnergyIn[];
  workouts: readonly WorkoutIn[];
}

/** YYYY-MM-DD'ye gün ekler (takvim günü, saat diliminden bağımsız). */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * Bir pencerenin yükleme gövdesi. Penceredeki her gün tam gönderilir (değeri olmayan alan boş kalır), uyku,
 * antrenman ve saatlik enerji pencerenin tamamıdır; sunucu pencerede olup gönderilmeyen Apple satırını siler.
 * Gece değerleri o günün ana uykusundan gelir; şekerleme gece değerine katılmaz.
 */
export function buildIngestBody(input: ChunkInput, clock: LocalClock): IngestBody {
  const inWindow = (d: string) => d >= input.from && d <= input.to;
  const sleep = buildSleepSessions(input.sleep, clock).filter((s) => inWindow(s.localDate));
  const mainByDate = new Map(sleep.filter((s) => !s.isNap).map((s) => [s.localDate, s]));

  const days: DayOut[] = datesBetween(input.from, input.to).map((localDate) => {
    const day: DayOut = { localDate };
    const main = mainByDate.get(localDate);
    if (main) {
      const start = new Date(main.startTime);
      const end = new Date(main.endTime);
      const hrv = round(meanInWindow(input.sdnn, start, end), 1);
      const hr = round(meanInWindow(input.heartRate, start, end), 1);
      const resp = round(meanInWindow(input.respiratory, start, end), 1);
      if (hrv !== null) day.hrvSleepSdnnMs = hrv;
      if (hr !== null) day.sleepHrBpm = hr;
      if (resp !== null) day.respiratoryRateBpm = resp;
    }
    const resting = round(input.stats.restingHrBpm.get(localDate), 0);
    const steps = round(input.stats.steps.get(localDate), 0);
    const distance = round(input.stats.distanceM.get(localDate), 0);
    const active = input.stats.activeKcal.get(localDate);
    const basal = input.stats.basalKcal.get(localDate);
    if (resting !== null) day.restingHrBpm = resting;
    if (steps !== null) day.steps = steps;
    if (distance !== null) day.distanceM = distance;
    // Enerji tahmini aktif + bazal (enerji-harcamasi-tahmin-apple); biri yoksa gün eksik sayılır, yazılmaz.
    if (active !== undefined && basal !== undefined) day.caloriesKcal = Math.round(active + basal);
    return day;
  });

  const hourlyEnergy: HourOut[] = [];
  const seen = new Set<string>();
  for (const h of input.hours) {
    const localDate = clock.date(h.hourStart);
    const hourStart = h.hourStart.toISOString();
    if (!inWindow(localDate) || seen.has(hourStart) || !Number.isFinite(h.kcal) || h.kcal < 0) continue;
    seen.add(hourStart);
    hourlyEnergy.push({ hourStart, localDate, localHour: clock.hour(h.hourStart), kcal: round(h.kcal, 1)! });
  }

  const workouts = buildWorkouts(input.workouts, clock).filter((w) => inWindow(w.localDate));
  return { window: { from: input.from, to: input.to }, days, sleep, workouts, hourlyEnergy };
}

/** `fromDate`'ten bugüne en çok CHUNK_DAYS günlük yükleme pencereleri, eskiden yeniye. */
export function syncWindows(today: string, fromDate: string): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  for (let from = fromDate; from <= today; from = addDays(from, CHUNK_DAYS)) {
    const to = addDays(from, CHUNK_DAYS - 1);
    out.push({ from, to: to < today ? to : today });
  }
  return out;
}
