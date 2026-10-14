// Haftalık rapor (karar 0040): takvim haftası (pazartesi-pazar) için mevcut okumaların derlemesi.
// Yeni eşik yok: yük rules/yuk.json'un pencereleriyle, toparlanma / check-in / beslenme / ağrı kendi kurallarıyla
// gün gün okunur; burada yalnız hafta sınırları, toplamlar, ortalamalar ve sayımlar var.
// Tarihler "YYYY-AA-GG" sporcunun yerel takvim günleri; saat dilimi çağıranın işidir (karar 0015).

import { addIsoDays, type DayValue } from './recovery.ts';
import { wellnessItems, type WellnessItem } from './scales.ts';
import { dailyLoads, loadWeek, readTrainingLoad, type LoadSession, type TrainingLoadReading } from './training-load.ts';
import { checkinBaseline, isCompleteWellness, readCheckin, wellnessTotal, type CheckinDay } from './wellness.ts';

/** Bir haftanın gün sayısı; yük penceresiyle aynı (rules/yuk.json → yuk-haftalik). */
export const weekLength = loadWeek.days;

/** Raporda kıyas için gösterilen önceki tamamlanmış hafta sayısı; 4 hafta ortalamasının penceresiyle aynı. */
export const weeklyHistoryWeeks = loadWeek.averageWeeks;

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && addIsoDays(date, 0) === date;
}

/** Günün ait olduğu haftanın pazartesisi (ISO 8601 haftası). */
export function weekStartOf(date: string): string {
  if (!isIsoDate(date)) throw new Error(`geçersiz gün: ${date}`);
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = pazar
  return addIsoDays(date, -((weekday + 6) % 7));
}

export function isWeekStart(date: string): boolean {
  return isIsoDate(date) && weekStartOf(date) === date;
}

/** Haftanın yedi günü, pazartesiden pazara. */
export function weekDates(weekStart: string): string[] {
  if (!isWeekStart(weekStart)) throw new Error(`pazartesi değil: ${weekStart}`);
  return Array.from({ length: weekLength }, (_, i) => addIsoDays(weekStart, i));
}

export function weekEndOf(weekStart: string): string {
  return addIsoDays(weekStart, weekLength - 1);
}

/** Hafta bugünle ilişkisine göre: bitti, sürüyor, ya da henüz gelmedi (rapor üretilmez). */
export type WeekPhase = 'complete' | 'current' | 'future';

export function weekPhase(weekStart: string, today: string): WeekPhase {
  if (weekStart > today) return 'future';
  return weekEndOf(weekStart) < today ? 'complete' : 'current';
}

/** Haftanın raporda sayılan günleri: biten haftada yedisi, süren haftada bugüne kadar olanlar. */
export function elapsedDates(weekStart: string, today: string): string[] {
  return weekDates(weekStart).filter((d) => d <= today);
}

// --- Yük ---

/**
 * Tamamlanmış haftanın yük okuması: haftanın son günü (pazar) "bugün" sayılarak rules/yuk.json'un pencereleri.
 * readTrainingLoad bugün seans yoksa dünü esas alır; pazar akşamı girilmemiş seans haftayı kaydırmasın diye
 * pazartesi "bugün" verilir ve pazartesi seansları dışarıda bırakılır: hesap her zaman pazarda biter.
 */
export function readCompletedWeekLoad(
  sessions: readonly LoadSession[],
  weekStart: string,
  opts: { historyStart?: string } = {},
): TrainingLoadReading {
  const end = weekEndOf(weekStart);
  const until = sessions.filter((s) => s.date <= end);
  return readTrainingLoad(until, addIsoDays(end, 1), opts);
}

export interface PastWeekLoad {
  weekStart: string;
  total: number | null;
  monotony: number | null;
  strain: number | null;
}

export interface WeeklyLoadReading {
  weekStart: string;
  phase: Exclude<WeekPhase, 'future'>;
  /** Haftanın günlük yükleri (sürüyorsa bugüne kadar); ilk kayıttan önceki günler yok. */
  days: { date: string; load: number }[];
  /** Haftanın toplamı (sürüyorsa bugüne kadar). Hafta ilk kayıttan önce başlıyorsa null. */
  total: number | null;
  /** Önceki tamamlanmış haftanın toplamı. */
  previousTotal: number | null;
  /** Yalnız tamamlanmış haftada: önceki haftaya göre değişim (kesir). */
  change: number | null;
  /** Yalnız tamamlanmış haftada: haftanın son günündeki okumalar (4 hafta ort., oran, monotonluk, gerilim). */
  end: TrainingLoadReading | null;
  /** Önceki tamamlanmış haftalar, yeniden eskiye (kendi geçmişinle kıyas; eşik yok). */
  history: PastWeekLoad[];
}

