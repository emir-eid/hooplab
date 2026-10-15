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
import { matchRuleIds, metricRules, travelRuleIds, type MetricKey } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
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
  illnessSigns: ['signs'],
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
  // Haftalık rapor koça gitmez; kuralları ilgili ölçümlerinkiler (karar 0040).
  weeklyReport: ['load', 'hrv', 'rhr', 'sleep', 'checkin', 'pain', 'nutrition'],
  // Maç çevresinin kuralları ölçümden değil anlık değerlerdeki maç bilgisinden gelir (matchRuleIds, karar 0046).
  match: ['nutrition'],
  // Seyahatin kuralları anlık değerlerdeki seyahat bilgisinden gelir (travelRuleIds, karar 0047).
  travel: [],
  energy: [],
};

/** Takvimde dün, bugün (saatli, şekerleme penceresiyle) ve yarın maç olan bir günün maç kuralları. */
const brief = { startTime: '19:00', venue: null };
const allMatchRules = matchRuleIds({
  version: 1,
  date: '2026-11-02',
  matchDay: true,
  match: {
    yesterday: brief,
    today: brief,
    tomorrow: brief,
    plan: { meal: ['15:00', '16:00'], mealCarbsG: null, fluid: ['15:00', '17:00'], fluidMl: null, nap: ['12:30', '16:50'], postCarbsGPerHour: null },
  },
});

/** Yolculuk günü ve jet lag'in ilk saatleri olan bir seyahatin kuralları. */
const travelBase = { offsetHours: 7, direction: 'east' as const, jetLag: true, daysUntil: null, dayAway: 1, totalDays: 7, remainingDays: 7, firstHours: true, eastDelayHint: false };
const allTravelRules = [
  ...travelRuleIds({ version: 1, date: '2026-11-02', matchDay: false, travel: { ...travelBase, phase: 'departure' } }),
];

/** Koça hiç gitmeyen açıklama sayfaları ve nedeni. */
const notInCoach: Partial<Record<ExplainerId, string>> = {
  energy: 'Yakılan enerji koçun anlık değerlerine girmez: tahmin, eşiği yok, alımla karşılaştırılmaz (karar 0043).',
};

/** Koçta olup açıklama sayfasında olmayan kurallar ve nedeni. */
const coachOnlyRules: Record<string, string> = {
  'agri-olcek': 'Ağrı bloğu değeri 0-10 ölçeğinde yazar ("3/10"); Vücut ekranının açıklaması ağrı izlemeyi anlatır.',
};

test('her açıklama sayfasının kuralları koçun ilgili ölçümünde', () => {
  for (const [id, metrics] of Object.entries(explainerMetrics) as [ExplainerId, readonly MetricKey[]][]) {
    if (notInCoach[id]) {
      assert.equal(metrics.length, 0, id);
      continue;
    }
    const extra = id === 'match' ? allMatchRules : id === 'travel' ? allTravelRules : [];
    const coach = new Set([...metrics.flatMap((m) => metricRules[m]), ...extra]);
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
