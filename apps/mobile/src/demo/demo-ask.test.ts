// Demo soru-cevabı gerçek yanıtın yapısını taşımalı: her yanıt sunucudaki denetçiden soru-cevap kipinde geçer.
// Kaynağın sayısı yalnız alıntılanan metinde varsa kabul edildiği için burada alıntı metni kaynak özetinin
// kendisidir: cümledeki sayı özette yazmıyorsa test kırılır.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { judgeAnswer, buildAskRequest } from '../../../../supabase/functions/_shared/coach/ask.ts';
import { auditResponse, type ResponseBlock } from '../../../../supabase/functions/_shared/coach/audit.ts';
import { kbRules, kbSources } from '../../../../supabase/functions/_shared/coach/kb-data.ts';
import type { Kb } from '../../../../supabase/functions/_shared/coach/kb.ts';
import { askSamples } from '../copy/coach-ask.ts';
import { demoAnswer, demoAnswers } from './demo-ask.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const { layout } = buildAskRequest('demo', null, kb);

test('demo: her örnek sorunun yanıtı var', () => {
  assert.deepEqual(Object.keys(demoAnswers), [...askSamples]);
  assert.equal(demoAnswer('  maç günü ne kadar karbonhidrat almalıyım?  ')?.status, 'answered');
  assert.equal(demoAnswer('Serbest bir soru'), null);
});

test('demo: yanıtlar soru-cevap denetçisinden tam geçer', () => {
  for (const [question, answer] of Object.entries(demoAnswers)) {
    if (answer.status !== 'answered') continue;
    const content: ResponseBlock[] = answer.sentences.flatMap((s) => [
      {
        type: 'text',
        text: s.text,
        citations: s.sources.map((id) => {
          const i = layout.findIndex((e) => e.kind === 'source' && e.sourceId === id);
          assert.ok(i >= 0, `${question}: ${id} kanıt tabanında yok`);
          return { type: 'char_location', document_index: i, cited_text: kbSources[i]!.summary };
        }),
      },
      { type: 'text', text: ' ' },
    ]);
    const audit = auditResponse(content, layout, { sourceNumbers: true });
    assert.deepEqual(audit.problems, [], question);
    assert.equal(judgeAnswer(audit, layout).status, 'answered', question);
    assert.deepEqual(audit.sentences, answer.sentences, question);
  }
});
