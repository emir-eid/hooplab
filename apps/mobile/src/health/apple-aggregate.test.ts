// Apple Health gövde hesabı (karar 0061 sıra 3d). Sentetik örnekler, sabit +03:00 saat dilimi.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildIngestBody,
  buildSleepSessions,
  CHUNK_DAYS,
  exerciseTypeFor,
  meanInWindow,
  SleepValue,
  syncWindows,
  type DayStats,
  type LocalClock,
  type SleepSampleIn,
} from './apple-aggregate.ts';

const OFFSET_S = 3 * 3600;
const clock: LocalClock = {
  date: (d) => new Date(d.getTime() + OFFSET_S * 1000).toISOString().slice(0, 10),
  hour: (d) => new Date(d.getTime() + OFFSET_S * 1000).getUTCHours(),
  offsetS: () => OFFSET_S,
};
/** Yerel saat (+03:00) → Date. */
const at = (local: string) => new Date(`${local}+03:00`);

let n = 0;
const s = (start: string, end: string, value: number, source = 'com.apple.health.watch'): SleepSampleIn => ({
  uuid: `U-${++n}`,
  start: at(start),
  end: at(end),
  value,
  source,
});

const night = [
  s('2026-01-14T23:00:00', '2026-01-15T01:00:00', SleepValue.asleepCore),
  s('2026-01-15T01:00:00', '2026-01-15T01:20:00', SleepValue.awake),
  s('2026-01-15T01:20:00', '2026-01-15T02:20:00', SleepValue.asleepDeep),
  s('2026-01-15T02:20:00', '2026-01-15T03:50:00', SleepValue.asleepREM),
  // 40 dk boşluk: aynı uyku
  s('2026-01-15T04:30:00', '2026-01-15T07:00:00', SleepValue.asleepCore),
];

test('uyku: parçalar tek oturum, uyanılan gün, evreler ayrı; yatakta kaydı sayılmaz', () => {
  const sessions = buildSleepSessions([...night, s('2026-01-14T22:30:00', '2026-01-15T07:10:00', SleepValue.inBed, 'com.apple.iphone')], clock);
  assert.equal(sessions.length, 1);
  const [x] = sessions;
  assert.equal(x?.localDate, '2026-01-15');
  assert.equal(x?.isNap, false);
  assert.equal(x?.startTime, '2026-01-14T20:00:00.000Z');
  assert.equal(x?.endTime, '2026-01-15T04:00:00.000Z');
  assert.equal(x?.minutesInPeriod, 480);
  assert.equal(x?.minutesAsleep, 120 + 60 + 90 + 150);
  assert.equal(x?.minutesAwake, 20);
  assert.equal(x?.minutesCore, 270);
  assert.equal(x?.minutesDeep, 60);
  assert.equal(x?.minutesRem, 90);
  assert.equal(x?.startUtcOffsetS, OFFSET_S);
  assert.match(x!.sourceId, /^[A-Za-z0-9._:-]+$/);
});

test('uyku: iki kaynak aynı geceyi yazınca en çok uyku yazan kaynak alınır, süre iki kez sayılmaz', () => {
  const phone = s('2026-01-14T23:30:00', '2026-01-15T06:00:00', SleepValue.asleepUnspecified, 'com.apple.iphone');
  const [x] = buildSleepSessions([...night, phone], clock);
  assert.equal(x?.minutesAsleep, 420);
  assert.equal(x?.minutesDeep, 60);
});

test('uyku: öğleden sonraki kısa uyku şekerleme, gecenin uykusu ana uyku', () => {
  const nap = s('2026-01-15T14:00:00', '2026-01-15T14:40:00', SleepValue.asleepUnspecified);
  const sessions = buildSleepSessions([...night, nap], clock);
  assert.deepEqual(
    sessions.map((x) => [x.localDate, x.isNap, x.minutesAsleep]),
    [
      ['2026-01-15', false, 420],
      ['2026-01-15', true, 40],
    ],
  );
});

test('ortalama: yalnız pencereye düşen örnekler; örnek yoksa boş', () => {
  const v = (t: string, value: number) => ({ start: at(t), end: at(t), value });
  const samples = [v('2026-01-14T22:00:00', 99), v('2026-01-15T00:00:00', 40), v('2026-01-15T05:00:00', 50), v('2026-01-15T09:00:00', 99)];
  assert.equal(meanInWindow(samples, at('2026-01-14T23:00:00'), at('2026-01-15T07:00:00')), 45);
  assert.equal(meanInWindow([], at('2026-01-14T23:00:00'), at('2026-01-15T07:00:00')), null);
});

