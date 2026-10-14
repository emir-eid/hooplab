// Haftalık rapor görünümü (karar 0040): haftanın satırlarından motorun okumalarına. Saf modül; sorgu
// weekly-report.ts'te. Sayıları motor hesaplar; her gün mevcut kurallarla okunur, burada yalnız toplanır.
// Görünüm ekrandan bağımsız bir veri nesnesidir: ileride PDF de aynı nesneden üretilecek.

import { loadGroups } from '@hooplab/theme';
import {
  addIsoDays,
  bodySpots,
  checkinBaseline,
  dayStatus,
  elapsedDates,
  flaggedSigns,
  meanOf,
  painMonitoringRule,
  readIllnessSigns,
  readMetric,
  readRespiration,
  readSleep,
  readWeeklyCheckin,
  readWeeklyLoad,
  readWeeklyWeight,
  recoveryLookbackDays,
  sessionLoad,
  tally,
  weekEndOf,
  weekPhase,
  weekStartOf,
  type BodySpot,
  type DayLevel,
  type DayType,
  type IllnessSignKey,
  type MetricReading,
  type RangePosition,
  type SessionKind,
  type WeeklyCheckin,
  type WeeklyLoadReading,
  type WeeklyWeight,
  type WellnessAnswers,
} from '@hooplab/engine';

import { buildNutritionView, toWeightSeries, weightFrom, type FluidRow, type MealRow, type WeightRow } from './nutrition-view.ts';
import { painMapFromRows, painOf } from './pain-map.ts';
import { nightlySleep, type HealthDailyRow, type SleepRow } from './recovery-view.ts';
import { loadFrom, loadGroupOf, type LoadParts } from './training-load-view.ts';

export interface WeeklySessionRow {
  local_date: string;
  rpe: number;
  duration_min: number;
  kind: SessionKind;
  minutes_played: number | null;
  /** Ter testi girilmiş mi (sweat_pre_kg dolu). */
  sweat: boolean;
}

export interface WeeklyPainRow {
  local_date: string;
  region: string;
  side: string;
  pain: number;
}

/** Haftanın raporu için çekilen satırlar; her tablo kendi geriye bakış penceresiyle (weeklyRanges). */
export interface WeeklyRows {
  sessions: WeeklySessionRow[];
  /** Bütün geçmişteki ilk seans günü (Trend'deki gibi). */
  earliestSession: string | null;
  healthDaily: HealthDailyRow[];
  sleep: SleepRow[];
  checkins: ({ local_date: string } & Partial<WellnessAnswers>)[];
  pain: WeeklyPainRow[];
  weights: WeightRow[];
  dayTypes: { local_date: string; day_type: DayType }[];
  matchDays: string[];
  meals: MealRow[];
  fluids: FluidRow[];
}

/** Her tablonun çekileceği en eski gün; bitiş haftanın son günü. */
export function weeklyRanges(weekStart: string) {
  const end = weekEndOf(weekStart);
  return {
    end,
    // Yük: Trend'le aynı geriye bakış (oran ve 4 hafta ortalaması aynı çıksın); önceki 4 haftayı da kapsar.
    sessions: loadFrom(end),
    // Toparlanma: haftanın ilk gününün 7 günlük penceresi ve 28 günlük bandı.
    health: addIsoDays(weekStart, -recoveryLookbackDays),
    // Check-in: haftanın ilk gününün önceki 28 günü.
    checkins: addIsoDays(weekStart, -checkinBaseline.baselineDays),
    // Kilo: haftanın ilk gününün hedef kilosu (son 4 hafta) ve önceki haftanın ortalaması.
    weights: weightFrom(weekStart),
    week: weekStart,
  };
}

export type NightNoteKind = 'respiration' | IllnessSignKey;

