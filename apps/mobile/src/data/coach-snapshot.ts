// Koçun günlük özeti için anlık değerler (karar 0032): Bugün ekranının zaten hesapladığı motor görünümlerinden
// sunucunun şemasına (supabase/functions/_shared/coach/snapshot.ts). Burada hesap yok; değerler motorun
// okumalarından olduğu gibi alınır, yalnız şemanın biçimine çevrilir. Saf modül, testli (coach-snapshot.test.ts).
//
// Şema ve doğrulama aralıkları tek kaynaktan: sunucunun dosyası doğrudan içe aktarılır (içe aktardığı bir şey
// yok, Metro paketler). Aralık dışı seçmeli bir değer (ör. önceki hafta çok düşükken haftalık değişim)
// gönderilmez, null olur: sunucu kısmen geçersiz anlık değeri bütünüyle reddeder.
//
// Gitmeyenler (DATA-INVENTORY): ad, kilo, ham seriler, tarihli gece değerleri. Kilo yalnız gram hedeflerinin
// içinde dolaylıdır.

import {
  addIsoDays,
  postMatchCarbs,
  preMatchPlan,
  type CheckinReading,
  type Match,
  type MetricReading,
  type SweatTestResult,
  type TravelReading,
} from '@hooplab/engine';

import {
  parseSnapshot,
  snapshotLimits,
  snapshotVersion,
  type BandMetric,
  type CoachSnapshot,
} from '../../../../supabase/functions/_shared/coach/snapshot.ts';
import type { NutritionView } from './nutrition-view.ts';
import type { RecoveryView } from './recovery-view.ts';
import type { RegionLoadView } from './region-load-view.ts';
import type { TrainingLoadView } from './training-load-view.ts';

export type { CoachSnapshot };

export interface CoachInputs {
  /** Sporcunun yerel günü (YYYY-MM-DD). */
  today: string;
  matchDay: boolean;
  recovery: RecoveryView | null;
  checkin: CheckinReading | null;
  load: TrainingLoadView | null;
  regions: RegionLoadView | null;
  nutrition: NutritionView | null;
  /** Bugünkü seansın ter testi (karar 0029); yoksa null. */
  sweat: SweatTestResult | null;
  /** Bugünün seyahat okuması (karar 0047); yoksa null. */
  travel?: TravelReading | null;
}

type Limit = readonly [number, number];