export function readWeeklyLoad(
  sessions: readonly LoadSession[],
  weekStart: string,
  today: string,
  opts: { historyStart?: string } = {},
): WeeklyLoadReading {
  const phase = weekPhase(weekStart, today);
  if (phase === 'future') throw new Error(`hafta henüz gelmedi: ${weekStart}`);

  const past = (start: string): PastWeekLoad => {
    const r = readCompletedWeekLoad(sessions, start, opts);
    return { weekStart: start, total: r.week, monotony: r.monotony, strain: r.strain };
  };
  const history = Array.from({ length: weeklyHistoryWeeks }, (_, i) => past(addIsoDays(weekStart, -weekLength * (i + 1))));
  const previousTotal = history[0]?.total ?? null;

  if (phase === 'complete') {
    const end = readCompletedWeekLoad(sessions, weekStart, opts);
    const days = end.daily.filter((d) => d.date >= weekStart);
    return { weekStart, phase, days, total: end.week, previousTotal, change: end.weekChange, end, history };
  }

  // Süren hafta: yalnız bugüne kadarki toplam; değişim, oran ve monotonluk hafta bitince.
  const firstSession = sessions.reduce<string | null>((min, s) => (s.date <= today && (min === null || s.date < min) ? s.date : min), null);
  const historyStart = [opts.historyStart, firstSession].filter((d): d is string => !!d && isIsoDate(d)).sort()[0] ?? null;
  const started = historyStart !== null && historyStart <= weekStart;
  const from = historyStart !== null && historyStart > weekStart ? historyStart : weekStart;
  const days = historyStart !== null && from <= today ? dailyLoads(sessions, from, today) : [];
  const total = started ? days.reduce((a, d) => a + d.load, 0) : null;
  return { weekStart, phase, days, total, previousTotal, change: null, end: null, history };
}

// --- Genel sayımlar ---

/** Değerlerin kaç kez geçtiği; null sayılmaz. */
export function tally<T extends string>(values: readonly (T | null)[]): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};
  for (const v of values) if (v !== null) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** Sonlu değerlerin ortalaması; hiç yoksa null. */
export function meanOf(values: readonly (number | null)[]): number | null {
  const xs = values.filter((x): x is number => x !== null && Number.isFinite(x));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

// --- Kilo ---

export interface WeeklyWeight {
  /** Haftadaki sabah tartısı sayısı. */
  n: number;
  /** Haftanın ortalaması (kg); tartı yoksa null. */
  mean: number | null;
  previousN: number;
  previousMean: number | null;
  /** mean − previousMean (kg); ikisi de varsa. Eşik yok. */
  change: number | null;
}

/** Sabah kilolarının haftalık ortalaması ve önceki haftaya göre farkı (eşiksiz, karar 0029'daki trend gibi). */
export function readWeeklyWeight(weights: readonly DayValue[], weekStart: string, today: string): WeeklyWeight {
  const inRange = (from: string, to: string) =>
    weights.filter((w) => w.date >= from && w.date <= to && w.date <= today).map((w) => w.value);
  const prevStart = addIsoDays(weekStart, -weekLength);
  const now = inRange(weekStart, weekEndOf(weekStart)).filter((x): x is number => x !== null && Number.isFinite(x));
  const prev = inRange(prevStart, weekEndOf(prevStart)).filter((x): x is number => x !== null && Number.isFinite(x));
  const mean = meanOf(now);
  const previousMean = meanOf(prev);
  return {
    n: now.length,
    mean,
    previousN: prev.length,
    previousMean,
    change: mean !== null && previousMean !== null ? mean - previousMean : null,
  };
}

// --- Check-in ---

export interface WeeklyItem {
  item: WellnessItem;
  /** Haftanın ortalaması (1-5). */
  mean: number;
  /** Haftadan önceki 28 günün ortalaması; başlangıç yetersizse null. */
  baselineMean: number | null;
}

export interface WeeklyCheckin {
  /** Haftadaki eksiksiz check-in sayısı. */
  n: number;
  /** Haftanın ortalama toplamı (5-25); check-in yoksa null. */
  meanTotal: number | null;
  /** Haftadan önceki 28 günün ortalama toplamı (rules/iyi-olus.json → checkin-kisisel'in başlangıç penceresi). */
  baselineMean: number | null;
  baselineN: number;
  /** "Alıştığından belirgin düşük" notunun düştüğü günler (her gün kendi önceki 28 gününe göre). */
  lowDates: string[];
  /** Madde ortalamaları; başlangıç varsa kendi ortalamasına göre en çok düşenden başlayarak, yoksa madde sırasıyla. */
  items: WeeklyItem[];
}

export function readWeeklyCheckin(days: readonly CheckinDay[], weekStart: string, today: string): WeeklyCheckin {
  const complete = (from: string, to: string) => {
    const seen = new Set<string>();
    const out: { date: string; answers: Record<WellnessItem, number> }[] = [];
    for (const d of [...days].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      if (d.date < from || d.date > to || seen.has(d.date) || !isCompleteWellness(d.answers)) continue;
      seen.add(d.date);
      out.push({ date: d.date, answers: d.answers });
    }
    return out;
  };
  const dates = elapsedDates(weekStart, today);
  const week = complete(weekStart, dates.at(-1)!);
  // Başlangıç: haftanın ilk gününün kişisel kıyasıyla aynı pencere (önceki 28 gün).
  const start = readCheckin(days, weekStart);
  const base = start.baselineMean === null ? [] : complete(addIsoDays(weekStart, -checkinBaseline.baselineDays), addIsoDays(weekStart, -1));

  const items: WeeklyItem[] = wellnessItems.map((item) => ({
    item,
    mean: meanOf(week.map((d) => d.answers[item])) ?? Number.NaN,
    baselineMean: meanOf(base.map((d) => d.answers[item])),
  }));
  const drop = (x: WeeklyItem) => (x.baselineMean === null ? 0 : x.baselineMean - x.mean);
  if (start.baselineMean !== null) items.sort((a, b) => drop(b) - drop(a) || wellnessItems.indexOf(a.item) - wellnessItems.indexOf(b.item));

  return {
    n: week.length,
    meanTotal: meanOf(week.map((d) => wellnessTotal(d.answers))),
    baselineMean: start.baselineMean,
    baselineN: start.baselineN,
    lowDates: week.filter((d) => readCheckin(days, d.date).low).map((d) => d.date),
    items: week.length ? items : [],
  };
}
