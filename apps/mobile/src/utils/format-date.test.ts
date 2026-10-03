import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDayHeader } from './format-date.ts';

test('gün başlığı maketteki biçimde', () => {
  assert.equal(formatDayHeader(new Date(2026, 9, 16)), 'Cuma, 16 Ekim');
});

test('Türkçe karakterli gün ve ay adları', () => {
  assert.equal(formatDayHeader(new Date(2026, 1, 4)), 'Çarşamba, 4 Şubat');
  assert.equal(formatDayHeader(new Date(2026, 4, 3)), 'Pazar, 3 Mayıs');
});
