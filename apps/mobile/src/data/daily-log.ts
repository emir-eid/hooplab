// Kayıt formlarının veri erişimi: sabah check-in (+ ağrı haritası) ve seans kaydı.
// Erişimi RLS korur (karar 0015); user_id veritabanında oturumdan yazılır, istemci göndermez.

import { isCompleteWellness, wellnessItems, type WellnessAnswers } from '@hooplab/engine';

import type { SessionKind } from '@/copy/labels';
import { painEntries, painMapFromRows, type PainMap } from '@/data/pain-map';
import { supabase } from '@/lib/supabase';

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const offline = 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.';
const failed = 'Kaydedilemedi. Biraz sonra yeniden dene.';

export interface Checkin {
  answers: WellnessAnswers;
  pain: PainMap;
}

export interface TrainingSession {
  id: string;
  localDate: string;
  kind: SessionKind;
  durationMin: number;
  rpe: number;
  minutesPlayed: number | null;
}

export interface NewTrainingSession {
  localDate: string;
  kind: SessionKind;
  durationMin: number;
  rpe: number;
  minutesPlayed: number | null;
}

/** O günün check-in'i; yoksa null. */
export async function fetchCheckin(localDate: string): Promise<Result<Checkin | null>> {
  if (!supabase) return { ok: false, message: offline };
  const [checkin, pain] = await Promise.all([
    supabase.from('daily_checkins').select(wellnessItems.join(', ')).eq('local_date', localDate).maybeSingle(),
    supabase.from('pain_reports').select('region, side, pain').eq('local_date', localDate),
  ]);
  if (checkin.error || pain.error) return { ok: false, message: offline };
  if (!checkin.data) return { ok: true, value: null };
  const answers = checkin.data as unknown as Partial<WellnessAnswers>;
  if (!isCompleteWellness(answers)) return { ok: true, value: null };
  return { ok: true, value: { answers, pain: painMapFromRows(pain.data ?? []) } };
}

/** Check-in ve o günün ağrı haritası tek işlemde (save_morning_checkin). */
export async function saveCheckin(localDate: string, checkin: Checkin): Promise<Result<null>> {
  if (!supabase) return { ok: false, message: offline };
  const { answers } = checkin;
  const { error } = await supabase.rpc('save_morning_checkin', {
    p_local_date: localDate,
    p_sleep_quality: answers.sleep_quality,
    p_fatigue: answers.fatigue,
    p_soreness: answers.soreness,
    p_stress: answers.stress,
    p_mood: answers.mood,
    p_pain: painEntries(checkin.pain),
  });
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

export async function insertSession(session: NewTrainingSession): Promise<Result<null>> {
  if (!supabase) return { ok: false, message: offline };
  const { error } = await supabase.from('training_sessions').insert({
    local_date: session.localDate,
    kind: session.kind,
    duration_min: session.durationMin,
    rpe: session.rpe,
    minutes_played: session.kind === 'game' ? session.minutesPlayed : null,
  });
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

interface SessionRow {
  id: string;
  local_date: string;
  kind: SessionKind;
  duration_min: number;
  rpe: number;
  minutes_played: number | null;
}

export async function fetchSessions(localDate: string): Promise<Result<TrainingSession[]>> {
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('training_sessions')
    .select('id, local_date, kind, duration_min, rpe, minutes_played')
    .eq('local_date', localDate)
    .order('created_at', { ascending: true });
  if (error) return { ok: false, message: offline };
  return {
    ok: true,
    value: (data as SessionRow[]).map((r) => ({
      id: r.id,
      localDate: r.local_date,
      kind: r.kind,
      durationMin: r.duration_min,
      rpe: r.rpe,
      minutesPlayed: r.minutes_played,
    })),
  };
}
