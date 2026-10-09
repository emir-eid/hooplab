// Demo sporcunun anlık değerleri ve sentetik koç özeti uçtan uca: demo verisi → motor görünümleri → anlık değerler
// (sunucunun doğrulamasından geçer) → sentetik özet (sunucunun denetçisinden geçer). Demo özeti gerçek yanıtın
// yapısını taşımazsa ya da bir sayı günün sayılarında yoksa test kırılır.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { WellnessAnswers } from '@hooplab/engine';

import { auditResponse, type ResponseBlock } from '../../../../supabase/functions/_shared/coach/audit.ts';
import { routingNotes } from '../../../../supabase/functions/_shared/coach/contract.ts';
import { dailyDocuments, type DocumentEntry } from '../../../../supabase/functions/_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../../../supabase/functions/_shared/coach/kb-data.ts';
import { selectForRules, type Kb } from '../../../../supabase/functions/_shared/coach/kb.ts';
import { parseSnapshot, snapshotRuleIds, type CoachSnapshot } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import { buildCoachSnapshot, checkCoachSnapshot } from '../data/coach-snapshot.ts';
import { demoCoachSummary } from './demo-coach.ts';
import { createDemoDb, demoScenarios, type DemoScenario } from './demo-data.ts';
import { demoInputs } from './demo-inputs.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const now = new Date('2026-10-05T09:00:00+03:00');
const days = ['2026-10-05', '2026-11-01', '2027-01-03', '2028-03-01'];

/** Demo özetini Messages API'nin citations biçimine çevirir: her cümle bir metin bloğu, aralarda alıntısız boşluk. */
function asResponse(snapshot: CoachSnapshot, scenario: DemoScenario) {
  const { sources } = selectForRules(kb, snapshotRuleIds(snapshot));
  const { layout } = dailyDocuments(snapshot, kb, sources);
  const blocks = (layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>).blocks;
  const summary = demoCoachSummary(scenario, snapshot);
  const content: ResponseBlock[] = summary.flatMap((s) => [
    {
      type: 'text',
      text: s.text,
      citations: [
        ...s.numbers.map((id) => {
          const i = blocks.findIndex((b) => b.id === id);
          assert.ok(i >= 0, `${scenario}: günün sayılarında ${id} bloğu yok`);
          return { type: 'content_block_location', document_index: 0, start_block_index: i, end_block_index: i + 1 };
        }),
        ...s.sources.map((id) => {
          const i = layout.findIndex((e) => e.kind === 'source' && e.sourceId === id);
          assert.ok(i > 0, `${scenario}: ${id} bu günün seçilen kaynaklarında yok`);
          return { type: 'char_location', document_index: i };
        }),
      ],
    },
    { type: 'text', text: ' ' },
  ]);
  return { summary, audit: auditResponse(content, layout) };
}

test('demo: anlık değerler her senaryoda ve takvim sınırlarında sunucunun doğrulamasından geçer', () => {
  for (const today of days) {
    for (const scenario of demoScenarios) {
      const snapshot = buildCoachSnapshot(demoInputs(createDemoDb(scenario, today, now), today, now));
      assert.deepEqual(checkCoachSnapshot(snapshot), { ok: true }, `${scenario} @ ${today}`);
      // JSON'dan geçince de aynı (istek gövdesi): undefined alan yok, tuple'lar dizi.
      const parsed = parseSnapshot(JSON.parse(JSON.stringify(snapshot)));
      assert.ok(parsed.ok && JSON.stringify(parsed.snapshot) === JSON.stringify(snapshot), `${scenario} @ ${today}`);
    }
  }
});

test('demo: bugün check-in yok; check-in eklenince toplam ve kıyas gider', () => {
  const today = days[0]!;
  const db = createDemoDb('yellow', today, now);
  assert.equal(buildCoachSnapshot(demoInputs(db, today, now)).checkin, undefined);
  const answers: WellnessAnswers = { sleep_quality: 2, fatigue: 2, soreness: 3, stress: 3, mood: 3 };
  db.checkins.push({ local_date: today, answers });
  const checkin = buildCoachSnapshot(demoInputs(db, today, now)).checkin;
  assert.equal(checkin?.total, 13);
  assert.ok(checkin?.z !== null && checkin!.z < 0 && checkin!.baselineMean !== null);
});

test('demo: senaryonun durumu ve kırmızıdaki solunum notu anlık değerlere geçer', () => {
  const today = days[0]!;
  const level = { green: 'ready', yellow: 'caution', red: 'recover' } as const;
  for (const scenario of demoScenarios) {
    const snapshot = buildCoachSnapshot(demoInputs(createDemoDb(scenario, today, now), today, now));
    assert.equal(snapshot.status?.level, level[scenario]);
    assert.deepEqual(routingNotes(snapshot), scenario === 'red' ? ['respiration_high'] : []);
  }
});

test('demo özeti: her senaryoda sunucunun denetçisinden geçer, cümleler alıntılı', () => {
  for (const today of days) {
    for (const scenario of demoScenarios) {
      const snapshot = buildCoachSnapshot(demoInputs(createDemoDb(scenario, today, now), today, now));
      const { summary, audit } = asResponse(snapshot, scenario);
      // Yönergedeki biçim: 4-7 cümle (daily.ts systemPrompt).
      assert.ok(summary.length >= 4 && summary.length <= 7, `${scenario} @ ${today}: ${summary.length} cümle`);
      assert.deepEqual(audit.problems, [], `${scenario} @ ${today}`);
      // Denetçinin çıkardığı cümleler ve dayanaklar demodakiyle aynı: kart gerçek yanıtla aynı yoldan çizilir.
      assert.deepEqual(
        audit.sentences.map((s) => s.text),
        summary.map((s) => s.text),
      );
      assert.deepEqual(
        audit.sentences.map((s) => [[...s.numbers].sort(), [...s.sources].sort()]),
        summary.map((s) => [[...s.numbers].sort(), [...s.sources].sort()]),
      );
    }
  }
});

test('denetçi bu yolda gerçekten kırılır: demo cümlesindeki sayı değişince özet reddedilir', () => {
  const today = days[0]!;
  const snapshot = buildCoachSnapshot(demoInputs(createDemoDb('green', today, now), today, now));
  const { sources } = selectForRules(kb, snapshotRuleIds(snapshot));
  const { layout } = dailyDocuments(snapshot, kb, sources);
  const blocks = (layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>).blocks;
  const hrv = blocks.findIndex((b) => b.id === 'hrv');
  const text = demoCoachSummary('green', snapshot).find((s) => s.numbers.includes('hrv'))!.text.replace(/(\d+) ms,/, (_, n: string) => `${Number(n) + 1} ms,`);
  const audit = auditResponse(
    [{ type: 'text', text, citations: [{ type: 'content_block_location', document_index: 0, start_block_index: hrv, end_block_index: hrv + 1 }] }],
    layout,
  );
  assert.deepEqual(
    audit.problems.map((p) => p.code),
    ['number_mismatch'],
  );
});
