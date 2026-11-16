// Açıklamalar kurallara bağlı mı (karar 0026): her kural research/rules'ta var, her kaynak o kuralların kaynaklarından.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { appleExplainers, explainerFor, explainers, isExplainerId, type Explainer } from './explainers.ts';

/** İki profilin açıklamaları birlikte (karar 0061): Apple sürümleri aynı denetimlerden geçer. */
const all: [string, Explainer][] = [
  ...(Object.entries(explainers) as [string, Explainer][]),
  ...(Object.entries(appleExplainers) as [string, Explainer][]).map(([id, e]): [string, Explainer] => [`${id} (apple)`, e]),
];

const root = new URL('../../../../research/', import.meta.url);
const ruleFiles = readdirSync(new URL('rules/', root)).filter((f) => f.endsWith('.json'));
const rules = new Map<string, string[]>();
for (const f of ruleFiles) {
  const json = JSON.parse(readFileSync(new URL(`rules/${f}`, root), 'utf8')) as { rules: { id: string; sources: string[] }[] };
  for (const r of json.rules) rules.set(r.id, r.sources);
}

test('her açıklamanın kuralları var, kaynakları o kuralların kaynaklarından', () => {
  for (const [id, e] of all) {
    const allowed = new Set<string>();
    for (const r of e.rules) {
      const s = rules.get(r);
      assert.ok(s, `${id}: kural yok ${r}`);
      for (const x of s) allowed.add(x);
    }
    for (const s of e.sources) assert.ok(allowed.has(s), `${id}: ${s} kurallarının kaynağı değil`);
    // Kaynağı olmayan açıklama eşik veya iddia taşımaz; yalnız "yorumlanmıyor" diyebilir.
    if (e.sources.length === 0) assert.equal(e.rules.length, 0, id);
  }
});

test('metinlerde "â" yok ve bölümler dolu', () => {
  for (const [id, e] of all) {
    const text = [e.title, e.hint, e.goal ?? '', e.what, e.reference, ...e.read, e.limits ?? ''].join(' ');
    assert.ok(!/[âÂ]/.test(text), id);
    assert.ok(e.what.length > 0 && e.reference.length > 0 && e.read.length > 0, id);
  }
});

test('her açıklamanın kısa cümlesi var; kartta sığacak kadar kısa (sade dil, 2026-10-14)', () => {
  for (const [id, e] of all) {
    assert.ok(e.hint.length > 0 && e.hint.length <= 72, `${id}: ${e.hint.length}`);
    assert.ok(e.hint.endsWith('.'), id);
  }
});

test('günün durumunu belirleyen ve not düşen ölçümlerde hedef yazılı', () => {
  for (const id of ['hrv', 'rhr', 'sleep', 'respiration', 'checkin', 'illnessSigns', 'ratio', 'sweatTest', 'painMonitoring'] as const) {
    assert.ok((explainers[id].goal ?? '').length > 0, id);
  }
});

test('Apple açıklamaları yalnız Apple kurallarına dayanır, sahibininkiler Fitbit sürümlerine (karar 0061)', () => {
  const appleOnly = /-apple$/;
  for (const [id, e] of Object.entries(appleExplainers) as [string, Explainer][]) {
    assert.ok(e.rules.some((r) => appleOnly.test(r)), id);
    for (const r of e.rules) assert.ok(!['hrv-olcu', 'nabiz-olcu', 'gunun-durumu', 'enerji-harcamasi-tahmin'].includes(r), `${id}: ${r}`);
    assert.equal(e.title, explainers[id as keyof typeof appleExplainers].title.replace(' · derin uyku', ' · uyku'), id);
  }
  for (const e of Object.values(explainers) as Explainer[]) for (const r of e.rules) assert.ok(!appleOnly.test(r), r);
  assert.equal(appleExplainers.hrv.basis, 'estimate');
});

test('explainerFor: varsayılan ve Google Health sahibinin açıklaması, Apple yalnız tanımlı olanlarda farklı', () => {
  assert.equal(explainerFor('hrv'), explainers.hrv);
  assert.equal(explainerFor('hrv', 'google_health'), explainers.hrv);
  assert.equal(explainerFor('hrv', 'apple_health'), appleExplainers.hrv);
  assert.equal(explainerFor('sleep', 'apple_health'), explainers.sleep);
});

test('isExplainerId yalnız bilinen kimlikleri kabul eder', () => {
  assert.equal(isExplainerId('monotony'), true);
  assert.equal(isExplainerId('toString'), false);
  assert.equal(isExplainerId(undefined), false);
});