const emptyStats = (): DayStats => ({
  restingHrBpm: new Map(),
  steps: new Map(),
  distanceM: new Map(),
  activeKcal: new Map(),
  basalKcal: new Map(),
});

test('gövde: her gün tam, gece değerleri ana uykudan; enerji aktif + bazal, biri eksikse yazılmaz', () => {
  const stats = emptyStats();
  stats.restingHrBpm.set('2026-01-15', 51.6);
  stats.steps.set('2026-01-15', 8123.4);
  stats.activeKcal.set('2026-01-15', 600.4);
  stats.basalKcal.set('2026-01-15', 1800.2);
  stats.activeKcal.set('2026-01-14', 500);
  const v = (t: string, value: number) => ({ start: at(t), end: at(t), value });
  const body = buildIngestBody(
    {
      from: '2026-01-14',
      to: '2026-01-15',
      sleep: night,
      sdnn: [v('2026-01-15T02:00:00', 41.23), v('2026-01-15T05:00:00', 50.01), v('2026-01-15T12:00:00', 90)],
      heartRate: [v('2026-01-15T00:00:00', 52), v('2026-01-15T06:00:00', 55), v('2026-01-15T10:00:00', 110)],
      respiratory: [],
      stats,
      hours: [
        { hourStart: at('2026-01-15T06:00:00'), kcal: 82.54 },
        { hourStart: at('2026-01-13T06:00:00'), kcal: 70 },
      ],
      workouts: [],
    },
    clock,
  );
  assert.deepEqual(body.window, { from: '2026-01-14', to: '2026-01-15' });
  assert.deepEqual(body.days, [
    { localDate: '2026-01-14' },
    { localDate: '2026-01-15', hrvSleepSdnnMs: 45.6, sleepHrBpm: 53.5, restingHrBpm: 52, steps: 8123, caloriesKcal: 2401 },
  ]);
  assert.deepEqual(body.hourlyEnergy, [{ hourStart: '2026-01-15T03:00:00.000Z', localDate: '2026-01-15', localHour: 6, kcal: 82.5 }]);
});

test('antrenman: Google tip adlarına eşlenir, bilinmeyen tip ayrı ad; pencere dışı gönderilmez', () => {
  assert.equal(exerciseTypeFor(6), 'BASKETBALL');
  assert.equal(exerciseTypeFor(50), 'STRENGTH_TRAINING');
  assert.equal(exerciseTypeFor(3000), 'APPLE_3000');
  const body = buildIngestBody(
    {
      from: '2026-01-15',
      to: '2026-01-15',
      sleep: [],
      sdnn: [],
      heartRate: [],
      respiratory: [],
      stats: emptyStats(),
      hours: [],
      workouts: [
        { uuid: 'W-1', start: at('2026-01-15T18:00:00'), end: at('2026-01-15T19:05:00'), activityType: 6, durationS: 3900.4, energyKcal: 610.7, distanceM: null, avgHrBpm: 141.6 },
        { uuid: 'W-2', start: at('2026-01-14T18:00:00'), end: at('2026-01-14T19:00:00'), activityType: 37, durationS: 3600, energyKcal: null, distanceM: 9000, avgHrBpm: null },
      ],
    },
    clock,
  );
  assert.deepEqual(body.workouts, [
    {
      sourceId: 'hk-W-1',
      localDate: '2026-01-15',
      startTime: '2026-01-15T15:00:00.000Z',
      endTime: '2026-01-15T16:05:00.000Z',
      startUtcOffsetS: OFFSET_S,
      exerciseType: 'BASKETBALL',
      activeDurationS: 3900,
      avgHrBpm: 142,
      caloriesKcal: 611,
      distanceM: null,
    },
  ]);
});

test('pencereler: en çok CHUNK_DAYS gün, eskiden yeniye, bugünde biter', () => {
  const w = syncWindows('2026-01-15', '2026-01-01');
  assert.deepEqual(w[0], { from: '2026-01-01', to: '2026-01-07' });
  assert.deepEqual(w[w.length - 1], { from: '2026-01-15', to: '2026-01-15' });
  assert.equal(w.length, 3);
  assert.ok(CHUNK_DAYS * 24 <= 240, 'saatlik enerji sınırına sığar');
  assert.deepEqual(syncWindows('2026-01-15', '2026-01-13'), [{ from: '2026-01-13', to: '2026-01-15' }]);
});
