// Beslenme hedefi görünümü (karar 0029): sabah kiloları, gün tipi düzeltmesi ve o günün seanslarından
// motorun hedeflerine; öğün kaydı (karar 0030) varsa günün alımı ve hedefe göre yeri. Saf modül; sorgu
// nutrition.ts'te. Sayıları motor hesaplar.

import {
  addIsoDays,
  dayFluidL,
  dayIntake,
  inferDayType,
  mealSlots,
  nutritionTargets,
  targetWeight,
  type DayIntake,
  type DayType,
  type DayValue,
  type Meal,
  type MealItem,
  type MealSlot,
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
  /** Bugünün öğünleri, kayıt sırasıyla. */
  meals: Meal[];
  intake: DayIntake;
  /** Bugünün içişleri, yeniden eskiye (karar 0031). */
  fluids: FluidEntry[];
  /** Günün içtiği sıvı (L); hedefle kıyaslanmaz. */
  fluidL: number;
}

export interface FluidRow {
  id: string;
  local_date: string;
  volume_ml: number;
  created_at?: string;
}

export interface FluidEntry {
  id: string;
  ml: number;
  createdAt: string | null;
}

export function toFluids(rows: readonly FluidRow[], today: string): FluidEntry[] {
  return rows
    .filter((r) => r.local_date === today)
    .map((r) => ({ id: r.id, ml: Number(r.volume_ml), createdAt: r.created_at ?? null }))
    .sort((a, b) => ((a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1));
}

/** meals tablosunun satırı; items veritabanında snake_case (carbs_g). */
export interface MealRow {
  id: string;
  local_date: string;
  slot: string;
  items: unknown;
  created_at?: string;
}

type StoredItem = { food: string; portions: number } | { label: string | null; carbs_g: number; protein_g: number };

function toItem(raw: unknown): MealItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.food === 'string' && typeof o.portions === 'number') return { food: o.food, portions: o.portions };
  if (typeof o.carbs_g === 'number' && typeof o.protein_g === 'number') {
    return { label: typeof o.label === 'string' ? o.label : null, carbsG: o.carbs_g, proteinG: o.protein_g };
  }
  return null;
}

/** Satırları motorun öğünlerine çevirir (gün, sonra kayıt anı sırasıyla); tanınmayan öğün adı ya da kalem atlanır. */
export function toMeals(rows: readonly MealRow[]): Meal[] {
  const key = (r: MealRow) => `${r.local_date}|${r.created_at ?? ''}`;
  return [...rows]
    .sort((a, b) => (key(a) < key(b) ? -1 : 1))
    .flatMap((r) => {
      if (!(mealSlots as readonly string[]).includes(r.slot) || !Array.isArray(r.items)) return [];
      const items = r.items.map(toItem).filter((x): x is MealItem => x !== null);
      return items.length ? [{ id: r.id, localDate: r.local_date, slot: r.slot as MealSlot, items }] : [];
    });
}

/** Motorun kalemlerini veritabanı biçimine çevirir. */
export function toStoredItems(items: readonly MealItem[]): StoredItem[] {
  return items.map((i) => ('food' in i ? { food: i.food, portions: i.portions } : { label: i.label, carbs_g: i.carbsG, protein_g: i.proteinG }));
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
  mealRows: readonly MealRow[] = [],
  fluidRows: readonly FluidRow[] = [],
): NutritionView {
  const weights = toWeightSeries(weightRows).filter((w) => w.date >= weightFrom(today) && w.date <= today);
  const inferred = inferDayType(todaySessions);
  const dayType = override ?? inferred;
  const weight = targetWeight(weights, today);
  const targets = nutritionTargets(dayType, weight?.kg ?? null);
  const meals = toMeals(mealRows).filter((m) => m.localDate === today);
  const fluids = toFluids(fluidRows, today);
  return {
    today,
    dayType,
    inferred,
    override,
    weight,
    todayWeight: weights.find((w) => w.date === today)?.value ?? null,
    weights,
    targets,
    meals,
    intake: dayIntake(meals, targets),
    fluids,
    fluidL: dayFluidL(fluids),
  };
}

/** Tekrar için bakılan geçmiş (gün) ve gösterilen son öğün sayısı; görsel seçim, eşik değil. */
export const recentMealDays = 14;
export const recentMealCount = 3;

/** Aynı kalemleri taşıyan öğünler tek sayılır (en yenisi kalır). */
export function distinctRecent(meals: readonly Meal[], count = recentMealCount): Meal[] {
  const seen = new Set<string>();
  const out: Meal[] = [];
  for (const m of [...meals].reverse()) {
    const key = JSON.stringify(toStoredItems(m.items));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
    if (out.length === count) break;
  }
  return out;
}
