// Yakılan enerji görünümü (karar 0043): sentetik satırlarla; demo deposu aynı yoldan okur.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDemoDb } from '../demo/demo-data.ts';
import { buildEnergyView, energyFrom } from './energy-view.ts';

const today = '2026-10-14';

test('bugün, dün, ortalama ve bugünün güncellenme anı', () => {
  const v = buildEnergyView(
    [
      { local_date: '2026-10-14', calories_kcal: 1400, updated_at: '2026-10-14T14:17:00Z' },
      { local_date: '2026-10-13', calories_kcal: 3200, updated_at: '2026-10-14T14:17:00Z' },
      { local_date: '2026-10-12', calories_kcal: 3000 },
    ],
    today,
  );
  assert.equal(v.reading.today, 1400);
  assert.equal(v.reading.yesterday, 3200);
  assert.equal(v.reading.average, 3100);
  assert.equal(v.updatedAt, '2026-10-14T14:17:00Z');
  assert.equal(v.empty, false);
});

test('hiç değer yoksa boş (kart görünmez)', () => {
  assert.equal(buildEnergyView([{ local_date: today, calories_kcal: null }], today).empty, true);
  assert.equal(buildEnergyView([], today).empty, true);
});

test('demo: bugünkü değer günün geçen kısmı kadar, önceki günler tam', () => {
  const db = createDemoDb('green', today, new Date('2026-10-14T12:40:00'));
  const v = buildEnergyView(db.energy.filter((r) => r.local_date >= energyFrom(today)), today);
  assert.equal(v.reading.averageN, 7);
  assert.ok(v.reading.today !== null && v.reading.average !== null && v.reading.today < v.reading.average);
  assert.ok(v.updatedAt !== null);
});
