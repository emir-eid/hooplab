// Demo sporcu: tamamen sentetik, deterministik veri (karar 0022). Gerçek bir ölçüme dayanmaz; sayılar
// yalnız ekranların üç durumu (Hazır / Kontrollü / Toparlan) inandırıcı göstermesi için seçildi.
// Saf modül: veritabanı satırlarıyla aynı biçimde üretir, motor ve ekranlar gerçek veriyle aynı yoldan okur.

import { addIsoDays, defaultContentTags, type ContentTag, type DayType, type Match, type Trip, type WellnessAnswers } from '@hooplab/engine';
import type { DayState } from '@hooplab/theme';

import type { TrainingSession } from '@/data/daily-log';
import { hoursPerDay, type EnergyDayRow, type EnergyHourRow } from '../data/energy-view.ts';
import type { ExerciseSession } from '@/data/exercise-tagging';
import type { SyncStatusRow } from '@/data/google-health-status';
import type { FluidRow, MealRow } from '@/data/nutrition-view';
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
  /** Sentetik günlük toplam kalori (karar 0043); bugünkü, `now`a kadar geçen kısım. */
  energy: EnergyDayRow[];
  /** Saatlik yakılan enerji (karar 0044): günlük toplamın sentetik bir gün profiline dağıtılmışı. */
  energyHours: EnergyHourRow[];
  /** Sentetik sabah kiloları (kg). */
  weights: { local_date: string; weight_kg: number }[];
  /** Gün tipi düzeltmeleri; başta boş. */
  dayTypes: Record<string, DayType>;
  /** Maç takvimi (karar 0036, 0046): bugünden 3 ve 6 gün sonra iki sentetik maç; bugün ve dünü / yarını boş. */
  matches: Match[];
  /** Seyahatler (karar 0047); başta boş. */
  trips: Trip[];
  /** Sentetik öğünler (karar 0030): bugün kahvaltı, dün üç öğün; satır biçiminde. */
  meals: MealRow[];
  /** Sentetik içişler (karar 0031): bugün sabah üç içiş. */
  fluids: FluidRow[];
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

/**
 * Elle girilmiş geçmiş seanslar (2-41 gün önce; dünkü antrenman ayrıca saatle eşleşmiş olarak eklenir).
 * Haftalık düzen: 4 takım antrenmanı, 2 kuvvet, 1 maç, 1 dinlenme günü. Son hafta (1-6 gün önce) senaryoya göre:
 * yeşil aynı düzen (oran yaklaşık 1), sarı orta artış (bağlam, not yok), kırmızı hafif bir dönemden sonra
 * çift seanslı kamp haftası (oran 1,5 üstü, bilgi notu). Toparlanmanın rastgele dizisinden ayrı tohum.
 */
function historySessions(scenario: DemoScenario, today: string): TrainingSession[] {
  const r = rng(20261006);
  const out: TrainingSession[] = [];
  const add = (daysAgo: number, kind: TrainingSession['kind'], durationMin: number, rpe: number, minutesPlayed: number | null = null) =>
    out.push({
      // İçerik etiketleri (karar 0027): son iki haftada girilmiş; daha eskisi ve iki gün öncesi etiketsiz
      // (sütundan önceki kayıtlar gibi), türün hazır etiketleriyle sayılır ve ekran bunu söyler.
      contentTags: daysAgo >= 14 || daysAgo === 2 ? null : demoTags(kind, daysAgo),
      startedAt: null,
      sweat: null,
      kcal: null,
      id: `demo-session-${daysAgo}-${kind}`,
      localDate: addIsoDays(today, -daysAgo),
      kind,
      durationMin: Math.round(durationMin + 10 * noise(r)),
      rpe: clamp(rpe + noise(r) * 0.4, 0, 10),
      minutesPlayed,
      exerciseSessionId: null,
    });

  for (let i = 2; i < historyDays; i++) {
    const recent = i < 7;
    const day = i % 7;
    if (scenario === 'red' && recent) {
      // Kamp: her gün iki seans.
      add(i, 'team_practice', 120, 8);
      add(i, 'strength', 70, 7);
      continue;
    }
    const light = scenario === 'red'; // kırmızının öncesi: sezon arası, hafif
    const boost = scenario === 'yellow' && recent ? 1.7 : 1;
    if (day === 3) continue; // dinlenme
    if (day === 6 && !light) {
      add(i, 'game', 105 * boost, 8, 24);
      continue;
    }
    add(i, 'team_practice', (light ? 60 : 95) * boost, light ? 4 : 6);
    if ((day === 1 || day === 4) && !light) add(i, 'strength', 55, 6);
    if (day === 2 && !light) add(i, 'shooting', 35, 4);
    if (day === 5) add(i, 'mobility', 30, 2); // maç ertesi
  }
  return out;
}

