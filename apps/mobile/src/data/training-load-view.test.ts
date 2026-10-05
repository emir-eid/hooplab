// Yük görünümü: sentetik satırlarla (gerçek kayıt yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addIsoDays } from '@hooplab/engine';

import { buildTrainingLoadView, loadChartDays, loadFrom, type LoadSessionRow } from './training-load-view.ts';

const today = '2026-10-31';
const row = (daysAgo: number, minutes = 60, rpe = 5): LoadSessionRow => ({
  local_date: addIsoDays(today, -daysAgo),
  rpe,
  duration_min: minutes,
});

test('kayıt yoksa görünüm boş, grafik günleri bilinmiyor', () => {
  const v = buildTrainingLoadView([], today, { earliest: null, untagged: [] });
  assert.equal(v.empty, true);
  assert.equal(v.chart.length, loadChartDays);
  assert.ok(v.chart.every((d) => d.load === null));
});

test('ilk kayıttan önceki günler null, sonrası 0 ya da yük; bugün dahil', () => {
  const v = buildTrainingLoadView([row(10), row(3, 30, 4)], today, { earliest: addIsoDays(today, -10), untagged: [{ id: 'a', localDate: addIsoDays(today, -40) }, { id: 'b', localDate: addIsoDays(today, -2) }, { id: 'c', localDate: today }] });
  assert.equal(v.empty, false);
  assert.deepEqual(v.untagged.map((e) => e.id), ['c', 'b'], 'grafik penceresi dışındaki atlanır, en yeni önce');
  assert.equal(v.chart.at(-1)!.date, today);
  const byDate = new Map(v.chart.map((d) => [d.date, d.load]));
  assert.equal(byDate.get(addIsoDays(today, -11)), null);
  assert.equal(byDate.get(addIsoDays(today, -10)), 300);
  assert.equal(byDate.get(addIsoDays(today, -9)), 0);
  assert.equal(byDate.get(addIsoDays(today, -3)), 120);
  assert.equal(byDate.get(today), 0);
});

test('akut pencere hesap gününde biten 7 gün: bugün kayıt yoksa dün biter', () => {
  const v = buildTrainingLoadView([row(1), row(20)], today, { earliest: addIsoDays(today, -20), untagged: [] });
  assert.equal(v.reading.asOf, addIsoDays(today, -1));
  const acute = v.chart.filter((d) => d.acute).map((d) => d.date);
  assert.deepEqual(acute, Array.from({ length: 7 }, (_, i) => addIsoDays(today, -7 + i)));
});

test('pencereden eski ilk kayıt: geçmiş pencerenin başından sayılır, sessiz günler 0', () => {
  const v = buildTrainingLoadView([row(2)], today, { earliest: '2025-01-01', untagged: [] });
  assert.equal(v.reading.historyStart, loadFrom(today));
  assert.equal(v.reading.historyDays, 120 - 1, 'bugün kayıt yok: hesap düne kadar');
  assert.ok(v.chart.every((d) => d.load !== null));
});
