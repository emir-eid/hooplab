import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRecoveryView } from '../data/recovery-view.ts';
import { buildTrainingLoadView } from '../data/training-load-view.ts';
import { createDemoDb, demoScenarios } from './demo-data.ts';

const now = new Date('2026-10-05T09:00:00+03:00');
// Ay sonu, yıl sonu ve artık gün: bant penceresi takvim sınırlarını geçerken de durum değişmemeli.
const days = ['2026-10-05', '2026-11-01', '2027-01-03', '2028-03-01'];
const expected = { green: 'ready', yellow: 'caution', red: 'recover' } as const;

test('her senaryo motorda beklenen durumu verir', () => {
  for (const today of days) {
    for (const scenario of demoScenarios) {
      const db = createDemoDb(scenario, today, now);
      const view = buildRecoveryView(db.healthDaily, db.sleep, today);
      assert.equal(view.status.level, expected[scenario], `${scenario} @ ${today}: ${view.status.signals.join(',')}`);
    }
  }
});

test('sarı: HRV düşük ve uyku kısa; kırmızı: HRV düşük ve nabız yüksek', () => {
  const today = days[0]!;
  const yellow = createDemoDb('yellow', today, now);
  assert.deepEqual(buildRecoveryView(yellow.healthDaily, yellow.sleep, today).status.signals, ['hrv_low', 'sleep_short']);
  const red = createDemoDb('red', today, now);
  const signals = buildRecoveryView(red.healthDaily, red.sleep, today).status.signals;
  assert.ok(signals.includes('hrv_low') && signals.includes('rhr_high'));
});

test('deterministik: aynı girdi aynı veriyi verir', () => {
  assert.deepEqual(createDemoDb('yellow', days[0]!, now), createDemoDb('yellow', days[0]!, now));
});

test('bugün check-in yok, etiket bekleyen oturum var, satırlar biçimde', () => {
  const today = days[0]!;
  const db = createDemoDb('green', today, now);
  assert.ok(!db.checkins.some((c) => c.local_date === today));
  assert.ok(db.checkins.length >= 10);
  assert.ok(db.exercises.some((e) => e.localDate === today));
  assert.ok(db.healthDaily.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.local_date) && r.local_date <= today));
  for (const c of db.checkins) for (const v of Object.values(c.answers)) assert.ok(Number.isInteger(v) && v >= 1 && v <= 5);
  assert.ok(db.pain.every((p) => Number.isInteger(p.pain) && p.pain >= 1 && p.pain <= 10));
  // Eşleşmiş seansın saat oturumu var
  const linked = db.sessions.filter((s) => s.exerciseSessionId);
  assert.ok(linked.every((s) => db.exercises.some((e) => e.id === s.exerciseSessionId)));
});

test('yük: yeşil dengeli, sarı orta artış (not yok), kırmızı kamp haftası (oran 1,5 üstü, not)', () => {
  for (const today of days) {
    const ratio = (scenario: (typeof demoScenarios)[number]) => {
      const db = createDemoDb(scenario, today, now);
      const rows = db.sessions.map((s) => ({ local_date: s.localDate, rpe: s.rpe, duration_min: s.durationMin, kind: s.kind }));
      const earliest = rows.map((r) => r.local_date).sort()[0] ?? null;
      return buildTrainingLoadView(rows, today, { earliest, untagged: [] }).reading;
    };
    const [green, yellow, red] = [ratio('green'), ratio('yellow'), ratio('red')];
    assert.ok(green.ratio !== null && green.ratio < 1.1 && !green.spike, `yeşil ${green.ratio}`);
    assert.ok(yellow.ratio !== null && yellow.ratio > green.ratio! + 0.05 && !yellow.spike, `sarı ${yellow.ratio}`);
    assert.ok(red.ratio !== null && red.spike, `kırmızı ${red.ratio}`);
    assert.ok(green.monotony !== null && green.strain !== null);
  }
});