/** Girilmiş etiketler: türün hazır seçimi; haftada iki kuvvetten biri üst vücut da içerir. */
function demoTags(kind: TrainingSession['kind'], daysAgo: number): ContentTag[] {
  if (kind === 'strength' && daysAgo % 7 === 4) return ['lower_strength', 'upper_strength'];
  return [...defaultContentTags[kind]];
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
        nrem_hr_bpm: clamp(rhr, 38, 70),
        // Kırmızıda son hafta bandın üstünde ve son gece belirgin yüksek (tek gece notu, karar 0028).
        respiratory_rate_bpm:
          Math.round((14.4 + 0.4 * noise(r) + (recent && scenario === 'red' ? (i === 0 ? 3.6 : 1.2) : 0)) * 10) / 10,
        // SpO2 ve cilt sıcaklığı günün sırasından türetilir: rastgele üreteç ilerlemesin, diğer demo değerleri kaymasın.
        // Kırmızıda son iki gece cilt sıcaklığı tabanın belirgin üstünde (gece işareti, karar 0039); SpO2 hep olağan.
        spo2_avg_pct: Math.round((95.8 + 0.1 * ((i * 7) % 5)) * 10) / 10,
        skin_temp_nightly_c: Math.round((33.4 + 0.05 * (((i * 3) % 5) - 2) + (scenario === 'red' && i <= 1 ? 0.45 : 0)) * 1000) / 1000,
        skin_temp_baseline_c: 33.4,
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
      kcal: 984,
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
      kcal: 357,
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
      kcal: 143,
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
      contentTags: ['jump', 'cod', 'sprint'],
      exerciseSessionId: 'demo-ex-yesterday-practice',
      startedAt: at(yesterday, 10, 0),
      // Ter testi (karar 0029): kırmızıda kayıp %2'nin üstünde, diğerlerinde altında.
      sweat: { preKg: 78.6, postKg: scenario === 'red' ? 76.4 : 77.3, fluidL: scenario === 'red' ? 0.6 : 1.2, urineL: null },
      // Kalori bağlı saat oturumundan okunur (demo deposu doldurur).
      kcal: null,
    },
  ];

  sessions.push(...historySessions(scenario, today));

  // Sabah kiloları: son 4 hafta, bazı sabahlar boş; bugün girilmemiş (Bugün'de giriş çağrısı görünsün).
  const wr = rng(20261007);
  const weights: DemoDb['weights'] = [];
  for (let i = 27; i >= 1; i--) {
    if (wr() < 0.25) continue;
    weights.push({ local_date: addIsoDays(today, -i), weight_kg: Math.round((78.4 + 0.4 * noise(wr)) * 10) / 10 });
  }

  // Öğünler: bugün kahvaltı ve ara öğün (alım hedefin altında görünsün), dün üç öğün (tekrar listesi dolsun).
  const meals: MealRow[] = [
    {
      id: 'demo-meal-1',
      local_date: yesterday,
      slot: 'breakfast',
      created_at: at(yesterday, 6, 0),
      items: [{ food: 'yulaf', portions: 2 }, { food: 'sut', portions: 1 }, { food: 'muz', portions: 1 }, { food: 'yumurta', portions: 2 }],
    },
    {
      id: 'demo-meal-2',
      local_date: yesterday,
      slot: 'lunch',
      created_at: at(yesterday, 10, 0),
      items: [{ food: 'pilav-pirinc', portions: 2 }, { food: 'tavuk-gogsu', portions: 2 }, { food: 'yogurt', portions: 1 }],
    },
    {
      id: 'demo-meal-3',
      local_date: yesterday,
      slot: 'dinner',
      created_at: at(yesterday, 16, 0),
      items: [{ food: 'makarna', portions: 2 }, { food: 'kofte', portions: 1.5 }, { food: 'ekmek-tam', portions: 1 }],
    },
    {
      id: 'demo-meal-4',
      local_date: today,
      slot: 'breakfast',
      created_at: at(today, 5, 0),
      items: [{ food: 'yulaf', portions: 2 }, { food: 'sut', portions: 1 }, { food: 'muz', portions: 1 }, { food: 'yumurta', portions: 2 }],
    },
    {
      id: 'demo-meal-5',
      local_date: today,
      slot: 'snack',
      created_at: at(today, 7, 0),
      items: [{ label: 'Protein bar', carbs_g: 24, protein_g: 20 }],
    },
  ];

  const fluids: FluidRow[] = [
    { id: 'demo-fluid-1', local_date: today, volume_ml: 500, created_at: at(today, 5, 0) },
    { id: 'demo-fluid-2', local_date: today, volume_ml: 250, created_at: at(today, 6, 30) },
    { id: 'demo-fluid-3', local_date: today, volume_ml: 750, created_at: at(today, 8, 0) },
  ];

  // Haftalık rapor (karar 0040) için geçmiş öğün ve içişler: 2-13 gün önce, bazı günler kayıtsız. Bugün ve dün
  // yukarıdaki gibi kalır (tekrar listesi yalnız en yeni üç öğünü gösterir). Ayrı tohum: diğer değerler kaymaz.
  const mr = rng(20261014);
  const templates: MealRow['items'][][] = [
    [
      [{ food: 'yulaf', portions: 2 }, { food: 'sut', portions: 1 }, { food: 'muz', portions: 1 }],
      [{ food: 'pilav-pirinc', portions: 2 }, { food: 'tavuk-gogsu', portions: 2 }],
      [{ food: 'makarna', portions: 2 }, { food: 'kofte', portions: 1.5 }],
    ],
    [
      [{ food: 'yumurta', portions: 3 }, { food: 'ekmek-tam', portions: 2 }],
      [{ food: 'makarna', portions: 3 }, { food: 'tavuk-gogsu', portions: 2 }, { food: 'yogurt', portions: 1 }],
      [{ food: 'pilav-pirinc', portions: 3 }, { food: 'kofte', portions: 2 }],
    ],
  ];
  const slots = ['breakfast', 'lunch', 'dinner'] as const;
  for (let i = 13; i >= 2; i--) {
    const date = addIsoDays(today, -i);
    if (mr() < 0.2) continue;
    const day = templates[i % templates.length]!;
    day.forEach((items, k) =>
      meals.push({ id: `demo-meal-${i}-${k}`, local_date: date, slot: slots[k]!, created_at: at(date, 6 + 5 * k, 0), items }),
    );
    if (mr() < 0.3) continue;
    fluids.push(
      { id: `demo-fluid-${i}-1`, local_date: date, volume_ml: 750, created_at: at(date, 7, 0) },
      { id: `demo-fluid-${i}-2`, local_date: date, volume_ml: 500 + 250 * Math.floor(mr() * 3), created_at: at(date, 12, 0) },
      { id: `demo-fluid-${i}-3`, local_date: date, volume_ml: 750, created_at: at(date, 18, 0) },
    );
  }

  // Günlük toplam kalori: günün sırasından türetilir (rastgele üreteç ilerlemesin). Saatlik değerler günün toplamını
  // sentetik bir profile dağıtır (gece düşük, gündüz yüksek, seans günü akşam tepe). Bugün yalnız son senkrona kadarki
  // saatler var ve günün değeri onların toplamı: gerçek senkronda da bugün şu ana kadardır. Son senkron 40 dakika önce.
  const syncedAt = new Date(now.getTime() - 40 * 60_000);
  const lastHour = syncedAt.getHours();
  const energy: EnergyDayRow[] = [];
  const energyHours: EnergyHourRow[] = [];
  for (let i = historyDays - 1; i >= 0; i--) {
    const date = addIsoDays(today, -i);
    const trained = sessions.some((x) => x.localDate === date);
    const full = 3150 + 45 * (((i * 5) % 7) - 3) + 12 * ((i * 3) % 11) + (trained ? 420 : 0);
    const weights = Array.from({ length: hoursPerDay }, (_, h) => demoHourWeight(h, trained, i));
    const sum = weights.reduce((a, b) => a + b, 0);
    let dayTotal = 0;
    weights.forEach((w, h) => {
      if (i === 0 && h > lastHour) return;
      // Süren saat yarım: senkron saatin ortasında.
      const kcal = Math.round(((full * w) / sum) * (i === 0 && h === lastHour ? 0.5 : 1) * 10) / 10;
      dayTotal += kcal;
      energyHours.push({ local_date: date, local_hour: h, kcal });
    });
    energy.push({ local_date: date, calories_kcal: Math.round(dayTotal), updated_at: syncedAt.toISOString() });
  }

  const connectedAt = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  return {
    healthDaily,
    sleep,
    checkins,
    pain,
    sessions,
    exercises,
    energy,
    energyHours,
    weights,
    dayTypes: {},
    matches: [
      { date: addIsoDays(today, 3), startTime: '19:00', venue: 'home' },
      { date: addIsoDays(today, 6), startTime: '20:30', venue: 'away' },
    ],
    trips: [],
    meals,
    fluids,
    syncStatus: {
      state: 'connected',
      connected_at: connectedAt,
      synced_from: addIsoDays(today, -(historyDays - 1)),
      synced_through: today,
      last_success_at: syncedAt.toISOString(),
      last_error: null,
    },
  };
}

/** Sentetik saat ağırlığı: uyku saatleri düşük, gündüz orta, seans günü 17-19 arası tepe; günden güne küçük oynama. */
function demoHourWeight(hour: number, trained: boolean, dayIndex: number): number {
  const jitter = 1 + 0.08 * (((hour * 7 + dayIndex * 3) % 5) - 2) / 2;
  if (hour < 7) return 0.62 * jitter;
  if (hour === 7) return 0.9 * jitter;
  if (trained && hour >= 17 && hour <= 19) return (hour === 18 ? 3.1 : 2.2) * jitter;
  if (hour >= 23) return 0.7 * jitter;
  return (hour >= 12 && hour <= 14 ? 1.25 : 1.05) * jitter;
}
