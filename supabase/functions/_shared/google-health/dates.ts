// Sivil (yerel) tarih yardımcıları. Tarihler 'YYYY-MM-DD' dizesi olarak taşınır; hesap UTC gece
// yarısında yapılır ki yaz saati geçişleri gün sayısını bozmasın.

import type { CivilDate } from './api-types.ts';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function civilToIso(date: CivilDate | undefined): string | null {
  if (!date || !date.year || !date.month || !date.day) return null;
  const iso = `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  return isIsoDate(iso) ? iso : null;
}

export function isoToCivil(isoDate: string): CivilDate {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  return { year, month, day };
}

// Verilen anda, verilen IANA saat diliminde takvim tarihi. Geçersiz dilimde UTC'ye düşer.
export function todayInTimeZone(timeZone: string | null | undefined, now: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

// [from, to) aralığını en fazla maxDays günlük parçalara böler (API'nin 14 / 90 gün sınırı).
export function chunkRange(fromIso: string, toIso: string, maxDays: number): Array<[string, string]> {
  if (maxDays < 1) throw new Error('maxDays en az 1 olmalı');
  const chunks: Array<[string, string]> = [];
  let start = fromIso;
  while (daysBetween(start, toIso) > 0) {
    const end = daysBetween(start, toIso) > maxDays ? addDays(start, maxDays) : toIso;
    chunks.push([start, end]);
    start = end;
  }
  return chunks;
}

// "3600s" / "3600.5s" biçimindeki süreyi saniyeye çevirir.
export function durationSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^(-?\d+(?:\.\d+)?)s$/.exec(value);
  return match ? Number(match[1]) : null;
}
