// Koç kanıt tabanı paketleyicisinin testleri (karar 0032). Gerçek paketin research/ ile eşitliği
// supabase/functions/tests/coach/kb.test.ts içinde denetlenir.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKb, renderKb, summaryBody } from './coach-kb.mjs';

const fixture = (name) => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

test('özet gövdesi: frontmatter ve "Bağlı kurallar" atılır, diğer bölümler kalır', () => {
  const text = [
    '---',
    'id: x-2020',
    '---',
    '',
    '## Ne söylüyor (kendi cümlelerimizle)',
    '',
    '- Bir bulgu.',
    '',
    '## Bağlı kurallar',
    '',
    '- `rules/a.json` → `a`',
    '',
    '## Sınırlılıklar',
    '',
    'Küçük örneklem.',
    '',
  ].join('\r\n');
  const body = summaryBody(text);
  assert.match(body, /^## Ne söylüyor/);
  assert.match(body, /Bir bulgu\./);
  assert.match(body, /## Sınırlılıklar\n\nKüçük örneklem\.$/);
  assert.doesNotMatch(body, /Bağlı kurallar|rules\/a\.json|\r|^---/m);
});

test('geçerli set paketlenir: alanlar, sayı türünde yıl, kural modülü ve değeri', () => {
  const kb = buildKb(fixture('gecerli'));
  assert.equal(kb.sources.length, 1);
  const [source] = kb.sources;
  assert.equal(source.id, 'ornek-2020');
  assert.equal(source.year, 2020);
  assert.deepEqual(source.authors, ['Örnek A', 'Deneme B']);
  assert.equal(source.doi, '10.1234/ornek.2020.001');
  assert.equal('pmid' in source, false, 'olmayan alan yazılmaz');
  assert.equal(source.summary, "Test fixture'ı. Gerçek bir yayın değildir.");
  assert.deepEqual(kb.rules, [
    { id: 'ornek-esik', module: 'ornek', description: "Test fixture'ı kuralı", value: { min: 1, max: 2, unit: 'g/kg/gün' }, sources: ['ornek-2020'] },
  ]);
});

test('doğrulanmayan research/ paketlenmez', () => {
  assert.throws(() => buildKb(fixture('hatali')), /research\/ doğrulanmadı/);
});

test('çıktı deterministik ve elle değiştirme uyarısı taşır', () => {
  const a = renderKb(buildKb(fixture('gecerli')));
  const b = renderKb(buildKb(fixture('gecerli')));
  assert.equal(a, b);
  assert.match(a, /^\/\/ OTOMATİK ÜRETİLDİ/);
  assert.match(a, /export const kbSources: readonly KbSource\[\]/);
  assert.match(a, /export const kbRules: readonly KbRule\[\]/);
});

test('--check: eski veya eksik paket çıkış 1, güncel paket çıkış 0', () => {
  const script = fileURLToPath(new URL('./coach-kb.mjs', import.meta.url));
  const dir = mkdtempSync(path.join(tmpdir(), 'coach-kb-'));
  const out = path.join(dir, 'kb-data.ts');
  const run = () => spawnSync(process.execPath, [script, '--check', '--root', fixture('gecerli'), '--out', out], { encoding: 'utf8' });
  try {
    assert.equal(run().status, 1, 'dosya yok');
    execFileSync(process.execPath, [script, '--root', fixture('gecerli'), '--out', out]);
    assert.equal(run().status, 0, 'güncel');
    writeFileSync(out, renderKb(buildKb(fixture('gecerli'))).replace('ornek-2020', 'ornek-2021'));
    assert.equal(run().status, 1, 'elle değişmiş');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
