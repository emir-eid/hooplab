// Haftalık koç yorumu uçtan uca (karar 0052): demo verisi → haftalık rapor görünümü → koça giden sayılar (sunucunun
// doğrulamasından geçer) → sentetik yorum (sunucunun denetçisinden ve kısmi kabulünden geçer).

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { auditResponse, salvageAudit, type ResponseBlock } from '../../../../supabase/functions/_shared/coach/audit.ts';
import type { DocumentEntry } from '../../../../supabase/functions/_shared/coach/documents.ts';
import { kbRules, kbSources } from '../../../../supabase/functions/_shared/coach/kb-data.ts';
import type { Kb } from '../../../../supabase/functions/_shared/coach/kb.ts';
import { buildWeeklyRequest, parseWeeklySnapshot } from '../../../../supabase/functions/_shared/coach/weekly.ts';
import { buildWeeklyCoachSnapshot, checkWeeklyCoachSnapshot } from '../data/coach-weekly-snapshot.ts';
import { buildWeeklyReportView, type WeeklyRows } from '../data/weekly-report-view.ts';
import { demoWeeklyComment } from './demo-coach-weekly.ts';
import { createDemoDb, demoScenarios, type DemoScenario } from './demo-data.ts';

const kb: Kb = { sources: kbSources, rules: kbRules };
const today = '2026-10-14';
const now = new Date('2026-10-14T09:00:00+03:00');
const weeks = ['2026-10-05', '2026-09-28'];

function rows(scenario: DemoScenario): WeeklyRows {
  const db = createDemoDb(scenario, today, now);
  return {
    sessions: db.sessions.map((s) => ({
      local_date: s.localDate,
      rpe: s.rpe,
      duration_min: s.durationMin,
      kind: s.kind,
      minutes_played: s.minutesPlayed,
      sweat: s.sweat !== null,
    })),
    earliestSession: db.sessions.map((s) => s.localDate).sort()[0] ?? null,
    healthDaily: db.healthDaily,
    energy: db.energy,
    sleep: db.sleep,
    checkins: db.checkins.map((c) => ({ local_date: c.local_date, ...c.answers })),
    pain: db.pain,
    weights: db.weights,
    dayTypes: [],
    matches: db.matches,
    meals: db.meals,
    fluids: db.fluids,
  };
}

test('süren haftada koça sayı gitmez', () => {
  assert.equal(buildWeeklyCoachSnapshot(buildWeeklyReportView(rows('green'), '2026-10-12', today)), null);
});

for (const scenario of demoScenarios) {
  for (const week of weeks) {
    test(`demo ${scenario} @ ${week}: sayılar doğrulanır, yorum denetimden geçer`, () => {
      const snapshot = buildWeeklyCoachSnapshot(buildWeeklyReportView(rows(scenario), week, today))!;
      assert.ok(snapshot);
      assert.deepEqual(checkWeeklyCoachSnapshot(snapshot), { ok: true });
      // İstek gövdesi JSON'dan geçer; kilo ve yakılan enerji yok.
      const body = JSON.parse(JSON.stringify(snapshot));
      assert.equal(parseWeeklySnapshot(body).ok, true);
      assert.doesNotMatch(JSON.stringify(body), /kg|kcal|weight|energy/i);

      const { layout } = buildWeeklyRequest(snapshot, kb);
      const blocks = (layout[0] as Extract<DocumentEntry, { kind: 'numbers' }>).blocks;
      const comment = demoWeeklyComment(snapshot);
      const content: ResponseBlock[] = comment.flatMap((s) => [
        {
          type: 'text',
          text: s.text,
          citations: [
            ...s.numbers.map((id) => {
              const i = blocks.findIndex((b) => b.id === id);
              assert.ok(i >= 0, `haftanın sayılarında ${id} yok`);
              return { type: 'content_block_location', document_index: 0, start_block_index: i, end_block_index: i + 1 };
            }),
            ...s.sources.map((id) => {
              const i = layout.findIndex((e) => e.kind === 'source' && e.sourceId === id);
              assert.ok(i > 0, `${id} bu haftanın seçilen kaynaklarında yok`);
              return { type: 'char_location', document_index: i };
            }),
          ],
        },
        { type: 'text', text: ' ' },
      ]);
      const audit = auditResponse(content, layout);
      assert.deepEqual(audit.problems, []);
      assert.ok(salvageAudit(audit, layout));
    });
  }
}
