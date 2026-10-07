// Beslenme hedefi, öğün kaydı ve ter testi metinleri (karar 0029, 0030). Hedef bir rehber aralık, eşik değil;
// kayıtlı alım bir tahmin ve uyarı değil; ter testi notları tanı değil. Takviye bu kapsamda yok.

import {
  fluidTargetRule,
  foodById,
  highDayRule,
  lossNoteRule,
  mealMacros,
  proteinTarget,
  reachesProteinDose,
  targetWeightDays,
  type DayIntake,
  type DayType,
  type Food,
  type FoodGroup,
  type Meal,
  type MealItem,
  type MealSlot,
  type NutritionTargets,
  type RangePosition,
  type SweatTestResult,
  type TargetWeight,
} from '@hooplab/engine';

import { formatDecimal } from './recovery.ts';

export const dayTypeLabels: Record<DayType, string> = {
  rest: 'Dinlenme',
  training: 'Antrenman',
  high: 'Yoğun',
};

const range = (r: readonly [number, number], digits = 0) =>
  `${formatDecimal(r[0], digits)}–${formatDecimal(r[1], digits)}`;

export function dayTypeNote(dayType: DayType, inferred: DayType, override: DayType | null): string {
  if (override === null) {
    return dayType === 'rest' ? 'bugün seans kaydı yok' : dayType === 'high' ? `maç ya da ${highDayRule.minutesAtLeast / 60} saat ve üstü seans` : 'bugünkü seanslarından';
  }
  return `senin seçimin · kayıtlardan: ${dayTypeLabels[inferred].toLocaleLowerCase('tr')}`;
}

export function carbsValue(t: NutritionTargets): string {
  return t.carbsG ? `${range(t.carbsG)} g` : `${range(t.carbsPerKg)} g/kg`;
}

export function carbsDetail(t: NutritionTargets): string {
  return t.carbsG ? `${range(t.carbsPerKg)} g/kg` : 'kilonu girince gram olarak';
}

export function proteinValue(t: NutritionTargets): string {
  return t.proteinG ? `${range(t.proteinG)} g` : `${range(t.proteinPerKg, 1)} g/kg`;
}

export function proteinDetail(t: NutritionTargets): string {
  const meal = t.proteinPerMealG ? `öğün başı ~${t.proteinPerMealG} g` : `öğün başı ~${formatDecimal(t.proteinPerMealPerKg)} g/kg`;
  const [a, b] = proteinTarget.mealIntervalHours;
  return `${range(t.proteinPerKg, 1)} g/kg · ${meal}, ${a}-${b} saatte bir`;
}

export function weightValue(w: TargetWeight | null): string {
  return w ? `${formatDecimal(w.kg)} kg` : 'Gir';
}

export function weightDetail(w: TargetWeight | null, todayWeight: number | null): string {
  if (!w) return 'hedefler gram olarak görünsün';
  const basis = w.basis === 'average' ? `son ${targetWeightDays} gün ort. (${w.n} ölçüm)` : `son ölçüm, ${targetWeightDays} günde ölçüm yok`;
  return todayWeight === null ? `${basis} · bugün girilmedi` : basis;
}

export const nutritionFooter =
  'Rehber aralık. Kişisel bir beslenme planı için spor diyetisyenine danış.';

// --- Öğün kaydı (karar 0030) ---

export const mealSlotLabels: Record<MealSlot, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Ara öğün',
};

export const foodGroupLabels: Record<FoodGroup, string> = {
  grain: 'Tahıl ve nişasta',
  legume: 'Baklagil',
  fruit: 'Meyve, şeker, içecek',
  protein: 'Et, balık, yumurta',
  dairy: 'Süt ürünleri',
  nut: 'Kuruyemiş',
};

/** Saate göre önerilen öğün adı; kullanıcı değiştirebilir. Görsel varsayılan, kural değil. */
export function defaultSlot(hour: number): MealSlot {
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 18 && hour < 23) return 'dinner';
  return 'snack';
}

export const estimateLabel = 'Tahmin';

