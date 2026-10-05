// Motor sabitleri research/rules ile ve veritabanı CHECK'leriyle aynı mı?
// Kural dosyası veya migration değişip motor değişmezse (ya da tersi) bu test kırılır.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

import {
  bodyRegions,
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

test('veritabanındaki bölge listesi motorla aynı', () => {
  const m = migrations.match(/check \(region in \(([^)]*)\)\)/);
  assert.ok(m, 'region CHECK bulunamadı');
  const dbRegions = [...m[1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  assert.deepEqual(dbRegions, [...bodyRegions]);
});
