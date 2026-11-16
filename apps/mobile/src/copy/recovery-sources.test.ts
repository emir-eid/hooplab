import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { cycleSources, recoverySources, recoverySourcesApple, recoverySourcesAppleFitness, recoverySourcesFitness } from './recovery-sources.ts';

const root = new URL('../../../../research/', import.meta.url);

test('ekrandaki kaynaklar toparlanma kurallarının (Google Health profili) kaynaklarıyla aynı', () => {
  // Karar 0061: Apple sürümlerinin kaynakları bu ekranda değil, Apple profilinin açıklamasında gösterilir.
  type Rule = { sources: string[]; profile?: { source?: string[]; sport?: string[] } };
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: Rule[] };
  // Spor sürümleri (karar 0061 sıra 4) bu listeye girmez; fitness listesi uygulamaya 4b'de gelir.
  const basketbol = (r: Rule) => !r.profile?.sport || r.profile.sport.includes('basketbol');
  const forOwner = rules.rules.filter((r) => basketbol(r) && (!r.profile?.source || r.profile.source.includes('google_health')));
  const ruleSources = new Set(forOwner.flatMap((r) => r.sources));
  assert.deepEqual(new Set(recoverySources.map((s) => s.id)), ruleSources);
});

test('Apple listesi Apple profilindeki toparlanma kurallarının kaynaklarıyla aynı (karar 0061)', () => {
  type Rule = { sources: string[]; profile?: { source?: string[]; sport?: string[] } };
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: Rule[] };
  const basketbol = (r: Rule) => !r.profile?.sport || r.profile.sport.includes('basketbol');
  const forApple = rules.rules.filter((r) => basketbol(r) && (!r.profile?.source || r.profile.source.includes('apple_health')));
  assert.deepEqual(new Set(recoverySourcesApple.map((s) => s.id)), new Set(forApple.flatMap((r) => r.sources)));
});

test('her kaynağın research/sources dosyası var', () => {
  for (const s of [...recoverySources, ...recoverySourcesApple, ...recoverySourcesFitness, ...recoverySourcesAppleFitness]) assert.ok(existsSync(new URL(`sources/${s.id}.md`, root)), s.id);
});

test('fitness listeleri fitness profilindeki toparlanma kurallarının kaynaklarıyla aynı (karar 0061 sıra 4)', () => {
  type Rule = { sources: string[]; profile?: { source?: string[]; sport?: string[] } };
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: Rule[] };
  const fits = (r: Rule, source: string) => (!r.profile?.sport || r.profile.sport.includes('fitness')) && (!r.profile?.source || r.profile.source.includes(source));
  for (const [source, list] of [['google_health', recoverySourcesFitness], ['apple_health', recoverySourcesAppleFitness]] as const) {
    const expected = new Set(rules.rules.filter((r) => fits(r, source)).flatMap((r) => r.sources));
    assert.deepEqual(new Set(list.map((s) => s.id)), expected, source);
  }
});

test('döngü listesi döngü kurallarının kaynaklarıyla aynı (karar 0061 sıra 5)', () => {
  const rules = JSON.parse(readFileSync(new URL('rules/dongu.json', root), 'utf8')) as { rules: { sources: string[] }[] };
  assert.deepEqual(new Set(cycleSources.map((s) => s.id)), new Set(rules.rules.flatMap((r) => r.sources)));
  for (const s of cycleSources) assert.ok(existsSync(new URL(`sources/${s.id}.md`, root)), s.id);
});
