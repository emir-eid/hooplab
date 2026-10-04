// Sentetik satırlarla (gerçek ölçüm yok).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addIsoDays } from '@hooplab/engine';

import { bandNote, formatDecimal, formatSleep, statusAdvice, statusChips, statusReason } from '../copy/recovery.ts';
import { buildRecoveryView, chartDays, chartIndexAt, nightlySleep, recoveryFrom, type HealthDailyRow, type SleepRow } from './recovery-view.ts';

const today = '2026-10-31';

/** 35 gün: başlangıçta HRV 50/70 ve nabız 48/52 dönüşümlü; son 7 günde verilen değerler. */
function daily(recentHrv: number, recentRhr: number): HealthDailyRow[] {
  return Array.from({ length: 35 }, (_, i) => ({
    local_date: addIsoDays(today, -i),
    hrv_deep_rmssd_ms: i < 7 ? recentHrv : i % 2 === 0 ? 50 : 70,
    resting_hr_bpm: i < 7 ? recentRhr : i % 2 === 0 ? 48 : 52,
    respiratory_rate_bpm: i === 0 ? 14.63 : 15,
  }));
}

const nights = (minutes: number): SleepRow[] =>
  Array.from({ length: 7 }, (_, i) => ({ local_date: addIsoDays(today, -i), minutes_asleep: minutes, is_nap: false }));

test('veri penceresi bant ve grafiği kapsar', () => {
  assert.equal(recoveryFrom(today), addIsoDays(today, -34));
});

test('şekerleme sayılmaz, bölünmüş gece toplanır', () => {
  const rows: SleepRow[] = [
    { local_date: today, minutes_asleep: 300, is_nap: false },
    { local_date: today, minutes_asleep: 120, is_nap: null },
    { local_date: today, minutes_asleep: 40, is_nap: true },
    { local_date: addIsoDays(today, -1), minutes_asleep: null, is_nap: false },
  ];
  assert.deepEqual(nightlySleep(rows), [{ date: today, value: 420 }]);
});

test('her şey bandında, uyku yeterli → Hazır', () => {
  const v = buildRecoveryView(daily(59, 50), nights(460), today);
  assert.equal(v.status.level, 'ready');
  assert.equal(statusReason(v), 'HRV ve dinlenik nabız kendi bandında, uyku yeterli.');
  assert.deepEqual(statusChips(v), ['HRV bandında', 'Uyku yeterli']);
  assert.equal(statusAdvice(v), 'Planlanan antrenmanı yapabilirsin.');
  assert.deepEqual(v.respiration, { date: today, value: 14.63 });
});

test('HRV düşük ve nabız yüksek → Toparlan', () => {
  const v = buildRecoveryView(daily(35, 60), nights(460), today);
  assert.equal(v.status.level, 'recover');
  assert.equal(statusReason(v), "HRV'nin 7 günlük ortalaması bandının altında ve dinlenik nabız bandının üstünde.");
  assert.deepEqual(statusChips(v), ['HRV düşük', 'Nabız yüksek']);
});

test('yalnız uyku kısa → Kontrollü, öneride uyku', () => {
  const v = buildRecoveryView(daily(59, 50), nights(380), today);
  assert.equal(v.status.level, 'caution');
  assert.equal(statusReason(v), 'Son 7 gecenin uyku ortalaması 7 saatin altında.');
  assert.match(statusAdvice(v) ?? '', /uykuyu öne çek/);
});

test('yalnız HRV yüksek → Kontrollü, iki yorum da söylenir', () => {
  const v = buildRecoveryView(daily(90, 50), nights(460), today);
  assert.equal(v.status.level, 'caution');
  assert.match(statusReason(v), /iyi uyum da olabilir, yorgunluk da/);
});

test('bant henüz yok → durum yok, eksik gece sayısı söylenir', () => {
  const young = daily(59, 50).slice(0, 15);
  const v = buildRecoveryView(young, [], today);
  assert.equal(v.status.level, 'insufficient');
  assert.equal(v.hrv.baselineN, 8);
  assert.match(statusReason(v), /en az 12 gecesinden kurulur; şu an 8 gece var/);
  assert.equal(statusAdvice(v), null);
  assert.equal(bandNote(v.hrv), 'bant oluşuyor');
});

test('hiç veri yok → bağlanma çağrısı', () => {
  const v = buildRecoveryView([], [], today);
  assert.equal(v.empty, true);
  assert.match(statusReason(v), /Google Health/);
  assert.equal(bandNote(v.hrv), 'son 7 günde veri az');
});

test('grafik 21 gün, eksik gün null ve sıfır değer çizilmez', () => {
  const rows = daily(59, 50).filter((r) => r.local_date !== addIsoDays(today, -3));
  rows[0] = { ...rows[0]!, hrv_deep_rmssd_ms: 0 };
  const v = buildRecoveryView(rows, [], today);
  assert.equal(v.chart.length, chartDays);
  assert.equal(v.chart.at(-1)!.date, today);
  assert.equal(v.chart.at(-1)!.value, null);
  assert.equal(v.chart.find((d) => d.date === addIsoDays(today, -3))!.value, null);
  assert.ok(v.chart.every((d) => d.rolling !== null));
});

test('biçimler', () => {
  assert.equal(formatSleep(452), '7:32');
  assert.equal(formatSleep(60), '1:00');
  assert.equal(formatDecimal(14.63), '14,6');
});

test('grafikte dokunulan yere en yakın gün', () => {
  // 21 gün, 334 genişlik, 6 kenar: adım 16,1
  assert.equal(chartIndexAt(6, 334, 21, 6), 0);
  assert.equal(chartIndexAt(328, 334, 21, 6), 20);
  assert.equal(chartIndexAt(6 + 16.1 * 10 + 7, 334, 21, 6), 10);
  assert.equal(chartIndexAt(-50, 334, 21, 6), 0);
  assert.equal(chartIndexAt(900, 334, 21, 6), 20);
  assert.equal(chartIndexAt(100, 0, 21, 6), null);
  assert.equal(chartIndexAt(100, 334, 0, 6), null);
});
