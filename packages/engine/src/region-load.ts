// Kas ve tendon bölge yükü (karar 0027, research/rules/bolge.json). Tahmindir: doku yükü ölçmez; "bu bölge
// son 2-3 günde hangi seanslarla, ne yoğunlukta çalıştı" sorusunu cevaplar. Katsayı, sönüm, eşik ve risk yok.
// Tarihler "YYYY-AA-GG" sporcunun yerel takvim günleri (karar 0015).

import { bodySpots, spotKey, type BodyRegion, type BodySide } from './body-regions.ts';
import { addIsoDays } from './recovery.ts';
import { sessionLoad } from './session-load.ts';
import type { LoadSession } from './training-load.ts';

/** Seans türleri, formdaki sırayla. Veritabanındaki CHECK listesiyle aynı küme. */
export const sessionKinds = ['team_practice', 'game', 'shooting', 'strength', 'conditioning', 'mobility', 'rehab'] as const;
export type SessionKind = (typeof sessionKinds)[number];

/** rules/bolge.json → bolge-icerik-etiketleri. Veritabanındaki CHECK listesiyle aynı. */
export const contentTags = ['jump', 'cod', 'sprint', 'lower_strength', 'upper_strength'] as const;
export type ContentTag = (typeof contentTags)[number];

/** rules/bolge.json → bolge-icerik-etiketleri: türe göre hazır seçim (arayüz varsayılanı, eşik değil). */
export const defaultContentTags: Readonly<Record<SessionKind, readonly ContentTag[]>> = {
  team_practice: ['jump', 'cod', 'sprint'],
  game: ['jump', 'cod', 'sprint'],
  shooting: ['jump'],
  conditioning: ['sprint'],
  strength: ['lower_strength'],
  mobility: [],
  rehab: [],
};

/** rules/bolge.json → bolge-esleme: etiket → bölge, katsayısız. */
export const tagRegions: Readonly<Record<ContentTag, readonly BodyRegion[]>> = {
  jump: ['patellar_tendon', 'achilles'],
  cod: ['quadriceps', 'adductor'],
  sprint: ['hamstring', 'calf', 'achilles'],
  lower_strength: ['quadriceps', 'hamstring', 'hip'],
  upper_strength: ['shoulder'],
};

/** rules/bolge.json → bolge-esleme: yalnız ağrı haritasında; kaynaklı bir eşleme yok. */
export const notModeledRegions: readonly BodyRegion[] = ['ankle', 'lower_back'];

/** rules/bolge.json → bolge-toparlanma-penceresi */
export const regionWindow = {
  tendonHours: 48,
  muscleHours: 72,
  tendonRegions: ['patellar_tendon', 'achilles'],
  muscleRegions: ['quadriceps', 'hamstring', 'adductor', 'calf', 'hip', 'shoulder'],
} as const;

/** Modeldeki bölgeler, ağrı haritasının bölge sırasıyla. */
export const modeledRegions: readonly BodyRegion[] = [...new Set(Object.values(tagRegions).flat())].sort(
  (a, b) => bodyOrder(a) - bodyOrder(b),
);

/** rules/bolge.json → bolge-yuku: kıyas penceresi (gün). */
export const regionComparison = { days: 28 } as const;

/** rules/bolge.json → bolge-agri-izleme */
export const painMonitoringRule = { maxNrs: 5 } as const;

function bodyOrder(region: BodyRegion): number {
  return bodySpots.findIndex((s) => s.region === region);
}

export function isTendonRegion(region: BodyRegion): boolean {
  return (regionWindow.tendonRegions as readonly BodyRegion[]).includes(region);
}

export function regionWindowHours(region: BodyRegion): number {
  return isTendonRegion(region) ? regionWindow.tendonHours : regionWindow.muscleHours;
}

/** Takvim günüyle pencere: 48 saat = bugün ve dün, 72 saat = bugün ve önceki iki gün. */
export function regionWindowDays(region: BodyRegion): number {
  return regionWindowHours(region) / 24;
}

export interface RegionSession extends LoadSession {
  kind: SessionKind;
  /** null: etiket girilmemiş, türün hazır etiketleri sayılır. Boş dizi: içerik yok. */
  tags: readonly ContentTag[] | null;
  /** Saatle eşleşen seansın başlangıcı (ISO); elle girilende yok. */
  startedAt?: string | null;
}

