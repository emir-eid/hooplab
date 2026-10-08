import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as engine from '@hooplab/engine';

import { kbRules } from '../../_shared/coach/kb-data.ts';
import {
  bandPositions,
  bodyRegions,
  bodySides,
  dayLevels,
  dayTypes,
  metricKeys,
  metricRules,
  painNoteReasons,
  parseSnapshot,
  presentMetrics,
  rangePositions,
  recoverySignals,
  snapshotRuleIds,
  wellnessItems,
  type BandPosition,
  type DayLevel,
  type PainNoteReason,
  type RangePosition,
  type RecoverySignal,
} from '../../_shared/coach/snapshot.ts';
import { asRequestBody, fullSnapshot } from './fixtures.ts';

// Motorda yalnız tip olan listeler: iki yönlü atanabilirlik derleme anında denetlenir.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameTypes: [
  Same<DayLevel, engine.DayLevel>,
  Same<RecoverySignal, engine.RecoverySignal>,
  Same<BandPosition, engine.BandPosition>,
  Same<PainNoteReason, engine.PainNoteReason>,
  Same<RangePosition, engine.RangePosition>,
] = [true, true, true, true, true];

test('enum listeleri motorla aynı', () => {
  assert.deepEqual(sameTypes, [true, true, true, true, true]);
  assert.deepEqual(bodyRegions, engine.bodyRegions);
  assert.deepEqual(bodySides, engine.bodySides);
  assert.deepEqual(wellnessItems, engine.wellnessItems);
  assert.deepEqual(dayTypes, engine.dayTypes);
  // Tip listelerinin elemanları da tekil (as const dizilerin tip denetimi tekrarı yakalamaz).
  for (const list of [dayLevels, recoverySignals, bandPositions, painNoteReasons, rangePositions]) {
    assert.equal(new Set(list).size, list.length);
  }
});

test('geçerli anlık değerler olduğu gibi kabul edilir', () => {
  const snapshot = fullSnapshot();
  const result = parseSnapshot(asRequestBody(snapshot));
  assert.ok(result.ok, result.ok ? '' : result.errors.join('\n'));
  assert.deepEqual(result.snapshot, snapshot);
});

test('yalnız zorunlu alanlar: ölçümsüz gün', () => {
  const result = parseSnapshot({ version: 1, date: '2026-01-15', matchDay: true });
  assert.ok(result.ok);
  assert.deepEqual(presentMetrics(result.snapshot), []);
  assert.deepEqual(snapshotRuleIds(result.snapshot), []);
});

test('şemada olmayan alan reddedilir (ad, kilo gibi veri modele sızmasın)', () => {
  const body = asRequestBody(fullSnapshot()) as Record<string, unknown>;
  body.weightKg = 88;
  (body.nutrition as Record<string, unknown>).weightKg = 88;
  const result = parseSnapshot(body);
  assert.ok(!result.ok);
  assert.ok(result.errors.includes('snapshot.weightKg: bilinmeyen alan'));
  assert.ok(result.errors.includes('snapshot.nutrition.weightKg: bilinmeyen alan'));
});

test('aralık, tip, sürüm ve tarih hataları; hepsi birlikte döner', () => {
  const body = asRequestBody(fullSnapshot()) as Record<string, any>;
  body.version = 2;
  body.date = '2026-02-30';
  body.hrv.rolling = 900;
  body.checkin.total = 16.5;
  body.status.signals = ['hrv_low', 'hrv_low'];
  body.nutrition.carbsG = [602, 430];
  body.pain[0].side = 'up';
  body.matchDay = 'evet';
  const result = parseSnapshot(body);
  assert.ok(!result.ok);
  const fields = result.errors.map((e) => e.split(':')[0]);
  assert.deepEqual(fields.sort(), [
    'snapshot.checkin.total',
    'snapshot.date',
    'snapshot.hrv.rolling',
    'snapshot.matchDay',
    'snapshot.nutrition.carbsG',
    'snapshot.pain[0].side',
    'snapshot.status.signals',
    'snapshot.version',
  ]);
});

test('tekrar eden bölge reddedilir; nesne olmayan gövde reddedilir', () => {
  const body = asRequestBody(fullSnapshot()) as Record<string, any>;
  body.regions.push({ ...body.regions[0] });
  assert.ok(!parseSnapshot(body).ok);
  assert.ok(!parseSnapshot(null).ok);
  assert.ok(!parseSnapshot([]).ok);
  assert.ok(!parseSnapshot('{}').ok);
});

test('her ölçümün kuralı kanıt tabanında; her ölçümün en az bir kuralı var', () => {
  const ruleIds = new Set(kbRules.map((r) => r.id));
  assert.deepEqual(Object.keys(metricRules).sort(), [...metricKeys].sort());
  for (const key of metricKeys) {
    assert.ok(metricRules[key].length > 0, key);
    for (const id of metricRules[key]) assert.ok(ruleIds.has(id), `${key} → ${id}`);
  }
});

test('anlık değerlerin kuralları: ölçüm sırasıyla, tekrarsız; boş dizi sayılmaz', () => {
  const snapshot = fullSnapshot();
  const ids = snapshotRuleIds(snapshot);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.slice(0, 4), ['gunun-durumu', 'toparlanma-bant', 'toparlanma-veri-yeterliligi', 'hrv-olcu']);

  const { regions: _r, pain: _p, ...rest } = snapshot;
  const empty = { ...rest, regions: [], pain: [] };
  assert.ok(!presentMetrics(empty).includes('regions'));
  assert.ok(!snapshotRuleIds(empty).includes('bolge-agri-izleme'));
});
