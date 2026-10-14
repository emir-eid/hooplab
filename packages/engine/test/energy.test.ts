// Yakılan enerji (karar 0043): sentetik günlük toplamlarla (gerçek kayıt yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addIsoDays, energyRule, readEnergy, readWeeklyEnergy, roundKcal, sumKcal, type DayValue } from '../src/index.ts';

// 2026-10-12 pazartesi, 2026-10-18 pazar.
const monday = '2026-10-12';
const day = (date: string, value: number | null): DayValue => ({ date, value });

test('gösterim en yakın 10 kcal', () => {
  assert.equal(energyRule.roundKcal, 10);
  assert.equal(roundKcal(3244), 3240);
  assert.equal(roundKcal(3245), 3250);
  assert.equal(roundKcal(612.4), 610);
});

test('bugün, dün ve önceki 7 tam günün ortalaması; bugün ortalamaya girmez', () => {
  const today = '2026-10-14';
  const days = [day(today, 1500), ...Array.from({ length: 7 }, (_, i) => day(addIsoDays(today, -(i + 1)), 3000 + i * 100))];
  const r = readEnergy(days, today);
  assert.equal(r.today, 1500);
  assert.equal(r.yesterday, 3000);
  assert.equal(r.averageN, 7);
  assert.equal(r.average, 3300);
});

test('eksik ve sıfır gün ortalamaya girmez, sayısı söylenir', () => {
  const today = '2026-10-14';
  const r = readEnergy([day('2026-10-13', 0), day('2026-10-12', 3200), day('2026-10-11', null), day('2026-10-10', 2800), day('2026-10-01', 9000)], today);
  assert.equal(r.today, null);
  assert.equal(r.yesterday, null);
  assert.equal(r.averageN, 2);
  assert.equal(r.average, 3000);
  assert.deepEqual(readEnergy([], today), { today: null, yesterday: null, average: null, averageN: 0 });
});

test('seans kalorisi toplamı: değersizler sayılmaz, hiç yoksa null', () => {
  assert.equal(sumKcal([600, null, 250]), 850);
  assert.equal(sumKcal([null, 0]), null);
});

test('biten hafta: toplam, gün ortalaması ve önceki hafta', () => {
  const days = [
    ...Array.from({ length: 7 }, (_, i) => day(addIsoDays(monday, i), 3000)),
    ...Array.from({ length: 6 }, (_, i) => day(addIsoDays(monday, -7 + i), 2500)),
  ];
  const w = readWeeklyEnergy(days, monday, '2026-10-20');
  assert.equal(w.total, 21000);
  assert.equal(w.days, 7);
  assert.equal(w.dailyMean, 3000);
  assert.equal(w.meanDays, 7);
  assert.equal(w.previousTotal, 15000);
  assert.equal(w.previousDays, 6);
});

test('süren hafta: bugün toplama girer, gün ortalamasına girmez', () => {
  const days = [day('2026-10-12', 3000), day('2026-10-13', 3200), day('2026-10-14', 1200), day('2026-10-15', 9999)];
  const w = readWeeklyEnergy(days, monday, '2026-10-14');
  assert.equal(w.total, 7400);
  assert.equal(w.days, 3);
  assert.equal(w.dailyMean, 3100);
  assert.equal(w.meanDays, 2);
  assert.equal(w.previousTotal, null);
  assert.equal(w.previousDays, 0);
});
