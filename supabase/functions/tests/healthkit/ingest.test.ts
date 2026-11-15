// healthkit-ingest (karar 0061 sıra 3b): biçim denetimi, satır kurulumu ve profil kapısı. Veriler sentetik.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LIMITS, MAX_DAYS_BACK, parseIngestBody, runIngest, type IngestStore, type Row } from '../../_shared/healthkit/ingest.ts';

const NOW = new Date('2026-01-15T07:30:00Z');
const USER = '22222222-2222-4222-8222-222222222222';

function validBody() {
  return {
    days: [
      { localDate: '2026-01-14', hrvSleepSdnnMs: 48.2, sleepHrBpm: 54.6, restingHrBpm: 52, respiratoryRateBpm: 14.1, steps: 9000, distanceM: 6500, caloriesKcal: 2400 },
      { localDate: '2026-01-15', steps: 1200 },
    ],
    sleep: [
      {
        sourceId: 'A1B2C3D4-0000-4000-8000-000000000001',
        localDate: '2026-01-15',
        startTime: '2026-01-14T23:10:00+03:00',
        endTime: '2026-01-15T07:05:00+03:00',
        startUtcOffsetS: 10800,
        endUtcOffsetS: 10800,
        minutesInPeriod: 475,
        minutesAsleep: 440,
        minutesAwake: 35,
        minutesCore: 250,
        minutesDeep: 80,
        minutesRem: 110,
      },
    ],
    workouts: [
      {
        sourceId: 'A1B2C3D4-0000-4000-8000-000000000002',
        localDate: '2026-01-14',
        startTime: '2026-01-14T18:00:00+03:00',
        endTime: '2026-01-14T19:05:00+03:00',
        exerciseType: 'traditionalStrengthTraining',
        activeDurationS: 3600,
        avgHrBpm: 118,
        caloriesKcal: 410,
      },
    ],
    hourlyEnergy: [{ hourStart: '2026-01-15T06:00:00+03:00', localDate: '2026-01-15', localHour: 6, kcal: 82.5 }],
  };
}

function memoryStore(dataSource: string | null) {
  const writes: { table: string; onConflict: string; rows: Row[] }[] = [];
  const store: IngestStore = {
    dataSource: async () => dataSource,
    upsert: async (table, onConflict, rows) => {
      writes.push({ table, onConflict, rows: structuredClone(rows) });
    },
  };
  return { store, writes };
}

test('geçerli gövde: satırlar kurulur, kaynak apple_health, zamanlar UTC ISO', () => {
  const r = parseIngestBody(validBody(), NOW);
  assert.ok(r.ok);
  const { daily, sleep, exercise, hourlyEnergy } = r.rows;
  assert.equal(daily.length, 2);
  assert.deepEqual(daily[0], {
    local_date: '2026-01-14',
    source: 'apple_health',
    hrv_sleep_sdnn_ms: 48.2,
    sleep_hr_bpm: 54.6,
    resting_hr_bpm: 52,
    respiratory_rate_bpm: 14.1,
    spo2_avg_pct: null,
    steps: 9000,
    distance_m: 6500,
    calories_kcal: 2400,
  });
  assert.equal(sleep[0]?.start_time, '2026-01-14T20:10:00.000Z');
  assert.equal(sleep[0]?.minutes_light, 250, 'Apple "core" evresi hafif uyku sütununa');
  assert.equal(sleep[0]?.is_nap, false);
  assert.equal(sleep[0]?.is_main, true);
  assert.equal(exercise[0]?.exercise_type, 'traditionalStrengthTraining');
  assert.equal(hourlyEnergy[0]?.hour_start, '2026-01-15T03:00:00.000Z');
  for (const row of [...daily, ...sleep, ...exercise, ...hourlyEnergy]) assert.equal(row.source, 'apple_health');
});

test('günler tam yazılır: her gün satırı aynı anahtarlarla (upsert sütun birleşimi, LESSONS)', () => {
  const r = parseIngestBody(validBody(), NOW);
  assert.ok(r.ok);
  const [a, b] = r.rows.daily;
  assert.deepEqual(Object.keys(a ?? {}).sort(), Object.keys(b ?? {}).sort());
  assert.equal(b?.hrv_sleep_sdnn_ms, null);
});

test('Fitbit sütunları Apple yüklemesinden yazılamaz (SDNN ile RMSSD karışmaz)', () => {
  const body = validBody();
  (body.days[0] as Record<string, unknown>).hrvDeepRmssdMs = 60;
  const r = parseIngestBody(body, NOW);
  assert.deepEqual(r, { ok: false, issues: ['days[0].hrvDeepRmssdMs'] });
  const ok = parseIngestBody(validBody(), NOW);
  assert.ok(ok.ok);
  for (const row of ok.rows.daily) for (const col of ['hrv_rmssd_ms', 'hrv_deep_rmssd_ms', 'hrv_entropy', 'nrem_hr_bpm']) assert.ok(!(col in row), col);
});

