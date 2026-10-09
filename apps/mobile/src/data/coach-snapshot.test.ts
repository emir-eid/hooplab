import assert from 'node:assert/strict';
import { test } from 'node:test';

import { snapshotLimits } from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import { createDemoDb } from '../demo/demo-data.ts';
import { demoInputs } from '../demo/demo-inputs.ts';
import { buildCoachSnapshot, checkCoachSnapshot, type CoachInputs } from './coach-snapshot.ts';

const now = new Date('2026-10-05T09:00:00+03:00');
const today = '2026-10-05';
const base = (): CoachInputs => demoInputs(createDemoDb('red', today, now), today, now);

test('cihaz verisi yoksa toparlanma bölümü gitmez (bant oluşuyor yanıltmasın)', () => {
  const input = base();
  input.recovery = { ...input.recovery!, empty: true };
  const s = buildCoachSnapshot(input);
  for (const key of ['status', 'hrv', 'rhr', 'sleep', 'respiration'] as const) assert.equal(s[key], undefined, key);
  assert.deepEqual(checkCoachSnapshot(s), { ok: true });
});

test('son gece yalnız bugün ya da dün; daha eski gece son gece sayılmaz', () => {
  const input = base();
  const r = input.recovery!;
  input.recovery = {
    ...r,
    hrv: { ...r.hrv, latest: { date: '2026-10-02', value: 60 } },
    sleep: { ...r.sleep, lastNight: { date: '2026-10-04', minutes: 420 } },
  };
  const s = buildCoachSnapshot(input);
  assert.equal(s.hrv?.lastNight, null);
  assert.equal(s.sleep?.lastNightHours, 7);
});

test('aralık dışı seçmeli değer null olur, anlık değerin tamamı reddedilmez', () => {
  const input = base();
  const l = input.load!;
  input.load = { ...l, reading: { ...l.reading, weekChange: snapshotLimits.weekChange[1] + 400, monotony: Number.POSITIVE_INFINITY } };
  input.checkin = { ...input.checkin!, total: 12, z: -45, baselineMean: 20, low: true, drops: [{ item: 'fatigue', mean: 4, today: 1, drop: 3 }] };
  const s = buildCoachSnapshot(input);
  assert.equal(s.load?.weekChange, null);
  assert.equal(s.load?.monotony, null);
  // z aralık dışıysa kıyasın hiçbir parçası gitmez: tek başına "düşük" notu dayanaksız kalmasın.
  assert.deepEqual(s.checkin, { total: 12, baselineMean: null, z: null, low: false, topDrop: null });
  assert.deepEqual(checkCoachSnapshot(s), { ok: true });
});

test('bölge: yalnız toparlanma penceresindekiler; ağrı: yalnız notu olanlar; su: hiç içiş yoksa gitmez', () => {
  const input = base();
  const reg = input.regions!;
  input.regions = {
    ...reg,
    notes: [
      { region: 'patellar_tendon', side: 'left', pain: 6, yesterdayPain: 2, reasons: ['high'] },
      { region: 'calf', side: 'right', pain: 1, yesterdayPain: null, reasons: [] },
    ],
  };
  input.nutrition = { ...input.nutrition!, fluidL: 0 };
  const s = buildCoachSnapshot(input);
  const recovering = reg.reading.regions.filter((r) => r.recovering).map((r) => r.region);
  assert.deepEqual(s.regions?.map((r) => r.region) ?? [], recovering);
  assert.deepEqual(s.pain, [{ region: 'patellar_tendon', side: 'left', pain: 6, yesterdayPain: 2, reasons: ['high'] }]);
  assert.equal(s.fluid, undefined);
  assert.deepEqual(checkCoachSnapshot(s), { ok: true });
});

test('kilo, ad ya da ham seri gitmez: yalnız şemadaki alanlar', () => {
  const s = buildCoachSnapshot(base());
  const json = JSON.stringify(s);
  for (const word of ['weight', 'kg"', 'chart', 'daily', 'latest', 'meals":[']) assert.ok(!json.includes(word), word);
});

test('bozuk değer gönderilmeden yakalanır; hatada yalnız alan yolu döner', () => {
  const s = buildCoachSnapshot(base());
  const broken = { ...s, nutrition: { ...s.nutrition!, meals: 2.5 } };
  assert.deepEqual(checkCoachSnapshot(broken), { ok: false, paths: ['snapshot.nutrition.meals'] });
});