export interface WeeklyReportView {
  weekStart: string;
  weekEnd: string;
  phase: 'complete' | 'current';
  /** Raporda sayılan günler (süren haftada bugüne kadar). */
  dates: string[];
  load: {
    reading: WeeklyLoadReading;
    /** Haftanın yükünün tür gruplarına dağılımı (AU). */
    parts: LoadParts;
    /** Haftanın günlük yükleri gruplara bölünmüş; ilk kayıttan önceki gün null. */
    days: { date: string; load: number | null; parts: LoadParts }[];
    sessions: number;
    games: number;
    /** Maçlarda oynanan dakikaların toplamı; hiç girilmediyse null. */
    minutesPlayed: number | null;
    empty: boolean;
  };
  recovery: {
    /** Her günün durumu (o güne kadarki 7 günlük ortalama ve bandıyla). */
    days: { date: string; level: DayLevel }[];
    counts: Partial<Record<DayLevel, number>>;
    /** Yalnız biten haftada: haftanın 7 günlük ortalaması ve önceki 28 günün bandı (rules/toparlanma.json). */
    hrv: MetricReading | null;
    rhr: MetricReading | null;
    /** Haftanın gece başına ortalama uykusu (saat) ve ölçülen gece sayısı. */
    sleepHours: number | null;
    sleepNights: number;
    /** Yalnız biten haftada: 7 gecelik ortalama kısa mı (uyku-kisa). */
    sleepShort: boolean | null;
    empty: boolean;
  };
  /** Gece notlarının düştüğü günler (solunum ve gece işaretleri; tanı değil). */
  nights: { date: string; kinds: NightNoteKind[] }[];
  checkin: WeeklyCheckin;
  pain: {
    checkinDays: number;
    /** Hafta içinde ağrı girilen noktalar; her gün ayrı (birleştirilmez, karar 0018). */
    spots: { spot: BodySpot; days: { date: string; pain: number | null }[]; aboveMonitoring: number }[];
  };
  nutrition: {
    /** Öğün kaydı olan gün sayısı. */
    mealDays: number;
    carbs: Partial<Record<RangePosition, number>>;
    protein: Partial<Record<RangePosition, number>>;
    /** Kilo olmadığı için gram hedefi hesaplanamayan, öğünlü gün sayısı. */
    noTarget: number;
    dayTypes: Partial<Record<DayType, number>>;
    matchDays: number;
    fluidDays: number;
    /** Kayıtlı günlerin ortalama sıvısı (L); hedefle kıyaslanmaz. */
    fluidMeanL: number | null;
    sweatTests: number;
  };
  weight: WeeklyWeight;
}

const emptyParts = (): LoadParts => ({ game: 0, court: 0, gym: 0, light: 0 });

