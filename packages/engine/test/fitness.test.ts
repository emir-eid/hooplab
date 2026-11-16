// Fitness profili (karar 0061 sıra 4): yük artış notu yok, bölgelerde yalnız kuvvet etiketleri. Varsayılan
// (parametresiz) çağrılar sahibinin (basketbol) davranışını verir. Veriler sentetik.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addIsoDays, readRegionLoad, readTrainingLoad, regionsLoadedOn, sessionRegions, sessionTags, type RegionSession } from '../src/index.ts';

const today = '2026-03-02';

test('yük: oran aynı hesaplanır, fitness\'ta not yok', () => {
  // 28 gün hafif, son hafta ağır: oran yüksek.
  const sessions = Array.from({ length: 35 }, (_, i) => ({ date: addIsoDays(today, -34 + i), rpe: i >= 28 ? 9 : 3, durationMin: i >= 28 ? 120 : 40 }));
  const owner = readTrainingLoad(sessions, today);
  const fit = readTrainingLoad(sessions, today, { sport: 'fitness' });
  assert.equal(owner.spike, true);
  assert.equal(fit.spike, false);
  assert.equal(fit.ratio, owner.ratio);
  assert.deepEqual({ ...fit, spike: true }, owner);
});

test('etiketler: fitness\'ta etiketsiz kuvvet seansı alt + üst vücut; sıçrama ve sprint bölgesi sayılmaz', () => {
  const strength = { kind: 'strength' as const, tags: null };
  assert.deepEqual(sessionTags(strength).tags, ['lower_strength']);
  assert.deepEqual(sessionTags(strength, 'fitness').tags, ['lower_strength', 'upper_strength']);
  assert.deepEqual(sessionTags({ kind: 'conditioning', tags: null }, 'fitness').tags, []);
  const tagged = { kind: 'strength' as const, tags: ['jump', 'lower_strength'] as const };
  assert.deepEqual([...sessionRegions(tagged)].sort(), ['achilles', 'hamstring', 'hip', 'patellar_tendon', 'quadriceps']);
  assert.deepEqual([...sessionRegions(tagged, 'fitness')].sort(), ['hamstring', 'hip', 'quadriceps']);
});

test('bölge yükü: fitness okuması yalnız kuvvet bölgelerini yükler', () => {
  const sessions: RegionSession[] = [
    { date: today, rpe: 7, durationMin: 60, kind: 'conditioning', tags: ['sprint'] },
    { date: today, rpe: 6, durationMin: 50, kind: 'strength', tags: null },
  ];
  const loaded = (sport?: 'fitness') => readRegionLoad(sessions, today, sport ? { sport } : {}).regions.filter((r) => r.load > 0).map((r) => r.region).sort();
  assert.deepEqual(loaded('fitness'), ['hamstring', 'hip', 'quadriceps', 'shoulder']);
  assert.ok(loaded().includes('calf'), 'sahibinde sprint baldırı yükler');
  assert.deepEqual([...regionsLoadedOn(sessions, today, 'fitness')].sort(), ['hamstring', 'hip', 'quadriceps', 'shoulder']);
});