const positionLabels: Record<RangePosition, string> = {
  below: 'aralığın altında',
  within: 'aralıkta',
  above: 'aralığın üstünde',
};

const grams = (g: number) => `${Math.round(g)} g`;

/** Porsiyon sayısı: 1,5 (virgüllü, çarpı işaretsiz). */
export function formatPortions(n: number): string {
  return formatDecimal(n, Number.isInteger(n) ? 0 : 1);
}

export function portionsText(n: number): string {
  return `${formatPortions(n)} porsiyon`;
}

/** Günün kayıtlı karbonhidratı ve hedefe göre yeri; kayıt yoksa null (satır hedefi gösterir). */
export function intakeCarbs(i: DayIntake, t: NutritionTargets): { value: string; detail: string } | null {
  if (i.meals === 0) return null;
  const target = t.carbsG ? `hedef ${range(t.carbsG)} g` : `hedef ${range(t.carbsPerKg)} g/kg`;
  return { value: `≈ ${grams(i.carbsG)}`, detail: i.carbsPosition ? `${target} · ${positionLabels[i.carbsPosition]}` : target };
}

export function intakeProtein(i: DayIntake, t: NutritionTargets): { value: string; detail: string } | null {
  if (i.meals === 0) return null;
  const target = t.proteinG ? `hedef ${range(t.proteinG)} g` : `hedef ${range(t.proteinPerKg, 1)} g/kg`;
  const dose = i.mealsAtProteinDose === null ? '' : ` · ${i.mealsAtProteinDose}/${i.meals} öğün dozda`;
  return { value: `≈ ${grams(i.proteinG)}`, detail: `${i.proteinPosition ? `${target} · ${positionLabels[i.proteinPosition]}` : target}${dose}` };
}

export function intakeFooter(i: DayIntake): string {
  if (i.meals === 0) return nutritionFooter;
  return `${estimateLabel}: kayıt çoğu zaman gerçek alımın altında kalır; düşük görünmesi bir uyarı değil. Kişisel bir plan için spor diyetisyenine danış.`;
}

function itemName(item: MealItem): string {
  if (!('food' in item)) return item.label ?? 'Etiketten';
  const food = foodById(item.food);
  const name = food?.name ?? 'Listede yok';
  return item.portions === 1 ? name : `${name} ${portionsText(item.portions)}`;
}

export function mealItemsText(meal: Meal): string {
  return meal.items.map(itemName).join(', ');
}

export function mealMacrosText(items: readonly MealItem[]): string {
  const m = mealMacros(items);
  return `≈ ${grams(m.carbsG)} karbonhidrat · ${grams(m.proteinG)} protein`;
}

/** Öğün satırının ikinci satırı: kalemler ve, kilo varsa, öğün dozu. */
export function mealDetail(meal: Meal, t: NutritionTargets): string {
  const m = mealMacros(meal.items);
  const dose = reachesProteinDose(m.proteinG, t);
  return `${mealItemsText(meal)}${dose ? ' · protein öğün dozunda' : ''}`;
}

export function mealValue(meal: Meal): string {
  const m = mealMacros(meal.items);
  return `${Math.round(m.carbsG)} / ${Math.round(m.proteinG)} g`;
}

/** Gram: tam sayıysa ondalıksız, değilse bir ondalık (virgüllü). */
const gramsExact = (g: number) => `${formatDecimal(g, Number.isInteger(g) ? 0 : 1)} g`;

export function foodPortionText(food: Food): string {
  return `${food.portionLabel} · ${gramsExact(food.portionGrams)}`;
}

export function customItemText(item: { carbsG: number; proteinG: number }): string {
  return `${gramsExact(item.carbsG)} karbonhidrat · ${gramsExact(item.proteinG)} protein`;
}

export const mealListNote = "Değerler USDA FoodData Central'dan; ev ölçüsü yaklaşık. Paketli ürün için etiketteki gramı gir.";

// --- Ter testi ---

