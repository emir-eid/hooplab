// Kart işaretleri (karar 0057): sentetik okumalarla.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { MetricReading, SleepReading } from '@hooplab/engine';

import { loadRatioMark, respirationMark, sleepHrMark, sleepMark } from './tile-mark.ts';

const reading = (position: MetricReading['position']): MetricReading => ({
  rolling: position === null ? null : 50,
  rollingN: 7,
  band: position === null ? null : { low: 45, high: 55, mean: 50, n: 20 },
  baselineN: 20,
  position,
  latest: null,
});

const sleep = (short: boolean | null): SleepReading => ({ rollingHours: short === null ? null : 7, rollingN: 7, short, lastNight: null });

test('uyku nabzı: aralıkta sakin, üstünde dikkat, altında farklı; aralık yoksa işaret yok', () => {
  assert.equal(sleepHrMark(reading('within')), 'calm');
  assert.equal(sleepHrMark(reading('above')), 'attention');
  assert.equal(sleepHrMark(reading('below')), 'notice');
  assert.equal(sleepHrMark(reading(null)), null);
});

test('solunum: aralık dışı iki yönde de farklı, hiçbir zaman dikkat değil (karar 0028)', () => {
  assert.equal(respirationMark(reading('within')), 'calm');
  assert.equal(respirationMark(reading('above')), 'notice');
  assert.equal(respirationMark(reading('below')), 'notice');
  assert.equal(respirationMark(reading(null)), null);
});

test('uyku: kısa dikkat, yeterli sakin, veri azsa işaret yok', () => {
  assert.equal(sleepMark(sleep(true)), 'attention');
  assert.equal(sleepMark(sleep(false)), 'calm');
  assert.equal(sleepMark(sleep(null)), null);
});

test('yük oranı: yalnız bilgi notu eşiğinde dikkat, altında işaret yok (karar 0025)', () => {
  assert.equal(loadRatioMark({ spike: true }), 'attention');
  assert.equal(loadRatioMark({ spike: false }), null);
});
