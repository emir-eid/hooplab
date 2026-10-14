// Haftalık rapor verisi (karar 0040): haftanın ve kıyas pencerelerinin satırları tek seferde.
// Erişimi RLS korur (karar 0015): sahibi yalnız kendi satırlarını okur. Demo modu bellekteki depoya gider (karar 0022).

import type { DayType } from '@hooplab/engine';

import type { Result } from '@/data/daily-log';
import type { FluidRow, MealRow, WeightRow } from '@/data/nutrition-view';
import type { HealthDailyRow, SleepRow } from '@/data/recovery-view';
import {
  buildWeeklyReportView,
  firstWeekOf,
  weeklyRanges,
  type WeeklyPainRow,
  type WeeklyReport,
  type WeeklyRows,
  type WeeklySessionRow,
} from '@/data/weekly-report-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Haftanın verisi alınamadı. İnternetini kontrol edip yeniden dene.';

export async function fetchWeeklyReport(weekStart: string, today: string): Promise<Result<WeeklyReport>> {
  const demo = demoStore();
  if (demo) return demo.fetchWeeklyReport(weekStart, today);
  if (!supabase) return { ok: false, message: offline };
  const r = weeklyRanges(weekStart);
  const end = r.end < today ? r.end : today;
  const first = (table: string) => supabase!.from(table).select('local_date').order('local_date', { ascending: true }).limit(1).maybeSingle();
  const [sessions, firstSession, firstHealth, firstCheckin, daily, sleep, checkins, pain, weights, dayTypes, match, meals, fluids] =
    await Promise.all([
      supabase
        .from('training_sessions')
        .select('local_date, rpe, duration_min, kind, minutes_played, sweat_pre_kg')
        .gte('local_date', r.sessions)
        .lte('local_date', end),
      first('training_sessions'),
      first('health_daily'),
      first('daily_checkins'),
      supabase
        .from('health_daily')
        .select('local_date, hrv_deep_rmssd_ms, resting_hr_bpm, respiratory_rate_bpm, spo2_avg_pct, skin_temp_nightly_c, skin_temp_baseline_c')
        .gte('local_date', r.health)
        .lte('local_date', end),
      supabase.from('sleep_sessions').select('local_date, minutes_asleep, is_nap').gte('local_date', r.health).lte('local_date', end),
      supabase
        .from('daily_checkins')
        .select('local_date, sleep_quality, fatigue, soreness, stress, mood')
        .gte('local_date', r.checkins)
        .lte('local_date', end),
      supabase.from('pain_reports').select('local_date, region, side, pain').gte('local_date', r.week).lte('local_date', end),
      supabase.from('body_weights').select('local_date, weight_kg').gte('local_date', r.weights).lte('local_date', end),
      supabase.from('day_types').select('local_date, day_type').gte('local_date', r.week).lte('local_date', end),
      supabase.from('match_days').select('local_date').gte('local_date', r.week).lte('local_date', end),
      supabase.from('meals').select('id, local_date, slot, items, created_at').gte('local_date', r.week).lte('local_date', end),
      supabase.from('fluid_intakes').select('id, local_date, volume_ml, created_at').gte('local_date', r.week).lte('local_date', end),
    ]);
  const all = [sessions, firstSession, firstHealth, firstCheckin, daily, sleep, checkins, pain, weights, dayTypes, match, meals, fluids];
  if (all.some((q) => q.error)) return { ok: false, message: offline };

  const date = (q: { data: unknown }) => (q.data as { local_date: string } | null)?.local_date ?? null;
  const sessionRows = (sessions.data ?? []) as (Omit<WeeklySessionRow, 'sweat'> & { sweat_pre_kg: number | null })[];
  const rows: WeeklyRows = {
    sessions: sessionRows.map(({ sweat_pre_kg, ...s }) => ({ ...s, sweat: sweat_pre_kg !== null })),
    earliestSession: date(firstSession),
    healthDaily: (daily.data ?? []) as HealthDailyRow[],
    sleep: (sleep.data ?? []) as SleepRow[],
    checkins: (checkins.data ?? []) as WeeklyRows['checkins'],
    pain: (pain.data ?? []) as WeeklyPainRow[],
    weights: (weights.data ?? []) as WeightRow[],
    dayTypes: (dayTypes.data ?? []) as { local_date: string; day_type: DayType }[],
    matchDays: ((match.data ?? []) as { local_date: string }[]).map((m) => m.local_date),
    meals: (meals.data ?? []) as MealRow[],
    fluids: (fluids.data ?? []) as FluidRow[],
  };
  return {
    ok: true,
    value: {
      view: buildWeeklyReportView(rows, weekStart, today),
      firstWeek: firstWeekOf([date(firstSession), date(firstHealth), date(firstCheckin)]),
    },
  };
}
