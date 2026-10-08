import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { fullKb, selectForRules, UnknownRuleError, type Kb } from '../../_shared/coach/kb.ts';
import { kbRules, kbSources } from '../../_shared/coach/kb-data.ts';

const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const kb: Kb = { sources: kbSources, rules: kbRules };

test('paket research/ ile aynı (üretilmiş dosya elle değişmemiş, research/ değişince yeniden üretilmiş)', () => {
  // Çıkış 0 değilse execFileSync hata fırlatır; mesajı betik yazar.
  execFileSync(process.execPath, ['tools/research/coach-kb.mjs', '--check'], { cwd: repo, stdio: 'pipe' });
});

test('her kuralın kaynakları pakette; kimlikler tekil ve sıralı', () => {
  const sourceIds = kbSources.map((s) => s.id);
  const ruleIds = kbRules.map((r) => r.id);
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  assert.equal(new Set(ruleIds).size, ruleIds.length);
  assert.deepEqual(sourceIds, [...sourceIds].sort((a, b) => a.localeCompare(b, 'en')));
  assert.deepEqual(ruleIds, [...ruleIds].sort((a, b) => a.localeCompare(b, 'en')));
  for (const rule of kbRules) for (const id of rule.sources) assert.ok(sourceIds.includes(id), `${rule.id} → ${id}`);
});

test('özetler dolu ve "Bağlı kurallar" bölümü pakete girmez', () => {
  for (const source of kbSources) {
    assert.match(source.summary, /## Ne söylüyor/, source.id);
    assert.doesNotMatch(source.summary, /## Bağlı kurallar/, source.id);
  }
});

const tiny: Kb = {
  sources: ['a-2020', 'b-2021', 'c-2022'].map((id, i) => ({
    id,
    title: id,
    authors: ['X'],
    year: 2020 + i,
    type: 'rct' as const,
    population: 'test',
    summary: '## Ne söylüyor',
  })),
  rules: [
    { id: 'r1', module: 'm', description: 'r1', sources: ['b-2021', 'a-2020'] },
    { id: 'r2', module: 'm', description: 'r2', sources: ['a-2020', 'c-2022'] },
    { id: 'r3', module: 'm', description: 'r3', sources: ['c-2022'] },
  ],
};

test('kural grafiğiyle seçim: kurallar verildiği sırada, kaynaklar ilk geçtiği sırada, tekrarsız', () => {
  const sel = selectForRules(tiny, ['r2', 'r1', 'r2']);
  assert.deepEqual(sel.rules.map((r) => r.id), ['r2', 'r1']);
  assert.deepEqual(sel.sources.map((s) => s.id), ['a-2020', 'c-2022', 'b-2021']);
});

test('seçim: boş liste boş seçim; olmayan kural hata, sessizce düşmez', () => {
  assert.deepEqual(selectForRules(tiny, []), { rules: [], sources: [] });
  assert.throws(
    () => selectForRules(tiny, ['r1', 'yok', 'yok']),
    (e: unknown) => e instanceof UnknownRuleError && e.ruleIds.length === 1 && e.ruleIds[0] === 'yok',
  );
});

test('gerçek tabanda seçim: toparlanma kuralları kendi kaynaklarını getirir', () => {
  const sel = selectForRules(kb, ['hrv-olcu']);
  const rule = kbRules.find((r) => r.id === 'hrv-olcu');
  assert.ok(rule);
  assert.deepEqual(sel.sources.map((s) => s.id), [...rule.sources]);
});

test('tam taban: bütün kaynaklar ve kurallar, sabit sırada', () => {
  const all = fullKb(kb);
  assert.equal(all.sources.length, kbSources.length);
  assert.equal(all.rules.length, kbRules.length);
  assert.deepEqual(fullKb(kb), all);
});
