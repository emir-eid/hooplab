// Koçun günlük özeti için anlık değerler (karar 0032): uygulama motorun hesapladığı değerleri gönderir,
// fonksiyon bu şemayla doğrular. Sayıları motor hesaplar (CLAUDE.md §3); burada hesap yok, yalnız biçim ve
// aralık denetimi var. Aralıklar veri doğrulamasıdır, bilimsel eşik değildir. Kuralların eşikleri istemciden
// gelmez; günün sayıları belgesi onları kanıt tabanındaki kural değerlerinden yazar (documents.ts).
//
// Şema katıdır: bilinmeyen alan reddedilir. Böylece Anthropic'e şemada yazılı olmayan veri (ad, kilo, ham seri)
// yanlışlıkla gitmez (DATA-INVENTORY). Kilonun kendisi yoktur; g/kg ve gram hedeflerinin içinde dolaylıdır.
//
// Enum listeleri packages/engine'dekilerle aynıdır; Edge Function motoru içe aktarmaz (Deno paketleme
// doğrulanmadı, karar 0032). Eşitliği tests/coach/snapshot.test.ts denetler.

export const snapshotVersion = 1;

export const dayLevels = ['ready', 'caution', 'recover', 'insufficient'] as const;
export const recoverySignals = ['hrv_low', 'hrv_high', 'rhr_high', 'sleep_short'] as const;
export const bandPositions = ['below', 'within', 'above'] as const;
export const wellnessItems = ['sleep_quality', 'fatigue', 'soreness', 'stress', 'mood'] as const;
export const bodyRegions = [
  'calf',
  'achilles',
  'ankle',
  'patellar_tendon',
  'quadriceps',
  'hamstring',
  'adductor',
  'hip',
  'lower_back',
  'shoulder',
] as const;
export const bodySides = ['left', 'right', 'center'] as const;
export const painNoteReasons = ['high', 'notDecreasing'] as const;
export const dayTypes = ['rest', 'training', 'match', 'high'] as const;
export const venues = ['home', 'away'] as const;
export const travelPhases = ['before', 'departure', 'away', 'return', 'after'] as const;
export const travelDirections = ['east', 'west'] as const;
export const rangePositions = ['below', 'within', 'above'] as const;

export type DayLevel = (typeof dayLevels)[number];
export type RecoverySignal = (typeof recoverySignals)[number];
export type BandPosition = (typeof bandPositions)[number];
export type WellnessItem = (typeof wellnessItems)[number];
export type BodyRegion = (typeof bodyRegions)[number];
export type BodySide = (typeof bodySides)[number];
export type PainNoteReason = (typeof painNoteReasons)[number];
export type DayType = (typeof dayTypes)[number];
export type RangePosition = (typeof rangePositions)[number];
export type Venue = (typeof venues)[number];
export type TravelPhase = (typeof travelPhases)[number];
export type TravelDirection = (typeof travelDirections)[number];

export type Range = readonly [number, number];

export interface BandValue {
  low: number;
  high: number;
}

export interface StatusMetric {
  level: DayLevel;
  signals: readonly RecoverySignal[];
}

/** HRV (ms) ve uyku nabzı (atım/dk, karar 0041): son 7 günün ortalaması ve kişisel bant (karar 0021). */
export interface BandMetric {
  rolling: number | null;
  lastNight: number | null;
  band: BandValue | null;
  position: BandPosition | null;
}

export interface SleepMetric {
  /** Son 7 gecenin ortalaması (saat). */
  rollingHours: number | null;
  lastNightHours: number | null;
  short: boolean | null;
}

/** Gece solunumu (nefes/dk; karar 0028). Günün durumuna girmez. */
export interface RespirationMetric extends BandMetric {
  nightHigh: boolean | null;
}

/**
 * Gece işaretleri (karar 0039; rules/hastalik-isaretleri.json): tanı koymayan notlar. Değer motorda hesaplanır; null =
 * hesaplanamadı (yakın gece ya da taban yok). Günün durumuna girmez; koç yorumlamaz, uygulama sabit metinle yönlendirir.
 */
export interface SignsMetric {
  rhrHigh: boolean | null;
  spo2Low: boolean | null;
  skinTempHigh: boolean | null;
}

export interface CheckinMetric {
  /** Bugünkü toplam (5-25). */
  total: number;
  baselineMean: number | null;
  z: number | null;
  low: boolean;
  /** En çok düşen madde; düşüş yoksa null. */
  topDrop: WellnessItem | null;
}

