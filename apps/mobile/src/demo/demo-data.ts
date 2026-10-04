// Demo sporcu: tamamen sentetik, deterministik veri (karar 0022). Gerçek bir ölçüme dayanmaz; sayılar
// yalnız ekranların üç durumu (Hazır / Kontrollü / Toparlan) inandırıcı göstermesi için seçildi.
// Saf modül: veritabanı satırlarıyla aynı biçimde üretir, motor ve ekranlar gerçek veriyle aynı yoldan okur.

import { addIsoDays, type WellnessAnswers } from '@hooplab/engine';
import type { DayState } from '@hooplab/theme';

import type { TrainingSession } from '@/data/daily-log';
import type { ExerciseSession } from '@/data/exercise-tagging';
import type { SyncStatusRow } from '@/data/google-health-status';
import type { HealthDailyRow, SleepRow } from '@/data/recovery-view';

export type DemoScenario = DayState;
export const demoScenarios = ['green', 'yellow', 'red'] as const satisfies readonly DemoScenario[];

export interface DemoPainRow {
  local_date: string;
  region: string;
  side: string;
  pain: number;
}

export interface DemoCheckin {
  local_date: string;
  answers: WellnessAnswers;
}

export interface DemoDb {
  healthDaily: HealthDailyRow[];
  sleep: SleepRow[];
  checkins: DemoCheckin[];
  pain: DemoPainRow[];
  sessions: TrainingSession[];
  exercises: ExerciseSession[];
  syncStatus: SyncStatusRow;
}

/** Üretilen geçmiş (gün). Bant penceresi (34 gün) ve grafiği kapsar. */
const historyDays = 42;
/** Demo sporcunun saat dilimi farkı (saniye); oturum saatleri buna göre yazılır. */
const demoOffsetS = 3 * 3600;

/** Tohumlu, deterministik sayı üreteci (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Yaklaşık normal dağılım (üç tekdüze toplamı), ortalama 0, SD ~1. */
function noise(r: () => number): number {
  return (r() + r() + r() - 1.5) * 2;
}

/** Son 7 günün senaryoya göre şekli: HRV çarpanı, nabız eki, uyku dakikası, iyi oluş kayması. */
const tails: Record<DemoScenario, { hrv: number; rhr: number; sleep: number; wellness: number }> = {
  green: { hrv: 1, rhr: 0, sleep: 478, wellness: 0 },
  yellow: { hrv: 0.84, rhr: 0, sleep: 392, wellness: -1 },
  red: { hrv: 0.76, rhr: 5, sleep: 376, wellness: -2 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));

function at(date: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${date}T${hh}:${mm}:00+03:00`;
}

/** Senaryo ve bugün için demo veritabanı. `now` yalnız senkron zaman damgası içindir. */
export function createDemoDb(scenario: DemoScenario, today: string, now: Date): DemoDb {
  const r = rng(20261005);
  const tail = tails[scenario];
  const healthDaily: HealthDailyRow[] = [];
  const sleep: SleepRow[] = [];
  const checkins: DemoCheckin[] = [];
  const pain: DemoPainRow[] = [];

  for (let i = historyDays - 1; i >= 0; i--) {
    const date = addIsoDays(today, -i);
    const recent = i < 7;
    // Son 7 günde gürültü azaltılır: ortalama senaryonun istediği yerde kalsın (durum testle denetlenir).
    const n = recent ? 0.35 : 1;
    const hrv = 72 * Math.exp(0.11 * noise(r) * n) * (recent ? tail.hrv : 1);
    const rhr = 46 + 1.6 * noise(r) * n + (recent ? tail.rhr : 0);
    // Saat bazı geceler takılmamış: eksik gün sıfır sayılmaz, ekran da öyle göstermeli.
    const worn = recent || r() > 0.08;
    if (worn) {
      healthDaily.push({
        local_date: date,
        hrv_deep_rmssd_ms: Math.round(hrv),
        resting_hr_bpm: clamp(rhr, 38, 70),
        respiratory_rate_bpm: Math.round((14.4 + 0.4 * noise(r) + (recent && scenario === 'red' ? 1.2 : 0)) * 10) / 10,
      });
      const minutes = recent ? tail.sleep + 10 * noise(r) : 465 + 28 * noise(r);
      sleep.push({ local_date: date, minutes_asleep: Math.round(minutes), is_nap: false });
    }
    // Ara sıra şekerleme: uyku ortalamasına girmez.
    if (r() > 0.85) sleep.push({ local_date: date, minutes_asleep: 25 + Math.round(15 * r()), is_nap: true });

    // Check-in: son 14 gün, bugün hariç (Bugün'de check-in çağrısı görünsün).
    if (i >= 1 && i <= 14) {
      const shift = recent ? tail.wellness : 0;
      const item = () => clamp(4 + shift + noise(r) * 0.5, 1, 5);
      checkins.push({
        local_date: date,
        answers: { sleep_quality: item(), fatigue: item(), soreness: item(), stress: clamp(4 + noise(r) * 0.5, 1, 5), mood: item() },
      });
      if (i <= 6 && scenario !== 'green') {
        pain.push({ local_date: date, region: 'patellar_tendon', side: 'right', pain: scenario === 'red' ? 4 : 2 });
      }
      if (i <= 3 && scenario === 'red') pain.push({ local_date: date, region: 'achilles', side: 'left', pain: 3 });
      if (i === 9) pain.push({ local_date: date, region: 'hamstring', side: 'left', pain: 2 });
    }
  }

  const yesterday = addIsoDays(today, -1);
  const exercises: ExerciseSession[] = [
    {
      id: 'demo-ex-yesterday-practice',
      localDate: yesterday,
      startTime: at(yesterday, 10, 0),
      endTime: at(yesterday, 11, 50),
      startUtcOffsetS: demoOffsetS,
      exerciseType: 'BASKETBALL',
      displayName: null,
      avgHrBpm: 138,
      dismissed: false,
    },
    {
      id: 'demo-ex-yesterday-strength',
      localDate: yesterday,
      startTime: at(yesterday, 17, 30),
      endTime: at(yesterday, 18, 25),
      startUtcOffsetS: demoOffsetS,
      exerciseType: 'STRENGTH_TRAINING',
      displayName: null,
      avgHrBpm: 112,
      dismissed: false,
    },
    {
      id: 'demo-ex-today-walk',
      localDate: today,
      startTime: at(today, 8, 10),
      endTime: at(today, 8, 45),
      startUtcOffsetS: demoOffsetS,
      exerciseType: 'WALKING',
      displayName: null,
      avgHrBpm: 92,
      dismissed: false,
    },
  ];

  // Dünkü takım antrenmanı elle girilmiş ve saatle eşleşmiş; kuvvet ve bugünkü yürüyüş etiket bekliyor.
  const sessions: TrainingSession[] = [
    {
      id: 'demo-session-yesterday-practice',
      localDate: yesterday,
      kind: 'team_practice',
      durationMin: 110,
      rpe: scenario === 'green' ? 6 : 7,
      minutesPlayed: null,
      exerciseSessionId: 'demo-ex-yesterday-practice',
    },
  ];

  const connectedAt = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  return {
    healthDaily,
    sleep,
    checkins,
    pain,
    sessions,
    exercises,
    syncStatus: {
      state: 'connected',
      connected_at: connectedAt,
      synced_from: addIsoDays(today, -(historyDays - 1)),
      synced_through: today,
      last_success_at: new Date(now.getTime() - 40 * 60_000).toISOString(),
      last_error: null,
    },
  };
}
