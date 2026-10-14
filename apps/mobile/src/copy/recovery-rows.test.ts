// Kartlardaki etiketli satırlar (kullanıcı isteği 2026-10-14): büyük sayı, son gece, aralık ve hedef ayrı.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { MetricReading, SleepReading } from '@hooplab/engine';

import { bandDigits, bandPageRows, bandRows, formatRolling, rollingCaption, sleepCaption, sleepPageRows, sleepRows } from './recovery.ts';

const reading = (rolling: number | null, low: number, high: number, position: MetricReading['position']): MetricReading => ({
  rolling,
  rollingN: 7,
  band: { mean: (low + high) / 2, low, high, n: 28 },
  baselineN: 28,
  position,
  latest: { date: '2026-10-14', value: 15 },
});

test('satırlar: son gece ve aralık; aralık yoksa "oluşuyor"', () => {
  assert.deepEqual(bandRows(reading(14.4, 14.1, 14.6, 'within'), 'nefes/dk', 1), [
    { label: 'Son gece', value: '15,0 nefes/dk' },
    { label: 'Aralığın', value: '14,1–14,6 nefes/dk' },
  ]);
  const noBand: MetricReading = { ...reading(50, 0, 0, null), band: null };
  assert.deepEqual(bandRows(noBand, 'ms').at(-1), { label: 'Aralığın', value: 'oluşuyor' });
});

test('ortalama sınırla aynı görünüp dışındaysa bir ondalık fazla gösterilir', () => {
  const r = reading(14.64, 14.1, 14.62, 'above');
  assert.equal(bandDigits(r, 1), 2);
  assert.equal(formatRolling(r, 1), '14,64');
  assert.equal(bandRows(r, 'nefes/dk', 1)[1]!.value, '14,10–14,62 nefes/dk');
  // Aralığın içindeyse ya da yuvarlama ayırt ediyorsa aynı kalır
  assert.equal(bandDigits(reading(14.64, 14.1, 14.7, 'within'), 1), 1);
  assert.equal(formatRolling(reading(46.4, 44, 45.2, 'above')), '46');
});

test('büyük sayının açıklaması: 7 gün ort. ve aralığa göre yeri', () => {
  assert.equal(rollingCaption(reading(46, 45, 47, 'within')), '7 gün ort. · aralığında');
  assert.equal(rollingCaption(reading(48, 45, 47, 'above')), '7 gün ort. · aralığın üstünde');
});

test('uyku: 7 gecenin ortalaması büyük sayı; son gece ve hedef satırda', () => {
  const s: SleepReading = { rollingHours: 6.5, rollingN: 7, short: true, lastNight: { date: '2026-10-14', minutes: 399 } };
  assert.equal(sleepCaption(s), '7 gece ort. · kısa');
  assert.deepEqual(sleepRows(s), [
    { label: 'Son gece', value: '6:39 sa' },
    { label: 'Hedef', value: 'en az 7:00 sa' },
  ]);
});

test('açıklama sayfası satırları: 7 gün ort., son gece, aralık ve şu anki yeri', () => {
  assert.deepEqual(bandPageRows(reading(46, 45, 47, 'within'), 'atım/dk'), [
    { label: '7 gün ort.', value: '46 atım/dk' },
    { label: 'Son gece', value: '15 atım/dk' },
    { label: 'Aralığın', value: '45–47 atım/dk' },
    { label: 'Şu an', value: 'aralığında' },
  ]);
  const s: SleepReading = { rollingHours: 7.5, rollingN: 7, short: false, lastNight: null };
  assert.deepEqual(sleepPageRows(s), [
    { label: '7 gece ort.', value: '7:30 sa' },
    { label: 'Hedef', value: 'en az 7:00 sa' },
    { label: 'Şu an', value: 'yeterli' },
  ]);
});
