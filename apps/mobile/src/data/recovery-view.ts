// Toparlanma görünümü: veritabanı satırlarından motorun okumalarına (karar 0021, rules/toparlanma.json).
// Saf modül; sorgu recovery.ts'te. Sayıları motor hesaplar, burada yalnız satırlar seriye çevrilir.

import {
  addIsoDays,
  dayStatus,
  readIllnessSigns,
  readMetric,
  readRespiration,
  readSleep,
  recoveryLookbackDays,
  type DataSource,
  type DayStatus,
  type DayValue,
  type IllnessSigns,
  type MetricReading,
  type RespirationReading,
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

/**
 * Nabız: NREM uyku nabzı (rules/toparlanma.json → nabiz-olcu, karar 0041); günlük dinlenik nabız okunmaz.
 * Apple profilinde (karar 0061) HRV gecelik SDNN ortalaması ve uyku nabzı ayrı sütunlardan gelir (hrv-olcu-apple,
 * nabiz-olcu-apple); iki ölçü hiç karışmaz (veritabanında kaynağa göre kısıt).
 */
export interface HealthDailyRow {
  local_date: string;
  hrv_deep_rmssd_ms: number | null;
  nrem_hr_bpm: number | null;
  hrv_sleep_sdnn_ms?: number | null;
  sleep_hr_bpm?: number | null;
  respiratory_rate_bpm: number | null;
  spo2_avg_pct: number | null;
  skin_temp_nightly_c: number | null;
  skin_temp_baseline_c: number | null;
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
  /** Gece solunumu: kişisel bant ve tek gece notu (karar 0028); günün durumuna girmez. */
  respiration: RespirationReading;
  /** Gece nabzı, SpO2 ve cilt sıcaklığının tanı koymayan notları (karar 0039); günün durumuna girmez. */
  signs: IllnessSigns;
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

/** Kaynağın HRV ve uyku nabzı sütunları (sorgu için); Google Health'te sahibinin sorgusu birebir aynı kalır. */
export function autonomicColumns(source: DataSource = 'google_health'): string {
  return source === 'apple_health' ? 'hrv_sleep_sdnn_ms, sleep_hr_bpm' : 'hrv_deep_rmssd_ms, nrem_hr_bpm';
}

/** Profilin kaynağına göre HRV ve uyku nabzı serileri (karar 0061). Varsayılan sahibinin profili (Google Health). */
export function autonomicSeries(daily: readonly HealthDailyRow[], source: DataSource = 'google_health'): { hrv: DayValue[]; rhr: DayValue[] } {
  const apple = source === 'apple_health';
  return {
    hrv: daily.map((r) => ({ date: r.local_date, value: apple ? (r.hrv_sleep_sdnn_ms ?? null) : r.hrv_deep_rmssd_ms })),
    rhr: daily.map((r) => ({ date: r.local_date, value: apple ? (r.sleep_hr_bpm ?? null) : r.nrem_hr_bpm })),
  };
}

export function buildRecoveryView(
  daily: readonly HealthDailyRow[],
  sleepRows: readonly SleepRow[],
  today: string,
  source: DataSource = 'google_health',
): RecoveryView {
  const { hrv: hrvSeries, rhr: rhrSeries } = autonomicSeries(daily, source);

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

  const respiration = readRespiration(
    daily.map((r) => ({ date: r.local_date, value: r.respiratory_rate_bpm })),
    today,
  );

  const signs = readIllnessSigns(
    {
      rhr: rhrSeries,
      spo2: daily.map((r) => ({ date: r.local_date, value: r.spo2_avg_pct })),
      skinTemp: daily.map((r) => ({ date: r.local_date, nightly: r.skin_temp_nightly_c, baseline: r.skin_temp_baseline_c })),
    },
    today,
  );

  return {
    status: dayStatus(hrv, rhr, sleep, source),
    hrv,
    rhr,
    sleep,
    respiration,
    signs,
    chart,
    empty: daily.length === 0 && sleepRows.length === 0,
  };
}
