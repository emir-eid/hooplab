import assert from 'node:assert/strict';
import { test } from 'node:test';

import { categoryTypes, latestEnd, quantityTypes, shortType } from './healthkit-probe.ts';

test('kısa tip adı: önek düşer, workout okunur hale gelir', () => {
  assert.equal(shortType('HKQuantityTypeIdentifierHeartRateVariabilitySDNN'), 'HeartRateVariabilitySDNN');
  assert.equal(shortType('HKCategoryTypeIdentifierMenstrualFlow'), 'MenstrualFlow');
  assert.equal(shortType('HKWorkoutTypeIdentifier'), 'Workout');
});

test('en son örnek: en geç bitiş zamanı; boş listede null', () => {
  assert.equal(latestEnd([]), null);
  assert.equal(
    latestEnd([{ endDate: new Date('2026-01-01T05:00:00Z') }, { endDate: new Date('2026-01-02T03:00:00Z') }, { endDate: new Date('x') }]),
    '2026-01-02T03:00:00.000Z',
  );
});

test('deneme yalnız okur: 0061 tipleri listede, yazma tipi yok', () => {
  assert.ok(quantityTypes.includes('HKQuantityTypeIdentifierHeartRateVariabilitySDNN'));
  assert.ok(categoryTypes.includes('HKCategoryTypeIdentifierMenstrualFlow'));
});
