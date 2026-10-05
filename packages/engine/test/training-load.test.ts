// Antrenman yükü motoru: sentetik seanslarla (gerçek kayıt yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addIsoDays,
  dailyLoads,
  ewma,
  ewmaLambda,
  readTrainingLoad,
  type LoadSession,
} from '../src/index.ts';

const today = '2026-10-31';

/** today'den geriye `days` gün, her güne `load(daysAgo)` dakika × RPE 5 (0 → seans yok). */
function history(days: number, minutes: (daysAgo: number) => number): LoadSession[] {
  const out: LoadSession[] = [];
  for (let i = 0; i < days; i++) {
    const m = minutes(i);
    if (m > 0) out.push({ date: addIsoDays(today, -i), rpe: 5, durationMin: m });
  }
  return out;
}

const close = (a: number | null, b: number, eps = 1e-9) => {
  assert.ok(a !== null, 'değer null');
  assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
};

test('λ = 2 / (N + 1)', () => {
  assert.equal(ewmaLambda(7), 0.25);
  close(ewmaLambda(28), 2 / 29);
});

test('günlük yük: aynı günün seansları toplanır, seans olmayan gün 0, geçersiz seans atlanır', () => {
  const days = dailyLoads(
    [
      { date: '2026-10-01', rpe: 5, durationMin: 60 },
      { date: '2026-10-01', rpe: 7, durationMin: 30 },
      { date: '2026-10-03', rpe: 11, durationMin: 60 },
      { date: '2026-10-03', rpe: 4, durationMin: 0 },
    ],
    '2026-10-01',
    '2026-10-03',
  );
  assert.deepEqual(days, [
    { date: '2026-10-01', load: 510 },
    { date: '2026-10-02', load: 0 },
    { date: '2026-10-03', load: 0 },
  ]);
});

test('normalleştirilmiş EWMA: sabit yükte yükün kendisi, ilk gün o günün yükü', () => {
  close(ewma([300, 300, 300, 300], 28), 300);
  close(ewma([400], 7), 400);
  assert.equal(ewma([], 7), null);
});

test('normalleştirilmiş EWMA uzun geçmişte özyinelemeli formülle aynı', () => {
  const loads = Array.from({ length: 400 }, (_, i) => (i % 3 === 0 ? 0 : 200 + (i % 7) * 50));
  const lambda = ewmaLambda(28);
  let rec = loads[0]!;
  for (const x of loads.slice(1)) rec = x * lambda + (1 - lambda) * rec;
  close(ewma(loads, 28), rec, 1e-6);
});

test('kayıt yoksa hiçbir değer üretilmez', () => {
  const r = readTrainingLoad([], today);
  assert.equal(r.historyStart, null);
  assert.equal(r.historyDays, 0);
  assert.equal(r.week, null);
  assert.equal(r.ratio, null);
  assert.equal(r.spike, false);
  assert.deepEqual(r.daily, []);
});

test('bugün kayıt yoksa hesap düne kadar yapılır; varsa bugüne', () => {
  const noToday = readTrainingLoad(history(40, (i) => (i === 0 ? 0 : 60)), today);
  assert.equal(noToday.asOf, addIsoDays(today, -1));
  const withToday = readTrainingLoad(history(40, () => 60), today);
  assert.equal(withToday.asOf, today);
});

test('sabit yükte oran 1, not yok; haftalık değerler tutarlı', () => {
  const r = readTrainingLoad(history(40, () => 60), today); // her gün 300 AU
  assert.equal(r.historyDays, 40);
  assert.equal(r.week, 2100);
  assert.equal(r.previousWeek, 2100);
  assert.equal(r.weekChange, 0);
  assert.equal(r.weeklyAverage, 2100);
  close(r.acute, 300);
  close(r.chronic, 300);
  close(r.ratio, 1);
  assert.equal(r.spike, false);
  assert.equal(r.monotony, null, 'her gün aynı yük: SD 0, monotonluk üretilmez');
  assert.equal(r.daily.length, 28);
});

