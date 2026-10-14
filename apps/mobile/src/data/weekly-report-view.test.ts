// Haftalık rapor görünümü (karar 0040): demo sporcunun sentetik verisiyle ve elle kurulmuş küçük satırlarla.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addIsoDays, readCompletedWeekLoad, weekStartOf } from '@hooplab/engine';

import { createDemoDb, type DemoDb, type DemoScenario } from '../demo/demo-data.ts';
import { buildWeeklyReportView, firstWeekOf, type WeeklyRows } from './weekly-report-view.ts';

// 2026-10-14 çarşamba: süren hafta 12-18 Ekim, biten hafta 5-11 Ekim.
const today = '2026-10-14';
const now = new Date('2026-10-14T09:00:00+03:00');
const thisWeek = '2026-10-12';
const lastWeek = '2026-10-05';

function rowsOf(db: DemoDb): WeeklyRows {
  return {
    sessions: db.sessions.map((s) => ({
      local_date: s.localDate,
      rpe: s.rpe,
      duration_min: s.durationMin,
      kind: s.kind,
      minutes_played: s.minutesPlayed,
      sweat: s.sweat !== null,
    })),
    earliestSession: db.sessions.map((s) => s.localDate).sort()[0] ?? null,
    healthDaily: db.healthDaily,
    sleep: db.sleep,
    checkins: db.checkins.map((c) => ({ local_date: c.local_date, ...c.answers })),
    pain: db.pain,
    weights: db.weights,
    dayTypes: [],
    matchDays: db.matchDays,
    meals: db.meals,
    fluids: db.fluids,
  };
}

const demo = (scenario: DemoScenario) => rowsOf(createDemoDb(scenario, today, now));

const emptyRows: WeeklyRows = {
  sessions: [],
  earliestSession: null,
  healthDaily: [],
  sleep: [],
  checkins: [],
  pain: [],
  weights: [],
  dayTypes: [],
  matchDays: [],
  meals: [],
  fluids: [],
};

test('biten hafta: yedi gün, yük motorla aynı, tür dağılımı toplamı verir', () => {
  const rows = demo('green');
  const v = buildWeeklyReportView(rows, lastWeek, today);
  assert.equal(v.phase, 'complete');
  assert.equal(v.weekEnd, '2026-10-11');
  assert.equal(v.dates.length, 7);
  const engine = readCompletedWeekLoad(
    rows.sessions.map((s) => ({ date: s.local_date, rpe: s.rpe, durationMin: s.duration_min })),
    lastWeek,
  );
  assert.equal(v.load.reading.total, engine.week);
  const parts = Object.values(v.load.parts).reduce((a, b) => a + b, 0);
  assert.equal(parts, v.load.reading.total);
  assert.equal(
    v.load.days.reduce((a, d) => a + (d.load ?? 0), 0),
    v.load.reading.total,
  );
  // Demo düzeni: haftada bir maç, oynanan dakika girilmiş.
  assert.equal(v.load.games, 1);
  assert.ok(v.load.minutesPlayed !== null);
  assert.ok(v.recovery.hrv?.rolling !== null && v.recovery.hrv?.band !== null);
  assert.equal(v.recovery.days.length, 7);
});

test('süren hafta: bugüne kadarki günler; bant kıyası ve değişim hafta bitince', () => {
  const v = buildWeeklyReportView(demo('green'), thisWeek, today);
  assert.equal(v.phase, 'current');
  assert.deepEqual(v.dates, ['2026-10-12', '2026-10-13', today]);
  assert.equal(v.recovery.hrv, null);
  assert.equal(v.recovery.sleepShort, null);
  assert.equal(v.load.reading.change, null);
  assert.equal(v.recovery.days.length, 3);
});

test('kırmızı senaryo: son iki gecenin cilt sıcaklığı notu ve süren haftadaki ağrılar', () => {
  const v = buildWeeklyReportView(demo('red'), thisWeek, today);
  const skin = v.nights.filter((n) => n.kinds.includes('skinTemp')).map((n) => n.date);
  assert.deepEqual(skin, [today]);
  assert.ok(v.nights.some((n) => n.date === today && n.kinds.includes('respiration')));
  const patellar = v.pain.spots.find((s) => s.spot.region === 'patellar_tendon' && s.spot.side === 'right');
  assert.ok(patellar);
  // Bugün check-in yok: gün boş (0 değil).
  assert.equal(patellar.days.at(-1)?.pain, null);
  assert.equal(patellar.aboveMonitoring, 0);
  assert.equal(v.checkin.n, 2);
});

test('beslenme: öğünlü günler hedef aralığına göre sayılır, kilo yoksa hedef yok', () => {
  const rows: WeeklyRows = {
    ...emptyRows,
    weights: [{ local_date: '2026-10-06', weight_kg: 90 }],
    meals: [
      { id: 'a', local_date: '2026-10-06', slot: 'lunch', items: [{ label: null, carbs_g: 300, protein_g: 150 }] },
      { id: 'b', local_date: '2026-10-07', slot: 'lunch', items: [{ label: null, carbs_g: 50, protein_g: 20 }] },
    ],
    fluids: [
      { id: 'f1', local_date: '2026-10-06', volume_ml: 1000 },
      { id: 'f2', local_date: '2026-10-08', volume_ml: 2000 },
    ],
    matchDays: ['2026-10-10'],
  };
  const v = buildWeeklyReportView(rows, lastWeek, today);
  // Dinlenme günü (seans yok): karbonhidrat 3-5 g/kg = 270-450 g, protein 108-180 g.
  assert.deepEqual(v.nutrition.carbs, { within: 1, below: 1 });
  assert.deepEqual(v.nutrition.protein, { within: 1, below: 1 });
  assert.equal(v.nutrition.mealDays, 2);
  assert.equal(v.nutrition.noTarget, 0);
  assert.equal(v.nutrition.matchDays, 1);
  assert.deepEqual(v.nutrition.dayTypes, { rest: 6, high: 1 });
  assert.equal(v.nutrition.fluidDays, 2);
  assert.equal(v.nutrition.fluidMeanL, 1.5);

  const noWeight = buildWeeklyReportView({ ...rows, weights: [] }, lastWeek, today);
  assert.deepEqual(noWeight.nutrition.carbs, {});
  assert.equal(noWeight.nutrition.noTarget, 2);
});

test('boş hesap: rapor üretilir, her bölüm boş', () => {
  const v = buildWeeklyReportView(emptyRows, lastWeek, today);
  assert.equal(v.load.empty, true);
  assert.equal(v.load.reading.total, null);
  assert.equal(v.recovery.empty, true);
  assert.deepEqual(v.recovery.counts, { insufficient: 7 });
  assert.equal(v.checkin.n, 0);
  assert.equal(v.weight.mean, null);
  assert.throws(() => buildWeeklyReportView(emptyRows, '2026-10-19', today));
});

test('ilk hafta: en eski kaydın haftası', () => {
  assert.equal(firstWeekOf([null, '2026-10-03', '2026-09-30']), weekStartOf('2026-09-30'));
  assert.equal(firstWeekOf([null]), null);
  assert.equal(addIsoDays(weekStartOf('2026-10-03'), 0), '2026-09-28');
});
