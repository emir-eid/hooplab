// Beslenme hedefi verisi (karar 0029): sabah kiloları, gün tipi düzeltmesi, bugünün seansları; kilo ve gün tipi kaydı.
// Öğün kaydı (karar 0030): bugünün öğünleri, son öğünler (tekrar için), öğün ekleme / düzeltme / silme.
// Maç günü işareti (karar 0036) ve maç takvimi (0046): maç günü ve dünü / yarını maç çevresi sayılır; işaret satır ekler,
// kaldırmak siler. Takvim ekranının sorguları matches.ts'te.
// Erişimi RLS korur (karar 0015). Demo modu açıksa bellekteki demo deposuna gider (karar 0022).

import {
  addIsoDays,
  fluidEntryLimits,
  isValidFluidMl,
  isValidWeight,
  itemMacros,
  mealLimits,
  type DayType,
  type Meal,
  type MealItem,
  type MealSlot,
  type SessionKind,
} from '@hooplab/engine';

import type { Result } from '@/data/daily-log';
import { aroundRange, toMatches, type MatchRow } from '@/data/match-view';
import {
  buildNutritionView,
  distinctRecent,
  recentMealDays,
  toMeals,
  toStoredItems,
  weightFrom,
  type FluidRow,
  type MealRow,
  type NutritionView,
  type WeightRow,
} from '@/data/nutrition-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Beslenme verisi alınamadı. İnternetini kontrol edip yeniden dene.';
const failed = 'Kaydedilemedi. Biraz sonra yeniden dene.';
const mealColumns = 'id, local_date, slot, items, created_at';

export async function fetchNutrition(today: string): Promise<Result<NutritionView>> {
  const demo = demoStore();
  if (demo) return demo.fetchNutrition(today);
  if (!supabase) return { ok: false, message: offline };
  const around = aroundRange(today);
  const [weights, override, sessions, meals, fluids, match] = await Promise.all([
    supabase.from('body_weights').select('local_date, weight_kg').gte('local_date', weightFrom(today)).lte('local_date', today),
    supabase.from('day_types').select('day_type').eq('local_date', today).maybeSingle(),
    supabase.from('training_sessions').select('local_date, kind, duration_min').gte('local_date', addIsoDays(today, -1)).lte('local_date', today),
    supabase.from('meals').select(mealColumns).eq('local_date', today),
    supabase.from('fluid_intakes').select('id, local_date, volume_ml, created_at').eq('local_date', today),
    supabase.from('match_days').select('local_date, start_time, venue').gte('local_date', around.from).lte('local_date', around.to),
  ]);
  if (weights.error || override.error || sessions.error || meals.error || fluids.error || match.error) return { ok: false, message: offline };
  const rows = (sessions.data ?? []) as { local_date: string; kind: SessionKind; duration_min: number }[];
  const on = (date: string) => rows.filter((s) => s.local_date === date).map((s) => ({ kind: s.kind, durationMin: s.duration_min }));
  return {
    ok: true,
    value: buildNutritionView(
      today,
      (weights.data ?? []) as WeightRow[],
      on(today),
      (override.data as { day_type: DayType } | null)?.day_type ?? null,
      (meals.data ?? []) as MealRow[],
      (fluids.data ?? []) as FluidRow[],
      toMatches((match.data ?? []) as MatchRow[]),
      on(addIsoDays(today, -1)),
    ),
  };
}

