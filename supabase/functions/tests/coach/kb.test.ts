import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createHash } from 'node:crypto';

import { DEFAULT_PROFILE, forProfile, fullKb, selectForRules, UnknownRuleError, withoutAppNumbers, type Kb, type KbProfile } from '../../_shared/coach/kb.ts';
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

test('"Uygulamada kullanılan sayılar" bölümü çıkarılınca öbür bölümler kalır', () => {
  const withTable = kbSources.filter((s) => s.summary.includes('## Uygulamada kullanılan sayılar'));
  assert.ok(withTable.length > 0);
  for (const s of withTable) {
    const out = withoutAppNumbers(s).summary;
    assert.ok(!out.includes('Uygulamada kullanılan sayılar'), s.id);
    for (const h of ['## Ne söylüyor', '## Sınırlılıklar']) if (s.summary.includes(h)) assert.ok(out.includes(h), `${s.id} ${h}`);
    assert.ok(out.length < s.summary.length);
  }
});

// Karar 0061: koçun tabanı kullanıcının profiline göre süzülür.
const owner: KbProfile = DEFAULT_PROFILE;
const apple: KbProfile = { source: 'apple_health', sport: 'fitness', sex: 'kadin' };

test('sahibinin profili: koçun tabanı profil alanından önceki tabanla bayt bayt aynı (parmak izi)', () => {
  // 2026-11-15 yayındaki paketin fullKb çıktısı (51 kural, 122 kaynak). Sahibi için koçun girdisi değişmemeli;
  // değişirse bu bilinçli bir kural / kaynak değişikliğidir ve parmak izi gerekçesiyle birlikte güncellenir.
  const selected = fullKb(forProfile(kb, owner));
  const digest = createHash('sha256').update(JSON.stringify(selected)).digest('hex');
  assert.equal(selected.rules.length, 51);
  assert.equal(selected.sources.length, 122);
  assert.equal(digest, '1d47b1bab9dc213f92f481aa01affbaf888f71389bcf7e5ef98874e87fafe7c9');
});

test('profil süzmesi: Apple profili Apple sürümlerini alır, Fitbit sürümlerini almaz; profil alanı modele gitmez', () => {
  const a = forProfile(kb, apple);
  const ids = a.rules.map((r) => r.id);
  for (const id of ['hrv-olcu-apple', 'nabiz-olcu-apple', 'gunun-durumu-apple', 'enerji-harcamasi-tahmin-apple']) assert.ok(ids.includes(id), id);
  for (const id of ['hrv-olcu', 'nabiz-olcu', 'gunun-durumu', 'enerji-harcamasi-tahmin']) assert.ok(!ids.includes(id), id);
  assert.ok(ids.includes('protein-gunluk'), 'profilsiz kural herkese');
  for (const rule of [...a.rules, ...forProfile(kb, owner).rules]) assert.equal('profile' in rule, false, rule.id);
  const sourceIds = new Set(a.sources.map((s) => s.id));
  for (const rule of a.rules) for (const id of rule.sources) assert.ok(sourceIds.has(id), `${rule.id} → ${id}`);
  // Yalnız Fitbit kurallarının kullandığı kaynak Apple tabanında yok; ortak kaynak kalır.
  assert.ok(!sourceIds.has('reddy-2018'));
  assert.ok(sourceIds.has('nuuttila-2022'));
});

test('profil süzmesi: sahibinin tabanında Apple kuralı ve yalnız Apple kaynağı yok', () => {
  const o = forProfile(kb, owner);
  assert.ok(o.rules.every((r) => !r.id.endsWith('-apple')));
  const sourceIds = new Set(o.sources.map((s) => s.id));
  for (const id of ['ogrady-2024', 'miller-2022', 'task-force-1996', 'choe-2025', 'lambe-2026b']) assert.ok(!sourceIds.has(id), id);
});
