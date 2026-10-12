// Koçun anlık değerleri (karar 0033, 0037): Bugün ekranının kurduğu son değerler bellekte tutulur; Koç sekmesi
// soruyla birlikte bunları gönderir. Bugün henüz yüklenmediyse (ör. uygulama Koç'ta açıldı) Koç aynı veriyi
// kendisi çeker. Değerler yazılmaz; başka bir günün değeri gönderilmez.

import { sweatTest } from '@hooplab/engine';

import { buildCoachSnapshot, type CoachSnapshot } from '@/data/coach-snapshot';
import { fetchCheckin, fetchCheckinReading, fetchSessions, type TrainingSession } from '@/data/daily-log';
import { fetchNutrition } from '@/data/nutrition';
import { fetchRecovery } from '@/data/recovery';
import { fetchRegionLoad } from '@/data/region-load';
import { fetchTrainingLoad } from '@/data/training-load';
import { demoStore } from '@/demo/demo-mode';

// Demo ve gerçek hesap ayrı: demodan çıkınca sentetik değerler gerçek soruya gitmesin.
let latest: { snapshot: CoachSnapshot; demo: boolean } | null = null;

export function rememberCoachSnapshot(snapshot: CoachSnapshot) {
  latest = { snapshot, demo: demoStore() !== null };
}

/** Bugünkü ter testlerinden en yenisi. */
export function todaySweat(sessions: readonly TrainingSession[]) {
  return (
    sessions
      .map((s) => (s.sweat ? sweatTest({ ...s.sweat, urineL: s.sweat.urineL ?? 0, durationMin: s.durationMin }) : null))
      .filter((r) => r !== null)
      .at(-1) ?? null
  );
}

/**
 * Günün anlık değerleri: Bugün'ün bıraktığı varsa o, yoksa veriler çekilip kurulur (Bugün'deki birleşimle aynı).
 * Check-in okunamazsa (çevrimdışı) null: soru genel gider.
 */
export async function coachSnapshotFor(localDate: string): Promise<CoachSnapshot | null> {
  if (latest && latest.snapshot.date === localDate && latest.demo === (demoStore() !== null)) return latest.snapshot;
  const [checkin, sessions, recovery, nutrition, reading, load, regions] = await Promise.all([
    fetchCheckin(localDate),
    fetchSessions(localDate),
    fetchRecovery(localDate),
    fetchNutrition(localDate),
    fetchCheckinReading(localDate),
    fetchTrainingLoad(localDate),
    fetchRegionLoad(localDate, new Date()),
  ]);
  if (!checkin.ok) return null;
  const snapshot = buildCoachSnapshot({
    today: localDate,
    matchDay: nutrition.ok ? nutrition.value.matchDay : false,
    recovery: recovery.ok ? recovery.value : null,
    checkin: reading.ok ? reading.value : null,
    load: load.ok ? load.value : null,
    regions: regions.ok ? regions.value : null,
    nutrition: nutrition.ok ? nutrition.value : null,
    sweat: sessions.ok ? todaySweat(sessions.value) : null,
  });
  rememberCoachSnapshot(snapshot);
  return snapshot;
}
