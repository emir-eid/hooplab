// Beslenme hedefi görünümü (karar 0029): sabah kiloları, gün tipi düzeltmesi ve o günün seanslarından
// motorun hedeflerine. Saf modül; sorgu nutrition.ts'te. Sayıları motor hesaplar.

import {
  addIsoDays,
  inferDayType,
  nutritionTargets,
  targetWeight,
  type DayType,
  type DayValue,
  type NutritionTargets,
  type SessionKind,
  type TargetWeight,
} from '@hooplab/engine';

/** Kilo trendi için çekilen gün sayısı (4 hafta); görsel seçim, eşik değil. */
export const weightTrendDays = 28;

export function weightFrom(today: string): string {
  return addIsoDays(today, -(weightTrendDays - 1));
}

export interface WeightRow {
  local_date: string;
  weight_kg: number | string;
}

export interface NutritionView {
  today: string;
  dayType: DayType;
  /** Seans kayıtlarından çıkan gün tipi. */
  inferred: DayType;
  /** Kullanıcının düzeltmesi; yoksa null. */
  override: DayType | null;
  weight: TargetWeight | null;
  /** Bugün sabah kilosu girildi mi (değeri). */
  todayWeight: number | null;
  /** Son 4 haftanın sabah kiloları, eskiden yeniye (eşiksiz trend). */
  weights: DayValue[];
  targets: NutritionTargets;
}

/** PostgREST numeric'i sayı ya da metin döndürebilir; ikisini de kabul et. */
export function toWeightSeries(rows: readonly WeightRow[]): DayValue[] {
  return rows
    .map((r) => ({ date: r.local_date, value: Number(r.weight_kg) }))
    .filter((w) => Number.isFinite(w.value))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function buildNutritionView(
  today: string,
  weightRows: readonly WeightRow[],
  todaySessions: readonly { kind: SessionKind; durationMin: number }[],
  override: DayType | null,
): NutritionView {
  const weights = toWeightSeries(weightRows).filter((w) => w.date >= weightFrom(today) && w.date <= today);
  const inferred = inferDayType(todaySessions);
  const dayType = override ?? inferred;
  const weight = targetWeight(weights, today);
  return {
    today,
    dayType,
    inferred,
    override,
    weight,
    todayWeight: weights.find((w) => w.date === today)?.value ?? null,
    weights,
    targets: nutritionTargets(dayType, weight?.kg ?? null),
  };
}
