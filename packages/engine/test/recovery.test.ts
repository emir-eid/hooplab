// Toparlanma motoru: sentetik serilerle (gerçek ölçüm yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addIsoDays,
  baselineDaysMissing,
  dayStatus,
  readMetric,
  readSleep,
  recoveryLookbackDays,
  type DayValue,
  type MetricReading,
  type SleepReading,
} from '../src/index.ts';

const today = '2026-10-31';

/** today'den geriye `days` gün; gün indeksi 0 = bugün. */
function series(days: number, value: (daysAgo: number) => number | null): DayValue[] {
  return Array.from({ length: days }, (_, i) => ({ date: addIsoDays(today, -i), value: value(i) }));
}

/** Başlangıç penceresinde 60 / 70 dönüşümlü (ortalama 65), son 7 günde `recent`. */
const withRecent = (recent: number) => series(35, (i) => (i < 7 ? recent : i % 2 === 0 ? 60 : 70));

test('takvim günü ekleme ay ve yıl sınırını geçer', () => {
  assert.equal(addIsoDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addIsoDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addIsoDays('2028-02-28', 1), '2028-02-29');
  assert.equal(recoveryLookbackDays, 34);
});

test('dinlenik nabız: bant başlangıç penceresinin ortalaması ± 0,5 SD', () => {
  const r = readMetric(withRecent(65), today, { log: false });
  assert.equal(r.rolling, 65);
  assert.equal(r.rollingN, 7);
  assert.equal(r.baselineN, 28);
  assert.ok(r.band);
  // 14 × 60 ve 14 × 70: örneklem SD = 5 × sqrt(28/27)
  const half = 0.5 * 5 * Math.sqrt(28 / 27);
  assert.ok(Math.abs(r.band.mean - 65) < 1e-9);
  assert.ok(Math.abs(r.band.low - (65 - half)) < 1e-9);
  assert.ok(Math.abs(r.band.high - (65 + half)) < 1e-9);
  assert.equal(r.position, 'within');
  assert.deepEqual(r.latest, { date: today, value: 65 });
});

test('7 günlük ortalama bandın altında ve üstünde', () => {
  assert.equal(readMetric(withRecent(60), today, { log: false }).position, 'below');
  assert.equal(readMetric(withRecent(70), today, { log: false }).position, 'above');
});

test('HRV ln üzerinden: ortalama geometrik, bant ms olarak geri döner', () => {
  const s = series(35, (i) => (i < 7 ? (i % 2 === 0 ? 40 : 90) : 60));
  const r = readMetric(s, today, { log: true });
  // Son 7 gün: 4 × 40, 3 × 90 → geometrik ortalama
  const geo = Math.exp((4 * Math.log(40) + 3 * Math.log(90)) / 7);
  assert.ok(r.rolling !== null && Math.abs(r.rolling - geo) < 1e-9);
  // Sabit başlangıç: SD 0, bant tek nokta (60)
  assert.ok(r.band && Math.abs(r.band.low - 60) < 1e-9 && Math.abs(r.band.high - 60) < 1e-9);
});

test('başlangıç penceresi 7 günlük pencereyle çakışmaz', () => {
  // Son 7 gün çok düşük; başlangıç bandı bundan etkilenmemeli.
  const r = readMetric(withRecent(20), today, { log: false });
  assert.ok(r.band && Math.abs(r.band.mean - 65) < 1e-9);
  assert.equal(r.position, 'below');
});

test('veri yetersizse ortalama ve bant yok, sıfır uydurulmaz', () => {
  // Son 7 günde yalnız 2 değer
  const sparse = series(35, (i) => (i < 7 ? (i < 2 ? 65 : null) : 65));
  const r = readMetric(sparse, today, { log: false });
  assert.equal(r.rolling, null);
  assert.equal(r.rollingN, 2);
  assert.equal(r.position, null);
  assert.ok(r.band);

  // Başlangıçta 11 değer: bant yok, 1 gece eksik
  const young = series(18, (i) => (i < 18 ? 65 : null));
  const y = readMetric(young, today, { log: false });
  assert.equal(y.baselineN, 11);
  assert.equal(y.band, null);
  assert.equal(baselineDaysMissing(y), 1);
});

test('geçersiz, sıfır ve tekrarlanan günler sayılmaz', () => {
  const s: DayValue[] = [
    { date: today, value: 0 },
    { date: today, value: 50 },
    { date: addIsoDays(today, -1), value: Number.NaN },
    { date: addIsoDays(today, -2), value: 50 },
    { date: addIsoDays(today, -2), value: 999 },
    { date: addIsoDays(today, -3), value: 50 },
    { date: addIsoDays(today, 1), value: 999 },
  ];
  const r = readMetric(s, today, { log: false });
  assert.equal(r.rollingN, 3);
  assert.equal(r.rolling, 50);
});

test('geçersiz bugün tarihi hata verir', () => {
  assert.throws(() => readMetric([], '2026-13-01', { log: false }));
  assert.throws(() => readSleep([], '31.10.2026'));
});

test('uyku: 7 gecelik ortalama 7 saatin altındaysa kısa', () => {
  const short = readSleep(series(7, () => 6 * 60 + 30), today);
  assert.equal(short.rollingHours, 6.5);
  assert.equal(short.short, true);
  const ok = readSleep(series(7, () => 7 * 60), today);
  assert.equal(ok.short, false);
  const sparse = readSleep(series(7, (i) => (i < 2 ? 300 : null)), today);
  assert.equal(sparse.short, null);
  assert.deepEqual(sparse.lastNight, { date: today, minutes: 300 });
});

const metric = (position: MetricReading['position']): MetricReading => ({
  rolling: position === null ? null : 1,
  rollingN: 7,
  band: null,
  baselineN: 28,
  position,
  latest: null,
});
const sleep = (short: boolean | null): SleepReading => ({ rollingHours: null, rollingN: 7, short, lastNight: null });

test('günün durumu: iki otonom işaret birlikte → toparlan', () => {
  assert.deepEqual(dayStatus(metric('below'), metric('above'), sleep(false)), {
    level: 'recover',
    signals: ['hrv_low', 'rhr_high'],
  });
});

test('günün durumu: tek işaret → kontrollü; HRV iki yönde de sayılır', () => {
  assert.equal(dayStatus(metric('below'), metric('within'), sleep(false)).level, 'caution');
  assert.equal(dayStatus(metric('above'), metric('within'), sleep(false)).level, 'caution');
  assert.equal(dayStatus(metric('within'), metric('above'), sleep(false)).level, 'caution');
  assert.equal(dayStatus(metric('within'), metric('within'), sleep(true)).level, 'caution');
  // Uyku kısa + HRV düşük kırmızı değildir: kırmızı yalnız iki otonom işaret
  assert.equal(dayStatus(metric('below'), metric('within'), sleep(true)).level, 'caution');
});

test('günün durumu: işaret yoksa hazır; nabız ve uyku eksikse yok sayılır', () => {
  assert.equal(dayStatus(metric('within'), metric('within'), sleep(false)).level, 'ready');
  assert.equal(dayStatus(metric('within'), metric(null), sleep(null)).level, 'ready');
  // Nabız düşük (bandın altı) işaret değildir
  assert.equal(dayStatus(metric('within'), metric('below'), sleep(false)).level, 'ready');
});

test('günün durumu: HRV bandı yoksa durum yok, uyku işareti yine gelir', () => {
  assert.deepEqual(dayStatus(metric(null), metric('above'), sleep(true)), {
    level: 'insufficient',
    signals: ['rhr_high', 'sleep_short'],
  });
});
