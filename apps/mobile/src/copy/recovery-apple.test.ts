// Apple Health profilinin günün durumu metinleri (karar 0061, rules/toparlanma.json → gunun-durumu-apple).
// Sentetik geceler; sahibinin (Google Health) metinleri varsayılanla aynı kalır.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addIsoDays } from '@hooplab/engine';

import { buildRecoveryView, type HealthDailyRow, type SleepRow } from '../data/recovery-view.ts';
import { hrvAloneNoteApple, hrvTitleFor, statusChips, statusReason } from './recovery.ts';

const today = '2026-11-16';

/** 35 gece: ilk 28 gece sabit çevresinde oynar, son 7 gece verilen değerde. */
function nights(base: { hrv: number; hr: number }, recent: { hrv: number; hr: number }): { daily: HealthDailyRow[]; sleep: SleepRow[] } {
  const daily: HealthDailyRow[] = [];
  const sleep: SleepRow[] = [];
  for (let i = 34; i >= 0; i--) {
    const date = addIsoDays(today, -i);
    const wobble = i % 2 === 0 ? 1 : -1;
    const v = i < 7 ? recent : { hrv: base.hrv + wobble * 3, hr: base.hr + wobble };
    daily.push({
      local_date: date,
      // Apple satırında Fitbit sütunları boş (veritabanında kaynağa göre kısıt).
      hrv_deep_rmssd_ms: null,
      nrem_hr_bpm: null,
      hrv_sleep_sdnn_ms: v.hrv,
      sleep_hr_bpm: v.hr,
      respiratory_rate_bpm: null,
      spo2_avg_pct: null,
      skin_temp_nightly_c: null,
      skin_temp_baseline_c: null,
    });
    sleep.push({ local_date: date, minutes_asleep: 480, is_nap: false });
  }
  return { daily, sleep };
}

const view = (recent: { hrv: number; hr: number }) => {
  const { daily, sleep } = nights({ hrv: 60, hr: 55 }, recent);
  return buildRecoveryView(daily, sleep, today, 'apple_health');
};

test('Apple: HRV tek başına düşükken durum Hazır, HRV notu düşer', () => {
  const v = view({ hrv: 40, hr: 55 });
  assert.equal(v.status.level, 'ready');
  const text = statusReason(v, 'apple_health');
  assert.match(text, /^Uyku nabzı kendi aralığında, uyku yeterli\./);
  assert.ok(text.includes(hrvAloneNoteApple));
  assert.deepEqual(statusChips(v, 'apple_health'), ['Uyku nabzı aralığında', 'Uyku yeterli', 'HRV düşük']);
});

test('Apple: uyku nabzı tek başına yüksekken Kontrollü', () => {
  const v = view({ hrv: 60, hr: 62 });
  assert.equal(v.status.level, 'caution');
  assert.equal(statusReason(v, 'apple_health'), 'Uyku nabzı aralığının üstünde.');
});

test('Apple: iki işaret birlikte Toparlan, HRV not değil neden', () => {
  const v = view({ hrv: 40, hr: 62 });
  assert.equal(v.status.level, 'recover');
  const text = statusReason(v, 'apple_health');
  assert.ok(!text.includes(hrvAloneNoteApple));
  assert.match(text, /HRV'nin .* altında ve uyku nabzı aralığının üstünde\./);
});

test('Apple: veri yoksa Google Health yerine Apple Sağlık denir', () => {
  const v = buildRecoveryView([], [], today, 'apple_health');
  assert.ok(!statusReason(v, 'apple_health').includes('Google'));
  assert.ok(statusReason(v).includes('Google Health'));
});

test('başlık: sahibinde derin uyku, Apple’da uyku', () => {
  assert.equal(hrvTitleFor(), 'HRV · derin uyku');
  assert.equal(hrvTitleFor('google_health'), 'HRV · derin uyku');
  assert.equal(hrvTitleFor('apple_health'), 'HRV · uyku');
});