/** Aralıktaysa değer, değilse null. */
function within(value: number | null, [min, max]: Limit): number | null {
  return value !== null && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

/** "Son gece": yalnız bugünün ya da dünün gecesi (solunum notunun penceresiyle aynı); daha eskisi son gece sayılmaz. */
function recentNight<T extends { date: string }>(latest: T | null, today: string): T | null {
  return latest !== null && latest.date >= addIsoDays(today, -1) ? latest : null;
}

function bandMetric(r: MetricReading, today: string, lim: Limit): BandMetric {
  const band = r.band && within(r.band.low, lim) !== null && within(r.band.high, lim) !== null ? { low: r.band.low, high: r.band.high } : null;
  return {
    rolling: within(r.rolling, lim),
    lastNight: within(recentNight(r.latest, today)?.value ?? null, lim),
    band,
    position: band ? r.position : null,
  };
}

export function buildCoachSnapshot(input: CoachInputs): CoachSnapshot {
  const { today } = input;
  const L = snapshotLimits;
  const snapshot: CoachSnapshot = { version: snapshotVersion, date: today, matchDay: input.matchDay };

  // Cihaz verisi hiç yoksa toparlanma bölümü gönderilmez: "Bant oluşuyor" saat bağlı değilken yanıltır.
  const r = input.recovery;
  if (r && !r.empty) {
    snapshot.status = { level: r.status.level, signals: [...r.status.signals] };
    snapshot.hrv = bandMetric(r.hrv, today, L.hrvMs);
    snapshot.rhr = bandMetric(r.rhr, today, L.rhrBpm);
    const night = recentNight(r.sleep.lastNight, today);
    snapshot.sleep = {
      rollingHours: within(r.sleep.rollingHours, L.sleepHours),
      lastNightHours: within(night ? night.minutes / 60 : null, L.sleepHours),
      short: r.sleep.short,
    };
    snapshot.respiration = { ...bandMetric(r.respiration, today, L.respirationBpm), nightHigh: r.respiration.nightHigh };
    // Gece işaretleri (karar 0039): yalnız bayraklar; hiçbiri hesaplanamadıysa gönderilmez.
    const signs = { rhrHigh: r.signs.rhr.flagged, spo2Low: r.signs.spo2.flagged, skinTempHigh: r.signs.skinTemp.flagged };
    if (Object.values(signs).some((v) => v !== null)) snapshot.signs = signs;
  }

  const c = input.checkin;
  if (c && c.total !== null) {
    const z = within(c.z, L.z);
    snapshot.checkin = {
      total: c.total,
      baselineMean: z === null ? null : within(c.baselineMean, L.checkinTotal),
      z,
      low: z !== null && c.low,
      topDrop: z !== null ? (c.drops[0]?.item ?? null) : null,
    };
  }

  const load = input.load;
  if (load && !load.empty) {
    const l = load.reading;
    snapshot.load = {
      week: within(l.week, L.loadAu),
      previousWeek: within(l.previousWeek, L.loadAu),
      weekChange: within(l.weekChange, L.weekChange),
      weeklyAverage: within(l.weeklyAverage, L.loadAu),
      ratio: within(l.ratio, L.ratio),
      spike: l.spike,
      monotony: within(l.monotony, L.monotony),
      strain: within(l.strain, L.strainAu),
    };
  }

  // Bölge: yalnız toparlanma penceresinde çalışan bölgeler (Vücut'ta işaretli olanlar). Ağrı: yalnız notu olanlar.
  const regions = input.regions;
  if (regions) {
    const recovering = regions.reading.regions
      .filter((x) => x.recovering && within(x.load, L.loadAu) !== null && within(x.sessions, L.sessions) !== null)
      .map((x) => ({
        region: x.region,
        load: x.load,
        sessions: x.sessions,
        hoursSinceLoaded: within(x.hoursSinceLoaded, L.hours),
        windowHours: x.windowHours,
        typical: within(x.typical, L.loadAu),
      }));
    if (recovering.length) snapshot.regions = recovering;
    const pain = regions.notes
      .filter((n) => n.reasons.length > 0)
      .map((n) => ({ region: n.region, side: n.side, pain: n.pain, yesterdayPain: n.yesterdayPain, reasons: [...n.reasons] }));
    if (pain.length) snapshot.pain = pain;
  }

  const n = input.nutrition;
  if (n) {
    const t = n.targets;
    const grams = (x: readonly [number, number] | null) =>
      x && within(x[0], L.grams) !== null && within(x[1], L.grams) !== null ? ([x[0], x[1]] as const) : null;
    const logged = n.intake.meals > 0;
    snapshot.nutrition = {
      dayType: n.dayType,
      carbsPerKg: [t.carbsPerKg[0], t.carbsPerKg[1]],
      proteinPerKg: [t.proteinPerKg[0], t.proteinPerKg[1]],
      carbsG: grams(t.carbsG),
      proteinG: grams(t.proteinG),
      intakeCarbsG: logged ? within(n.intake.carbsG, L.grams) : null,
      intakeProteinG: logged ? within(n.intake.proteinG, L.grams) : null,
      carbsPosition: logged ? n.intake.carbsPosition : null,
      proteinPosition: logged ? n.intake.proteinPosition : null,
      meals: Math.min(n.intake.meals, L.meals[1]),
    };
    // Su hedefsiz bir kayıt (karar 0031): hiç içiş yoksa "0 L" gönderilmez.
    const fluid = within(n.fluidL, L.liters);
    if (fluid !== null && fluid > 0) snapshot.fluid = { totalL: fluid };

    // Maç çevresi (karar 0046): yalnız saat ve yer; zamanlama ve gramlar motorun. Kilo kendisi gitmez.
    const m = n.matches;
    if ((m.today || m.tomorrow || m.yesterday) && n.matchDay === input.matchDay) {
      const brief = (x: Match | null) => (x ? { startTime: x.startTime, venue: x.venue } : null);
      const kg = n.weight?.kg ?? null;
      const plan = m.today ? preMatchPlan(m.today, kg) : null;
      const post = postMatchCarbs(kg).gramsPerHour;
      const ml = plan?.fluidMl && within(plan.fluidMl[0], L.milliliters) !== null && within(plan.fluidMl[1], L.milliliters) !== null ? plan.fluidMl : null;
      snapshot.match = {
        yesterday: brief(m.yesterday),
        today: brief(m.today),
        tomorrow: brief(m.tomorrow),
        plan: plan
          ? {
              meal: [plan.meal.from, plan.meal.to],
              mealCarbsG: grams(plan.mealCarbsG),
              fluid: [plan.fluid.from, plan.fluid.to],
              fluidMl: ml ? [ml[0], ml[1]] : null,
              nap: plan.nap ? [plan.nap.from, plan.nap.to] : null,
              postCarbsGPerHour: within(post, L.grams),
            }
          : null,
      };
    }
  }

  // Seyahat (karar 0047): evre, saat farkı ve motorun uyum tahmini; şehir ve tarih gitmez.
  const t = input.travel;
  const days = (x: number | null) => within(x, L.travelDays);
  if (t && within(t.trip.offsetHours, L.offsetHours) !== null) {
    snapshot.travel = {
      phase: t.phase,
      offsetHours: t.trip.offsetHours,
      direction: t.direction,
      jetLag: t.jetLag,
      daysUntil: days(t.daysUntil),
      dayAway: days(t.dayAway),
      totalDays: days(t.totalDays),
      remainingDays: days(t.remainingDays),
      firstHours: t.firstHours,
      eastDelayHint: t.eastDelayHint,
    };
  }

  const s = input.sweat;
  if (s && within(s.lossL, L.liters) !== null && within(s.rateLPerH, L.litersPerHour) !== null && within(s.changePercent, L.percent) !== null) {
    const target = s.shortRecoveryFluidL;
    snapshot.sweatTest = {
      lossL: s.lossL,
      rateLPerH: s.rateLPerH,
      changePercent: s.changePercent,
      lossNote: s.lossNote,
      gainNote: s.gainNote,
      fluidTargetL: target && within(target[0], L.liters) !== null && within(target[1], L.liters) !== null ? [target[0], target[1]] : null,
    };
  }

  return snapshot;
}

/**
 * Gönderilmeden önce sunucunun doğrulamasıyla aynı denetim. Geçmezse istek atılmaz; hatalar yalnız alan yolu
 * olarak döner (değer içermez).
 */
export function checkCoachSnapshot(snapshot: CoachSnapshot): { ok: true } | { ok: false; paths: string[] } {
  const result = parseSnapshot(snapshot);
  return result.ok ? { ok: true } : { ok: false, paths: result.errors.map((e) => e.split(':')[0]!) };
}
