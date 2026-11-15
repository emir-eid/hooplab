import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { recoverySources } from './recovery-sources.ts';

const root = new URL('../../../../research/', import.meta.url);

test('ekrandaki kaynaklar toparlanma kurallarının (Google Health profili) kaynaklarıyla aynı', () => {
  // Karar 0061: Apple sürümlerinin kaynakları bu ekranda değil, Apple profilinin açıklamasında gösterilir.
  type Rule = { sources: string[]; profile?: { source?: string[] } };
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: Rule[] };
  const forOwner = rules.rules.filter((r) => !r.profile?.source || r.profile.source.includes('google_health'));
  const ruleSources = new Set(forOwner.flatMap((r) => r.sources));
  assert.deepEqual(new Set(recoverySources.map((s) => s.id)), ruleSources);
});

test('her kaynağın research/sources dosyası var', () => {
  for (const s of recoverySources) assert.ok(existsSync(new URL(`sources/${s.id}.md`, root)), s.id);
});