/** Antrenman yükü (AU; karar 0025). Oran yalnız bağlamdır, tahmin etiketli. */
export interface LoadMetric {
  week: number | null;
  previousWeek: number | null;
  /** Kesir: 0,25 = %25 artış. */
  weekChange: number | null;
  weeklyAverage: number | null;
  ratio: number | null;
  spike: boolean;
  monotony: number | null;
  strain: number | null;
}

/** Toparlanma penceresindeki bir bölge (karar 0027; tahmin). */
export interface RegionMetric {
  region: BodyRegion;
  load: number;
  sessions: number;
  hoursSinceLoaded: number | null;
  windowHours: number;
  typical: number | null;
}

/** Bugünkü sabah ağrısı için ağrı izleme notu (karar 0027; tahmin, tanı değil). */
export interface PainMetric {
  region: BodyRegion;
  side: BodySide;
  pain: number;
  yesterdayPain: number | null;
  reasons: readonly PainNoteReason[];
}

/** Beslenme hedefleri ve kayıtlı alım (karar 0029, 0030). Gram hedefi yoksa kilo girilmemiştir. */
export interface NutritionMetric {
  dayType: DayType;
  carbsPerKg: Range;
  proteinPerKg: Range;
  carbsG: Range | null;
  proteinG: Range | null;
  intakeCarbsG: number | null;
  intakeProteinG: number | null;
  carbsPosition: RangePosition | null;
  proteinPosition: RangePosition | null;
  meals: number;
}

export interface FluidMetric {
  /** Günün içtiği sıvı (L); hedefsiz (karar 0031). */
  totalL: number;
}

/** Bugünkü ter testi (karar 0029). */
export interface SweatMetric {
  lossL: number;
  rateLPerH: number;
  /** Seans öncesi kilonun yüzdesi olarak net değişim (negatif = kayıp). */
  changePercent: number;
  lossNote: boolean;
  gainNote: boolean;
  fluidTargetL: Range | null;
}

/** Takvimdeki bir maç (karar 0046): başlama saati "SS:DD" ve yer; bilinmiyorsa null. Rakip, şehir yok. */
export interface MatchBrief {
  startTime: string | null;
  venue: Venue | null;
}

export type ClockRange = readonly [string, string];

/** Bugünün maçı için motorun zamanlaması (mac-oncesi-ogun, mac-gunu-sekerleme, mac-sonrasi); gram ve mL kiloyla. */
export interface MatchPlan {
  meal: ClockRange;
  mealCarbsG: Range | null;
  fluid: ClockRange;
  fluidMl: Range | null;
  nap: ClockRange | null;
  postCarbsGPerHour: number | null;
}

/** Maç çevresi (karar 0046): dün, bugün, yarın. Alan yoksa takvimde maç yok (eski istemci de göndermez). */
export interface MatchContext {
  yesterday: MatchBrief | null;
  today: MatchBrief | null;
  tomorrow: MatchBrief | null;
  plan: MatchPlan | null;
}

/**
 * Seyahat (karar 0047): bugünün evresi, saat farkı ve motorun uyum tahmini (gün). Şehir ve tarih gitmez.
 * Alan yoksa bugün ilgili seyahat yok.
 */
export interface TravelContext {
  phase: TravelPhase;
  /** Varılan yer − ev (saat; + doğu, − batı). */
  offsetHours: number;
  /** Bu evredeki uyum yönü (dönüşten sonra ters); saat farkı yoksa null. */
  direction: TravelDirection | null;
  jetLag: boolean;
  daysUntil: number | null;
  dayAway: number | null;
  totalDays: number | null;
  remainingDays: number | null;
  firstHours: boolean;
  eastDelayHint: boolean;
}

export interface CoachSnapshot {
  version: typeof snapshotVersion;
  /** Sporcunun yerel günü (YYYY-MM-DD). Modele gitmez; kayıt anahtarıdır. */
  date: string;
  matchDay: boolean;
  match?: MatchContext;
  travel?: TravelContext;
  status?: StatusMetric;
  hrv?: BandMetric;
  rhr?: BandMetric;
  sleep?: SleepMetric;
  respiration?: RespirationMetric;
  signs?: SignsMetric;
  checkin?: CheckinMetric;
  load?: LoadMetric;
  regions?: readonly RegionMetric[];
  pain?: readonly PainMetric[];
  nutrition?: NutritionMetric;
  fluid?: FluidMetric;
  sweatTest?: SweatMetric;
}

