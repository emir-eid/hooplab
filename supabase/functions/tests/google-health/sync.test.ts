import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  GoogleApiError,
  GoogleHealthClient,
  refreshAccessToken,
  WEARABLES_FAMILY,
} from '../../_shared/google-health/client.ts';
import { parseDailyRollupPoint, parseExercise, parseSleep, type DailyRow, type ExerciseRow, type SleepRow } from '../../_shared/google-health/parse.ts';
import { BACKFILL_DAYS, planWindow, statusAfterSync, SYNCED_TYPES, type SyncStore, syncWindow } from '../../_shared/google-health/sync.ts';
import { createFakeGoogle, EXPIRED_REFRESH_TOKEN, FAKE_ACCESS_TOKEN } from './fake-google.ts';

const API = 'https://saglik.test/v4';
const noSleep = async () => {};

function memoryStore() {
  const daily = new Map<string, DailyRow>();
  const sleep: SleepRow[] = [];
  const exercise: ExerciseRow[] = [];
  const store: SyncStore = {
    async upsertDaily(rows) {
      const keys = JSON.stringify(Object.keys(rows[0] ?? {}).sort());
      // Tek upsert'teki satırlar aynı sütunları taşımalı (yoksa eksik sütun null'a yazılır).
      for (const r of rows) assert.equal(JSON.stringify(Object.keys(r).sort()), keys);
      for (const r of rows) daily.set(r.local_date, { ...daily.get(r.local_date), ...r });
    },
    async upsertSleep(rows) {
      sleep.push(...rows);
    },
    async upsertExercise(rows) {
      exercise.push(...rows);
    },
  };
  return { store, daily, sleep, exercise };
}

test('pencere: ilk senkron 90 gün geriye, sonrakiler son 7 günü yeniden çeker', () => {
  assert.deepEqual(planWindow(null, '2026-10-04'), { from: '2026-07-07', to: '2026-10-05' });
  assert.equal(BACKFILL_DAYS, 90);
  assert.deepEqual(planWindow('2026-10-04', '2026-10-04'), { from: '2026-09-27', to: '2026-10-05' });
  // Uzun kopukluk: yine en fazla 90 gün.
  assert.deepEqual(planWindow('2025-01-01', '2026-10-04'), { from: '2026-07-07', to: '2026-10-05' });
});

test('ilk senkron: tüm tipler yazılır, nabız ham çekilmez, sınırlar ve kaynak ailesi doğru', async () => {
  const google = createFakeGoogle();
  const client = new GoogleHealthClient(google.fetch, FAKE_ACCESS_TOKEN, API, noSleep);
  const { store, daily, sleep, exercise } = memoryStore();
  const window = planWindow(null, '2026-10-04');

  const result = await syncWindow(client, store, window);

  assert.deepEqual(result.errors, []);
  assert.equal(daily.size, 90);
  assert.equal(result.counts.sleep, 90);
  assert.equal(sleep.length, 90);
  assert.equal(exercise.length, result.counts.exercise);
  assert.ok(exercise.length > 0);

  const day = daily.get('2026-10-04');
  assert.ok(day);
  // Her tipin sütunu aynı güne birleşti.
  for (const col of ['hrv_rmssd_ms', 'resting_hr_bpm', 'spo2_avg_pct', 'respiratory_rate_bpm', 'skin_temp_nightly_c',
    'hr_avg_bpm', 'steps', 'distance_m', 'calories_kcal', 'azm_cardio']) {
    assert.notEqual(day[col], undefined, `${col} yazılmadı`);
  }
  assert.equal(day.resting_hr_bpm, 49); // "49" dizesi sayıya çevrildi

  // Gün içi nabız ham listesi hiç istenmedi; swim-lengths-data hiç istenmedi.
  assert.ok(!google.calls.some((c) => c.dataType === 'heart-rate' && c.method === 'GET'));
  assert.ok(!google.calls.some((c) => c.dataType === 'swim-lengths-data'));
  assert.ok(!(SYNCED_TYPES as readonly string[]).includes('swim-lengths-data'));

  // Özetler bileklik ailesinden; 14 günlük sınır parçalanarak aşılmadı.
  const rollups = google.calls.filter((c) => c.path.endsWith(':dailyRollUp'));
  assert.ok(rollups.every((c) => c.family === WEARABLES_FAMILY));
  assert.equal(rollups.filter((c) => c.dataType === 'heart-rate').length, 7);
  assert.equal(rollups.filter((c) => c.dataType === 'steps').length, 1);

  // Uyku 25'lik sayfalarla geldi.
  assert.equal(google.calls.filter((c) => c.dataType === 'sleep').length, 4);
});

test('bir tip başarısız olursa diğerleri yazılır ve hata kodu kaydedilir', async () => {
  const google = createFakeGoogle({ failTypes: ['daily-oxygen-saturation', 'exercise'] });
  const client = new GoogleHealthClient(google.fetch, FAKE_ACCESS_TOKEN, API, noSleep);
  const { store, daily } = memoryStore();

  const result = await syncWindow(client, store, { from: '2026-10-01', to: '2026-10-05' });

  assert.deepEqual(result.errors, [
    { type: 'daily-oxygen-saturation', code: 'PERMISSION_DENIED' },
    { type: 'exercise', code: 'PERMISSION_DENIED' },
  ]);
  assert.equal(daily.size, 4);
  assert.equal(daily.get('2026-10-02')?.spo2_avg_pct, undefined);
  assert.notEqual(daily.get('2026-10-02')?.hrv_rmssd_ms, undefined);
});

