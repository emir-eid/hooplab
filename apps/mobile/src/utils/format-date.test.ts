import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDayHeader, formatShortDay } from './format-date.ts';

test('gün başlığı maketteki biçimde', () => {
  assert.equal(formatDayHeader(new Date(2026, 9, 16)), 'Cuma, 16 Ekim');
});

test('Türkçe karakterli gün ve ay adları', () => {
  assert.equal(formatDayHeader(new Date(2026, 1, 4)), 'Çarşamba, 4 Şubat');
  assert.equal(formatDayHeader(new Date(2026, 4, 3)), 'Pazar, 3 Mayıs');
});

test('kısa gün adı yerel tarihten', () => {
  assert.equal(formatShortDay('2026-10-04'), 'Paz');
  assert.equal(formatShortDay('2026-10-05'), 'Pzt');
  assert.equal(formatShortDay('2026-10-08'), 'Per');
  assert.equal(formatShortDay('04.10.2026'), '');
});