export const metricKeys = [
  'status',
  'hrv',
  'rhr',
  'sleep',
  'respiration',
  'signs',
  'checkin',
  'load',
  'regions',
  'pain',
  'nutrition',
  'fluid',
  'sweatTest',
] as const;
export type MetricKey = (typeof metricKeys)[number];

/**
 * Ölçüm → research/rules kural kimlikleri. Günlük özette bu kuralların kaynakları modele gider (selectForRules).
 * Eşleme uygulamanın açıklama sayfalarıyla (copy/explainers.ts) aynı kuralları kullanır; testle denetlenir.
 * Kural kimliğini istemci göndermez: sunucu ölçümün türünden çıkarır.
 */
export const metricRules: Readonly<Record<MetricKey, readonly string[]>> = {
  status: ['gunun-durumu', 'toparlanma-bant', 'toparlanma-veri-yeterliligi'],
  hrv: ['hrv-olcu', 'toparlanma-bant', 'toparlanma-veri-yeterliligi'],
  rhr: ['nabiz-olcu', 'toparlanma-bant', 'toparlanma-veri-yeterliligi'],
  sleep: ['uyku-kisa'],
  respiration: ['solunum-bant', 'solunum-tek-gece', 'toparlanma-veri-yeterliligi'],
  signs: ['gece-nabzi-yuksek', 'gece-spo2-dusuk', 'cilt-sicakligi-yuksek', 'hastalik-isareti-yonlendirme'],
  checkin: ['checkin-olcek', 'checkin-kisisel'],
  load: ['seans-rpe-olcek', 'seans-yuku', 'yuk-gunluk', 'yuk-haftalik', 'yuk-ewma', 'yuk-orani', 'yuk-artis-notu', 'yuk-monotonluk'],
  regions: ['bolge-icerik-etiketleri', 'bolge-esleme', 'bolge-yuku', 'bolge-toparlanma-penceresi'],
  pain: ['agri-olcek', 'bolge-agri-izleme'],
  nutrition: ['karbonhidrat-gun-tipi', 'protein-gunluk', 'ogun-besin-listesi', 'alim-hedef-kiyasi', 'enerji-yeterliligi'],
  fluid: ['sivi-alim-kaydi'],
  sweatTest: ['ter-orani', 'kilo-kaybi-notu', 'kilo-artisi-notu', 'sivi-hedefi'],
};

/** Ölçümlerden hangileri tahmin (CLAUDE.md §3: tahmin, tahmin olarak etiketlenir). */
export const estimateMetrics: ReadonlySet<MetricKey> = new Set(['load', 'regions', 'pain', 'nutrition']);

/** Anlık değerlerde bulunan ölçümler, sabit sırayla. Boş dizi (bölge, ağrı) yok sayılır. */
export function presentMetrics(snapshot: CoachSnapshot): MetricKey[] {
  return metricKeys.filter((key) => {
    const value = snapshot[key];
    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  });
}

/**
 * Dikkat isteyen ölçümler (maliyet ölçümü, 2026-10-09; varsayılan değil, kullanıcı kararı bekliyor): günün durumu ve
 * beslenme hedefi her zaman; HRV, nabız, uyku, solunum, check-in ve yük yalnız bandın dışındaysa ya da notu varsa;
 * bölge ve ağrı varsa. Olağan ölçümlerin sayıları belgeye yine girer; yalnız kaynakları gönderilmez.
 */
export function attentionMetrics(snapshot: CoachSnapshot): MetricKey[] {
  const s = snapshot;
  const outside = (m: BandMetric | undefined) => m !== undefined && m.position !== null && m.position !== 'within';
  const keep: Record<MetricKey, boolean> = {
    status: s.status !== undefined,
    hrv: outside(s.hrv),
    rhr: outside(s.rhr),
    sleep: s.sleep?.short === true,
    respiration: s.respiration?.nightHigh === true || s.respiration?.position === 'above',
    signs: s.signs !== undefined && Object.values(s.signs).some((v) => v === true),
    checkin: s.checkin?.low === true,
    load: s.load?.spike === true,
    regions: (s.regions?.length ?? 0) > 0,
    pain: (s.pain?.length ?? 0) > 0,
    nutrition: s.nutrition !== undefined,
    fluid: false,
    sweatTest: s.sweatTest !== undefined,
  };
  return presentMetrics(snapshot).filter((key) => keep[key]);
}

