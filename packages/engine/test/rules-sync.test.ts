// Motor sabitleri research/rules ile ve veritabanı CHECK'leriyle aynı mı?
// Kural dosyası veya migration değişip motor değişmezse (ya da tersi) bu test kırılır.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import { bodyRegions, painScale, rpeAnchors, rpeScale, wellnessItems, wellnessScale } from '../src/index.ts';

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');

interface Rule {
  id: string;
  value: Record<string, unknown>;
}
function rule(file: string, id: string): Rule {
  const doc = JSON.parse(read(`../../../research/rules/${file}`)) as { rules: Rule[] };
  const found = doc.rules.find((r) => r.id === id);
  assert.ok(found, `${file} → ${id} yok`);
  return found;
}

const migrationsDir = new URL('../../../supabase/migrations/', import.meta.url);
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(new URL(f, migrationsDir), 'utf8'))
  .join('\n');

test('check-in ölçeği kuralla aynı', () => {
  const { value } = rule('iyi-olus.json', 'checkin-olcek');
  assert.equal(value.items, wellnessItems.length);
  assert.equal(value.min, wellnessScale.min);
  assert.equal(value.max, wellnessScale.max);
  assert.equal(value.step, wellnessScale.step);
});

test('RPE ölçeği ve çapaları kuralla aynı', () => {
  const { value } = rule('yuk.json', 'seans-rpe-olcek');
  assert.equal(value.min, rpeScale.min);
  assert.equal(value.max, rpeScale.max);
  assert.deepEqual(value.anchors, [...rpeAnchors]);
});

test('ağrı ölçeği kuralla aynı', () => {
  const { value } = rule('agri.json', 'agri-olcek');
  assert.equal(value.min, painScale.min);
  assert.equal(value.max, painScale.max);
});

test('veritabanı CHECK aralıkları motorla aynı', () => {
  for (const item of wellnessItems) {
    assert.match(migrations, new RegExp(`${item} smallint not null check \\(${item} between ${wellnessScale.min} and ${wellnessScale.max}\\)`), item);
  }
  assert.match(migrations, new RegExp(`rpe between ${rpeScale.min} and ${rpeScale.max}`));
  assert.match(migrations, new RegExp(`pain between ${painScale.min} and ${painScale.max}`));
});

test('veritabanındaki bölge listesi motorla aynı', () => {
  const m = migrations.match(/check \(region in \(([^)]*)\)\)/);
  assert.ok(m, 'region CHECK bulunamadı');
  const dbRegions = [...m[1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  assert.deepEqual(dbRegions, [...bodyRegions]);
});
