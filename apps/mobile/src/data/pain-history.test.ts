import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPainHistory, latestPainMap, painDays, spotsWithPain, windowDates } from './pain-history.ts';

const leftAchilles = { region: 'achilles', side: 'left' } as const;
const back = { region: 'lower_back', side: 'center' } as const;

test('aralık bugün dahil, eskiden yeniye; ay geçişinde takvim günü', () => {
  const today = new Date(2026, 9, 2, 8, 0);
  assert.deepEqual(windowDates(today, 1), ['2026-10-02']);
  assert.deepEqual(windowDates(today, 3), ['2026-09-30', '2026-10-01', '2026-10-02']);
  assert.equal(windowDates(today, 7).length, 7);
  assert.equal(windowDates(today, 7)[0], '2026-09-26');
});

test('check-in yapılmayan gün null, ağrısız check-in 0', () => {
  const dates = ['2026-10-01', '2026-10-02', '2026-10-03'];
  const history = buildPainHistory(
    dates,
    [{ local_date: '2026-10-01' }, { local_date: '2026-10-03' }],
    [{ local_date: '2026-10-03', region: 'achilles', side: 'left', pain: 4 }],
  );
  assert.deepEqual(painDays(history, leftAchilles), [
    { date: '2026-10-01', pain: 0 },
    { date: '2026-10-02', pain: null },
    { date: '2026-10-03', pain: 4 },
  ]);
  assert.deepEqual(painDays(history, back).map((d) => d.pain), [0, null, 0]);
});

test('değerler birleştirilmez; aralıkta ağrı girilen noktalar listelenir', () => {
  const dates = ['2026-10-01', '2026-10-02'];
  const history = buildPainHistory(
    dates,
    [{ local_date: '2026-10-01' }, { local_date: '2026-10-02' }],
    [
      { local_date: '2026-10-01', region: 'lower_back', side: 'center', pain: 6 },
      { local_date: '2026-10-02', region: 'achilles', side: 'left', pain: 2 },
    ],
  );
  assert.deepEqual(spotsWithPain(history), [leftAchilles, back]);
  assert.deepEqual(latestPainMap(history), { 'achilles:left': 2 });
});

test('aralık dışı ve tanınmayan satırlar atlanır; check-in yoksa bugünün haritası null', () => {
  const history = buildPainHistory(
    ['2026-10-02'],
    [{ local_date: '2026-09-01' }],
    [{ local_date: '2026-10-02', region: 'elbow', side: 'left', pain: 5 }],
  );
  assert.equal(history.checkinDates.size, 0);
  assert.equal(latestPainMap(history), null);
  assert.deepEqual(spotsWithPain(history), []);
});