/** Maç günü işaretliyse koçun hazırlık dili için kural (rules/mac.json; ısınma, karbonhidrat, sıvı, maç sonrası). */
export const matchDayRules: readonly string[] = ['mac-gunu'];

/**
 * Maç çevresinin kuralları (karar 0046): bugün maç varsa maç günü ve maç sonrası (saat biliniyorsa öğün, şekerleme
 * penceresi varsa şekerleme), yarın maç varsa maçtan önceki gün, dün maç vardıysa maç sonrası.
 */
export function matchRuleIds(snapshot: CoachSnapshot): string[] {
  const m = snapshot.match;
  const ids: string[] = snapshot.matchDay ? [...matchDayRules] : [];
  if (m?.today) {
    if (m.plan) ids.push('mac-oncesi-ogun');
    if (m.plan?.nap) ids.push('mac-gunu-sekerleme');
    ids.push('mac-sonrasi');
  }
  if (m?.tomorrow) ids.push('mac-oncesi-gun');
  if (m?.yesterday) ids.push('mac-sonrasi');
  return [...new Set(ids)];
}

/**
 * Seyahatin kuralları (karar 0047): yolculuk günü seyahat yorgunluğu; jet lag'de uyum ve (öncesinde ya da ilk 72 saatte)
 * varış kuralı.
 */
export function travelRuleIds(snapshot: CoachSnapshot): string[] {
  const t = snapshot.travel;
  if (!t) return [];
  const ids: string[] = [];
  if (t.phase === 'departure' || t.phase === 'return') ids.push('seyahat-yorgunlugu');
  if (t.jetLag) {
    ids.push('jet-lag-uyum');
    if (t.phase === 'before' || t.firstHours) ids.push('jet-lag-varis');
  }
  return ids;
}

/** Anlık değerlerin kullandığı kurallar: önce maç çevresi ve seyahatinkiler, sonra ölçüm sırasıyla, tekrarsız. */
export function snapshotRuleIds(snapshot: CoachSnapshot, metrics: readonly MetricKey[] = presentMetrics(snapshot)): string[] {
  return [...new Set([...matchRuleIds(snapshot), ...travelRuleIds(snapshot), ...metrics.flatMap((key) => metricRules[key])])];
}

// --- Doğrulama ---

export type SnapshotResult = { ok: true; snapshot: CoachSnapshot } | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;

class Checker {
  readonly errors: string[] = [];

  fail(path: string, message: string): void {
    this.errors.push(`${path}: ${message}`);
  }

  object(value: unknown, path: string, keys: readonly string[]): Obj | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.fail(path, 'nesne olmalı');
      return null;
    }
    for (const key of Object.keys(value)) if (!keys.includes(key)) this.fail(`${path}.${key}`, 'bilinmeyen alan');
    return value as Obj;
  }

  number(value: unknown, path: string, min: number, max: number, opts: { integer?: boolean } = {}): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      this.fail(path, 'sayı olmalı');
      return 0;
    }
    if (opts.integer && !Number.isInteger(value)) this.fail(path, 'tam sayı olmalı');
    if (value < min || value > max) this.fail(path, `${min} ile ${max} arasında olmalı`);
    return value;
  }

  nullableNumber(value: unknown, path: string, min: number, max: number, opts: { integer?: boolean } = {}): number | null {
    return value === null ? null : this.number(value, path, min, max, opts);
  }

  boolean(value: unknown, path: string): boolean {
    if (typeof value !== 'boolean') this.fail(path, 'true / false olmalı');
    return value === true;
  }

  nullableBoolean(value: unknown, path: string): boolean | null {
    return value === null ? null : this.boolean(value, path);
  }

  oneOf<T extends string>(value: unknown, path: string, options: readonly T[]): T {
    if (typeof value !== 'string' || !(options as readonly string[]).includes(value)) {
      this.fail(path, `şunlardan biri olmalı: ${options.join(', ')}`);
      return options[0]!;
    }
    return value as T;
  }

  nullableOneOf<T extends string>(value: unknown, path: string, options: readonly T[]): T | null {
    return value === null ? null : this.oneOf(value, path, options);
  }

  array(value: unknown, path: string, maxLength: number): unknown[] {
    if (!Array.isArray(value)) {
      this.fail(path, 'dizi olmalı');
      return [];
    }
    if (value.length > maxLength) this.fail(path, `en fazla ${maxLength} eleman`);
    return value;
  }

  uniqueOneOf<T extends string>(value: unknown, path: string, options: readonly T[]): T[] {
    const items = this.array(value, path, options.length).map((v, i) => this.oneOf(v, `${path}[${i}]`, options));
    if (new Set(items).size !== items.length) this.fail(path, 'tekrar eden değer');
    return items;
  }

  range(value: unknown, path: string, min: number, max: number): Range {
    const items = this.array(value, path, 2);
    if (items.length !== 2) {
      this.fail(path, 'iki elemanlı [alt, üst] olmalı');
      return [0, 0];
    }
    const low = this.number(items[0], `${path}[0]`, min, max);
    const high = this.number(items[1], `${path}[1]`, min, max);
    if (low > high) this.fail(path, 'alt sınır üst sınırdan büyük');
    return [low, high];
  }

  nullableRange(value: unknown, path: string, min: number, max: number): Range | null {
    return value === null ? null : this.range(value, path, min, max);
  }

  isoDate(value: unknown, path: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      this.fail(path, 'YYYY-MM-DD olmalı');
      return '';
    }
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) this.fail(path, 'geçersiz tarih');
    return value;
  }
}

