// Koçun sunucu tarafı (supabase/functions/_shared/coach) uygulamanın metinleriyle aynı dili konuşur:
// ölçüm → kural eşlemesi açıklama sayfalarının kurallarıyla, günün sayıları belgesindeki etiketler
// uygulamadaki etiketlerle aynı (karar 0032). Edge Function uygulama kodunu içe aktarmadığı için eşitlik burada denetlenir.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  dayTypeLabels as coachDayTypes,
  levelLabels as coachLevels,
  regionLabels as coachRegions,
  sideLabels as coachSides,
  wellnessTitles as coachWellness,
} from '../../../../supabase/functions/_shared/coach/documents.ts';
import { metricRules, type MetricKey } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import { explainers, type ExplainerId } from './explainers.ts';
import { regionLabels, sideLabels, wellnessLabels } from './labels.ts';
import { dayTypeLabels } from './nutrition.ts';
import { levelLabels } from './recovery.ts';

/** Her açıklama sayfası koçta hangi ölçümle anlatılır. */
const explainerMetrics: Record<ExplainerId, readonly MetricKey[]> = {
  hrv: ['hrv', 'status'],
  hrvNight: ['hrv'],
  rhr: ['rhr', 'status'],
  sleep: ['sleep'],
  respiration: ['respiration'],
  checkin: ['checkin'],
  sessionLoad: ['load'],
  loadChart: ['load'],
  ratio: ['load'],
  weeklyAverage: ['load'],
  monotony: ['load'],
  strain: ['load'],
  regionLoad: ['regions'],
  regionWindow: ['regions'],
  painMonitoring: ['pain'],
  nutrition: ['nutrition', 'fluid'],
  sweatTest: ['sweatTest'],
};

/** Koçta olup açıklama sayfasında olmayan kurallar ve nedeni. */
const coachOnlyRules: Record<string, string> = {
  'agri-olcek': 'Ağrı bloğu değeri 0-10 ölçeğinde yazar ("3/10"); Vücut ekranının açıklaması ağrı izlemeyi anlatır.',
};

test('her açıklama sayfasının kuralları koçun ilgili ölçümünde', () => {
  for (const [id, metrics] of Object.entries(explainerMetrics) as [ExplainerId, readonly MetricKey[]][]) {
    const coach = new Set(metrics.flatMap((m) => metricRules[m]));
    for (const rule of explainers[id].rules) assert.ok(coach.has(rule), `${id} → ${rule} koçta yok`);
  }
});

test('koçun kuralları açıklama sayfalarında (istisnalar gerekçeli)', () => {
  const explained = new Set<string>(Object.values(explainers).flatMap((e) => e.rules));
  const coachRules = new Set(Object.values(metricRules).flat());
  const extra = [...coachRules].filter((r) => !explained.has(r)).sort();
  assert.deepEqual(extra, Object.keys(coachOnlyRules).sort());
});

test('günün sayıları belgesindeki etiketler uygulamadakiyle aynı', () => {
  assert.deepEqual(coachLevels, levelLabels);
  assert.deepEqual(coachDayTypes, dayTypeLabels);
  assert.deepEqual(coachRegions, regionLabels);
  assert.deepEqual(coachSides, sideLabels);
  assert.deepEqual(coachWellness, Object.fromEntries(Object.entries(wellnessLabels).map(([k, v]) => [k, v.title])));
});
