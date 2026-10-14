// Yakılan enerji metinleri (karar 0043): yuvarlama, eksik gün etiketi, bugünün "şu ana kadar" notu.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { energyRule } from '@hooplab/engine';

import { averageLabel, energyNote, energyPageRows, energyRows, formatKcal, kcalShort, previousWeekEnergyText, weeklyEnergyDetail, weeklyEnergyLabel } from './energy.ts';

test('kcal en yakın 10a yuvarlanır, binlik nokta', () => {
  assert.equal(formatKcal(3244), '3.240');
  assert.equal(formatKcal(987), '990');
  assert.equal(kcalShort(612), '~610\u00a0kcal');
  assert.equal(kcalShort(null), null);
  assert.equal(kcalShort(0), null);
});

test('ortalama etiketi eksik günde gün sayısını söyler', () => {
  assert.equal(averageLabel(energyRule.averageDays), `${energyRule.averageDays} gün ort.`);
  assert.equal(averageLabel(5), `${energyRule.averageDays} gün ort. (5 gün)`);
});

test('bugünün değeri şu ana kadar; veri yoksa söylenir', () => {
  const reading = { today: 1500, yesterday: 3100, average: 3050, averageN: 7 };
  assert.match(energyNote(reading, '2026-10-14T14:17:00Z'), /^Bugün şu ana kadar · \d{2}:\d{2} itibarıyla$/);
  assert.equal(energyNote(reading, null), 'Bugün şu ana kadar');
  assert.equal(energyNote({ ...reading, today: null }, null), 'Bugün için henüz veri yok');
  assert.deepEqual(energyRows(reading), [
    { label: 'Dün (tam gün)', value: '3.100 kcal' },
    { label: `${energyRule.averageDays} gün ort.`, value: '3.050 kcal' },
  ]);
  assert.deepEqual(energyPageRows(reading)[0], { label: 'Bugün şu ana kadar', value: '1.500 kcal' });
});

test('haftalık metinler: süren haftada bugün eksik', () => {
  const w = { total: 7400, days: 3, dailyMean: 3100, meanDays: 2, previousTotal: 21000, previousDays: 7 };
  assert.equal(weeklyEnergyLabel(w), '7.400 kcal');
  assert.equal(weeklyEnergyDetail(w, true), '3 gün, bugün eksik · gün ort. 3.100 kcal');
  assert.equal(weeklyEnergyDetail(w, false), '3 gün · gün ort. 3.100 kcal');
  assert.equal(previousWeekEnergyText(w), '21.000 kcal · 7 gün');
  assert.equal(weeklyEnergyLabel({ ...w, total: null }), 'Bu hafta veri yok');
});