// Veri doğrulama aralıkları (bilimsel eşik değil): fizyolojik olarak olanaksız ya da biçimce bozuk değerleri ayıklar.
// Uygulama da anlık değerleri kurarken aynı aralıkları kullanır (aralık dışı seçmeli değer gönderilmez).
export const snapshotLimits = {
  hrvMs: [1, 300],
  rhrBpm: [20, 200],
  respirationBpm: [4, 60],
  sleepHours: [0, 24],
  checkinTotal: [5, 25],
  z: [-20, 20],
  loadAu: [0, 100_000],
  weekChange: [-1, 100],
  ratio: [0, 20],
  monotony: [0, 100],
  strainAu: [0, 10_000_000],
  hours: [0, 24 * 60],
  sessions: [0, 100],
  nrs: [0, 10],
  perKg: [0, 20],
  grams: [0, 5000],
  meals: [0, 30],
  liters: [0, 30],
  milliliters: [0, 10_000],
  offsetHours: [-12, 14],
  travelDays: [0, 400],
  litersPerHour: [0, 10],
  percent: [-100, 100],
} as const satisfies Record<string, readonly [number, number]>;

function band(c: Checker, value: unknown, path: string, [min, max]: readonly [number, number]): BandValue | null {
  if (value === null) return null;
  const o = c.object(value, path, ['low', 'high']);
  if (!o) return null;
  const low = c.number(o.low, `${path}.low`, min, max);
  const high = c.number(o.high, `${path}.high`, min, max);
  if (low > high) c.fail(path, 'alt sınır üst sınırdan büyük');
  return { low, high };
}

function bandMetric(c: Checker, value: unknown, path: string, lim: readonly [number, number], extraKeys: readonly string[] = []): (BandMetric & Obj) | null {
  const o = c.object(value, path, ['rolling', 'lastNight', 'band', 'position', ...extraKeys]);
  if (!o) return null;
  return {
    ...o,
    rolling: c.nullableNumber(o.rolling, `${path}.rolling`, lim[0], lim[1]),
    lastNight: c.nullableNumber(o.lastNight, `${path}.lastNight`, lim[0], lim[1]),
    band: band(c, o.band, `${path}.band`, lim),
    position: c.nullableOneOf(o.position, `${path}.position`, bandPositions),
  };
}

