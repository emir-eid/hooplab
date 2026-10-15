// Yakılan enerji görünümü (karar 0043): health_daily.calories_kcal satırlarından motorun okumasına; saatlik grafik
// (karar 0044) health_hourly_energy satırlarından. Saf modül; sorgu energy.ts'te. Bileklik tahmini; eşik yok,
// alımla karşılaştırılmaz.

import { addIsoDays, energyRule, readEnergy, type EnergyReading } from '@hooplab/engine';

export interface EnergyDayRow {
  local_date: string;
  calories_kcal: number | null;
  /** Satırın son senkronda yazıldığı an; bugünün değeri bu ana kadardır. */
  updated_at?: string | null;
}

/** Senkronun yazdığı saat: yerel gün ve saat (0-23) sporcunun Google saat dilimine göre. */
export interface EnergyHourRow {
  local_date: string;
  local_hour: number;
  kcal: number | null;
}

export const hoursPerDay = 24;

export interface EnergyDay {
  date: string;
  /** Saat başına kcal (0-23); verisi olmayan saat null. */
  hours: (number | null)[];
  /** Günün toplamı: günlük satır, yoksa saatlerin toplamı. Bugün için şu ana kadar. */
  total: number | null;
  /** Bugünün son dolu saati süren saattir (son senkrona kadar); diğer günlerde null. */
  partialHour: number | null;
}

export interface EnergyView {
  reading: EnergyReading;
  /** Bugünün satırının son güncellenmesi (ISO); bugün satırı yoksa null. */
  updatedAt: string | null;
  /** Grafiğin günleri, eskiden yeniye; son öğe bugün. Saatlik veri hiç yoksa boş. */
  days: EnergyDay[];
  /** Gösterilecek hiçbir değer yok (kart görünmez). */
  empty: boolean;
}

/** Sorgunun en eski günü: bugünden önceki ortalama penceresi. */
export function energyFrom(today: string): string {
  return addIsoDays(today, -energyRule.averageDays);
}

/** Saatlik sorgunun en eski günü: grafikte geriye gidilebilen son gün. */
export function energyHoursFrom(today: string): string {
  return addIsoDays(today, -energyRule.hourlyDaysBack);
}

const positive = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

export function buildEnergyDays(
  daily: readonly EnergyDayRow[],
  hourly: readonly EnergyHourRow[],
  today: string,
): EnergyDay[] {
  if (!hourly.some((h) => positive(h.kcal))) return [];
  const from = energyHoursFrom(today);
  const days: EnergyDay[] = [];
  for (let date = from; date <= today; date = addIsoDays(date, 1)) {
    const hours: (number | null)[] = Array.from({ length: hoursPerDay }, () => null);
    for (const h of hourly) {
      if (h.local_date === date && Number.isInteger(h.local_hour) && h.local_hour >= 0 && h.local_hour < hoursPerDay) {
        hours[h.local_hour] = positive(h.kcal) ? h.kcal : null;
      }
    }
    const present = hours.filter(positive);
    const dayValue = daily.find((d) => d.local_date === date)?.calories_kcal;
    const last = hours.findLastIndex(positive);
    days.push({
      date,
      hours,
      total: positive(dayValue) ? dayValue : present.length ? present.reduce((a, b) => a + b, 0) : null,
      partialHour: date === today && last >= 0 ? last : null,
    });
  }
  return days;
}

export function buildEnergyView(
  rows: readonly EnergyDayRow[],
  today: string,
  hourly: readonly EnergyHourRow[] = [],
): EnergyView {
  const reading = readEnergy(
    rows.map((r) => ({ date: r.local_date, value: r.calories_kcal })),
    today,
  );
  return {
    reading,
    updatedAt: rows.find((r) => r.local_date === today)?.updated_at ?? null,
    days: buildEnergyDays(rows, hourly, today),
    empty: reading.today === null && reading.yesterday === null && reading.average === null,
  };
}
