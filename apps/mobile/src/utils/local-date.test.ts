import { test } from 'node:test';
import assert from 'node:assert/strict';

import { addDays, toLocalDate } from './local-date.ts';

test('yerel tarih gece yarısına yakın saatte de aynı gün', () => {
  assert.equal(toLocalDate(new Date(2026, 9, 4, 0, 5)), '2026-10-04');
  assert.equal(toLocalDate(new Date(2026, 9, 4, 23, 55)), '2026-10-04');
});

test('ay ve gün iki haneli', () => {
  assert.equal(toLocalDate(new Date(2026, 0, 5, 12)), '2026-01-05');
});

test('gün ekleme ay ve yıl sınırını geçer', () => {
  assert.equal(toLocalDate(addDays(new Date(2026, 11, 31, 12), 1)), '2027-01-01');
  assert.equal(toLocalDate(addDays(new Date(2026, 2, 1, 12), -1)), '2026-02-28');
});