const parsers: { [K in MetricKey]: (c: Checker, value: unknown, path: string) => CoachSnapshot[K] | null } = {
  status(c, value, path) {
    const o = c.object(value, path, ['level', 'signals']);
    if (!o) return null;
    return { level: c.oneOf(o.level, `${path}.level`, dayLevels), signals: c.uniqueOneOf(o.signals, `${path}.signals`, recoverySignals) };
  },
  hrv(c, value, path) {
    const m = bandMetric(c, value, path, snapshotLimits.hrvMs);
    return m && { rolling: m.rolling, lastNight: m.lastNight, band: m.band, position: m.position };
  },
  rhr(c, value, path) {
    const m = bandMetric(c, value, path, snapshotLimits.rhrBpm);
    return m && { rolling: m.rolling, lastNight: m.lastNight, band: m.band, position: m.position };
  },
  sleep(c, value, path) {
    const o = c.object(value, path, ['rollingHours', 'lastNightHours', 'short']);
    if (!o) return null;
    return {
      rollingHours: c.nullableNumber(o.rollingHours, `${path}.rollingHours`, ...snapshotLimits.sleepHours),
      lastNightHours: c.nullableNumber(o.lastNightHours, `${path}.lastNightHours`, ...snapshotLimits.sleepHours),
      short: c.nullableBoolean(o.short, `${path}.short`),
    };
  },
  respiration(c, value, path) {
    const m = bandMetric(c, value, path, snapshotLimits.respirationBpm, ['nightHigh']);
    if (!m) return null;
    return {
      rolling: m.rolling,
      lastNight: m.lastNight,
      band: m.band,
      position: m.position,
      nightHigh: c.nullableBoolean(m.nightHigh, `${path}.nightHigh`),
    };
  },
  signs(c, value, path) {
    const o = c.object(value, path, ['rhrHigh', 'spo2Low', 'skinTempHigh']);
    if (!o) return null;
    return {
      rhrHigh: c.nullableBoolean(o.rhrHigh, `${path}.rhrHigh`),
      spo2Low: c.nullableBoolean(o.spo2Low, `${path}.spo2Low`),
      skinTempHigh: c.nullableBoolean(o.skinTempHigh, `${path}.skinTempHigh`),
    };
  },
  checkin(c, value, path) {
    const o = c.object(value, path, ['total', 'baselineMean', 'z', 'low', 'topDrop']);
    if (!o) return null;
    return {
      total: c.number(o.total, `${path}.total`, ...snapshotLimits.checkinTotal, { integer: true }),
      baselineMean: c.nullableNumber(o.baselineMean, `${path}.baselineMean`, ...snapshotLimits.checkinTotal),
      z: c.nullableNumber(o.z, `${path}.z`, ...snapshotLimits.z),
      low: c.boolean(o.low, `${path}.low`),
      topDrop: c.nullableOneOf(o.topDrop, `${path}.topDrop`, wellnessItems),
    };
  },
  load(c, value, path) {
    const o = c.object(value, path, ['week', 'previousWeek', 'weekChange', 'weeklyAverage', 'ratio', 'spike', 'monotony', 'strain']);
    if (!o) return null;
    return {
      week: c.nullableNumber(o.week, `${path}.week`, ...snapshotLimits.loadAu),
      previousWeek: c.nullableNumber(o.previousWeek, `${path}.previousWeek`, ...snapshotLimits.loadAu),
      weekChange: c.nullableNumber(o.weekChange, `${path}.weekChange`, ...snapshotLimits.weekChange),
      weeklyAverage: c.nullableNumber(o.weeklyAverage, `${path}.weeklyAverage`, ...snapshotLimits.loadAu),
      ratio: c.nullableNumber(o.ratio, `${path}.ratio`, ...snapshotLimits.ratio),
      spike: c.boolean(o.spike, `${path}.spike`),
      monotony: c.nullableNumber(o.monotony, `${path}.monotony`, ...snapshotLimits.monotony),
      strain: c.nullableNumber(o.strain, `${path}.strain`, ...snapshotLimits.strainAu),
    };
  },
  regions(c, value, path) {
    const items = c.array(value, path, bodyRegions.length).map((item, i) => {
      const p = `${path}[${i}]`;
      const o = c.object(item, p, ['region', 'load', 'sessions', 'hoursSinceLoaded', 'windowHours', 'typical']);
      if (!o) return null;
      return {
        region: c.oneOf(o.region, `${p}.region`, bodyRegions),
        load: c.number(o.load, `${p}.load`, ...snapshotLimits.loadAu),
        sessions: c.number(o.sessions, `${p}.sessions`, ...snapshotLimits.sessions, { integer: true }),
        hoursSinceLoaded: c.nullableNumber(o.hoursSinceLoaded, `${p}.hoursSinceLoaded`, ...snapshotLimits.hours),
        windowHours: c.number(o.windowHours, `${p}.windowHours`, ...snapshotLimits.hours),
        typical: c.nullableNumber(o.typical, `${p}.typical`, ...snapshotLimits.loadAu),
      };
    });
    const regions = items.filter((r) => r !== null);
    if (new Set(regions.map((r) => r.region)).size !== regions.length) c.fail(path, 'tekrar eden bölge');
    return regions;
  },
  pain(c, value, path) {
    const items = c.array(value, path, bodyRegions.length * 2).map((item, i) => {
      const p = `${path}[${i}]`;
      const o = c.object(item, p, ['region', 'side', 'pain', 'yesterdayPain', 'reasons']);
      if (!o) return null;
      return {
        region: c.oneOf(o.region, `${p}.region`, bodyRegions),
        side: c.oneOf(o.side, `${p}.side`, bodySides),
        pain: c.number(o.pain, `${p}.pain`, ...snapshotLimits.nrs, { integer: true }),
        yesterdayPain: c.nullableNumber(o.yesterdayPain, `${p}.yesterdayPain`, ...snapshotLimits.nrs, { integer: true }),
        reasons: c.uniqueOneOf(o.reasons, `${p}.reasons`, painNoteReasons),
      };
    });
    const pain = items.filter((r) => r !== null);
    if (new Set(pain.map((r) => `${r.region}:${r.side}`)).size !== pain.length) c.fail(path, 'tekrar eden bölge / taraf');
    return pain;
  },
  nutrition(c, value, path) {
    const o = c.object(value, path, ['dayType', 'carbsPerKg', 'proteinPerKg', 'carbsG', 'proteinG', 'intakeCarbsG', 'intakeProteinG', 'carbsPosition', 'proteinPosition', 'meals']);
    if (!o) return null;
    return {
      dayType: c.oneOf(o.dayType, `${path}.dayType`, dayTypes),
      carbsPerKg: c.range(o.carbsPerKg, `${path}.carbsPerKg`, ...snapshotLimits.perKg),
      proteinPerKg: c.range(o.proteinPerKg, `${path}.proteinPerKg`, ...snapshotLimits.perKg),
      carbsG: c.nullableRange(o.carbsG, `${path}.carbsG`, ...snapshotLimits.grams),
      proteinG: c.nullableRange(o.proteinG, `${path}.proteinG`, ...snapshotLimits.grams),
      intakeCarbsG: c.nullableNumber(o.intakeCarbsG, `${path}.intakeCarbsG`, ...snapshotLimits.grams),
      intakeProteinG: c.nullableNumber(o.intakeProteinG, `${path}.intakeProteinG`, ...snapshotLimits.grams),
      carbsPosition: c.nullableOneOf(o.carbsPosition, `${path}.carbsPosition`, rangePositions),
      proteinPosition: c.nullableOneOf(o.proteinPosition, `${path}.proteinPosition`, rangePositions),
      meals: c.number(o.meals, `${path}.meals`, ...snapshotLimits.meals, { integer: true }),
    };
  },
  fluid(c, value, path) {
    const o = c.object(value, path, ['totalL']);
    if (!o) return null;
    return { totalL: c.number(o.totalL, `${path}.totalL`, ...snapshotLimits.liters) };
  },
  sweatTest(c, value, path) {
    const o = c.object(value, path, ['lossL', 'rateLPerH', 'changePercent', 'lossNote', 'gainNote', 'fluidTargetL']);
    if (!o) return null;
    return {
      lossL: c.number(o.lossL, `${path}.lossL`, ...snapshotLimits.liters),
      rateLPerH: c.number(o.rateLPerH, `${path}.rateLPerH`, ...snapshotLimits.litersPerHour),
      changePercent: c.number(o.changePercent, `${path}.changePercent`, ...snapshotLimits.percent),
      lossNote: c.boolean(o.lossNote, `${path}.lossNote`),
      gainNote: c.boolean(o.gainNote, `${path}.gainNote`),
      fluidTargetL: c.nullableRange(o.fluidTargetL, `${path}.fluidTargetL`, ...snapshotLimits.liters),
    };
  },
};

