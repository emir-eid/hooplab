// Yakılan enerji görünümü (karar 0043): sentetik satırlarla; demo deposu aynı yoldan okur.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { energyRule } from '@hooplab/engine';

import { createDemoDb } from '../demo/demo-data.ts';
import { buildEnergyView, energyFrom, energyHoursFrom, hoursPerDay } from './energy-view.ts';

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

test('saatlik: bugün ve geriye 7 gün, saatler yerine oturur, süren saat bugünün son dolu saati', () => {
  const v = buildEnergyView(
    [{ local_date: today, calories_kcal: 250 }, { local_date: '2026-10-13', calories_kcal: 3000 }],
    today,
    [
      { local_date: today, local_hour: 0, kcal: 80 },
      { local_date: today, local_hour: 1, kcal: 70 },
      { local_date: today, local_hour: 2, kcal: 100 },
      { local_date: '2026-10-13', local_hour: 18, kcal: 400 },
      { local_date: '2026-10-12', local_hour: 5, kcal: 60 },
      // Pencere dışı ve bozuk satırlar yok sayılır.
      { local_date: '2026-10-06', local_hour: 5, kcal: 60 },
      { local_date: today, local_hour: 24, kcal: 60 },
    ],
  );
  assert.equal(v.days.length, energyRule.hourlyDaysBack + 1);
  assert.equal(v.days[0]?.date, energyHoursFrom(today));
  const d = v.days.at(-1)!;
  assert.equal(d.date, today);
  assert.deepEqual(d.hours.slice(0, 4), [80, 70, 100, null]);
  assert.equal(d.hours.length, hoursPerDay);
  assert.equal(d.partialHour, 2);
  assert.equal(d.total, 250);
  // Geçmiş günde süren saat yok; günlük satır yoksa saatlerin toplamı.
  assert.equal(v.days.at(-2)?.partialHour, null);
  assert.equal(v.days.at(-2)?.total, 3000);
  assert.equal(v.days.at(-3)?.total, 60);
  assert.equal(v.days.at(-4)?.total, null);
});

test('saatlik veri hiç yoksa grafik günü yok (kart eski haliyle)', () => {
  assert.deepEqual(buildEnergyView([{ local_date: today, calories_kcal: 1400 }], today).days, []);
  assert.deepEqual(buildEnergyView([{ local_date: today, calories_kcal: 1400 }], today, [{ local_date: today, local_hour: 3, kcal: 0 }]).days, []);
});

test('demo: saatlik toplam günlük değere eşit, bugün yalnız son senkrona kadar', () => {
  const db = createDemoDb('green', today, new Date('2026-10-14T12:40:00'));
  const v = buildEnergyView(
    db.energy.filter((r) => r.local_date >= energyFrom(today)),
    today,
    db.energyHours.filter((r) => r.local_date >= energyHoursFrom(today)),
  );
  for (const d of v.days) {
    const sum = d.hours.reduce<number>((a, b) => a + (b ?? 0), 0);
    assert.ok(Math.abs(sum - (d.total ?? 0)) < 1, d.date);
  }
  const todayDay = v.days.at(-1)!;
  // Son senkron 12:00 (40 dk önce): 00..12 saatleri.
  assert.equal(todayDay.partialHour, 12);
  assert.equal(todayDay.hours[13], null);
});
