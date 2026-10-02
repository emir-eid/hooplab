// Kaynak doğrulayıcının çevrimdışı testleri. Çevrimiçi kontroller (Crossref/PubMed) CI'da gerçek kaynaklarla koşar.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, titleSimilarity, validateOffline } from './validate-sources.mjs';

const fixture = (name) => fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url));

test('geçerli kaynak ve kural seti temiz çıkar', () => {
  const { errors, sources, ruleCount } = validateOffline(fixture('gecerli'));
  assert.deepEqual(errors, []);
  assert.equal(sources.size, 1);
  assert.equal(ruleCount, 1);
});

test('hatalı set: eksik alan, yanlış tür, olmayan kaynağa bağlanan kural yakalanır', () => {
  const { errors } = validateOffline(fixture('hatali'));
  const joined = errors.join('\n');
  assert.match(joined, /'population' eksik/);
  assert.match(joined, /geçersiz type 'blog'/);
  assert.match(joined, /dosya adıyla aynı olmalı/);
  assert.match(joined, /kaynak 'olmayan-kaynak' research\/sources içinde yok/);
  assert.match(joined, /en az bir kaynak gerekli/);
});

test('boş kütüphane hata vermez', () => {
  const { errors, sources } = validateOffline(fixture('bos'));
  assert.deepEqual(errors, []);
  assert.equal(sources.size, 0);
});

test('frontmatter liste ve tırnak ayrıştırma', () => {
  const fm = parseFrontmatter('---\nid: x\nauthors: [Ayşe A, "Bob B"]\ntitle: "Bir başlık"\n---\nmetin');
  assert.deepEqual(fm.authors, ['Ayşe A', 'Bob B']);
  assert.equal(fm.title, 'Bir başlık');
});

test('başlık benzerliği', () => {
  assert.ok(titleSimilarity('Sleep and the athlete: narrative review', 'Sleep and the Athlete: Narrative Review and 2021 Expert Consensus') > 0.9);
  assert.ok(titleSimilarity('Protein intake meta-analysis', 'Caffeine and endurance cycling') < 0.2);
});