export function sessionTags(session: Pick<RegionSession, 'kind' | 'tags'>): { tags: readonly ContentTag[]; defaulted: boolean } {
  if (session.tags !== null) return { tags: session.tags, defaulted: false };
  return { tags: defaultContentTags[session.kind] ?? [], defaulted: true };
}

/** Seansın çalıştırdığı bölgeler (etiketlerin bölgelerinin birleşimi). */
export function sessionRegions(session: Pick<RegionSession, 'kind' | 'tags'>): ReadonlySet<BodyRegion> {
  return new Set(sessionTags(session).tags.flatMap((t) => tagRegions[t] ?? []));
}

export interface RegionLoad {
  region: BodyRegion;
  windowHours: number;
  windowDays: number;
  /** Pencerenin ilk günü; son günü bugün. */
  windowStart: string;
  /** Pencerede bu bölgeyi çalıştıran seansların yükleri toplamı (AU). Seans yükü bölünmez. */
  load: number;
  /** Pencerede bu bölgeyi çalıştıran seans sayısı. */
  sessions: number;
  /** Bunlardan kaçı etiketsiz (türün hazır etiketleriyle sayıldı). */
  defaultedSessions: number;
  /** Pencerede yüklendi: "toparlanıyor" (tahmin). */
  recovering: boolean;
  /** Bölgenin bugüne kadar son yüklendiği gün (girdideki seanslardan). */
  lastLoaded: string | null;
  daysSinceLoaded: number | null;
  /** Son yüklendiği günün seanslarının hepsinin saati biliniyorsa, en son bitişten bu yana saat. */
  hoursSinceLoaded: number | null;
  /** Kendi son 28 gününde aynı uzunluktaki pencerelerin ortalama yükü (AU). Geçmiş yetmiyorsa null. */
  typical: number | null;
}

export interface RegionLoadReading {
  today: string;
  historyStart: string | null;
  regions: RegionLoad[];
}

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && addIsoDays(date, 0) === date;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

const isValid = (s: RegionSession) => isIsoDate(s.date) && sessionLoad(s.rpe, s.durationMin) !== null;

/** Verilen gün bu bölgeyi çalıştıran seanslar. */
export function regionsLoadedOn(sessions: readonly RegionSession[], date: string): ReadonlySet<BodyRegion> {
  const out = new Set<BodyRegion>();
  for (const s of sessions) if (s.date === date && isValid(s)) for (const r of sessionRegions(s)) out.add(r);
  return out;
}

function endHoursAgo(s: RegionSession, now: Date): number | null {
  if (!s.startedAt) return null;
  const start = Date.parse(s.startedAt);
  if (Number.isNaN(start)) return null;
  return Math.max(0, (now.getTime() - (start + s.durationMin * 60_000)) / 3_600_000);
}

