// Apple Health yüklemesi (karar 0061 sıra 3b). Telefon HealthKit örneklerinden günlük / gecelik değerleri kendisi
// hesaplar ve bu biçimde gönderir; ham örnek buluta çıkmaz. Burada yalnız biçim denetlenir ve satırlar kurulur.
//
// Sınırlar sağlık eşiği değildir, biçim denetimidir: fiziksel olarak imkansız değeri (ör. 400 atım/dk, negatif adım)
// ve bozuk istemciyi durdurur. Yorum ve eşik motorda, kaynaklı kurallarla (research/rules).
// Hatalı istek bütünüyle reddedilir; yanıtta yalnız alan yolları döner, değer dönmez ve günlüğe yazılmaz.

export const SOURCE = 'apple_health';

/** İlk yüklemede telefon en çok bu kadar gün geriye gider (Google senkronunun BACKFILL_DAYS'iyle aynı). */
export const MAX_DAYS_BACK = 90;
export const LIMITS = { days: 92, sleep: 400, workouts: 500, hourlyEnergy: 240, cycle: 92 } as const;
/** İsteğe bağlı gövde anahtarları (liste olmayanlar). */
const OTHER_KEYS = ['window'] as const;
/** Gövde sınırı (bayt); yukarıdaki üst sınırlarla dolu bir istek ~400 KB. */
export const MAX_BODY_BYTES = 1_000_000;

type Range = readonly [min: number, max: number, integer?: true];

// Biçim sınırları (alan → [en az, en çok, tamsayı mı]).
const DAY_FIELDS = {
  hrvSleepSdnnMs: [1, 300],
  sleepHrBpm: [20, 250],
  restingHrBpm: [20, 250, true],
  respiratoryRateBpm: [1, 80],
  spo2AvgPct: [50, 100],
  steps: [0, 200_000, true],
  distanceM: [0, 500_000],
  caloriesKcal: [0, 30_000],
} as const satisfies Record<string, Range>;

const DAY_COLUMNS: Record<keyof typeof DAY_FIELDS, string> = {
  hrvSleepSdnnMs: 'hrv_sleep_sdnn_ms',
  sleepHrBpm: 'sleep_hr_bpm',
  restingHrBpm: 'resting_hr_bpm',
  respiratoryRateBpm: 'respiratory_rate_bpm',
  spo2AvgPct: 'spo2_avg_pct',
  steps: 'steps',
  distanceM: 'distance_m',
  caloriesKcal: 'calories_kcal',
};

const MINUTES: Range = [0, 1440, true];
const OFFSET_S: Range = [-18 * 3600, 18 * 3600, true];
const MAX_SESSION_MS = 24 * 3600 * 1000;
const ID_RE = /^[A-Za-z0-9._:-]{1,200}$/;
const TYPE_RE = /^[A-Za-z0-9_]{1,60}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Döngü evreleri (rules/dongu.json → dongu-evre; veritabanı CHECK'iyle aynı). */
export const CYCLE_PHASES = ['adet', 'folikuler', 'luteal', 'adet_oncesi'] as const;

export type Row = Record<string, string | number | boolean | null>;

export interface IngestRows {
  daily: Row[];
  sleep: Row[];
  exercise: Row[];
  hourlyEnergy: Row[];
  /** Döngü günleri (karar 0061 sıra 5): yalnız gün, döngü günü, evre, düzensiz bayrağı; ham adet kaydı yok. */
  cycle: Row[];
}

/**
 * Yenileme penceresi (yerel tarihler, uçlar dahil). Telefon pencerenin bütün uyku oturumlarını, antrenmanlarını ve
 * saatlik enerjisini gönderir; pencerede olup gönderilmeyen Apple satırı silinmiş sayılır ve silinir
 * (HealthKit'te silinen kayıt buluttan da kalkar). Pencere yoksa yalnız upsert yapılır.
 */
export interface ReplaceWindow {
  from: string;
  to: string;
}

export type ParseResult = { ok: true; rows: IngestRows; window: ReplaceWindow | null } | { ok: false; issues: string[] };

const MAX_ISSUES = 20;

class Checker {
  readonly issues: string[] = [];
  readonly earliest: string;
  readonly latest: string;
  constructor(earliest: string, latest: string) {
    this.earliest = earliest;
    this.latest = latest;
  }

  fail(path: string): null {
    if (this.issues.length < MAX_ISSUES) this.issues.push(path);
    return null;
  }

  num(obj: Record<string, unknown>, key: string, path: string, [min, max, integer]: Range, required = false): number | null {
    const v = obj[key];
    if (v === undefined || v === null) return required ? this.fail(`${path}.${key}`) : null;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) {
      return this.fail(`${path}.${key}`);
    }
    return v;
  }

  date(obj: Record<string, unknown>, key: string, path: string): string | null {
    const v = obj[key];
    if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(`${v}T00:00:00Z`))) return this.fail(`${path}.${key}`);
    if (new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) !== v) return this.fail(`${path}.${key}`);
    if (v < this.earliest || v > this.latest) return this.fail(`${path}.${key}`);
    return v;
  }

  instant(obj: Record<string, unknown>, key: string, path: string): string | null {
    const v = obj[key];
    // Saat dilimi ya da Z zorunlu: yerel saat belirsizdir.
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(v)) {
      return this.fail(`${path}.${key}`);
    }
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? this.fail(`${path}.${key}`) : new Date(ms).toISOString();
  }

  str(obj: Record<string, unknown>, key: string, path: string, re: RegExp): string | null {
    const v = obj[key];
    return typeof v === 'string' && re.test(v) ? v : this.fail(`${path}.${key}`);
  }

  bool(obj: Record<string, unknown>, key: string, path: string): boolean | null {
    const v = obj[key];
    if (v === undefined) return null;
    return typeof v === 'boolean' ? v : this.fail(`${path}.${key}`);
  }

  span(start: string | null, end: string | null, path: string): void {
    if (!start || !end) return;
    const d = Date.parse(end) - Date.parse(start);
    if (d < 0 || d > MAX_SESSION_MS) this.fail(`${path}.endTime`);
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function list(c: Checker, body: Record<string, unknown>, key: keyof typeof LIMITS): Record<string, unknown>[] {
  const v = body[key];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > LIMITS[key]) {
    c.fail(key);
    return [];
  }
  return v.filter((item, i) => (isObject(item) ? true : (c.fail(`${key}[${i}]`), false))) as Record<string, unknown>[];
}

