// Motor sabitleri research/rules ile ve veritabanı CHECK'leriyle aynı mı?
// Kural dosyası veya migration değişip motor değişmezse (ya da tersi) bu test kırılır.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import {
  bodyRegions,
  contentTags,
  defaultContentTags,
  modeledRegions,
  notModeledRegions,
  painMonitoringRule,
  regionComparison,
  regionWindow,
  sessionKinds,
  tagRegions,
  dayStatusRule,
  hrvTransform,
  loadEwma,
  loadRatioRule,
  loadSpikeRule,
  loadWeek,
  monotonyRule,
  painScale,
  recoveryBand,
  recoveryMinValues,
  rpeAnchors,
  rpeScale,
  shortSleep,
  wellnessItems,
  wellnessScale,
} from '../src/index.ts';

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

test('toparlanma bandı, veri yeterliliği ve uyku eşiği kuralla aynı', () => {
  assert.equal(rule('toparlanma.json', 'hrv-olcu').value.transform, hrvTransform);
  const band = rule('toparlanma.json', 'toparlanma-bant').value;
  assert.equal(band.rolling_days, recoveryBand.rollingDays);
  assert.equal(band.baseline_days, recoveryBand.baselineDays);
  assert.equal(band.sd_multiplier, recoveryBand.sdMultiplier);
  const min = rule('toparlanma.json', 'toparlanma-veri-yeterliligi').value;
  assert.equal(min.rolling_min_values, recoveryMinValues.rolling);
  assert.equal(min.baseline_min_values, recoveryMinValues.baseline);
  const sleep = rule('toparlanma.json', 'uyku-kisa').value;
  assert.equal(sleep.min_hours, shortSleep.minHours);
  assert.equal(sleep.rolling_nights, shortSleep.rollingNights);
});

test('günün durumu birleşimi kuralla aynı', () => {
  const { value } = rule('toparlanma.json', 'gunun-durumu');
  assert.deepEqual(value.recover_when_all, [...dayStatusRule.recoverWhenAll]);
  assert.deepEqual(value.caution_when_any, [...dayStatusRule.cautionWhenAny]);
});

test('antrenman yükü pencereleri ve eşikleri kuralla aynı', () => {
  assert.equal(rule('yuk.json', 'yuk-gunluk').value.rest_day_value, 0);
  const week = rule('yuk.json', 'yuk-haftalik').value;
  assert.equal(week.week_days, loadWeek.days);
  assert.equal(week.average_weeks, loadWeek.averageWeeks);
  const ewma = rule('yuk.json', 'yuk-ewma').value;
  assert.equal(ewma.acute_n, loadEwma.acuteN);
  assert.equal(ewma.chronic_n, loadEwma.chronicN);
  assert.equal(ewma.lambda, '2/(N+1)');
  assert.equal(rule('yuk.json', 'yuk-orani').value.min_history_days, loadRatioRule.minHistoryDays);
  assert.equal(rule('yuk.json', 'yuk-artis-notu').value.ratio_min, loadSpikeRule.ratioMin);
  const mono = rule('yuk.json', 'yuk-monotonluk').value;
  assert.equal(mono.window_days, monotonyRule.windowDays);
  assert.equal(mono.sd, 'sample');
  assert.equal(mono.threshold, null);
});

test('veritabanı CHECK aralıkları motorla aynı', () => {
  for (const item of wellnessItems) {
    assert.match(migrations, new RegExp(`${item} smallint not null check \\(${item} between ${wellnessScale.min} and ${wellnessScale.max}\\)`), item);
  }
  assert.match(migrations, new RegExp(`rpe between ${rpeScale.min} and ${rpeScale.max}`));
  assert.match(migrations, new RegExp(`pain between ${painScale.min} and ${painScale.max}`));
});

test('kas / tendon etiketleri, eşleme, pencereler ve ağrı izleme kuralla aynı', () => {
  const tags = rule('bolge.json', 'bolge-icerik-etiketleri').value;
  assert.deepEqual(tags.tags, [...contentTags]);
  assert.deepEqual(tags.defaults_by_kind, Object.fromEntries(Object.entries(defaultContentTags).map(([k, v]) => [k, [...v]])));
  const map = rule('bolge.json', 'bolge-esleme').value;
  const { not_modeled, ...byTag } = map;
  assert.deepEqual(byTag, Object.fromEntries(Object.entries(tagRegions).map(([k, v]) => [k, [...v]])));
  assert.deepEqual(not_modeled, [...notModeledRegions]);
  const win = rule('bolge.json', 'bolge-toparlanma-penceresi').value;
  assert.equal(win.tendon_hours, regionWindow.tendonHours);
  assert.equal(win.muscle_hours, regionWindow.muscleHours);
  assert.deepEqual(win.tendon_regions, [...regionWindow.tendonRegions]);
  assert.deepEqual(win.muscle_regions, [...regionWindow.muscleRegions]);
  assert.deepEqual([...(win.tendon_regions as string[]), ...(win.muscle_regions as string[])].sort(), [...modeledRegions].sort());
  const load = rule('bolge.json', 'bolge-yuku').value;
  assert.equal(load.comparison_days, regionComparison.days);
  assert.equal(load.threshold, null);
  assert.equal(rule('bolge.json', 'bolge-agri-izleme').value.max_nrs, painMonitoringRule.maxNrs);
});

test('veritabanındaki seans türleri ve içerik etiketleri motorla aynı', () => {
  const kinds = [...migrations.matchAll(/check \(kind in \(([^)]*)\)\)/g)].at(-1);
  assert.ok(kinds, 'kind CHECK bulunamadı');
  assert.deepEqual([...kinds[1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort(), [...sessionKinds].sort());
  const tags = migrations.match(/content_tags <@ array\[([^\]]*)\]/);
  assert.ok(tags, 'content_tags CHECK bulunamadı');
  assert.deepEqual([...tags[1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]), [...contentTags]);
});

test('veritabanındaki bölge listesi motorla aynı', () => {
  const m = migrations.match(/check \(region in \(([^)]*)\)\)/);
  assert.ok(m, 'region CHECK bulunamadı');
  const dbRegions = [...m[1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  assert.deepEqual(dbRegions, [...bodyRegions]);
});