export function readRegionLoad(
  sessions: readonly RegionSession[],
  today: string,
  opts: { historyStart?: string; now?: Date } = {},
): RegionLoadReading {
  if (!isIsoDate(today)) throw new Error(`geçersiz gün: ${today}`);
  const valid = sessions.filter((s) => isValid(s) && s.date <= today);
  const firstSession = valid.reduce<string | null>((min, s) => (min === null || s.date < min ? s.date : min), null);
  const starts = [opts.historyStart, firstSession].filter((d): d is string => typeof d === 'string' && isIsoDate(d));
  const historyStart = starts.length ? starts.sort()[0]! : null;

  // Bölgeye göre günlük yük ve günlük seanslar.
  const byRegion = new Map<BodyRegion, { day: Map<string, number>; sessions: RegionSession[] }>();
  for (const region of modeledRegions) byRegion.set(region, { day: new Map(), sessions: [] });
  for (const s of valid) {
    const load = sessionLoad(s.rpe, s.durationMin)!;
    for (const region of sessionRegions(s)) {
      const entry = byRegion.get(region);
      if (!entry) continue;
      entry.day.set(s.date, (entry.day.get(s.date) ?? 0) + load);
      entry.sessions.push(s);
    }
  }

  const regions = modeledRegions.map((region): RegionLoad => {
    const { day, sessions: worked } = byRegion.get(region)!;
    const windowDays = regionWindowDays(region);
    const windowStart = addIsoDays(today, -(windowDays - 1));
    const inWindow = worked.filter((s) => s.date >= windowStart);
    const load = inWindow.reduce((a, s) => a + sessionLoad(s.rpe, s.durationMin)!, 0);

    const lastLoaded = worked.reduce<string | null>((max, s) => (max === null || s.date > max ? s.date : max), null);
    let hoursSinceLoaded: number | null = null;
    if (lastLoaded !== null && opts.now) {
      const hours = worked.filter((s) => s.date === lastLoaded).map((s) => endHoursAgo(s, opts.now!));
      if (hours.every((h) => h !== null)) hoursSinceLoaded = Math.min(...(hours as number[]));
    }

    // Kıyas: pencereden önceki 28 gün içinde kalan, aynı uzunluktaki bütün pencerelerin ortalaması.
    // Bu günlerin hepsi kayıt geçmişinin içinde değilse (bilinmeyen gün 0 sayılmaz) kıyas yok.
    const spanEnd = addIsoDays(windowStart, -1);
    const spanStart = addIsoDays(windowStart, -regionComparison.days);
    let typical: number | null = null;
    if (historyStart !== null && historyStart <= spanStart) {
      const daily: number[] = [];
      for (let d = spanStart; d <= spanEnd; d = addIsoDays(d, 1)) daily.push(day.get(d) ?? 0);
      const sums: number[] = [];
      for (let i = 0; i + windowDays <= daily.length; i++) sums.push(daily.slice(i, i + windowDays).reduce((a, b) => a + b, 0));
      typical = sums.reduce((a, b) => a + b, 0) / sums.length;
    }

    return {
      region,
      windowHours: regionWindowHours(region),
      windowDays,
      windowStart,
      load,
      sessions: inWindow.length,
      defaultedSessions: inWindow.filter((s) => s.tags === null).length,
      recovering: inWindow.length > 0,
      lastLoaded,
      daysSinceLoaded: lastLoaded === null ? null : daysBetween(lastLoaded, today),
      hoursSinceLoaded,
      typical,
    };
  });

  return { today, historyStart, regions };
}

// --- Ağrı izleme (rules/bolge.json → bolge-agri-izleme) ---

export interface PainReading {
  region: BodyRegion;
  side: BodySide;
  pain: number;
}

/** high: sabah ağrısı 5'in üstünde. notDecreasing: bölge dün yüklendi, dün ağrı vardı ve bugün azalmadı. */
export type PainNoteReason = 'high' | 'notDecreasing';

export interface PainNote {
  region: BodyRegion;
  side: BodySide;
  pain: number;
  yesterdayPain: number | null;
  reasons: PainNoteReason[];
}

/**
 * Bugünkü sabah ağrısı için not (tahmin, tanı değil). `today` / `yesterday` o sabahın ağrı haritası;
 * check-in yoksa null. `loadedYesterday`: dün çalışan bölgeler (regionsLoadedOn).
 */
export function painNotes(
  today: readonly PainReading[] | null,
  yesterday: readonly PainReading[] | null,
  loadedYesterday: ReadonlySet<BodyRegion>,
): PainNote[] {
  if (!today) return [];
  const prev = new Map((yesterday ?? []).map((p) => [spotKey(p), p.pain]));
  const notes: PainNote[] = [];
  for (const spot of bodySpots) {
    const entry = today.find((p) => p.region === spot.region && p.side === spot.side);
    if (!entry || entry.pain <= 0) continue;
    const yesterdayPain = yesterday ? (prev.get(spotKey(spot)) ?? 0) : null;
    const reasons: PainNoteReason[] = [];
    if (entry.pain > painMonitoringRule.maxNrs) reasons.push('high');
    if (loadedYesterday.has(spot.region) && yesterdayPain !== null && yesterdayPain > 0 && entry.pain >= yesterdayPain) {
      reasons.push('notDecreasing');
    }
    if (reasons.length) notes.push({ region: spot.region, side: spot.side, pain: entry.pain, yesterdayPain, reasons });
  }
  return notes;
}
