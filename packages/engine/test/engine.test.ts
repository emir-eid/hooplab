import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  bodySpots,
  isCompleteWellness,
  sessionLoad,
  sidesOf,
  spotKey,
  wellnessTotal,
  wellnessTotalRange,
} from '../src/index.ts';

test('seans yükü RPE × dakika', () => {
  assert.equal(sessionLoad(7, 90), 630);
  assert.equal(sessionLoad(0, 30), 0);
  assert.equal(sessionLoad(10, 600), 6000);
});

test('seans yükü ölçek dışı veya kesirli girdide null döner', () => {
  assert.equal(sessionLoad(11, 60), null);
  assert.equal(sessionLoad(-1, 60), null);
  assert.equal(sessionLoad(6.5, 60), null);
  assert.equal(sessionLoad(5, 0), null);
  assert.equal(sessionLoad(5, 601), null);
  assert.equal(sessionLoad(Number.NaN, 60), null);
});

test('iyi oluş toplamı beş maddenin toplamı, 5-25', () => {
  const all = (v: number) => ({ sleep_quality: v, fatigue: v, soreness: v, stress: v, mood: v });
  assert.equal(wellnessTotal(all(1)), wellnessTotalRange.min);
  assert.equal(wellnessTotal(all(5)), wellnessTotalRange.max);
  assert.equal(wellnessTotal({ sleep_quality: 4, fatigue: 3, soreness: 2, stress: 5, mood: 4 }), 18);
  assert.deepEqual(wellnessTotalRange, { min: 5, max: 25 });
});

test('eksik veya ölçek dışı madde varsa toplam yok', () => {
  assert.equal(wellnessTotal({ sleep_quality: 4, fatigue: 3, soreness: 2, stress: 5 }), null);
  assert.equal(wellnessTotal({ sleep_quality: 0, fatigue: 3, soreness: 2, stress: 5, mood: 4 }), null);
  assert.equal(wellnessTotal({ sleep_quality: 4.5, fatigue: 3, soreness: 2, stress: 5, mood: 4 }), null);
  assert.equal(isCompleteWellness({ sleep_quality: 4 }), false);
});

test('bel orta hatta tek, diğer bölgeler sol ve sağ', () => {
  assert.deepEqual(sidesOf('lower_back'), ['center']);
  assert.deepEqual(sidesOf('achilles'), ['left', 'right']);
  assert.equal(bodySpots.length, 9 * 2 + 1);
  const keys = bodySpots.map(spotKey);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.includes('patellar_tendon:left'));
  assert.ok(!keys.includes('lower_back:left'));
});
