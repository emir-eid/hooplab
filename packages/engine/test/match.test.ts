// Maç takvimi ve maç çevresi (karar 0046): sentetik maçlarla.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  expectedSleepLossMin,
  isNightMatch,
  matchesAround,
  postMatchCarbs,
  preMatchPlan,
  stepClock,
  type Match,
} from '../src/index.ts';

const m = (date: string, startTime: string | null = '19:00'): Match => ({ date, startTime, venue: 'home' });

test('dün, bugün ve yarının maçı', () => {
  const list = [m('2026-11-01'), m('2026-11-03', null)];
  const a = matchesAround('2026-11-02', list);
  assert.equal(a.yesterday?.date, '2026-11-01');
  assert.equal(a.today, null);
  assert.equal(a.tomorrow?.date, '2026-11-03');
  // Ay sınırı
  assert.equal(matchesAround('2026-10-31', list).tomorrow?.date, '2026-11-01');
});

test('akşam maçı 18:00 ve sonrası; uyku kısalması akşam 80, gündüz 20 dk; saat yoksa bilinmiyor', () => {
  assert.equal(isNightMatch(m('2026-11-01', '18:00')), true);
  assert.equal(isNightMatch(m('2026-11-01', '17:45')), false);
  assert.equal(isNightMatch(m('2026-11-01', null)), null);
  assert.equal(expectedSleepLossMin(m('2026-11-01', '20:30')), 80);
  assert.equal(expectedSleepLossMin(m('2026-11-01', '13:00')), 20);
  assert.equal(expectedSleepLossMin(m('2026-11-01', null)), null);
});

test('maç öncesi plan: öğün 4-3 saat, sıvı 4-2 saat önce; gram ve mL kiloyla', () => {
  const p = preMatchPlan(m('2026-11-01', '19:00'), 80);
  assert.ok(p);
  assert.deepEqual(p.meal, { from: '15:00', to: '16:00' });
  assert.deepEqual(p.mealCarbsG, [80, 240]);
  assert.deepEqual(p.fluid, { from: '15:00', to: '17:00' });
  assert.deepEqual(p.fluidMl, [400, 560]);
  // Şekerleme: 12:30'dan en geç 16:50'ye (maç 19:00, uyanış 18:00'den önce zaten)
  assert.deepEqual(p.nap, { from: '12:30', to: '16:50' });
  // Kilo yoksa saatler var, miktar yok
  const q = preMatchPlan(m('2026-11-01', '19:00'), null);
  assert.equal(q?.mealCarbsG, null);
  assert.equal(q?.fluidMl, null);
});

test('şekerleme penceresi maçtan 1 saat önce biter; sığmazsa yok', () => {
  assert.deepEqual(preMatchPlan(m('2026-11-01', '17:00'), 80)?.nap, { from: '12:30', to: '16:00' });
  assert.equal(preMatchPlan(m('2026-11-01', '13:45'), 80)?.nap, null);
});

test('maç saati yoksa ya da pencere gece yarısını aşıyorsa plan yok', () => {
  assert.equal(preMatchPlan(m('2026-11-01', null), 80), null);
  assert.equal(preMatchPlan(m('2026-11-01', '03:00'), 80), null);
  assert.equal(preMatchPlan(m('2026-11-01', '25:00'), 80), null);
});

test('maç sonrası karbonhidrat: saatte 1 g/kg, 4 saat', () => {
  assert.deepEqual(postMatchCarbs(82), { gramsPerHour: 82, hours: 4 });
  assert.deepEqual(postMatchCarbs(null), { gramsPerHour: null, hours: 4 });
});

test('saat adımı 15 dakika, gün içinde döner', () => {
  assert.equal(stepClock('19:00', 1), '19:15');
  assert.equal(stepClock('00:00', -1), '23:45');
  assert.equal(stepClock('23:45', 1), '00:00');
});
