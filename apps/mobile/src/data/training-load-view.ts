// Antrenman yükü görünümü: seans satırlarından motorun okumasına ve grafiğe (karar 0025, rules/yuk.json).
// Saf modül; sorgu training-load.ts'te. Sayıları motor hesaplar, burada yalnız satırlar seriye çevrilir.

import { addIsoDays, dailyLoads, loadWeek, readTrainingLoad, sessionLoad, type TrainingLoadReading } from '@hooplab/engine';
import { loadGroups, type LoadGroup } from '@hooplab/theme';

import type { SessionKind } from '../copy/labels.ts';

/** Grafikte gösterilen gün sayısı: 4 hafta (yuk-haftalik penceresi). */
export const loadChartDays = loadWeek.days * loadWeek.averageWeeks;

/**
 * Seansların çekileceği en eski gün. Kronik EWMA'da (N = 28) 120 günden eski bir günün ağırlığı on binde
 * birkaçtır; daha eskisi sonucu değiştirmez. Görsel / performans seçimi, eşik değil.
 */
export const loadLookbackDays = 120;

export function loadFrom(today: string): string {
  return addIsoDays(today, -(loadLookbackDays - 1));
}

export interface LoadSessionRow {
  local_date: string;
  rpe: number;
  duration_min: number;
  kind: SessionKind;
}

/** Grafikteki renk grubu (karar 0026): yedi tür dörde katlanır; hesaba girmez, yalnız gösterim. */
export const loadGroupOf: Record<SessionKind, LoadGroup> = {
  game: 'game',
  team_practice: 'court',
  shooting: 'court',
  strength: 'gym',
  conditioning: 'gym',
  mobility: 'light',
  rehab: 'light',
};

export type LoadParts = Record<LoadGroup, number>;

const emptyParts = (): LoadParts => ({ game: 0, court: 0, gym: 0, light: 0 });

export interface LoadChartDay {
  date: string;
  /** O günün yükü (AU); ilk kayıttan önceki günler null (bilinmiyor, 0 değil). */
  load: number | null;
  /** Akut pencerede mi (hesap gününde biten son 7 gün)? */
  acute: boolean;
  /** Yükün tür gruplarına dağılımı (AU); toplamı `load`. Bilinmeyen günde hepsi 0. */
  parts: LoadParts;
}

export interface UntaggedExercise {
  id: string;
  localDate: string;
}

export interface TrainingLoadView {
  reading: TrainingLoadReading;
  chart: LoadChartDay[];
  /** Akut penceredeki (son 7 gün) yükün tür gruplarına dağılımı (AU). */
  weekParts: LoadParts;
  /** Son 4 haftada saatin kaydettiği ama seans olarak etiketlenmemiş (ve "Seans değil" denmemiş) oturumlar, en yeni önce. */
  untagged: UntaggedExercise[];
  /** Hiç seans kaydı yok. */
  empty: boolean;
}

/**
 * `earliest`: hesabın tamamındaki ilk seans günü (pencereden eskiyse geçmiş pencerenin başından sayılır;
 * daha önceki günler bilinmiyor kabul edilir, 0 sayılmaz).
 */
export function buildTrainingLoadView(
  rows: readonly LoadSessionRow[],
  today: string,
  opts: { earliest: string | null; untagged: readonly UntaggedExercise[] },
): TrainingLoadView {
  const from = loadFrom(today);
  const sessions = rows
    .filter((r) => r.local_date >= from && r.local_date <= today)
    .map((r) => ({ date: r.local_date, rpe: r.rpe, durationMin: r.duration_min }));
  const historyStart = opts.earliest !== null && opts.earliest < from ? from : undefined;
  const reading = readTrainingLoad(sessions, today, historyStart ? { historyStart } : {});

  const chartFrom = addIsoDays(today, -(loadChartDays - 1));
  const acuteFrom = addIsoDays(reading.asOf, -(loadWeek.days - 1));
  const loads = new Map(dailyLoads(sessions, chartFrom, today).map((d) => [d.date, d.load]));
  const partsByDay = new Map<string, LoadParts>();
  for (const r of rows) {
    if (r.local_date < chartFrom || r.local_date > today) continue;
    const parts = partsByDay.get(r.local_date) ?? emptyParts();
    parts[loadGroupOf[r.kind]] += sessionLoad(r.rpe, r.duration_min) ?? 0;
    partsByDay.set(r.local_date, parts);
  }
  const chart: LoadChartDay[] = [];
  const weekParts = emptyParts();
  for (let d = chartFrom; d <= today; d = addIsoDays(d, 1)) {
    const known = reading.historyStart !== null && d >= reading.historyStart;
    const acute = d >= acuteFrom && d <= reading.asOf;
    const parts = known ? (partsByDay.get(d) ?? emptyParts()) : emptyParts();
    if (acute) for (const g of loadGroups) weekParts[g] += parts[g];
    chart.push({ date: d, load: known ? (loads.get(d) ?? 0) : null, acute, parts });
  }

  const untagged = opts.untagged
    .filter((e) => e.localDate >= chartFrom && e.localDate <= today)
    .map(({ id, localDate }) => ({ id, localDate }))
    .sort((a, b) => (a.localDate < b.localDate ? 1 : a.localDate > b.localDate ? -1 : 0));
  return { reading, chart, weekParts, untagged, empty: reading.historyStart === null };
}
