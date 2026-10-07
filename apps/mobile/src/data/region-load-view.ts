// Kas ve tendon bölge yükü görünümü (karar 0027): seans satırlarından ve iki sabahın ağrı haritasından
// motorun okumasına. Saf modül; sorgu region-load.ts'te. Sayıları motor hesaplar, burada yalnız satırlar çevrilir.

import {
  addIsoDays,
  modeledRegions,
  painNotes,
  readRegionLoad,
  regionComparison,
  regionsLoadedOn,
  regionWindowDays,
  type ContentTag,
  type PainNote,
  type PainReading,
  type RegionLoadReading,
  type RegionSession,
  type SessionKind,
} from '@hooplab/engine';

/** En uzun pencere (kas, 3 gün) + kıyas penceresi (28 gün): bundan eski seans sonucu değiştirmez. */
export const regionLookbackDays = Math.max(...modeledRegions.map(regionWindowDays)) + regionComparison.days;

export function regionFrom(today: string): string {
  return addIsoDays(today, -(regionLookbackDays - 1));
}

export interface RegionSessionRow {
  local_date: string;
  rpe: number;
  duration_min: number;
  kind: SessionKind;
  content_tags: ContentTag[] | null;
  started_at: string | null;
}

export interface RegionLoadView {
  reading: RegionLoadReading;
  /** Bugünkü sabah ağrısı için ağrı izleme notları (tahmin). Bugün check-in yoksa boş. */
  notes: PainNote[];
  checkinToday: boolean;
  /** En uzun pencerede içerik etiketi girilmemiş seans sayısı (türün hazır etiketleriyle sayıldı). */
  defaultedSessions: number;
  /** Penceresinde çalışan bölge var mı? */
  anyRecovering: boolean;
}

export function toRegionSessions(rows: readonly RegionSessionRow[]): RegionSession[] {
  return rows.map((r) => ({
    date: r.local_date,
    rpe: r.rpe,
    durationMin: r.duration_min,
    kind: r.kind,
    tags: r.content_tags,
    startedAt: r.started_at,
  }));
}

export function buildRegionLoadView(
  rows: readonly RegionSessionRow[],
  today: string,
  opts: {
    earliest: string | null;
    now: Date;
    /** O sabahın ağrı haritası (0'dan büyük değerler); check-in yoksa null. */
    painToday: readonly PainReading[] | null;
    painYesterday: readonly PainReading[] | null;
  },
): RegionLoadView {
  const sessions = toRegionSessions(rows);
  const reading = readRegionLoad(sessions, today, {
    ...(opts.earliest ? { historyStart: opts.earliest } : {}),
    now: opts.now,
  });
  const longest = Math.max(...reading.regions.map((r) => r.windowDays));
  const windowStart = addIsoDays(today, -(longest - 1));
  const yesterday = addIsoDays(today, -1);
  return {
    reading,
    notes: painNotes(opts.painToday, opts.painYesterday, regionsLoadedOn(sessions, yesterday)),
    checkinToday: opts.painToday !== null,
    defaultedSessions: rows.filter((r) => r.content_tags === null && r.local_date >= windowStart && r.local_date <= today).length,
    anyRecovering: reading.regions.some((r) => r.recovering),
  };
}
