// Yakılan enerji metinleri (karar 0043): bileklik tahmini, en yakın 10 kcal'e yuvarlanır; eşik ve hedef yok.
// Saf modül (Node testleriyle denetlenir): değerler @hooplab/engine'den, yerel importlar göreli yolla.

import { energyRule, roundKcal, type EnergyReading, type WeeklyEnergy } from '@hooplab/engine';

import type { ValueRow } from './recovery.ts';

/** 3244 → "3.240" (en yakın 10 kcal, binlik ayırıcı nokta). */
export function formatKcal(kcal: number): string {
  return String(roundKcal(kcal)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Satır içi kısa gösterim: "~640 kcal" (bölünmez boşlukla: sayı ve birim ayrı satıra düşmesin); değer yoksa null. */
export function kcalShort(kcal: number | null | undefined): string | null {
  return typeof kcal === 'number' && Number.isFinite(kcal) && kcal > 0 ? `~${formatKcal(kcal)}\u00a0kcal` : null;
}

const dash = '–';
const kcal = (v: number | null) => (v === null ? dash : `${formatKcal(v)} kcal`);

/** "7 gün ort." ya da eksik günde "7 gün ort. (5 gün)". */
export function averageLabel(n: number): string {
  const base = `${energyRule.averageDays} gün ort.`;
  return n > 0 && n < energyRule.averageDays ? `${base} (${n} gün)` : base;
}

/** "14:05" (cihazın yerel saati); geçersizse null. */
export function clockOf(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

/** Büyük sayının ne olduğu: bugünün değeri gün bitmeden eksik. */
export function energyNote(reading: EnergyReading, updatedAt: string | null): string {
  if (reading.today === null) return 'Bugün için henüz veri yok';
  const clock = clockOf(updatedAt);
  return clock ? `Bugün şu ana kadar · ${clock} itibarıyla` : 'Bugün şu ana kadar';
}

export function energyRows(reading: EnergyReading): ValueRow[] {
  return [
    { label: 'Dün (tam gün)', value: kcal(reading.yesterday) },
    { label: averageLabel(reading.averageN), value: kcal(reading.average) },
  ];
}

/** Açıklama sayfasının "Senin değerlerin" satırları: bugünün değeri de yazılır. */
export function energyPageRows(reading: EnergyReading): ValueRow[] {
  return [{ label: 'Bugün şu ana kadar', value: kcal(reading.today) }, ...energyRows(reading)];
}

export const energyTitle = 'Yakılan enerji';

// --- Haftalık rapor ---

export function weeklyEnergyLabel(w: WeeklyEnergy): string {
  return w.total === null ? 'Bu hafta veri yok' : `${formatKcal(w.total)} kcal`;
}

export function weeklyEnergyDetail(w: WeeklyEnergy, current: boolean): string | undefined {
  if (w.total === null) return undefined;
  const parts = [current ? `${w.days} gün, bugün eksik` : `${w.days} gün`];
  if (w.dailyMean !== null) parts.push(`gün ort. ${formatKcal(w.dailyMean)} kcal`);
  return parts.join(' · ');
}

export function previousWeekEnergyText(w: WeeklyEnergy): string | null {
  return w.previousTotal === null ? null : `${formatKcal(w.previousTotal)} kcal · ${w.previousDays} gün`;
}

export const weeklyEnergyFooter =
  'Bilekliğin tahmini; dinlenirken yakılan dahil. Alımla karşılaştırılmaz, hedef ve eşik yok.';
