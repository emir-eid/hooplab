// Beslenme hedefi verisi (karar 0029): sabah kiloları, gün tipi düzeltmesi, bugünün seansları; kilo ve gün tipi kaydı.
// Erişimi RLS korur (karar 0015). Demo modu açıksa bellekteki demo deposuna gider (karar 0022).

import { isValidWeight, type DayType, type SessionKind } from '@hooplab/engine';

import type { Result } from '@/data/daily-log';
import { buildNutritionView, weightFrom, type NutritionView, type WeightRow } from '@/data/nutrition-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Beslenme verisi alınamadı. İnternetini kontrol edip yeniden dene.';
const failed = 'Kaydedilemedi. Biraz sonra yeniden dene.';

export async function fetchNutrition(today: string): Promise<Result<NutritionView>> {
  const demo = demoStore();
  if (demo) return demo.fetchNutrition(today);
  if (!supabase) return { ok: false, message: offline };
  const [weights, override, sessions] = await Promise.all([
    supabase.from('body_weights').select('local_date, weight_kg').gte('local_date', weightFrom(today)).lte('local_date', today),
    supabase.from('day_types').select('day_type').eq('local_date', today).maybeSingle(),
    supabase.from('training_sessions').select('kind, duration_min').eq('local_date', today),
  ]);
  if (weights.error || override.error || sessions.error) return { ok: false, message: offline };
  const rows = (sessions.data ?? []) as { kind: SessionKind; duration_min: number }[];
  return {
    ok: true,
    value: buildNutritionView(
      today,
      (weights.data ?? []) as WeightRow[],
      rows.map((s) => ({ kind: s.kind, durationMin: s.duration_min })),
      (override.data as { day_type: DayType } | null)?.day_type ?? null,
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
