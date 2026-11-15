// Altın test (karar 0061, bekçi 1): sahibinin profili (Fitbit · basketbol) için motorun ve görünüm katmanının
// çıktısı sentetik demo verisiyle kilitlidir. Profil, Apple Watch ve fitness işleri boyunca bu dosyanın
// anlık görüntüsü (__fixtures__/altin-sahip-profili.json) hiç değişmemelidir. Değişirse sahibinin ekranı değişmiştir:
// önce sebep bulunur. Bilinçli bir değişiklikte (yeni kural, kullanıcı onayıyla) yeniden üretilir:
//   GOLDEN_UPDATE=1 node --test apps/mobile/src/data/golden.test.ts
// ve fark commit'te gerekçesiyle yazılır.

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';

import { addIsoDays } from '@hooplab/engine';

import { createDemoDb, demoScenarios } from '../demo/demo-data.ts';
import { demoInputs } from '../demo/demo-inputs.ts';
import { buildCoachSnapshot } from './coach-snapshot.ts';
import { buildWeeklyCoachSnapshot } from './coach-weekly-snapshot.ts';
import { buildEnergyView, energyFrom, energyHoursFrom } from './energy-view.ts';
import { buildWeeklyReportView } from './weekly-report-view.ts';

// Demo verisi saatlik enerjiyi cihazın yerel saatiyle (getHours) kurar; anlık görüntü UTC+3'te
// yazıldı. Saat dilimi sabitlenmezse CI'da (UTC) sonuç 3 saat kayar. Etc/GMT-3 = UTC+3, yaz saati yok.
process.env.TZ = 'Etc/GMT-3';

const goldenUrl = new URL('./__fixtures__/altin-sahip-profili.json', import.meta.url);

/** Pazartesi, perşembe, pazar: hafta içi ve hafta sonu, haftalık raporun farklı noktaları. */
const days = ['2026-10-05', '2026-10-08', '2026-10-11'] as const;

function snapshotFor(scenario: (typeof demoScenarios)[number], today: string) {
  const now = new Date(`${today}T09:00:00+03:00`);
  const db = createDemoDb(scenario, today, now);
  const inputs = demoInputs(db, today, now);
  const ef = energyFrom(today);
  const hf = energyHoursFrom(today);
  const energy = buildEnergyView(
    db.energy.filter((r) => r.local_date >= ef && r.local_date <= today),
    today,
    db.energyHours.filter((r) => r.local_date >= hf && r.local_date <= today),
  );
  // Haftalık rapor: bugünün içinde bulunduğu haftadan önceki tam hafta (pazartesi başlangıçlı).
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const weekStart = addIsoDays(today, -weekday - 7);
  const weekly = buildWeeklyReportView(
    {
      sessions: db.sessions.map((s) => ({
        local_date: s.localDate,
        rpe: s.rpe,
        duration_min: s.durationMin,
        kind: s.kind,
        minutes_played: s.minutesPlayed,
        sweat: s.sweat !== null,
      })),
      earliestSession: db.sessions.map((s) => s.localDate).sort()[0] ?? null,
      healthDaily: db.healthDaily,
      energy: db.energy,
      sleep: db.sleep,
      checkins: db.checkins.map((c) => ({ local_date: c.local_date, ...c.answers })),
      pain: db.pain,
      weights: db.weights,
      dayTypes: Object.entries(db.dayTypes).map(([local_date, day_type]) => ({ local_date, day_type })),
      matches: db.matches,
      meals: db.meals,
      fluids: db.fluids,
    },
    weekStart,
    today,
  );
  return {
    inputs,
    coach: buildCoachSnapshot(inputs),
    energy,
    weekly,
    weeklyCoach: buildWeeklyCoachSnapshot(weekly),
  };
}

function current(): unknown {
  const out: Record<string, unknown> = {};
  for (const scenario of demoScenarios) {
    for (const today of days) out[`${scenario}@${today}`] = snapshotFor(scenario, today);
  }
  // JSON'a çevrilip geri okunur: undefined alanlar ve Date nesneleri dosyadaki biçimle aynı olur.
  return JSON.parse(JSON.stringify(out));
}

test('altın test: Fitbit · basketbol çıktısı kilitli anlık görüntüyle birebir aynı (karar 0061)', () => {
  const now = current();
  if (process.env.GOLDEN_UPDATE === '1') {
    writeFileSync(goldenUrl, `${JSON.stringify(now, null, 1)}\n`, 'utf8');
  }
  const golden: unknown = JSON.parse(readFileSync(goldenUrl, 'utf8'));
  assert.deepEqual(now, golden);
});

test('altın test kararlı: aynı girdi iki kez aynı çıktıyı verir (saat veya rastgelelik sızmıyor)', () => {
  assert.deepEqual(current(), current());
});
