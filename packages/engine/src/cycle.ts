// Döngü günü, kaba evre ve döngü notu (karar 0061 sıra 5; rules/dongu.json). Saf hesap: telefon HealthKit adet
// kayıtlarını buraya verir, çıkan gün / evre / düzensiz bayrağı buluta gider (cycle_days). Ham kayıt dışarı çıkmaz.
// Evre takvim sayımıyla "tahmin"dir; hormon ölçülmez. Bant, eşik ve günün durumu döngüye göre değişmez.

import { addIsoDays } from './recovery.ts';
import type { RecoverySignal } from './recovery.ts';

export type CyclePhase = 'adet' | 'folikuler' | 'luteal' | 'adet_oncesi';

/** rules/dongu.json → dongu-evre. */
export const cyclePhaseRule = {
  estimate: true,
  phases: ['adet', 'folikuler', 'luteal', 'adet_oncesi'],
  /** Önceki bu kadar günde akış yoksa akış günü yeni adetin başlangıcıdır (Sağlık'ın "başlangıç" işareti de sayılır). */
  onsetGapDays: 7,
  menstrualDays: { from: 1, to: 7 },
  forwardFollicularDays: { from: 8, to: 12 },
  lutealDaysBeforeNext: { from: -11, to: -8 },
  premenstrualDaysBeforeNext: { from: -7, to: -1 },
  regularCycleDays: { min: 21, max: 35 },
  minCyclesForBackwardCount: 2,
  historyCycles: 3,
  expectedLength: 'median',
} as const;

/** rules/dongu.json → dongu-notu. */
export const cycleNoteRule = {
  phases: ['adet_oncesi'],
  signals: ['hrv_low', 'rhr_high'],
  changesBand: false,
  changesStatus: false,
  weakerWithContraception: true,
  trainingAdvice: false,
} as const satisfies { phases: readonly CyclePhase[]; signals: readonly RecoverySignal[]; [k: string]: unknown };

/** rules/dongu.json → dongu-duzensiz. */
export const cycleIrregularRule = {
  cycleDaysAbove: 35,
  historyCycles: 3,
  healthkitDeviationLookbackDays: 182,
  healthkitDeviations: ['irregular', 'infrequent', 'prolonged', 'persistent_intermenstrual_bleeding'],
  action: 'hekime_yonlendir',
  comment: false,
} as const;

export type CycleDeviation = (typeof cycleIrregularRule.healthkitDeviations)[number];

/** Adet akışı olan gün (HealthKit akış kaydı "yok" değil). `start`: Sağlık'ta "döngü başlangıcı" işaretli. */
export interface FlowDay {
  date: string;
  start?: boolean;
}

export interface CycleDay {
  date: string;
  /** Son adet başlangıcından ileri sayım; başlangıç günü 1. */
  cycleDay: number;
  /** Kaba evre; bilinemiyorsa (geçmiş az, beklenen gün geçti, düzensiz) boş. */
  phase: CyclePhase | null;
  irregular: boolean;
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}

/** Akış günlerinden adet başlangıçları (artan, tekil). */
export function menstrualOnsets(flow: readonly FlowDay[]): string[] {
  const byDate = new Map<string, boolean>();
  for (const f of flow) byDate.set(f.date, (byDate.get(f.date) ?? false) || f.start === true);
  const dates = [...byDate.keys()].sort();
  const onsets: string[] = [];
  let previous: string | null = null;
  for (const date of dates) {
    const gap = previous === null ? Infinity : dayDiff(date, previous);
    if (byDate.get(date) === true || gap > cyclePhaseRule.onsetGapDays) {
      if (onsets.at(-1) !== date) onsets.push(date);
    }
    previous = date;
  }
  return onsets;
}

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * Bir gün için döngü günü ve evre. `onsets` artan sırada; `deviationDates` Sağlık'ın döngü sapması kayıtlarının günleri.
 * Döngü günü yoksa (o güne kadar başlangıç yok) null.
 */
