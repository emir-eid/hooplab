// Koçun Apple Health profili (karar 0061, sıra 3d): taban profile göre süzülünce ölçümün kuralı -apple sürümüne
// çevrilir, HRV tahmin olarak işaretlenir, durum notu Apple kuralından gelir. Sahibinin tabanında hiçbir şey değişmez.
// Veriler sentetik.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRequest } from '../../_shared/coach/daily.ts';
import { hrvNameApple, numbersBlocks, rhrNameApple } from '../../_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';
import { DEFAULT_PROFILE, forProfile, isAppleKb, profileRuleId, type Kb } from '../../_shared/coach/kb.ts';
import type { CoachSnapshot } from '../../_shared/coach/snapshot.ts';
import { buildWeeklyRequest, weeklyBlocks, type WeeklySnapshot } from '../../_shared/coach/weekly.ts';
import { fullSnapshot } from './fixtures.ts';

const full: Kb = { sources: kbSources, rules: kbRules };
const owner = forProfile(full, DEFAULT_PROFILE);
const apple = forProfile(full, { source: 'apple_health', sport: 'fitness', sex: null });

const block = (kb: Kb, s: CoachSnapshot, id: string) => numbersBlocks(s, kb).find((b) => b.id === id);

test('profil sürümü: sahibinde ana kural, Apple tabanında -apple sürümü; sürümü olmayan kural aynı', () => {
  assert.equal(isAppleKb(owner), false);
  assert.equal(isAppleKb(full), false);
  assert.equal(isAppleKb(apple), true);
  for (const id of ['hrv-olcu', 'nabiz-olcu', 'gunun-durumu']) {
    assert.equal(profileRuleId(owner, id), id);
    assert.equal(profileRuleId(apple, id), `${id}-apple`);
  }
  assert.equal(profileRuleId(apple, 'toparlanma-bant'), 'toparlanma-bant');
});

test('sahibinin günün sayıları süzülmemiş tabanla bayt bayt aynı', () => {
  assert.deepEqual(numbersBlocks(fullSnapshot(), owner), numbersBlocks(fullSnapshot(), full));
});

test('Apple: HRV tahmin olarak işaretli ve SDNN adıyla; uyku nabzı bütün uyku ortalaması', () => {
  const hrv = block(apple, fullSnapshot(), 'hrv');
  assert.equal(hrv?.estimate, true);
  assert.ok(hrv?.text.startsWith(hrvNameApple));
  assert.ok(!hrv?.text.includes('derin uyku'));
  assert.ok(block(apple, fullSnapshot(), 'rhr')?.text.startsWith(rhrNameApple));
  assert.equal(block(owner, fullSnapshot(), 'hrv')?.estimate, false);
});

test('Apple: HRV tek başına not, uyku nabzı neden (gunun-durumu-apple)', () => {
  const ready: CoachSnapshot = { ...fullSnapshot(), status: { level: 'ready', signals: ['hrv_low'] } };
  assert.equal(
    block(apple, ready, 'status')?.text,
    'Günün durumu: Hazır. Bandın dışında bir işaret yok. Not: HRV bandın altında; tek başına durumu değiştirmez.',
  );
  const caution: CoachSnapshot = { ...fullSnapshot(), status: { level: 'caution', signals: ['hrv_high', 'rhr_high'] } };
  assert.equal(
    block(apple, caution, 'status')?.text,
    'Günün durumu: Kontrollü. Nedeni: uyku nabzı bandın üstünde. Not: HRV bandın üstünde; tek başına durumu değiştirmez.',
  );
});

test('Apple: günlük istek kurulur, kaynaklar Apple kurallarından; Fitbit kaynağı yalnız ondan gelenler girmez', () => {
  const s: CoachSnapshot = { ...fullSnapshot(), hrv: { ...fullSnapshot().hrv!, position: 'below' } };
  const { layout } = buildRequest(s, apple, { selection: 'all' });
  const ids = layout.flatMap((e) => (e.kind === 'source' ? [e.sourceId] : []));
  assert.ok(ids.includes('ogrady-2024'), 'hrv-olcu-apple kaynağı');
  assert.ok(ids.includes('miller-2022'));
  // plews-2013 Apple durum kuralında da var; bellenger-2016 yalnız Fitbit durum kuralında.
  assert.ok(!ids.includes('bellenger-2016'));
});

test('Apple: haftalık istek kurulur, HRV tahmin', () => {
  const week: WeeklySnapshot = {
    version: 1,
    weekStart: '2026-01-12',
    status: { ready: 3, caution: 3, recover: 1, insufficient: 0 },
    hrv: { mean: 48, band: { low: 52, high: 66 }, position: 'below' },
    rhr: { mean: 47, band: { low: 44, high: 50 }, position: 'within' },
  };
  const hrv = weeklyBlocks(week, apple).find((b) => b.id === 'hrv');
  assert.equal(hrv?.estimate, true);
  assert.ok(hrv?.text.startsWith(hrvNameApple));
  assert.doesNotThrow(() => buildWeeklyRequest(week, apple));
  assert.equal(weeklyBlocks(week, owner).find((b) => b.id === 'hrv')?.estimate, false);
});