const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseClock(c: Checker, value: unknown, path: string): string {
  if (typeof value !== 'string' || !clockPattern.test(value)) {
    c.fail(path, 'SS:DD olmalı');
    return '00:00';
  }
  return value;
}

function parseClockRange(c: Checker, value: unknown, path: string): ClockRange {
  const items = c.array(value, path, 2);
  if (items.length !== 2) {
    c.fail(path, 'iki elemanlı [başlangıç, bitiş] olmalı');
    return ['00:00', '00:00'];
  }
  const from = parseClock(c, items[0], `${path}[0]`);
  const to = parseClock(c, items[1], `${path}[1]`);
  if (from > to) c.fail(path, 'başlangıç bitişten sonra');
  return [from, to];
}

function parseBrief(c: Checker, value: unknown, path: string): MatchBrief | null {
  if (value === null) return null;
  const o = c.object(value, path, ['startTime', 'venue']);
  if (!o) return null;
  return {
    startTime: o.startTime === null ? null : parseClock(c, o.startTime, `${path}.startTime`),
    venue: c.nullableOneOf(o.venue, `${path}.venue`, venues),
  };
}

function parseMatch(c: Checker, value: unknown, path: string): MatchContext | null {
  const o = c.object(value, path, ['yesterday', 'today', 'tomorrow', 'plan']);
  if (!o) return null;
  const today = parseBrief(c, o.today, `${path}.today`);
  let plan: MatchPlan | null = null;
  if (o.plan !== null) {
    const p = c.object(o.plan, `${path}.plan`, ['meal', 'mealCarbsG', 'fluid', 'fluidMl', 'nap', 'postCarbsGPerHour']);
    if (p) {
      plan = {
        meal: parseClockRange(c, p.meal, `${path}.plan.meal`),
        mealCarbsG: c.nullableRange(p.mealCarbsG, `${path}.plan.mealCarbsG`, ...snapshotLimits.grams),
        fluid: parseClockRange(c, p.fluid, `${path}.plan.fluid`),
        fluidMl: c.nullableRange(p.fluidMl, `${path}.plan.fluidMl`, ...snapshotLimits.milliliters),
        nap: p.nap === null ? null : parseClockRange(c, p.nap, `${path}.plan.nap`),
        postCarbsGPerHour: c.nullableNumber(p.postCarbsGPerHour, `${path}.plan.postCarbsGPerHour`, ...snapshotLimits.grams),
      };
    }
    if (today === null || today.startTime === null) c.fail(`${path}.plan`, 'bugün saati bilinen maç yoksa plan olmaz');
  }
  return { yesterday: parseBrief(c, o.yesterday, `${path}.yesterday`), today, tomorrow: parseBrief(c, o.tomorrow, `${path}.tomorrow`), plan };
}