export function cycleDayFor(date: string, onsets: readonly string[], deviationDates: readonly string[] = []): CycleDay | null {
  let idx = -1;
  for (let i = 0; i < onsets.length; i++) if (onsets[i]! <= date) idx = i;
  if (idx < 0) return null;
  const cycleDay = dayDiff(date, onsets[idx]!) + 1;

  const lengths: number[] = [];
  for (let i = Math.max(1, idx - cyclePhaseRule.historyCycles + 1); i <= idx; i++) lengths.push(dayDiff(onsets[i]!, onsets[i - 1]!));
  const { min, max } = cyclePhaseRule.regularCycleDays;

  const lookbackFrom = addIsoDays(date, -cycleIrregularRule.healthkitDeviationLookbackDays);
  const irregular =
    cycleDay > cycleIrregularRule.cycleDaysAbove ||
    lengths.some((l) => l > cycleIrregularRule.cycleDaysAbove) ||
    deviationDates.some((d) => d >= lookbackFrom && d <= date);
  if (irregular) return { date, cycleDay, phase: null, irregular: true };

  const m = cyclePhaseRule.menstrualDays;
  if (cycleDay >= m.from && cycleDay <= m.to) return { date, cycleDay, phase: 'adet', irregular: false };

  const regular = lengths.length >= cyclePhaseRule.minCyclesForBackwardCount && lengths.every((l) => l >= min && l <= max);
  if (!regular) {
    const f = cyclePhaseRule.forwardFollicularDays;
    return { date, cycleDay, phase: cycleDay >= f.from && cycleDay <= f.to ? 'folikuler' : null, irregular: false };
  }

  const expected = Math.round(median(lengths));
  // Bir sonraki adete göre gün: beklenen başlangıçtan bir önceki gün −1.
  const beforeNext = cycleDay - expected - 1;
  if (beforeNext >= 0) return { date, cycleDay, phase: null, irregular: false };
  const pm = cyclePhaseRule.premenstrualDaysBeforeNext;
  const lu = cyclePhaseRule.lutealDaysBeforeNext;
  const phase: CyclePhase =
    beforeNext >= pm.from && beforeNext <= pm.to ? 'adet_oncesi' : beforeNext >= lu.from && beforeNext <= lu.to ? 'luteal' : 'folikuler';
  return { date, cycleDay, phase, irregular: false };
}

/** Bir tarih aralığındaki (uçlar dahil) döngü günleri; başlangıcı olmayan günler listede yok. */
export function cycleDaysBetween(from: string, to: string, flow: readonly FlowDay[], deviationDates: readonly string[] = []): CycleDay[] {
  const onsets = menstrualOnsets(flow);
  const out: CycleDay[] = [];
  for (let d = from; d <= to; d = addIsoDays(d, 1)) {
    const day = cycleDayFor(d, onsets, deviationDates);
    if (day) out.push(day);
  }
  return out;
}

/** Hesap için kaç gün geriye akış kaydı okunmalı: geçmiş döngüler en çok düzenli üst sınır uzunluğunda sayılır. */
export const cycleFlowLookbackDays = (cyclePhaseRule.historyCycles + 1) * cycleIrregularRule.cycleDaysAbove + cyclePhaseRule.onsetGapDays;

export type CycleNote =
  | { kind: 'compatible'; signals: RecoverySignal[]; weak: boolean }
  | { kind: 'irregular' };

/**
 * Günün işaretlerine döngü notu (dongu-notu, dongu-duzensiz). Durum ve bant değişmez; yalnız açıklama. Düzensiz
 * döngüde işaret olsun olmasın hekim notu döner ve döngüye dair başka yorum yapılmaz.
 */
export function cycleNote(
  day: Pick<CycleDay, 'phase' | 'irregular'> | null,
  signals: readonly RecoverySignal[],
  contraception: 'yok' | 'var' | 'belirtmek_istemiyorum' | null,
): CycleNote | null {
  if (!day) return null;
  if (day.irregular) return { kind: 'irregular' };
  if (day.phase === null || !(cycleNoteRule.phases as readonly CyclePhase[]).includes(day.phase)) return null;
  const matched = signals.filter((s) => (cycleNoteRule.signals as readonly RecoverySignal[]).includes(s));
  if (matched.length === 0) return null;
  return { kind: 'compatible', signals: matched, weak: contraception === 'var' };
}
