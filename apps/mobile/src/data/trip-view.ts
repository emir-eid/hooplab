// Seyahat görünümü (karar 0047): trips satırlarından motorun seyahatlerine. Saf modül; sorgu trips.ts'te.

import { addIsoDays, arrivalRule, isValidOffset, type Trip } from '@hooplab/engine';

export interface TripRow {
  id: string;
  depart_date: string;
  return_date: string | null;
  offset_hours: number;
}

/** Bugün'ün seyahat okuması için geriye bakılan gün: uzun kalış ve dönüş sonrası uyum dahil; görsel seçim, eşik değil. */
export const tripLookbackDays = 120;
/** Seyahat formunda gidiş en fazla kaç gün ileride; görsel seçim, eşik değil. */
export const tripDaysAhead = 365;

export function toTrips(rows: readonly TripRow[]): Trip[] {
  return rows
    .map((r) => ({ id: r.id, departDate: r.depart_date, returnDate: r.return_date, offsetHours: Number(r.offset_hours) }))
    .filter((t) => isValidOffset(t.offsetHours))
    .sort((a, b) => (a.departDate < b.departDate ? -1 : 1));
}

/** Bugün'ün okuması için çekilen gidiş aralığı: geçmiş kalışlar ve uçuş öncesi pencere. */
export function tripRange(today: string): { from: string; to: string } {
  return { from: addIsoDays(today, -tripLookbackDays), to: addIsoDays(today, arrivalRule.preShiftDays[1]) };
}
