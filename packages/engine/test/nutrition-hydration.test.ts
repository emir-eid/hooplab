// Beslenme hedefleri ve ter testi (karar 0029): sentetik değerlerle.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addIsoDays, inferDayType, nutritionTargets, sweatTest, targetWeight } from '../src/index.ts';

const today = '2026-10-31';

test('gün tipi: seans yoksa dinlenme, kısa seans antrenman, maç ya da ≥ 180 dk yoğun', () => {
  assert.equal(inferDayType([]), 'rest');
  assert.equal(inferDayType([{ kind: 'team_practice', durationMin: 110 }]), 'training');
  assert.equal(inferDayType([{ kind: 'shooting', durationMin: 30 }, { kind: 'game', durationMin: 40 }]), 'high');
  assert.equal(inferDayType([{ kind: 'team_practice', durationMin: 120 }, { kind: 'strength', durationMin: 60 }]), 'high');
  assert.equal(inferDayType([{ kind: 'team_practice', durationMin: 120 }, { kind: 'strength', durationMin: 59 }]), 'training');
});

test('hedef kilo: son 7 günün ortalaması; yoksa son ölçüm; geçersiz ve gelecek sayılmaz', () => {
  const w = [
    { date: today, value: 80 },
    { date: addIsoDays(today, -6), value: 82 },
    { date: addIsoDays(today, -7), value: 99 },
    { date: addIsoDays(today, 1), value: 70 },
    { date: addIsoDays(today, -1), value: 10 },
  ];
  assert.deepEqual(targetWeight(w, today), { kg: 81, basis: 'average', n: 2, latestDate: today });
  assert.deepEqual(targetWeight([{ date: addIsoDays(today, -20), value: 85 }], today), {
    kg: 85,
    basis: 'latest',
    n: 1,
    latestDate: addIsoDays(today, -20),
  });
  assert.equal(targetWeight([], today), null);
});

test('hedefler: g/kg × kilo, yuvarlanmış; kilo yoksa yalnız g/kg', () => {
  const t = nutritionTargets('training', 90);
  assert.deepEqual(t.carbsPerKg, [5, 7]);
  assert.deepEqual(t.carbsG, [450, 630]);
  assert.deepEqual(t.proteinG, [108, 180]);
  assert.equal(t.proteinPerMealG, 27);
  assert.deepEqual(nutritionTargets('rest', 90).carbsG, [270, 450]);
  assert.deepEqual(nutritionTargets('high', 90).carbsG, [720, 900]);
  const none = nutritionTargets('high', null);
  assert.equal(none.carbsG, null);
  assert.equal(none.proteinPerMealG, null);
  assert.deepEqual(none.carbsPerKg, [8, 10]);
});

test('ter testi: NATA formülü, ter oranı, net değişim', () => {
  const r = sweatTest({ preKg: 90, postKg: 88.5, fluidL: 1.2, urineL: 0.2, durationMin: 120 });
  assert.ok(r);
  assert.equal(r.lossL, 2.5);
  assert.equal(r.rateLPerH, 1.25);
  assert.equal(r.changeKg, -1.5);
  assert.ok(Math.abs(r.changePercent - -1.5 / 0.9) < 1e-9);
  assert.equal(r.lossNote, false);
  assert.equal(r.gainNote, false);
  assert.deepEqual(r.shortRecoveryFluidL, [1.5, 2.3]);
});

test('ter testi: %2 kayıpta not; kilo artışında fazla içme notu ve sıvı hedefi yok', () => {
  assert.equal(sweatTest({ preKg: 90, postKg: 88.2, fluidL: 0, urineL: 0, durationMin: 90 })?.lossNote, true);
  assert.equal(sweatTest({ preKg: 90, postKg: 88.21, fluidL: 0, urineL: 0, durationMin: 90 })?.lossNote, false);
  const gain = sweatTest({ preKg: 90, postKg: 90.3, fluidL: 2, urineL: 0, durationMin: 90 });
  assert.equal(gain?.gainNote, true);
  assert.equal(gain?.lossNote, false);
  assert.equal(gain?.shortRecoveryFluidL, null);
});

test('ter testi: geçersiz girdi null döner', () => {
  const ok = { preKg: 90, postKg: 89, fluidL: 1, urineL: 0, durationMin: 60 };
  assert.equal(sweatTest({ ...ok, preKg: 20 }), null);
  assert.equal(sweatTest({ ...ok, fluidL: -1 }), null);
  assert.equal(sweatTest({ ...ok, fluidL: 11 }), null);
  assert.equal(sweatTest({ ...ok, urineL: 6 }), null);
  assert.equal(sweatTest({ ...ok, durationMin: 0 }), null);
});
