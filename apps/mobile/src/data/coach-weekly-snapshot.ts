// Haftalık koç yorumunun anlık değerleri (karar 0052): biten haftanın rapor görünümünden (weekly-report-view) koça
// giden sayılar. Saf modül; sayılar motorun ve görünümün, burada yalnız seçilir. Kilo ve yakılan enerji gitmez
// (DATA-INVENTORY); gün gün tarih gitmez. Şema sunucunun (weekly.ts); aralık dışı seçmeli değer null olur.

import type { MetricReading } from '@hooplab/engine';

import { dayLevels, rangePositions, snapshotLimits } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import {
  parseWeeklySnapshot,
  weeklySnapshotVersion,
  type WeekBand,
  type WeeklySnapshot,
} from '../../../../supabase/functions/_shared/coach/weekly-snapshot.ts';

import type { WeeklyReportView } from './weekly-report-view.ts';

export type { WeeklySnapshot };

type Limit = readonly [number, number];

function within(value: number | null, [min, max]: Limit): number | null {
  return value !== null && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function weekBand(r: MetricReading, lim: Limit): WeekBand {
  const band = r.band && within(r.band.low, lim) !== null && within(r.band.high, lim) !== null ? { low: r.band.low, high: r.band.high } : null;
  return { mean: within(r.rolling, lim), band, position: band ? r.position : null };
}

/** Biten haftanın anlık değerleri; süren haftada null (yorum yalnız biten haftaya yazılır). */
export function buildWeeklyCoachSnapshot(view: WeeklyReportView): WeeklySnapshot | null {
  if (view.phase !== 'complete') return null;
  const L = snapshotLimits;
  const r = view.recovery;
  const status = Object.fromEntries(dayLevels.map((l) => [l, r.counts[l] ?? 0])) as WeeklySnapshot['status'];
  const s: WeeklySnapshot = { version: weeklySnapshotVersion, weekStart: view.weekStart, status };

  if (!r.empty) {
    if (r.hrv) s.hrv = weekBand(r.hrv, L.hrvMs);
    if (r.rhr) s.rhr = weekBand(r.rhr, L.rhrBpm);
    s.sleep = { meanHours: within(r.sleepHours, L.sleepHours), nights: r.sleepNights, short: r.sleepShort };
    const count = (k: string) => view.nights.filter((n) => (n.kinds as readonly string[]).includes(k)).length;
    s.signs = { respiration: count('respiration'), rhr: count('rhr'), spo2: count('spo2'), skinTemp: count('skinTemp') };
  }

  const c = view.checkin;
  if (c.n > 0) {
    s.checkin = {
      days: c.n,
      meanTotal: within(c.meanTotal, L.checkinTotal),
      baselineMean: within(c.baselineMean, L.checkinTotal),
      lowDays: c.lowDates.length,
    };
  }

  const l = view.load;
  if (!l.empty) {
    const end = l.reading.end;
    s.load = {
      week: within(l.reading.total, L.loadAu),
      previousWeek: within(l.reading.previousTotal, L.loadAu),
      weekChange: within(l.reading.change, L.weekChange),
      weeklyAverage: within(end?.weeklyAverage ?? null, L.loadAu),
      ratio: within(end?.ratio ?? null, L.ratio),
      spike: end?.spike ?? false,
      monotony: within(end?.monotony ?? null, L.monotony),
      strain: within(end?.strain ?? null, L.strainAu),
      sessions: l.sessions,
      games: l.games,
      minutesPlayed: l.minutesPlayed,
    };
  }

  if (view.pain.spots.length > 0) {
    s.pain = view.pain.spots.map((p) => {
      const values = p.days.map((d) => d.pain ?? 0);
      return {
        region: p.spot.region,
        side: p.spot.side,
        maxPain: Math.max(...values),
        days: values.filter((v) => v > 0).length,
        daysAbove: p.aboveMonitoring,
      };
    });
  }

  const n = view.nutrition;
  const positions = (counts: Partial<Record<(typeof rangePositions)[number], number>>) =>
    Object.fromEntries(rangePositions.map((p) => [p, counts[p] ?? 0])) as Record<(typeof rangePositions)[number], number>;
  s.nutrition = {
    mealDays: n.mealDays,
    carbs: positions(n.carbs),
    protein: positions(n.protein),
    noTarget: n.noTarget,
    matchDays: n.matchDays,
    sweatTests: n.sweatTests,
  };
  if (n.fluidDays > 0) s.fluid = { meanL: within(n.fluidMeanL, L.liters), days: n.fluidDays };

  return s;
}

export function checkWeeklyCoachSnapshot(snapshot: WeeklySnapshot): { ok: true } | { ok: false; paths: string[] } {
  const result = parseWeeklySnapshot(snapshot);
  return result.ok ? { ok: true } : { ok: false, paths: result.errors.map((e) => e.split(':')[0]!) };
}