function duplicates(c: Checker, rows: Row[], key: string, path: string): void {
  const seen = new Set<unknown>();
  rows.forEach((r, i) => {
    if (seen.has(r[key])) c.fail(`${path}[${i}].${key}`);
    seen.add(r[key]);
  });
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Gövdeyi denetler ve tablo satırlarını kurar. Günler tam yazılır: gönderilmeyen alan null olur (telefon o günün
 * bütün değerlerini birlikte gönderir; supabase-js upsert anahtar birleşimiyle de bunu yapar, LESSONS).
 * Tarih penceresi UTC'ye göre bir gün gevşek: kullanıcının saat dilimi sunucuda bilinmez.
 */
export function parseIngestBody(body: unknown, now: Date): ParseResult {
  const today = now.toISOString().slice(0, 10);
  const c = new Checker(addDays(today, -MAX_DAYS_BACK), addDays(today, 1));
  if (!isObject(body)) return { ok: false, issues: ['body'] };
  for (const key of Object.keys(body)) if (!(key in LIMITS) && !(OTHER_KEYS as readonly string[]).includes(key)) c.fail(key);

  let window: ReplaceWindow | null = null;
  if (body.window !== undefined) {
    const w = body.window;
    if (!isObject(w) || Object.keys(w).some((k) => k !== 'from' && k !== 'to')) c.fail('window');
    else {
      const from = c.date(w, 'from', 'window');
      const to = c.date(w, 'to', 'window');
      if (from && to) {
        if (from > to) c.fail('window.to');
        else window = { from, to };
      }
    }
  }

  const daily = list(c, body, 'days').map((d, i): Row => {
    const path = `days[${i}]`;
    for (const key of Object.keys(d)) if (key !== 'localDate' && !(key in DAY_FIELDS)) c.fail(`${path}.${key}`);
    const row: Row = { local_date: c.date(d, 'localDate', path), source: SOURCE };
    for (const [key, range] of Object.entries(DAY_FIELDS) as [keyof typeof DAY_FIELDS, Range][]) {
      row[DAY_COLUMNS[key]] = c.num(d, key, path, range);
    }
    return row;
  });

  const sleep = list(c, body, 'sleep').map((s, i): Row => {
    const path = `sleep[${i}]`;
    const start = c.instant(s, 'startTime', path);
    const end = c.instant(s, 'endTime', path);
    c.span(start, end, path);
    const isNap = c.bool(s, 'isNap', path) ?? false;
    return {
      source_id: c.str(s, 'sourceId', path, ID_RE),
      local_date: c.date(s, 'localDate', path),
      start_time: start,
      end_time: end,
      start_utc_offset_s: c.num(s, 'startUtcOffsetS', path, OFFSET_S),
      end_utc_offset_s: c.num(s, 'endUtcOffsetS', path, OFFSET_S),
      is_nap: isNap,
      is_main: !isNap,
      minutes_in_period: c.num(s, 'minutesInPeriod', path, MINUTES),
      minutes_asleep: c.num(s, 'minutesAsleep', path, MINUTES, true),
      minutes_awake: c.num(s, 'minutesAwake', path, MINUTES),
      minutes_light: c.num(s, 'minutesCore', path, MINUTES),
      minutes_deep: c.num(s, 'minutesDeep', path, MINUTES),
      minutes_rem: c.num(s, 'minutesRem', path, MINUTES),
      source: SOURCE,
    };
  });

  const exercise = list(c, body, 'workouts').map((w, i): Row => {
    const path = `workouts[${i}]`;
    const start = c.instant(w, 'startTime', path);
    const end = c.instant(w, 'endTime', path);
    c.span(start, end, path);
    return {
      source_id: c.str(w, 'sourceId', path, ID_RE),
      local_date: c.date(w, 'localDate', path),
      start_time: start,
      end_time: end,
      start_utc_offset_s: c.num(w, 'startUtcOffsetS', path, OFFSET_S),
      exercise_type: c.str(w, 'exerciseType', path, TYPE_RE),
      active_duration_s: c.num(w, 'activeDurationS', path, [0, 86_400, true]),
      avg_hr_bpm: c.num(w, 'avgHrBpm', path, [20, 250, true]),
      calories_kcal: c.num(w, 'caloriesKcal', path, [0, 30_000]),
      distance_m: c.num(w, 'distanceM', path, [0, 500_000]),
      steps: c.num(w, 'steps', path, [0, 200_000, true]),
      source: SOURCE,
    };
  });

  const hourlyEnergy = list(c, body, 'hourlyEnergy').map((h, i): Row => {
    const path = `hourlyEnergy[${i}]`;
    return {
      hour_start: c.instant(h, 'hourStart', path),
      local_date: c.date(h, 'localDate', path),
      local_hour: c.num(h, 'localHour', path, [0, 23, true], true),
      kcal: c.num(h, 'kcal', path, [0, 5_000], true),
      source: SOURCE,
    };
  });

  const cycle = list(c, body, 'cycle').map((d, i): Row => {
    const path = `cycle[${i}]`;
    for (const key of Object.keys(d)) if (!['localDate', 'cycleDay', 'phase', 'irregular'].includes(key)) c.fail(`${path}.${key}`);
    const phase = d.phase === undefined || d.phase === null ? null : (CYCLE_PHASES as readonly unknown[]).includes(d.phase) ? (d.phase as string) : c.fail(`${path}.phase`);
    const irregular = c.bool(d, 'irregular', path) ?? false;
    // Düzensiz döngüde evre hesaplanmaz (dongu-duzensiz).
    if (irregular && phase !== null) c.fail(`${path}.phase`);
    return {
      local_date: c.date(d, 'localDate', path),
      cycle_day: c.num(d, 'cycleDay', path, [1, 400, true], true),
      phase,
      irregular,
    };
  });

  duplicates(c, daily, 'local_date', 'days');
  duplicates(c, cycle, 'local_date', 'cycle');
  duplicates(c, sleep, 'source_id', 'sleep');
  duplicates(c, exercise, 'source_id', 'workouts');
  duplicates(c, hourlyEnergy, 'hour_start', 'hourlyEnergy');

  // Pencere varken silinecek satırlar yalnız pencereden seçilir; pencere dışı satır gönderilemez.
  if (window) {
    const w = window;
    const outside = (rows: Row[], path: string) =>
      rows.forEach((r, i) => {
        const d = r.local_date as string | null;
        if (d && (d < w.from || d > w.to)) c.fail(`${path}[${i}].localDate`);
      });
    outside(sleep, 'sleep');
    outside(exercise, 'workouts');
    outside(hourlyEnergy, 'hourlyEnergy');
    outside(cycle, 'cycle');
  }

  if (c.issues.length > 0) return { ok: false, issues: c.issues };
  return { ok: true, rows: { daily, sleep, exercise, hourlyEnergy, cycle }, window };
}

export interface IngestStore {
  /** Kullanıcının profilindeki veri kaynağı; satır yoksa null. */
  dataSource(userId: string): Promise<string | null>;
  /** Kullanıcı rıza ekranını onayladı mı (karar 0061 sıra 6)? Onaylamadıysa hiçbir şey yazılmaz. */
  consented(userId: string): Promise<boolean>;
  /** Profilde döngü takibi açık mı (kadın ve cycle_tracking)? Kapalıysa döngü satırı yazılmaz. */
  cycleEnabled(userId: string): Promise<boolean>;
  upsert(
    table: 'health_daily' | 'sleep_sessions' | 'exercise_sessions' | 'health_hourly_energy' | 'cycle_days',
    onConflict: string,
    rows: Row[],
  ): Promise<void>;
  /** Penceredeki Apple satırlarının anahtarları (yalnız bu kullanıcı, yalnız apple_health; cycle_days zaten yalnız Apple). */
  keysInWindow(table: ReplaceTable, key: ReplaceKey, userId: string, window: ReplaceWindow): Promise<string[]>;
  /** Verilen anahtarlı Apple satırlarını siler (yalnız bu kullanıcı, yalnız apple_health). */
  deleteKeys(table: ReplaceTable, key: ReplaceKey, userId: string, keys: string[]): Promise<void>;
}

export type ReplaceTable = 'sleep_sessions' | 'exercise_sessions' | 'health_hourly_energy' | 'cycle_days';
export type ReplaceKey = 'source_id' | 'hour_start' | 'local_date';

/** Zaman damgası anahtarları veritabanından farklı biçimde dönebilir; kıyas ISO UTC'de yapılır. */
function normalizeKey(key: ReplaceKey, v: string): string {
  return key === 'hour_start' ? new Date(v).toISOString() : v;
}

export interface IngestResult {
  httpStatus: number;
  body: { error: string; issues?: string[] } | { counts: Record<keyof IngestRows, number>; deleted: number };
}

/** Yalnız apple_health profili yükleyebilir; veritabanındaki kaynak bekçisi aynı kuralı ikinci kez uygular. */
export async function runIngest(input: { userId: string; body: unknown; now: Date }, store: IngestStore): Promise<IngestResult> {
  const source = await store.dataSource(input.userId);
  if (source !== SOURCE) return { httpStatus: 403, body: { error: 'wrong_profile' } };
  // Rıza uygulamada da kapıdır (senkron rızadan önce başlamaz); sunucu aynı kuralı ikinci kez uygular.
  if (!(await store.consented(input.userId))) return { httpStatus: 403, body: { error: 'no_consent' } };

  const parsed = parseIngestBody(input.body, input.now);
  if (!parsed.ok) return { httpStatus: 400, body: { error: 'invalid_body', issues: parsed.issues } };

  const { rows, window } = parsed;
  const withUser = (list: Row[]) => list.map((r) => ({ ...r, user_id: input.userId }));
  if (rows.daily.length) await store.upsert('health_daily', 'user_id,local_date', withUser(rows.daily));
  if (rows.sleep.length) await store.upsert('sleep_sessions', 'user_id,source_id', withUser(rows.sleep));
  if (rows.exercise.length) await store.upsert('exercise_sessions', 'user_id,source_id', withUser(rows.exercise));
  if (rows.hourlyEnergy.length) await store.upsert('health_hourly_energy', 'user_id,hour_start', withUser(rows.hourlyEnergy));
  // Döngü: yalnız takip açıkken. Kapalıysa telefonun (eski önbellekle) gönderdiği satır yazılmaz, hata da sayılmaz;
  // veritabanı bekçisi aynı kuralı ikinci kez uygular, takip kapanınca satırları tetikleyici siler.
  const cycleOn = rows.cycle.length > 0 || window ? await store.cycleEnabled(input.userId) : false;
  const cycleRows = cycleOn ? rows.cycle : [];
  if (cycleRows.length) await store.upsert('cycle_days', 'user_id,local_date', withUser(cycleRows));

  let deleted = 0;
  if (window) {
    const replace: [ReplaceTable, ReplaceKey, Row[]][] = [
      ['sleep_sessions', 'source_id', rows.sleep],
      ['exercise_sessions', 'source_id', rows.exercise],
      ['health_hourly_energy', 'hour_start', rows.hourlyEnergy],
      ...(cycleOn ? [['cycle_days', 'local_date', cycleRows] as [ReplaceTable, ReplaceKey, Row[]]] : []),
    ];
    for (const [table, key, sent] of replace) {
      const keep = new Set(sent.map((r) => normalizeKey(key, r[key] as string)));
      const stale = (await store.keysInWindow(table, key, input.userId, window)).filter((k) => !keep.has(normalizeKey(key, k)));
      if (stale.length) await store.deleteKeys(table, key, input.userId, stale);
      deleted += stale.length;
    }
  }

  return {
    httpStatus: 200,
    body: {
      counts: {
        daily: rows.daily.length,
        sleep: rows.sleep.length,
        exercise: rows.exercise.length,
        hourlyEnergy: rows.hourlyEnergy.length,
        cycle: cycleRows.length,
      },
      deleted,
    },
  };
}
