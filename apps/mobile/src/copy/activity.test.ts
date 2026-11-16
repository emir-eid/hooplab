import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { WeeklyActivityReading } from '@hooplab/engine';

import { activityRows, aerobicSummary, strengthDaysText, strengthSummary } from './activity.ts';

const base: WeeklyActivityReading = {
  weekStart: '2026-10-12',
  moderateMinutes: 70,
  vigorousMinutes: 30,
  lightMinutes: 0,
  strengthDays: 1,
  aerobicMet: false,
  strengthMet: false,
  hasSessions: true,
};

test('aktivite: öneri karşılanmadıysa alt sınırlar yazılır; karşılandıysa sade cümle', () => {
  assert.equal(aerobicSummary(base, false), 'Öneri: 150 dk orta ya da 75 dk yüksek yoğunluk');
  assert.equal(aerobicSummary({ ...base, aerobicMet: true }, true), 'Aerobik öneri bu hafta karşılandı');
  assert.equal(strengthSummary(base), 'Öneri: haftada en az 2 gün');
  assert.equal(strengthDaysText(base), '1 / 2 gün');
});

test('aktivite: hafif dakikalar yalnız varsa ve "sayılmaz" diye gösterilir', () => {
  assert.deepEqual(
    activityRows(base).map((r) => r.label),
    ['Orta yoğunluk (RPE 5-6)', 'Yüksek yoğunluk (RPE 7+)'],
  );
  const rows = activityRows({ ...base, lightMinutes: 25 });
  assert.equal(rows.at(-1)?.label, 'Hafif (RPE 5 altı, sayılmaz)');
  assert.equal(rows.at(-1)?.value, '25 dk');
});