/** Bugünün sabah kilosu (günde bir; yeniden girilirse güncellenir). */
export async function saveWeight(localDate: string, kg: number): Promise<Result<null>> {
  if (!isValidWeight(kg)) return { ok: false, message: 'Kilo 30-250 kg arasında olmalı.' };
  const demo = demoStore();
  if (demo) return demo.saveWeight(localDate, kg);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase
    .from('body_weights')
    .upsert({ local_date: localDate, weight_kg: kg }, { onConflict: 'user_id,local_date' });
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

/** Gün tipi düzeltmesi; null seans kayıtlarından çıkan tipe döndürür (satır silinir). */
export async function saveDayType(localDate: string, dayType: DayType | null): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.saveDayType(localDate, dayType);
  if (!supabase) return { ok: false, message: failed };
  const { error } =
    dayType === null
      ? await supabase.from('day_types').delete().eq('local_date', localDate)
      : await supabase.from('day_types').upsert({ local_date: localDate, day_type: dayType }, { onConflict: 'user_id,local_date' });
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

/** "Bugün maç var" işareti; false işareti kaldırır (satır silinir). Aynı gün ikinci ekleme zaten işaretli demektir. */
export async function saveMatchDay(localDate: string, matchDay: boolean): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.saveMatchDay(localDate, matchDay);
  if (!supabase) return { ok: false, message: failed };
  const { error } = matchDay
    ? await supabase.from('match_days').insert({ local_date: localDate })
    : await supabase.from('match_days').delete().eq('local_date', localDate);
  return error && error.code !== '23505' ? { ok: false, message: failed } : { ok: true, value: null };
}

/** Son iki haftanın öğünleri, yeniden eskiye, kalemleri aynı olanlar bir kez. */
export async function fetchRecentMeals(today: string): Promise<Result<Meal[]>> {
  const demo = demoStore();
  if (demo) return demo.fetchRecentMeals(today);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('meals')
    .select(mealColumns)
    .gte('local_date', addIsoDays(today, -recentMealDays))
    .lte('local_date', today);
  if (error) return { ok: false, message: offline };
  return { ok: true, value: distinctRecent(toMeals((data ?? []) as MealRow[])) };
}

export async function fetchMeal(id: string): Promise<Result<Meal | null>> {
  const demo = demoStore();
  if (demo) return demo.fetchMeal(id);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase.from('meals').select(mealColumns).eq('id', id).maybeSingle();
  if (error) return { ok: false, message: offline };
  return { ok: true, value: data ? (toMeals([data as MealRow])[0] ?? null) : null };
}

export function isValidMeal(items: readonly MealItem[]): boolean {
  return items.length > 0 && items.length <= mealLimits.items && items.every((i) => itemMacros(i) !== null);
}

export interface MealInput {
  /** Varsa o öğün güncellenir. */
  id: string | null;
  localDate: string;
  slot: MealSlot;
  items: readonly MealItem[];
}

export async function saveMeal(meal: MealInput): Promise<Result<null>> {
  if (!isValidMeal(meal.items)) return { ok: false, message: 'Öğünde en az bir geçerli kalem olmalı.' };
  const demo = demoStore();
  if (demo) return demo.saveMeal(meal);
  if (!supabase) return { ok: false, message: failed };
  const row = { local_date: meal.localDate, slot: meal.slot, items: toStoredItems(meal.items) };
  const { error } = meal.id ? await supabase.from('meals').update(row).eq('id', meal.id) : await supabase.from('meals').insert(row);
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

export async function deleteMeal(id: string): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.deleteMeal(id);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase.from('meals').delete().eq('id', id);
  return error ? { ok: false, message: 'Silinemedi. Biraz sonra yeniden dene.' } : { ok: true, value: null };
}

/** Bir içiş (mL); hedefsiz kayıt (karar 0031). */
export async function addFluid(localDate: string, ml: number): Promise<Result<null>> {
  if (!isValidFluidMl(ml)) return { ok: false, message: `Miktar ${fluidEntryLimits.minMl}-${fluidEntryLimits.maxMl} mL arasında olmalı.` };
  const demo = demoStore();
  if (demo) return demo.addFluid(localDate, ml);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase.from('fluid_intakes').insert({ local_date: localDate, volume_ml: ml });
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

export async function deleteFluid(id: string): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.deleteFluid(id);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase.from('fluid_intakes').delete().eq('id', id);
  return error ? { ok: false, message: 'Silinemedi. Biraz sonra yeniden dene.' } : { ok: true, value: null };
}
