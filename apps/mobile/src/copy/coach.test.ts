import assert from 'node:assert/strict';
import { test } from 'node:test';

import { numbersBlocks } from '../../../../supabase/functions/_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../../../supabase/functions/_shared/coach/kb-data.ts';
import { fullSnapshot } from '../../../../supabase/functions/tests/coach/fixtures.ts';
import { basisLabel, basisTarget, coachFailureReason, summaryLayout, visibleRoutingNotes } from './coach.ts';
import { explainers } from './explainers.ts';
import { sources } from './sources.ts';

const kb = { sources: kbSources, rules: kbRules };

test('günün sayılarındaki her blok bir açıklamaya ya da yönteme gider (maç günü hariç)', () => {
  for (const block of numbersBlocks(fullSnapshot(), kb)) {
    const target = basisTarget(block.id);
    if (block.id === 'day') {
      assert.equal(target, null);
      continue;
    }
    assert.ok(target, block.id);
    if (target.kind === 'explainer') {
      assert.ok(explainers[target.id], block.id);
      // Hedef açıklama, bloğun ölçümünün kurallarından en az birini anlatır.
      assert.ok(explainers[target.id].rules.length > 0);
    }
    assert.ok(basisLabel(block.id).length > 0);
  }
});

test('kanıt tabanındaki her kaynağın künyesi uygulamada var (dayanaklar listesi)', () => {
  for (const s of kbSources) assert.ok(Object.hasOwn(sources, s.id), s.id);
});

test('hata kodları anlaşılır nedene çevrilir; bilinmeyen kod da bir metin alır', () => {
  assert.match(coachFailureReason('anthropic_401'), /anahtar/);
  assert.match(coachFailureReason('anthropic_400'), /kredi/);
  assert.match(coachFailureReason('anthropic_529'), /yoğun/);
  assert.match(coachFailureReason('anthropic_503'), /yoğun/);
  assert.match(coachFailureReason('refusal_general_harms'), /yanıtlamadı/);
  assert.ok(coachFailureReason('xyz').length > 0);
});

test('özetin düzeni: durum cümlesi öne, cümleler alıntıladıkları ölçümün konusunda, yorum önündekinin konusunda', () => {
  const s = (numbers: string[], sources: string[] = []) => ({ text: numbers.join('+') || sources.join('+'), numbers, sources });
  const layout = summaryLayout([
    s(['day', 'status']),
    s(['rhr']),
    s([], ['plews-2013']),
    s(['nutrition']),
    s(['regions.0']),
    s([], ['gabbett-2025']),
    s(['respiration']),
    { text: 'Kısa geçiş.', numbers: [], sources: [] },
  ]);
  assert.equal(layout.lead?.index, 0);
  assert.deepEqual(
    layout.sections.map((x) => [x.topic, x.lines.map((l) => l.index)]),
    [
      ['recovery', [1, 2, 6, 7]],
      ['load', [4, 5]],
      ['nutrition', [3]],
    ],
  );
  // Rozet numarası özetteki alıntılı cümle sırası; alıntısız cümlede rozet yok.
  assert.deepEqual(
    [layout.lead!, ...layout.sections.flatMap((x) => x.lines)].map((l) => l.mark),
    [1, 2, 3, 7, null, 5, 6, 4],
  );
});

test('özetin düzeni: ilk cümle durum değilse öne çıkan cümle yok', () => {
  const layout = summaryLayout([{ text: 'a', numbers: ['load'], sources: [] }]);
  assert.equal(layout.lead, null);
  assert.deepEqual(layout.sections.map((x) => x.topic), ['load']);
});

test('özetin düzeni: maç günü cümleleri ayrı konu, en başta (karar 0036)', () => {
  const s = (numbers: string[], sources: string[] = []) => ({ text: numbers.join('+') || sources.join('+'), numbers, sources });
  const layout = summaryLayout([s(['status']), s(['day']), s([], ['fradkin-2010']), s(['nutrition']), s([], ['sawka-2007'])]);
  assert.equal(layout.lead?.index, 0);
  assert.deepEqual(
    layout.sections.map((x) => [x.topic, x.lines.map((l) => l.index)]),
    [
      ['match', [1, 2]],
      ['nutrition', [3, 4]],
    ],
  );
  // Gerçek özetteki sıra: ısınma cümleleri nabız cümlesinin ardından gelse de Maç günü'ne girer; karışık kaynaklı cümle önündekinin konusunda kalır (burada Maç günü).
  const real = summaryLayout([
    s(['day', 'status']),
    s(['rhr']),
    s([], ['fradkin-2010']),
    s([], ['mcgowan-2015']),
    s([], ['fradkin-2010', 'plews-2013']),
  ]);
  assert.deepEqual(
    real.sections.map((x) => [x.topic, x.lines.map((l) => l.index)]),
    [
      ['match', [2, 3, 4]],
      ['recovery', [1]],
    ],
  );
});

test('gece işaretleri notu solunum notunu kapsar; tek başına notlar olduğu gibi (karar 0039)', () => {
  assert.deepEqual(visibleRoutingNotes(['respiration_high', 'illness_signs', 'pain_high']), ['illness_signs', 'pain_high']);
  assert.deepEqual(visibleRoutingNotes(['respiration_high', 'pain_high']), ['respiration_high', 'pain_high']);
  assert.deepEqual(visibleRoutingNotes([]), []);
});
