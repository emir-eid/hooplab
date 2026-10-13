// Soru-cevabın sabit güvenlik metinleri (karar 0037, 0038): doping uyarısı kuralına ve kaynağına bağlı,
// yönlendirme metinleri her sınıf için var, metinlerde "â" yok.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { askNoSource, askRejected, askRouted, dopingWarning } from './coach-ask.ts';
import { sources } from './sources.ts';

const rules = JSON.parse(readFileSync(new URL('../../../../research/rules/takviye.json', import.meta.url), 'utf8')) as {
  rules: { id: string; sources: string[] }[];
};

test('doping uyarısı takviye-doping-riski kuralına ve onun kaynağına bağlı', () => {
  const rule = rules.rules.find((r) => r.id === dopingWarning.rule);
  assert.ok(rule, dopingWarning.rule);
  for (const id of dopingWarning.sources) {
    assert.ok(rule.sources.includes(id), id);
    assert.ok(id in sources, `${id} künye listesinde yok`);
  }
  assert.match(dopingWarning.body, /WADA/);
});

test('yönlendirme ve sabit metinler dolu, "â" yok', () => {
  const texts = [askNoSource, askRejected, askRouted.medical_red_flag, askRouted.out_of_scope, dopingWarning].flatMap((t) => [t.title, t.body]);
  for (const t of texts) {
    assert.ok(t.length > 0);
    assert.ok(!/[âÂ]/.test(t), t);
  }
});