function parseTravel(c: Checker, value: unknown, path: string): TravelContext | null {
  const keys = ['phase', 'offsetHours', 'direction', 'jetLag', 'daysUntil', 'dayAway', 'totalDays', 'remainingDays', 'firstHours', 'eastDelayHint'];
  const o = c.object(value, path, keys);
  if (!o) return null;
  const days = (v: unknown, p: string) => c.nullableNumber(v, `${path}.${p}`, ...snapshotLimits.travelDays, { integer: true });
  return {
    phase: c.oneOf(o.phase, `${path}.phase`, travelPhases),
    offsetHours: c.number(o.offsetHours, `${path}.offsetHours`, ...snapshotLimits.offsetHours, { integer: true }),
    direction: c.nullableOneOf(o.direction, `${path}.direction`, travelDirections),
    jetLag: c.boolean(o.jetLag, `${path}.jetLag`),
    daysUntil: days(o.daysUntil, 'daysUntil'),
    dayAway: days(o.dayAway, 'dayAway'),
    totalDays: days(o.totalDays, 'totalDays'),
    remainingDays: days(o.remainingDays, 'remainingDays'),
    firstHours: c.boolean(o.firstHours, `${path}.firstHours`),
    eastDelayHint: c.boolean(o.eastDelayHint, `${path}.eastDelayHint`),
  };
}

/** İstek gövdesindeki anlık değerleri doğrular. Hata varsa hepsini döndürür; kısmen geçerli veri kabul edilmez. */
export function parseSnapshot(input: unknown): SnapshotResult {
  const c = new Checker();
  const o = c.object(input, 'snapshot', ['version', 'date', 'matchDay', 'match', 'travel', ...metricKeys]);
  if (!o) return { ok: false, errors: c.errors };

  if (o.version !== snapshotVersion) c.fail('snapshot.version', `${snapshotVersion} olmalı`);
  const snapshot: CoachSnapshot = {
    version: snapshotVersion,
    date: c.isoDate(o.date, 'snapshot.date'),
    matchDay: c.boolean(o.matchDay, 'snapshot.matchDay'),
  };
  if (o.match !== undefined) {
    const match = parseMatch(c, o.match, 'snapshot.match');
    if (match) snapshot.match = match;
    if (match && (match.today !== null) !== snapshot.matchDay) c.fail('snapshot.match.today', 'matchDay ile aynı olmalı');
  }
  if (o.travel !== undefined) {
    const travel = parseTravel(c, o.travel, 'snapshot.travel');
    if (travel) snapshot.travel = travel;
  }
  for (const key of metricKeys) {
    if (o[key] === undefined) continue;
    const parsed = parsers[key](c, o[key], `snapshot.${key}`);
    if (parsed !== null) (snapshot as unknown as Obj)[key] = parsed;
  }
  return c.errors.length ? { ok: false, errors: c.errors } : { ok: true, snapshot };
}
