// Künyeler kaynak dosyalarıyla aynı mı: her kaynak dosyası listede, ilk yazar soyadı, yıl ve tür eşleşiyor.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { sources } from './sources.ts';

const dir = new URL('../../../../research/sources/', import.meta.url);
const kinds: Record<string, string> = {
  consensus: 'Uzman konsensüsü',
  'position-stand': 'Tutum bildirgesi',
  'systematic-review': 'Sistematik derleme',
  'meta-analysis': 'Meta-analiz',
  rct: 'Randomize kontrollü çalışma',
  cohort: 'Kohort',
  'cross-sectional': 'Kesitsel çalışma',
  'narrative-review': 'Derleme',
  'expert-opinion': 'Uzman görüşü',
};

test('her kaynak dosyası künye listesinde ve künye dosyayla aynı', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md');
  assert.deepEqual(new Set(Object.keys(sources)), new Set(files.map((f) => f.slice(0, -3))));
  for (const f of files) {
    const id = f.slice(0, -3) as keyof typeof sources;
    const head = readFileSync(new URL(f, dir), 'utf8').split('---')[1] ?? '';
    const authors = head.match(/^authors:\s*\[(.*)\]/m)?.[1]?.split(',') ?? [];
    const first = authors[0]?.trim().split(' ').slice(0, -1).join(' ') ?? '';
    const year = head.match(/^year:\s*(\d+)/m)?.[1];
    const type = head.match(/^type:\s*(\S+)/m)?.[1] ?? '';
    const cite = authors.length > 1 ? `${first} ve ark., ${year}` : `${first}, ${year}`;
    assert.equal(sources[id].cite, cite, id);
    assert.equal(sources[id].kind, kinds[type], id);
  }
});
