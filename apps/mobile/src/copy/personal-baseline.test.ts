// Solunum ve check-in kıyas metinleri (karar 0028): sentetik okumalarla.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CheckinReading } from '@hooplab/engine';

import { checkinLowBody, checkinNote, formatZ } from './personal-baseline.ts';

const base: CheckinReading = {
  date: '2026-10-31',
  total: 18,
  baselineN: 14,
  baselineMean: 20,
  baselineSd: 1,
  z: -2,
  low: true,
  drops: [{ item: 'fatigue', mean: 4.1, today: 2, drop: 2.1 }],
};

test('z biçimi: işaretli, tek ondalık, virgül', () => {
  assert.equal(formatZ(-1.34), '−1,3 SD');
  assert.equal(formatZ(0.46), '+0,5 SD');
  assert.equal(formatZ(0.04), '0 SD');
});

test('check-in notu: kıyas için kalan check-in, SD 0, z', () => {
  assert.equal(checkinNote({ ...base, baselineN: 9, baselineMean: null, baselineSd: null, z: null }), 'Kendi geçmişinle kıyas 3 check-in sonra başlar.');
  assert.equal(checkinNote({ ...base, baselineSd: 0, z: null }), '4 hafta ort. 20,0 · toplamın hep aynıydı, kıyas yok');
  assert.equal(checkinNote(base), '4 hafta ort. 20,0 · bugün −2,0 SD');
});

test('düşük notu en çok düşen maddeyi yazar', () => {
  assert.equal(checkinLowBody(base), 'Toplamın son 4 haftadaki olağanının 1 SD altında. En çok düşen: yorgunluk (ort. 4,1, bugün 2).');
  assert.equal(checkinLowBody({ ...base, drops: [] }), 'Toplamın son 4 haftadaki olağanının 1 SD altında.');
});