export function sweatSummary(r: SweatTestResult): string {
  const pct = `${r.changePercent > 0 ? '+' : r.changePercent < 0 ? '−' : ''}%${formatDecimal(Math.abs(r.changePercent))}`;
  return `ter ${formatDecimal(r.rateLPerH)} L/sa · kilo ${pct}`;
}

export function sweatLossText(r: SweatTestResult): string {
  return `Ter kaybı ${formatDecimal(r.lossL)} L, ter oranı ${formatDecimal(r.rateLPerH)} L/saat.`;
}

export const sweatLossNote = `Seans boyunca kilo kaybın %${lossNoteRule.lossPercentMin} veya üstünde. Bu düzeyde basketbol becerisi düşebiliyor; sonraki seansta daha sık iç.`;

export const sweatGainNote =
  'Seansta kilon arttı: ihtiyacından fazla içmiş olabilirsin. Fazla içmek yarar sağlamaz; baş ağrısı, bulantı veya kafa karışıklığı olursa sağlık ekibine başvur. Tartı farkı küçükse ölçüm hatası da olabilir.';

export function fluidTargetText(r: SweatTestResult): string | null {
  if (!r.shortRecoveryFluidL) return null;
  const [a, b] = r.shortRecoveryFluidL;
  return `Sonraki seansa ${fluidTargetRule.shortRecoveryHoursBelow} saatten az varsa ${formatDecimal(a)}–${formatDecimal(b)} L iç. Daha uzun ara varsa öğünlerle birlikte, susadıkça.`;
}

// --- Bugün'deki halkalar ve su (karar 0031) ---

export const nutrientLabels = { carbs: 'Karbonhidrat', protein: 'Protein', water: 'Su' } as const;

export interface RingText {
  value: string;
  /** Halkanın altındaki hedef satırı. */
  target: string;
  /** Kayıt varsa hedefe göre yer; yoksa null. */
  position: string | null;
  /** Ekran okuyucu metni. */
  label: string;
}

export function carbsRing(i: DayIntake, t: NutritionTargets): RingText {
  const value = `${Math.round(i.carbsG)}`;
  const target = t.carbsG ? `hedef ${range(t.carbsG)}` : `hedef ${range(t.carbsPerKg)} g/kg`;
  const position = i.meals > 0 && i.carbsPosition ? positionLabels[i.carbsPosition] : null;
  return { value, target, position, label: `Karbonhidrat yaklaşık ${value} gram, ${target}${position ? `, ${position}` : ''}` };
}

export function proteinRing(i: DayIntake, t: NutritionTargets): RingText {
  const value = `${Math.round(i.proteinG)}`;
  const target = t.proteinG ? `hedef ${range(t.proteinG)}` : `hedef ${range(t.proteinPerKg, 1)} g/kg`;
  const position = i.meals > 0 && i.proteinPosition ? positionLabels[i.proteinPosition] : null;
  return { value, target, position, label: `Protein yaklaşık ${value} gram, ${target}${position ? `, ${position}` : ''}` };
}

export function waterRing(liters: number, sweatFluidL: readonly [number, number] | null): RingText {
  const value = formatDecimal(liters, 1);
  const target = sweatFluidL ? `ter testi ${range(sweatFluidL, 1)} L` : 'hedef yok';
  return { value, target, position: null, label: `Su ${value} litre, ${sweatFluidL ? `bugünkü ter testine göre ${range(sweatFluidL, 1)} litre` : 'günlük hedef yok'}` };
}

export function mealsSummary(i: DayIntake): string {
  if (i.meals === 0) return 'henüz öğün yok';
  const dose = i.mealsAtProteinDose === null ? '' : ` · ${i.mealsAtProteinDose}/${i.meals} protein dozunda`;
  return `${i.meals} öğün${dose}`;
}

export function fluidEntryText(ml: number): string {
  return ml >= 1000 ? `${formatDecimal(ml / 1000, 1)} L` : `${ml} mL`;
}

export const waterNote =
  'Günlük sabit bir su hedefi yok: ihtiyaç tere göre kişiden kişiye çok değişiyor. Susadıkça iç; ter testi yaptığın gün seans sonrası hedef burada görünür.';
