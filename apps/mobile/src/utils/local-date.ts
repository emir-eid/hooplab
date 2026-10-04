// Sporcunun yerel tarihi (karar 0015): günlük kayıtlar cihazın o anki saat dilimindeki güne yazılır.
// toISOString UTC'ye çevirdiği için gece yarısına yakın saatlerde bir önceki günü verir; kullanılmaz.

/** "2026-10-04" biçiminde, cihazın yerel saatine göre. */
export function toLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Yerel takvimde gün ekler (yaz saati geçişinde de takvim günü olarak). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