/** Uzun süre günde 300 AU'dan sonra son 7 gün `k` katı: EWMA = 300 + 300(k − 1)(1 − (1 − λ)^7). */
function stepRatio(k: number): number {
  const step = (n: number) => 300 + 300 * (k - 1) * (1 - (1 - ewmaLambda(n)) ** 7);
  return step(7) / step(28);
}

test('EWMA oranı kayan ortalamadan sıkışık: haftalık yük iki katına çıkınca yaklaşık 1,33, not yok', () => {
  const r = readTrainingLoad(history(400, (i) => (i < 7 ? 120 : 60)), today);
  assert.equal(r.week, 4200);
  assert.equal(r.previousWeek, 2100);
  assert.equal(r.weekChange, 1);
  close(r.ratio, stepRatio(2), 1e-6);
  assert.ok(r.ratio! > 1.33 && r.ratio! < 1.34);
  assert.equal(r.spike, false);
});

test('haftalık yük üç katına çıkınca oran 1,5 üstüne çıkar ve not düşer', () => {
  const r = readTrainingLoad(history(400, (i) => (i < 7 ? 180 : 60)), today);
  close(r.ratio, stepRatio(3), 1e-6);
  assert.ok(r.ratio! >= 1.5);
  assert.equal(r.spike, true);
});

test('28 günlük geçmiş olmadan oran üretilmez; haftalık değerler pencere dolunca gelir', () => {
  const r = readTrainingLoad(history(10, () => 60), today);
  assert.equal(r.historyDays, 10);
  assert.equal(r.week, 2100);
  assert.equal(r.previousWeek, null);
  assert.equal(r.weeklyAverage, null);
  assert.ok(r.acute !== null && r.chronic !== null, 'EWMA değerleri yine de hesaplanır');
  assert.equal(r.ratio, null);
  assert.equal(r.spike, false);
});

test('historyStart verilirse ilk seanstan önceki günler 0 yük sayılır', () => {
  const r = readTrainingLoad(history(5, () => 60), today, { historyStart: addIsoDays(today, -29) });
  assert.equal(r.historyDays, 30);
  assert.equal(r.previousWeek, 0);
  assert.equal(r.weekChange, null, 'önceki hafta 0: yüzde değişim tanımsız');
  assert.equal(r.weeklyAverage, 1500 / 4);
});

test('kronik yük 0 iken oran üretilmez', () => {
  const r = readTrainingLoad(
    [{ date: addIsoDays(today, -40), rpe: 0, durationMin: 60 }],
    today,
  );
  assert.equal(r.chronic, 0);
  assert.equal(r.ratio, null);
});

test('monotonluk ve gerilim: ortalama / örneklem SD, toplam × monotonluk', () => {
  // Son 7 gün (eskiden yeniye): 300, 0, 300, 0, 300, 0, 300 → ortalama 1200/7.
  const r = readTrainingLoad(history(7, (i) => (i % 2 === 0 ? 60 : 0)), today);
  const xs = [300, 0, 300, 0, 300, 0, 300];
  const m = 1200 / 7;
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / 6);
  close(r.monotony, m / sd);
  close(r.strain, 1200 * (m / sd));
});

test('bugünden sonraki ve geçersiz tarihli seanslar yok sayılır', () => {
  const r = readTrainingLoad(
    [
      { date: today, rpe: 5, durationMin: 60 },
      { date: addIsoDays(today, 1), rpe: 10, durationMin: 600 },
      { date: '2026-13-01', rpe: 5, durationMin: 60 },
    ],
    today,
  );
  assert.equal(r.historyStart, today);
  assert.deepEqual(r.daily, [{ date: today, load: 300 }]);
});

test('geçersiz bugün hata verir', () => {
  assert.throws(() => readTrainingLoad([], '2026-02-30'));
});