export function buildWeeklyReportView(rows: WeeklyRows, weekStart: string, today: string): WeeklyReportView {
  const phase = weekPhase(weekStart, today);
  if (phase === 'future') throw new Error(`hafta henüz gelmedi: ${weekStart}`);
  const weekEnd = weekEndOf(weekStart);
  const dates = elapsedDates(weekStart, today);
  const last = dates.at(-1)!;
  const inWeek = (d: string) => d >= weekStart && d <= last;

  // --- Yük ---
  const ranges = weeklyRanges(weekStart);
  const sessionRows = rows.sessions.filter((s) => s.local_date >= ranges.sessions && s.local_date <= last);
  const historyStart = rows.earliestSession !== null && rows.earliestSession < ranges.sessions ? ranges.sessions : undefined;
  const reading = readWeeklyLoad(
    sessionRows.map((s) => ({ date: s.local_date, rpe: s.rpe, durationMin: s.duration_min })),
    weekStart,
    today,
    historyStart ? { historyStart } : {},
  );
  const known = new Set(reading.days.map((d) => d.date));
  const weekSessions = sessionRows.filter((s) => inWeek(s.local_date));
  const parts = emptyParts();
  const days = dates.map((date) => {
    const p = emptyParts();
    for (const s of weekSessions) if (s.local_date === date) p[loadGroupOf[s.kind]] += sessionLoad(s.rpe, s.duration_min) ?? 0;
    if (known.has(date)) for (const g of loadGroups) parts[g] += p[g];
    return { date, load: known.has(date) ? loadGroups.reduce((a, g) => a + p[g], 0) : null, parts: known.has(date) ? p : emptyParts() };
  });
  const games = weekSessions.filter((s) => s.kind === 'game');
  const played = games.map((g) => g.minutes_played).filter((m): m is number => m !== null);

  // --- Toparlanma ---
  const health = rows.healthDaily.filter((r) => r.local_date <= last);
  const hrvSeries = health.map((r) => ({ date: r.local_date, value: r.hrv_deep_rmssd_ms }));
  const rhrSeries = health.map((r) => ({ date: r.local_date, value: r.nrem_hr_bpm }));
  const respSeries = health.map((r) => ({ date: r.local_date, value: r.respiratory_rate_bpm }));
  const signInputs = {
    rhr: rhrSeries,
    spo2: health.map((r) => ({ date: r.local_date, value: r.spo2_avg_pct })),
    skinTemp: health.map((r) => ({ date: r.local_date, nightly: r.skin_temp_nightly_c, baseline: r.skin_temp_baseline_c })),
  };
  const nightsSlept = nightlySleep(rows.sleep.filter((r) => r.local_date <= last));
  const statusDays = dates.map((date) => ({
    date,
    level: dayStatus(readMetric(hrvSeries, date, { log: true }), readMetric(rhrSeries, date, { log: false }), readSleep(nightsSlept, date)).level,
  }));
  const weekSleep = nightsSlept.filter((n) => inWeek(n.date) && n.value !== null);
  const sleepMinutes = meanOf(weekSleep.map((n) => n.value));
  const nights = dates.flatMap((date) => {
    const kinds: NightNoteKind[] = [];
    // Tek gece notu yalnız o günün gecesine bakar (readRespiration dünü de kabul eder; burada çift sayılmasın).
    const resp = readRespiration(respSeries, date);
    if (resp.nightHigh === true && resp.latest?.date === date) kinds.push('respiration');
    kinds.push(...flaggedSigns(readIllnessSigns(signInputs, date)));
    return kinds.length ? [{ date, kinds }] : [];
  });

  // --- Ağrı ---
  const checkinDates = new Set(rows.checkins.map((c) => c.local_date).filter(inWeek));
  const painByDate = new Map([...checkinDates].map((d) => [d, painMapFromRows(rows.pain.filter((p) => p.local_date === d))]));
  const spots = bodySpots.flatMap((spot) => {
    const spotDays = dates.map((date) => {
      const map = painByDate.get(date);
      return { date, pain: map ? painOf(map, spot) : null };
    });
    if (!spotDays.some((d) => (d.pain ?? 0) > 0)) return [];
    return [{ spot, days: spotDays, aboveMonitoring: spotDays.filter((d) => (d.pain ?? 0) > painMonitoringRule.maxNrs).length }];
  });

  // --- Beslenme ve sıvı: her gün Bugün'deki hesapla ---
  const nutritionDays = dates.map((date) =>
    buildNutritionView(
      date,
      rows.weights,
      weekSessions.filter((s) => s.local_date === date).map((s) => ({ kind: s.kind, durationMin: s.duration_min })),
      rows.dayTypes.find((d) => d.local_date === date)?.day_type ?? null,
      rows.meals,
      rows.fluids,
      rows.matchDays.includes(date),
    ),
  );
  const withMeals = nutritionDays.filter((n) => n.meals.length > 0);
  const withFluids = nutritionDays.filter((n) => n.fluids.length > 0);

  return {
    weekStart,
    weekEnd,
    phase,
    dates,
    load: {
      reading,
      parts,
      days,
      sessions: weekSessions.length,
      games: games.length,
      minutesPlayed: played.length ? played.reduce((a, b) => a + b, 0) : null,
      empty: rows.earliestSession === null,
    },
    recovery: {
      days: statusDays,
      counts: tally(statusDays.map((d) => d.level)),
      hrv: phase === 'complete' ? readMetric(hrvSeries, weekEnd, { log: true }) : null,
      rhr: phase === 'complete' ? readMetric(rhrSeries, weekEnd, { log: false }) : null,
      sleepHours: sleepMinutes === null ? null : sleepMinutes / 60,
      sleepNights: weekSleep.length,
      sleepShort: phase === 'complete' ? readSleep(nightsSlept, weekEnd).short : null,
      empty: health.length === 0 && rows.sleep.length === 0,
    },
    nights,
    checkin: readWeeklyCheckin(
      rows.checkins.map(({ local_date, ...answers }) => ({ date: local_date, answers })),
      weekStart,
      today,
    ),
    pain: { checkinDays: checkinDates.size, spots },
    nutrition: {
      mealDays: withMeals.length,
      carbs: tally(withMeals.map((n) => n.intake.carbsPosition)),
      protein: tally(withMeals.map((n) => n.intake.proteinPosition)),
      noTarget: withMeals.filter((n) => n.intake.carbsPosition === null).length,
      dayTypes: tally(nutritionDays.map((n) => n.dayType)),
      matchDays: nutritionDays.filter((n) => n.matchDay).length,
      fluidDays: withFluids.length,
      fluidMeanL: meanOf(withFluids.map((n) => n.fluidL)),
      sweatTests: weekSessions.filter((s) => s.sweat).length,
    },
    weight: readWeeklyWeight(toWeightSeries(rows.weights), weekStart, today),
  };
}

export interface WeeklyReport {
  view: WeeklyReportView;
  /** Kaydın başladığı hafta (seans, cihaz verisi ya da check-in'in en eskisi); geri gitme burada durur. */
  firstWeek: string | null;
}

/** Kaydın en eski gününden ilk haftaya. */
export function firstWeekOf(dates: readonly (string | null)[]): string | null {
  const first = dates.filter((d): d is string => d !== null).sort()[0];
  return first ? weekStartOf(first) : null;
}
