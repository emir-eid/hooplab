import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bodySpots, spotKey } from '@hooplab/engine';

import { bodyParts, facingYaw, partsOf, unmappedSpots } from './body-model.ts';

test('her bölge-taraf çiftinin mankende parçası var', () => {
  assert.deepEqual(unmappedSpots(), []);
});

test('parçaların bölgeleri bodySpots içinde; kimlikler tekil', () => {
  const known = new Set(bodySpots.map(spotKey));
  for (const part of bodyParts) {
    if (part.spot) assert.ok(known.has(spotKey(part.spot)), part.id);
  }
  assert.equal(new Set(bodyParts.map((p) => p.id)).size, bodyParts.length);
});

test('sağ taraf solun aynası; sporcunun solu +x', () => {
  const [left] = partsOf({ region: 'achilles', side: 'left' });
  const [right] = partsOf({ region: 'achilles', side: 'right' });
  assert.ok(left && right && left.shape === 'capsule' && right.shape === 'capsule');
  assert.ok(left.from[0] > 0);
  assert.equal(right.from[0], -left.from[0]);
  assert.deepEqual(right.from.slice(1), left.from.slice(1));
});

test('bel orta hatta, tek parça', () => {
  const parts = partsOf({ region: 'lower_back', side: 'center' });
  assert.equal(parts.length, 1);
});

test('bakış açısı: ön bölgeler 0, arka π, yanlar sağ-sol simetrik', () => {
  assert.equal(facingYaw({ region: 'quadriceps', side: 'right' }), 0);
  assert.equal(facingYaw({ region: 'achilles', side: 'right' }), Math.PI);
  assert.equal(facingYaw({ region: 'lower_back', side: 'center' }), Math.PI);
  assert.equal(facingYaw({ region: 'shoulder', side: 'left' }), -facingYaw({ region: 'shoulder', side: 'right' }));
  for (const spot of bodySpots) assert.ok(Number.isFinite(facingYaw(spot)));
});