test('hatalı değerler: yanıtta yalnız alan yolu, değer yok', () => {
  const body = validBody();
  body.days[0]!.sleepHrBpm = 400;
  body.days[0]!.steps = 12.5;
  body.sleep[0]!.minutesAsleep = -1;
  body.workouts[0]!.exerciseType = 'drop table;';
  body.hourlyEnergy[0]!.localHour = 24;
  const r = parseIngestBody(body, NOW);
  assert.equal(r.ok, false);
  assert.ok(!r.ok);
  assert.deepEqual(r.issues, ['days[0].sleepHrBpm', 'days[0].steps', 'sleep[0].minutesAsleep', 'workouts[0].exerciseType', 'hourlyEnergy[0].localHour']);
  assert.ok(!JSON.stringify(r.issues).includes('400'));
});

test('tarih penceresi: en çok 90 gün geri, en çok bir gün ileri; geçersiz takvim günü reddedilir', () => {
  const at = (localDate: string) => parseIngestBody({ days: [{ localDate }] }, NOW).ok;
  assert.equal(at('2025-10-17'), true, `${MAX_DAYS_BACK} gün geri`);
  assert.equal(at('2025-10-16'), false);
  assert.equal(at('2026-01-16'), true, 'kullanıcının saat dilimi UTC\'nin önünde olabilir');
  assert.equal(at('2026-01-17'), false);
  assert.equal(at('2026-02-30'), false);
  assert.equal(at('15.01.2026'), false);
});

test('zaman damgası saat dilimi taşımalı; oturum 24 saati geçemez, bitiş başlangıçtan önce olamaz', () => {
  const body = validBody();
  body.sleep[0]!.startTime = '2026-01-14T23:10:00';
  assert.deepEqual(parseIngestBody(body, NOW), { ok: false, issues: ['sleep[0].startTime'] });
  const back = validBody();
  back.workouts[0]!.endTime = '2026-01-14T17:00:00+03:00';
  assert.deepEqual(parseIngestBody(back, NOW), { ok: false, issues: ['workouts[0].endTime'] });
  const long = validBody();
  long.sleep[0]!.endTime = '2026-01-16T07:05:00+03:00';
  assert.equal(parseIngestBody(long, NOW).ok, false);
});

test('bilinmeyen alan, yinelenen anahtar ve sınır aşımı reddedilir', () => {
  assert.deepEqual(parseIngestBody({ ...validBody(), heartRateSamples: [] }, NOW), { ok: false, issues: ['heartRateSamples'] });
  const dup = validBody();
  dup.days[1]!.localDate = '2026-01-14';
  assert.deepEqual(parseIngestBody(dup, NOW), { ok: false, issues: ['days[1].local_date'] });
  const many = { days: Array.from({ length: LIMITS.days + 1 }, () => ({ localDate: '2026-01-14' })) };
  assert.deepEqual(parseIngestBody(many, NOW), { ok: false, issues: ['days'] });
  assert.deepEqual(parseIngestBody([], NOW), { ok: false, issues: ['body'] });
  assert.deepEqual(parseIngestBody({ days: [null] }, NOW), { ok: false, issues: ['days[0]'] });
});

test('şekerleme: is_nap true, is_main false', () => {
  const body = validBody();
  (body.sleep[0] as Record<string, unknown>).isNap = true;
  const r = parseIngestBody(body, NOW);
  assert.ok(r.ok);
  assert.equal(r.rows.sleep[0]?.is_nap, true);
  assert.equal(r.rows.sleep[0]?.is_main, false);
});

test('profil kapısı: yalnız apple_health yükler; sahibinin profili ve profilsiz hesap 403, hiçbir şey yazılmaz', async () => {
  for (const source of ['google_health', null]) {
    const { store, writes } = memoryStore(source);
    const result = await runIngest({ userId: USER, body: validBody(), now: NOW }, store);
    assert.deepEqual(result, { httpStatus: 403, body: { error: 'wrong_profile' } });
    assert.equal(writes.length, 0);
  }
});

test('Apple profili: dört tabloya user_id ile, doğru çakışma anahtarıyla yazılır', async () => {
  const { store, writes } = memoryStore('apple_health');
  const result = await runIngest({ userId: USER, body: validBody(), now: NOW }, store);
  assert.deepEqual(result, { httpStatus: 200, body: { counts: { daily: 2, sleep: 1, exercise: 1, hourlyEnergy: 1 } } });
  assert.deepEqual(
    writes.map((w) => [w.table, w.onConflict]),
    [
      ['health_daily', 'user_id,local_date'],
      ['sleep_sessions', 'user_id,source_id'],
      ['exercise_sessions', 'user_id,source_id'],
      ['health_hourly_energy', 'user_id,hour_start'],
    ],
  );
  for (const w of writes) for (const row of w.rows) assert.equal(row.user_id, USER);
});

test('hatalı gövdede 400, hiçbir şey yazılmaz; boş gövde yazmadan 200', async () => {
  const bad = memoryStore('apple_health');
  const result = await runIngest({ userId: USER, body: { days: 'x' }, now: NOW }, bad.store);
  assert.deepEqual(result, { httpStatus: 400, body: { error: 'invalid_body', issues: ['days'] } });
  assert.equal(bad.writes.length, 0);
  const empty = memoryStore('apple_health');
  assert.equal((await runIngest({ userId: USER, body: {}, now: NOW }, empty.store)).httpStatus, 200);
  assert.equal(empty.writes.length, 0);
});
