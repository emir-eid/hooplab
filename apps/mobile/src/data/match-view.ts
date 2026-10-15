// Maç takvimi görünümü (karar 0046): match_days satırlarından motorun maçlarına ve Bugün'deki maç çevresi okumasına.
// Saf modül; sorgu matches.ts'te. Sayıları motor hesaplar (packages/engine/src/match.ts).

import {
  addIsoDays,
  isValidClock,
  venues,
  type Match,
  type Venue,
} from '@hooplab/engine';

export interface MatchRow {
  local_date: string;
  /** Postgres `time`: "SS:DD:ss"; bilinmiyorsa null. */
  start_time: string | null;
  venue: string | null;
}

/** Takvime en fazla kaç gün ileriye maç girilir; görsel seçim, eşik değil. */
export const matchDaysAhead = 120;
/** Takvim ekranında gösterilen geçmiş (gün): dünün maçı MD+1 için görünür kalır. */
export const matchListPastDays = 1;

export function toMatch(row: MatchRow): Match {
  const clock = row.start_time ? row.start_time.slice(0, 5) : null;
  return {
    date: row.local_date,
    startTime: clock && isValidClock(clock) ? clock : null,
    venue: (venues as readonly string[]).includes(row.venue ?? '') ? (row.venue as Venue) : null,
  };
}

export function toMatches(rows: readonly MatchRow[]): Match[] {
  return rows.map(toMatch).sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Veritabanı satırına; tarih değişmez (güncellemede yalnız saat ve yer). */
export function toMatchRow(m: Match): MatchRow {
  return { local_date: m.date, start_time: m.startTime, venue: m.venue };
}

/** Bugün'ün maç çevresi için çekilen aralık: dün ile yarın. */
export function aroundRange(today: string): { from: string; to: string } {
  return { from: addIsoDays(today, -1), to: addIsoDays(today, 1) };
}
