// Yakılan enerji görünümü (karar 0043): health_daily.calories_kcal satırlarından motorun okumasına. Saf modül;
// sorgu energy.ts'te. Bileklik tahmini; eşik yok, alımla karşılaştırılmaz.

import { addIsoDays, energyRule, readEnergy, type EnergyReading } from '@hooplab/engine';

export interface EnergyDayRow {
  local_date: string;
  calories_kcal: number | null;
  /** Satırın son senkronda yazıldığı an; bugünün değeri bu ana kadardır. */
  updated_at?: string | null;
}

export interface EnergyView {
  reading: EnergyReading;
  /** Bugünün satırının son güncellenmesi (ISO); bugün satırı yoksa null. */
  updatedAt: string | null;
  /** Gösterilecek hiçbir değer yok (kart görünmez). */
  empty: boolean;
}

/** Sorgunun en eski günü: bugünden önceki ortalama penceresi. */
export function energyFrom(today: string): string {
  return addIsoDays(today, -energyRule.averageDays);
}

export function buildEnergyView(rows: readonly EnergyDayRow[], today: string): EnergyView {
  const reading = readEnergy(
    rows.map((r) => ({ date: r.local_date, value: r.calories_kcal })),
    today,
  );
  return {
    reading,
    updatedAt: rows.find((r) => r.local_date === today)?.updated_at ?? null,
    empty: reading.today === null && reading.yesterday === null && reading.average === null,
  };
}