test('erişim token geçersizse senkron durur (401 yukarı iletilir)', async () => {
  const google = createFakeGoogle();
  const client = new GoogleHealthClient(google.fetch, 'yanlis-token', API, noSleep);
  await assert.rejects(syncWindow(client, memoryStore().store, { from: '2026-10-01', to: '2026-10-02' }), (err) => {
    assert.ok(err instanceof GoogleApiError);
    assert.equal(err.status, 401);
    return true;
  });
});

test('düşmüş yenileme token’ı invalid_grant koduyla ayırt edilir', async () => {
  const google = createFakeGoogle();
  const config = { clientId: 'istemci', clientSecret: 'sir', tokenUrl: 'https://saglik.test/token' };
  await assert.rejects(refreshAccessToken(google.fetch, config, EXPIRED_REFRESH_TOKEN), (err) => {
    assert.ok(err instanceof GoogleApiError);
    assert.equal(err.code, 'invalid_grant');
    return true;
  });
  const ok = await refreshAccessToken(google.fetch, config, 'gecerli');
  assert.equal(ok.access_token, FAKE_ACCESS_TOKEN);
});

test('429 ve 5xx yeniden denenir, kalıcı hata vazgeçirilir', async () => {
  let n = 0;
  const flaky = async () => {
    n++;
    return n < 3 ? new Response('{}', { status: 503 }) : new Response('{"timeZone":"UTC"}', { status: 200 });
  };
  const client = new GoogleHealthClient(flaky, 't', API, noSleep);
  assert.equal((await client.getSettings()).timeZone, 'UTC');
  assert.equal(n, 3);

  let m = 0;
  const down = async () => {
    m++;
    return new Response('{"error":{"status":"UNAVAILABLE"}}', { status: 503 });
  };
  await assert.rejects(new GoogleHealthClient(down, 't', API, noSleep).getSettings(), /UNAVAILABLE/);
  assert.equal(m, 3);
});

test('uyku uyanılan güne yazılır; sivil tarih yoksa yerel saatten bulunur', () => {
  const row = parseSleep({
    name: 'users/me/dataTypes/sleep/dataPoints/abc',
    sleep: {
      interval: { startTime: '2026-10-03T20:30:00Z', endTime: '2026-10-03T22:30:00Z', endUtcOffset: '10800s' },
      summary: { minutesAsleep: '110', stagesSummary: [{ type: 'DEEP', minutes: '20' }] },
    },
  });
  assert.ok(row);
  assert.equal(row.source_id, 'abc');
  // 22:30 UTC + 3 saat = 4 Ekim 01:30 yerel.
  assert.equal(row.local_date, '2026-10-04');
  assert.equal(row.minutes_deep, 20);
  assert.equal(row.minutes_rem, null);
  assert.equal(row.minutes_asleep, 110);
});

test('egzersiz: nabız bölgeleri saniyeye, mesafe metreye; notlar alınmaz', () => {
  const row = parseExercise({
    exercise: {
      interval: { startTime: '2026-10-04T15:00:00Z', endTime: '2026-10-04T16:00:00Z', civilStartTime: { date: { year: 2026, month: 10, day: 4 } } },
      exerciseType: 'SPORT',
      activeDuration: '3300.4s',
      metricsSummary: { distanceMillimeters: 1234567, heartRateZoneDurations: { peakTime: '90s' } },
    },
  });
  assert.ok(row);
  assert.equal(row.source_id, 'start:2026-10-04T15:00:00Z');
  assert.equal(row.distance_m, 1234.6);
  assert.equal(row.active_duration_s, 3300);
  assert.equal(row.hr_zone_peak_s, 90);
  assert.equal(row.hr_zone_light_s, null);
  assert.ok(!('notes' in row));
});

test('değer alanı olmayan gün atlanır: veri yok sıfır değildir', () => {
  const civilStartTime = { date: { year: 2026, month: 10, day: 4 } };
  assert.equal(parseDailyRollupPoint('steps', { civilStartTime }), null);
  assert.equal(parseDailyRollupPoint('heart-rate', { civilStartTime, heartRate: {} }), null);
  assert.deepEqual(parseDailyRollupPoint('steps', { civilStartTime, steps: { countSum: '0' } }), { local_date: '2026-10-04', steps: 0 });
});

test('kısmi hatada senkron tarihi ilerlemez; sonraki senkron aynı pencereyi yeniden dener', () => {
  const window = planWindow(null, '2026-10-04');
  const partial = statusAfterSync(
    { window, counts: { daily: 17, sleep: 15, exercise: 3 }, errors: [{ type: 'steps', code: 'INVALID_ARGUMENT' }] },
    '2026-10-04',
    null,
  );
  assert.equal(partial.outcome, 'partial');
  assert.equal(partial.advance, null);
  assert.equal(partial.lastError, 'steps:INVALID_ARGUMENT');
  // İlerlemediği için sonraki pencere yine 90 gün.
  assert.deepEqual(planWindow(null, '2026-10-04'), window);

  const ok = statusAfterSync({ window, counts: { daily: 90, sleep: 90, exercise: 40 }, errors: [] }, '2026-10-04', null);
  assert.deepEqual(ok.advance, { synced_through: '2026-10-04', synced_from: '2026-07-07' });
  assert.equal(ok.lastError, null);

  const allFailed = statusAfterSync(
    { window, counts: { daily: 0, sleep: 0, exercise: 0 }, errors: SYNCED_TYPES.map((type) => ({ type, code: 'UNAVAILABLE' })) },
    '2026-10-04',
    null,
  );
  assert.equal(allFailed.outcome, 'error');
  assert.ok((allFailed.lastError ?? '').length <= 200);
});
