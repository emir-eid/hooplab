// Yakılan enerji (karar 0043): bilekliğin günlük toplam kalorisi (dinlenirken yakılan dahil) ve seans kalorisi.
// Tahmin: bileklik enerji harcamasını belirgin hatayla ölçer (rules/enerji.json → enerji-harcamasi-tahmin).
// Eşik ve hedef yok. Alımla karşılaştırılmaz, enerji dengesi hesaplanmaz (karar 0029: düşük enerji
// yeterliliği hesaplanamaz). Tarihler "YYYY-AA-GG" sporcunun yerel takvim günleri.

import { addIsoDays, type DayValue } from './recovery.ts';
import { elapsedDates, weekEndOf, weekLength } from './weekly.ts';

/** rules/enerji.json → enerji-gosterim ve enerji-harcamasi-tahmin. */
export const energyRule = {
  /** Kartta "ortalama" penceresi: bugünden önceki tam günler. */
  averageDays: 7,
  /** Saatlik grafikte bugünden geriye gidilebilen gün (karar 0044); senkron bugün + bu kadar günü çeker. */
  hourlyDaysBack: 7,
  /** Gösterim adımı (kcal): tahminin hatası tek kaloriyi anlamsız kılar. */
  roundKcal: 10,
  /** Laboratuvar çalışmalarında tipik ortalama mutlak yüzde hata (açıklama metni; eşik değil). */
  typicalErrorPct: [15, 30],
} as const;

/** Gösterilecek değer: en yakın 10 kcal. */
export function roundKcal(kcal: number): number {
  return Math.round(kcal / energyRule.roundKcal) * energyRule.roundKcal;
}

/** Sıfır ya da geçersiz değer veri yok sayılır (bileklik takılı değilken de günlük toplam sıfır olmaz). */
function valid(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function valueOn(days: readonly DayValue[], date: string): number | null {
  const v = days.find((d) => d.date === date)?.value;
  return valid(v) ? v : null;
}

export interface EnergyReading {
  /** Bugün şu ana kadar (son senkrona kadar); gün bitmeden günün tamamından düşüktür. */
  today: number | null;
  /** Dünün tamamı. */
  yesterday: number | null;
  /** Bugünden önceki 7 günün (tam günler) ortalaması; verisi olan günlerden. */
  average: number | null;
  /** Ortalamaya giren gün sayısı (en çok 7). */
  averageN: number;
}

export function readEnergy(days: readonly DayValue[], today: string): EnergyReading {
  const window = Array.from({ length: energyRule.averageDays }, (_, i) => valueOn(days, addIsoDays(today, -(i + 1))));
  const present = window.filter(valid);
  return {
    today: valueOn(days, today),
    yesterday: valueOn(days, addIsoDays(today, -1)),
    average: present.length ? present.reduce((a, b) => a + b, 0) / present.length : null,
    averageN: present.length,
  };
}

/** Seansların kalorisinin toplamı; hiçbirinde değer yoksa null. */
export function sumKcal(values: readonly (number | null)[]): number | null {
  const xs = values.filter(valid);
  return xs.length ? xs.reduce((a, b) => a + b, 0) : null;
}

export interface WeeklyEnergy {
  /** Haftanın toplamı (süren haftada bugüne kadar; bugün eksik gündür). Hiç veri yoksa null. */
  total: number | null;
  /** Toplama giren gün sayısı. */
  days: number;
  /** Tam günlerin ortalaması (süren haftada bugün hariç). */
  dailyMean: number | null;
  meanDays: number;
  /** Önceki haftanın toplamı ve gün sayısı. */
  previousTotal: number | null;
  previousDays: number;
}

export function readWeeklyEnergy(days: readonly DayValue[], weekStart: string, today: string): WeeklyEnergy {
  const dates = elapsedDates(weekStart, today);
  const values = dates.map((d) => valueOn(days, d));
  const complete = dates.map((d, i) => (d < today ? values[i]! : null)).filter(valid);
  const prevStart = addIsoDays(weekStart, -weekLength);
  const prevEnd = weekEndOf(prevStart);
  const previous = Array.from({ length: weekLength }, (_, i) => addIsoDays(prevStart, i))
    .filter((d) => d <= prevEnd && d < today)
    .map((d) => valueOn(days, d))
    .filter(valid);
  return {
    total: sumKcal(values),
    days: values.filter(valid).length,
    dailyMean: complete.length ? complete.reduce((a, b) => a + b, 0) / complete.length : null,
    meanDays: complete.length,
    previousTotal: sumKcal(previous),
    previousDays: previous.length,
  };
}
