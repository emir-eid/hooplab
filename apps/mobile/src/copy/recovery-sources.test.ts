import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { recoverySources, recoverySourcesApple } from './recovery-sources.ts';

const root = new URL('../../../../research/', import.meta.url);

test('ekrandaki kaynaklar toparlanma kurallarının (Google Health profili) kaynaklarıyla aynı', () => {
  // Karar 0061: Apple sürümlerinin kaynakları bu ekranda değil, Apple profilinin açıklamasında gösterilir.
  type Rule = { sources: string[]; profile?: { source?: string[] } };
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: Rule[] };
  const forOwner = rules.rules.filter((r) => !r.profile?.source || r.profile.source.includes('google_health'));
  const ruleSources = new Set(forOwner.flatMap((r) => r.sources));
  assert.deepEqual(new Set(recoverySources.map((s) => s.id)), ruleSources);
});

test('Apple listesi Apple profilindeki toparlanma kurallarının kaynaklarıyla aynı (karar 0061)', () => {
  type Rule = { sources: string[]; profile?: { source?: string[] } };
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: Rule[] };
  const forApple = rules.rules.filter((r) => !r.profile?.source || r.profile.source.includes('apple_health'));
  assert.deepEqual(new Set(recoverySourcesApple.map((s) => s.id)), new Set(forApple.flatMap((r) => r.sources)));
});

test('her kaynağın research/sources dosyası var', () => {
  for (const s of [...recoverySources, ...recoverySourcesApple]) assert.ok(existsSync(new URL(`sources/${s.id}.md`, root)), s.id);
});
