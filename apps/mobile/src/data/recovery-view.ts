// Toparlanma görünümü: veritabanı satırlarından motorun okumalarına (karar 0021, rules/toparlanma.json).
// Saf modül; sorgu recovery.ts'te. Sayıları motor hesaplar, burada yalnız satırlar seriye çevrilir.

import {
  addIsoDays,
  dayStatus,
  readMetric,
  readSleep,
  recoveryLookbackDays,
  type DayStatus,
  type DayValue,
  type MetricReading,
  type SleepReading,
} from '@hooplab/engine';

/** Grafikte gösterilen gün sayısı (maket: "21 gün"). Görsel seçim, eşik değil. */
export const chartDays = 21;

/** Veri çekilecek en eski gün: bant penceresi ve grafiğin ilk gününün 7 günlük ortalaması ikisini de kapsar. */
export function recoveryFrom(today: string): string {
  return addIsoDays(today, -Math.max(recoveryLookbackDays, chartDays - 1 + 6));
}

/** Grafikte dokunulan x konumuna en yakın gün (0 = en eski). Kenarların dışı uç güne sıkışır. */
export function chartIndexAt(x: number, width: number, count: number, padX: number): number | null {
  if (count <= 0 || width <= 2 * padX || !Number.isFinite(x)) return null;
  if (count === 1) return 0;
  const step = (width - 2 * padX) / (count - 1);
  return Math.min(count - 1, Math.max(0, Math.round((x - padX) / step)));
}

export interface HealthDailyRow {
  local_date: string;
  hrv_deep_rmssd_ms: number | null;
  resting_hr_bpm: number | null;
  respiratory_rate_bpm: number | null;
}

export interface SleepRow {
  local_date: string;
  minutes_asleep: number | null;
  is_nap: boolean | null;
}

export interface ChartDay {
  date: string;
  /** O gecenin değeri (ms). */
  value: number | null;
  /** O güne kadarki 7 günlük ortalama (ms); yetersizse null. */
  rolling: number | null;
}

export interface RecoveryView {
  status: DayStatus;
  hrv: MetricReading;
  rhr: MetricReading;
  sleep: SleepReading;
  respiration: { date: string; value: number } | null;
  chart: ChartDay[];
  /** Hiç cihaz verisi yok: Google Health bağlı değil veya henüz senkron olmadı. */
  empty: boolean;
}

/** Şekerleme dışı uyku oturumlarını bitiş gününe göre toplar (bölünmüş gece tek gece sayılır). */
export function nightlySleep(rows: readonly SleepRow[]): DayValue[] {
  const byDate = new Map<string, number>();
  for (const r of rows) {
    if (r.is_nap === true || r.minutes_asleep === null || r.minutes_asleep <= 0) continue;
    byDate.set(r.local_date, (byDate.get(r.local_date) ?? 0) + r.minutes_asleep);
  }
  return [...byDate].map(([date, value]) => ({ date, value }));
}

export function buildRecoveryView(daily: readonly HealthDailyRow[], sleepRows: readonly SleepRow[], today: string): RecoveryView {
  const hrvSeries = daily.map((r) => ({ date: r.local_date, value: r.hrv_deep_rmssd_ms }));
  const rhrSeries = daily.map((r) => ({ date: r.local_date, value: r.resting_hr_bpm }));

  const hrv = readMetric(hrvSeries, today, { log: true });
  const rhr = readMetric(rhrSeries, today, { log: false });
  const sleep = readSleep(nightlySleep(sleepRows), today);

  const byDate = new Map(hrvSeries.map((d) => [d.date, d.value]));
  const chart: ChartDay[] = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    const date = addIsoDays(today, -i);
    const value = byDate.get(date) ?? null;
    chart.push({ date, value: value !== null && value > 0 ? value : null, rolling: readMetric(hrvSeries, date, { log: true }).rolling });
  }

  const resp = daily
    .filter((r) => r.local_date <= today && r.respiratory_rate_bpm !== null && r.respiratory_rate_bpm > 0)
    .sort((a, b) => (a.local_date < b.local_date ? 1 : -1))[0];

  return {
    status: dayStatus(hrv, rhr, sleep),
    hrv,
    rhr,
    sleep,
    respiration: resp ? { date: resp.local_date, value: resp.respiratory_rate_bpm as number } : null,
    chart,
    empty: daily.length === 0 && sleepRows.length === 0,
  };
}
