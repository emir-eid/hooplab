// Öğün kaydı (karar 0030): sabit besin listesinden ev ölçüsüyle porsiyon → gram (research/foods/foods.json, USDA FDC),
// paketli ürün için etiketten elle gram. Kalori sayılmaz; yalnız karbonhidrat ve protein (PRODUCT modül 5).
// Alım hedef aralığıyla kıyaslanır ama bir tahmindir: kayıt çoğu zaman gerçek alımın altında kalır (capling-2017,
// buck-2022). Renk, eşik ya da uyarı yok (rules/beslenme.json → alim-hedef-kiyasi).

import { foods } from './foods-data.ts';
import { proteinTarget, type NutritionTargets } from './nutrition.ts';

export { foods };

export const foodGroups = ['grain', 'legume', 'fruit', 'protein', 'dairy', 'nut'] as const;
export type FoodGroup = (typeof foodGroups)[number];

export interface Food {
  id: string;
  name: string;
  group: FoodGroup;
  /** USDA FoodData Central kimliği (SR Legacy). */
  fdcId: number;
  /** Ev ölçüsü (ör. "1 kase"); gramı FDC'den. */
  portionLabel: string;
  portionGrams: number;
  carbsPer100g: number;
  proteinPer100g: number;
}

/** Öğün adları; görsel gruplama, hesaba girmez. */
export const mealSlots = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealSlot = (typeof mealSlots)[number];

/** rules/beslenme.json → ogun-besin-listesi: porsiyon çarpanları. */
export const portionMultipliers = [0.5, 1, 1.5, 2, 3] as const;

/** Girdi sınırları; veritabanı CHECK'leriyle aynı, bilimsel eşik değil. */
export const mealLimits = { items: 30, customGramsMax: 300, labelMax: 40 } as const;

export type MealItem =
  | { food: string; portions: number }
  /** Etiketten elle girilen değer (paketli ürün). */
  | { label: string | null; carbsG: number; proteinG: number };

export interface Meal {
  id: string;
  localDate: string;
  slot: MealSlot;
  items: readonly MealItem[];
}

export interface Macros {
  carbsG: number;
  proteinG: number;
}

const byId = new Map(foods.map((f) => [f.id, f]));

export function foodById(id: string): Food | undefined {
  return byId.get(id);
}

export function isFoodItem(item: MealItem): item is { food: string; portions: number } {
  return 'food' in item;
}

export function isValidPortions(portions: number): boolean {
  return (portionMultipliers as readonly number[]).includes(portions);
}

export function isValidCustom(item: { label: string | null; carbsG: number; proteinG: number }): boolean {
  const ok = (g: number) => Number.isFinite(g) && g >= 0 && g <= mealLimits.customGramsMax;
  return ok(item.carbsG) && ok(item.proteinG) && item.carbsG + item.proteinG > 0 && (item.label?.length ?? 0) <= mealLimits.labelMax;
}

/** Bir kalemin karbonhidrat ve proteini (gram); listede olmayan besin ya da geçersiz çarpan null. */
export function itemMacros(item: MealItem): Macros | null {
  if (!isFoodItem(item)) return isValidCustom(item) ? { carbsG: item.carbsG, proteinG: item.proteinG } : null;
  const food = byId.get(item.food);
  if (!food || !isValidPortions(item.portions)) return null;
  const grams = food.portionGrams * item.portions;
  return { carbsG: (food.carbsPer100g * grams) / 100, proteinG: (food.proteinPer100g * grams) / 100 };
}

export interface MealMacros extends Macros {
  /** Hesaba katılamayan kalem sayısı (listeden çıkmış besin). */
  skipped: number;
}

export function mealMacros(items: readonly MealItem[]): MealMacros {
  let carbsG = 0;
  let proteinG = 0;
  let skipped = 0;
  for (const item of items) {
    const m = itemMacros(item);
    if (!m) {
      skipped++;
      continue;
    }
    carbsG += m.carbsG;
    proteinG += m.proteinG;
  }
  return { carbsG, proteinG, skipped };
}

export type RangePosition = 'below' | 'within' | 'above';

/** Yuvarlanmış gram hedef aralığın neresinde (ekrandaki sayıyla aynı karar). */
export function rangePosition(grams: number, range: readonly [number, number]): RangePosition {
  const g = Math.round(grams);
  if (g < range[0]) return 'below';
  if (g > range[1]) return 'above';
  return 'within';
}

/** Öğünün proteini öğün dozuna (≈ 0,3 g/kg; protein-gunluk) ulaştı mı; kilo yoksa null. */
export function reachesProteinDose(proteinG: number, targets: NutritionTargets): boolean | null {
  if (targets.proteinPerMealG === null) return null;
  return Math.round(proteinG) >= targets.proteinPerMealG;
}

export interface DayIntake extends Macros {
  meals: number;
  skipped: number;
  /** Kilo yoksa (hedef yalnız g/kg) null. */
  carbsPosition: RangePosition | null;
  proteinPosition: RangePosition | null;
  /** Proteini öğün dozuna ulaşan öğün sayısı; kilo yoksa null. */
  mealsAtProteinDose: number | null;
}

/** Günün kayıtlı alımı ve hedef aralığa göre yeri. Kayıt eksikse alım düşük görünür; bu bir uyarı değil. */
export function dayIntake(meals: readonly Meal[], targets: NutritionTargets): DayIntake {
  let carbsG = 0;
  let proteinG = 0;
  let skipped = 0;
  let atDose = 0;
  for (const meal of meals) {
    const m = mealMacros(meal.items);
    carbsG += m.carbsG;
    proteinG += m.proteinG;
    skipped += m.skipped;
    if (reachesProteinDose(m.proteinG, targets)) atDose++;
  }
  const hasMeals = meals.length > 0;
  return {
    meals: meals.length,
    carbsG,
    proteinG,
    skipped,
    carbsPosition: hasMeals && targets.carbsG ? rangePosition(carbsG, targets.carbsG) : null,
    proteinPosition: hasMeals && targets.proteinG ? rangePosition(proteinG, targets.proteinG) : null,
    mealsAtProteinDose: targets.proteinPerMealG === null ? null : atDose,
  };
}

/** Öğün dozunun kaynağı protein-gunluk; burada yeniden tanımlanmaz. */
export const mealProteinDosePerKg = proteinTarget.perMeal;
