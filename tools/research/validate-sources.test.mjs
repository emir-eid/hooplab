// Kaynak doğrulayıcının çevrimdışı testleri. Çevrimiçi kontroller (Crossref/PubMed) CI'da gerçek kaynaklarla koşar.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { parseFrontmatter, PROFILE_VALUES, ruleAppliesTo, titleSimilarity, validateOffline, validateProfiles } from './validate-sources.mjs';

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

// Karar 0061: kural profili ve sürümleri.
const rule = (id, extra = {}) => ({ id, description: 'x', sources: ['k'], ...extra });

test('profil: sürümü olan aile her bileşimde tam bir kural seçer', () => {
  const ok = [
    rule('hrv', { profile: { source: ['google_health'] } }),
    rule('hrv-apple', { variant_of: 'hrv', profile: { source: ['apple_health'] } }),
    rule('protein'),
  ];
  assert.deepEqual(validateProfiles(ok), []);
});

test('profil: boşta kalan ya da iki kural düşen bileşim yakalanır', () => {
  const gap = [rule('hrv', { profile: { source: ['google_health'] } }), rule('hrv-fit', { variant_of: 'hrv', profile: { sport: ['fitness'] } })];
  const errors = validateProfiles(gap).join('\n');
  assert.match(errors, /'apple_health · basketbol · boş' profiline 0 kural/);
  assert.match(errors, /'google_health · fitness · kadin' profiline 2 kural/);
});

test('profil: biçim hataları yakalanır', () => {
  const bad = [
    rule('a', { profile: { source: ['garmin'] } }),
    rule('b', { profile: { renk: ['mavi'] } }),
    rule('c', { profile: {} }),
    rule('d', { variant_of: 'yok' }),
    rule('e', { variant_of: 'a' }),
  ];
  const errors = validateProfiles(bad).join('\n');
  assert.match(errors, /profile.source geçersiz değer 'garmin'/);
  assert.match(errors, /bilinmeyen profil boyutu 'renk'/);
  assert.match(errors, /'profile' boş olamaz/);
  assert.match(errors, /variant_of 'yok' kuralı yok/);
  assert.match(errors, /sürüm kuralının 'profile' alanı olmalı/);
});

test('profil: değerler profiles tablosunun CHECK listeleriyle aynı', () => {
  const sql = readFileSync(new URL('../../supabase/migrations/20261114220538_profil.sql', import.meta.url), 'utf8');
  const list = (col) => {
    const start = sql.indexOf(`check (${col} = any (array[`);
    assert.ok(start >= 0, `${col} CHECK'i migration'da yok`);
    const body = sql.slice(start, sql.indexOf(']', start));
    return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  };
  assert.deepEqual(list('data_source'), PROFILE_VALUES.source);
  assert.deepEqual(list('sport'), PROFILE_VALUES.sport);
  assert.deepEqual([...list('sex'), null], PROFILE_VALUES.sex);
});

test('profil: ruleAppliesTo profilsiz kuralı herkese, boş cinsiyeti yalnız cinsiyetsiz kurala uygular', () => {
  const owner = { source: 'google_health', sport: 'basketbol', sex: null };
  assert.equal(ruleAppliesTo(rule('a'), owner), true);
  assert.equal(ruleAppliesTo(rule('b', { profile: { sex: ['kadin'] } }), owner), false);
  assert.equal(ruleAppliesTo(rule('c', { profile: { source: ['google_health'], sport: ['basketbol'] } }), owner), true);
});
