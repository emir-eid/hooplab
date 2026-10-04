import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { recoverySources } from './recovery-sources.ts';

const root = new URL('../../../../research/', import.meta.url);

test('ekrandaki kaynaklar toparlanma kurallarının kaynaklarıyla aynı', () => {
  const rules = JSON.parse(readFileSync(new URL('rules/toparlanma.json', root), 'utf8')) as { rules: { sources: string[] }[] };
  const ruleSources = new Set(rules.rules.flatMap((r) => r.sources));
  assert.deepEqual(new Set(recoverySources.map((s) => s.id)), ruleSources);
});

test('her kaynağın research/sources dosyası var', () => {
  for (const s of recoverySources) assert.ok(existsSync(new URL(`sources/${s.id}.md`, root)), s.id);
});
