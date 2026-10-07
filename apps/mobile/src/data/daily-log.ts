// Kayıt formlarının veri erişimi: sabah check-in (+ ağrı haritası), seans kaydı ve seans etiketleme (karar 0020).
// Erişimi RLS korur (karar 0015); user_id veritabanında oturumdan yazılır, istemci göndermez.
// Demo modu açıksa her fonksiyon bellekteki demo deposuna gider (karar 0022).

import {
  addIsoDays,
  checkinBaseline,
  isCompleteWellness,
  readCheckin,
  wellnessItems,
  type CheckinReading,
  type ContentTag,
  type WellnessAnswers,
} from '@hooplab/engine';

import type { SessionKind } from '@/copy/labels';
import { linkCandidates, pendingExercises, type ExerciseSession } from '@/data/exercise-tagging';
import { buildPainHistory, type PainHistory } from '@/data/pain-history';
import { painEntries, painMapFromRows, type PainMap } from '@/data/pain-map';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const offline = 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.';
const failed = 'Kaydedilemedi. Biraz sonra yeniden dene.';
const alreadyLinked = 'Bu saat kaydı başka bir seansa bağlanmış. Listeyi yenileyip yeniden dene.';

export interface Checkin {
  answers: WellnessAnswers;
  pain: PainMap;
}

/** Seansa bağlı ter testi (karar 0029): kilolar kg, sıvı ve idrar L. Sonuç packages/engine'de (sweatTest). */
export interface SweatEntry {
  preKg: number;
  postKg: number;
  fluidL: number;
  urineL: number | null;
}

export interface TrainingSession {
  id: string;
  localDate: string;
  kind: SessionKind;
  durationMin: number;
  rpe: number;
  minutesPlayed: number | null;
  /** İçerik etiketleri (karar 0027); null = girilmemiş (eski kayıt), türün hazır etiketleri sayılır. */
  contentTags: ContentTag[] | null;
  /** Eşleşen saat oturumu; yoksa seans yalnız elle girilmiştir. */
  exerciseSessionId: string | null;
  /** Saat oturumundan gelen başlangıç (ISO); elle girilende null. */
  startedAt: string | null;
  sweat: SweatEntry | null;
}

export interface NewTrainingSession {
  localDate: string;
  kind: SessionKind;
  durationMin: number;
  rpe: number;
  minutesPlayed: number | null;
  contentTags: ContentTag[];
  sweat: SweatEntry | null;
  /** Saat oturumundan etiketleniyorsa: bağlanacak oturum ve başlangıç zamanı. */
  exercise?: Pick<ExerciseSession, 'id' | 'startTime'>;
}

/** O günün check-in'i; yoksa null. */
export async function fetchCheckin(localDate: string): Promise<Result<Checkin | null>> {
  const demo = demoStore();
  if (demo) return demo.fetchCheckin(localDate);
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

/**
 * Sabah check-in'in kişisel kıyası (karar 0028): bugün ve önceki 28 günün check-in'leri. Bugün check-in
 * yoksa da başlangıç (kaç check-in kaldı) okunur.
 */
export async function fetchCheckinReading(today: string): Promise<Result<CheckinReading>> {
  const demo = demoStore();
  if (demo) return demo.fetchCheckinReading(today);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('daily_checkins')
    .select(['local_date', ...wellnessItems].join(', '))
    .gte('local_date', addIsoDays(today, -checkinBaseline.baselineDays))
    .lte('local_date', today);
  if (error) return { ok: false, message: offline };
  const rows = (data ?? []) as unknown as ({ local_date: string } & Partial<WellnessAnswers>)[];
  return { ok: true, value: readCheckin(rows.map(({ local_date, ...answers }) => ({ date: local_date, answers })), today) };
}

/** Check-in ve o günün ağrı haritası tek işlemde (save_morning_checkin). */
export async function saveCheckin(localDate: string, checkin: Checkin): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.saveCheckin(localDate, checkin);
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
  const demo = demoStore();
  if (demo) return demo.insertSession(session);
  if (!supabase) return { ok: false, message: offline };
  const { error } = await supabase.from('training_sessions').insert({
    local_date: session.localDate,
    kind: session.kind,
    duration_min: session.durationMin,
    rpe: session.rpe,
    minutes_played: session.kind === 'game' ? session.minutesPlayed : null,
    content_tags: session.contentTags,
    sweat_pre_kg: session.sweat?.preKg ?? null,
    sweat_post_kg: session.sweat?.postKg ?? null,
    sweat_fluid_l: session.sweat ? session.sweat.fluidL : null,
    sweat_urine_l: session.sweat?.urineL ?? null,
    exercise_session_id: session.exercise?.id ?? null,
    started_at: session.exercise?.startTime ?? null,
  });
  if (error) return { ok: false, message: error.code === '23505' ? alreadyLinked : failed };
  return { ok: true, value: null };
}

interface SessionRow {
  id: string;
  local_date: string;
  kind: SessionKind;
  duration_min: number;
  rpe: number;
  minutes_played: number | null;
  content_tags: ContentTag[] | null;
  exercise_session_id: string | null;
  started_at: string | null;
  sweat_pre_kg: number | null;
  sweat_post_kg: number | null;
  sweat_fluid_l: number | null;
  sweat_urine_l: number | null;
}

const sessionColumns =
  'id, local_date, kind, duration_min, rpe, minutes_played, content_tags, exercise_session_id, started_at, sweat_pre_kg, sweat_post_kg, sweat_fluid_l, sweat_urine_l';

function sessionFromRow(r: SessionRow): TrainingSession {
  return {
    id: r.id,
    localDate: r.local_date,
    kind: r.kind,
    durationMin: r.duration_min,
    rpe: r.rpe,
    minutesPlayed: r.minutes_played,
    contentTags: r.content_tags,
    exerciseSessionId: r.exercise_session_id,
    startedAt: r.started_at,
    sweat:
      r.sweat_pre_kg !== null && r.sweat_post_kg !== null
        ? { preKg: Number(r.sweat_pre_kg), postKg: Number(r.sweat_post_kg), fluidL: Number(r.sweat_fluid_l ?? 0), urineL: r.sweat_urine_l === null ? null : Number(r.sweat_urine_l) }
        : null,
  };
}

export async function fetchSessions(localDate: string): Promise<Result<TrainingSession[]>> {
  const demo = demoStore();
  if (demo) return demo.fetchSessions(localDate);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('training_sessions')
    .select(sessionColumns)
    .eq('local_date', localDate)
    .order('created_at', { ascending: true });
  if (error) return { ok: false, message: offline };
  return { ok: true, value: (data as SessionRow[]).map(sessionFromRow) };
}

// --- Seans etiketleme ---

interface ExerciseRow {
  id: string;
  local_date: string;
  start_time: string;
  end_time: string;
  start_utc_offset_s: number | null;
  exercise_type: string;
  display_name: string | null;
  avg_hr_bpm: number | null;
  dismissed_at: string | null;
}

const exerciseColumns =
  'id, local_date, start_time, end_time, start_utc_offset_s, exercise_type, display_name, avg_hr_bpm, dismissed_at';

function exerciseFromRow(r: ExerciseRow): ExerciseSession {
  return {
    id: r.id,
    localDate: r.local_date,
    startTime: r.start_time,
    endTime: r.end_time,
    startUtcOffsetS: r.start_utc_offset_s,
    exerciseType: r.exercise_type,
    displayName: r.display_name,
    avgHrBpm: r.avg_hr_bpm,
    dismissed: r.dismissed_at !== null,
  };
}

/** from–to (dahil) günlerinde saatin kaydettiği, henüz etiketlenmemiş oturumlar. */
export async function fetchPendingExercises(from: string, to: string): Promise<Result<ExerciseSession[]>> {
  const demo = demoStore();
  if (demo) return demo.fetchPendingExercises(from, to);
  if (!supabase) return { ok: false, message: offline };
  const [exercises, sessions] = await Promise.all([
    supabase
      .from('exercise_sessions')
      .select(exerciseColumns)
      .gte('local_date', from)
      .lte('local_date', to)
      .is('dismissed_at', null),
    supabase.from('training_sessions').select(sessionColumns).gte('local_date', from).lte('local_date', to),
  ]);
  if (exercises.error || sessions.error) return { ok: false, message: offline };
  return {
    ok: true,
    value: pendingExercises(
      (exercises.data as ExerciseRow[]).map(exerciseFromRow),
      (sessions.data as SessionRow[]).map(sessionFromRow),
    ),
  };
}

export interface ExerciseToTag {
  exercise: ExerciseSession;
  /** Aynı güne elle girilmiş, henüz bağlanmamış kayıtlar: "Bu kayıt mı?" */
  candidates: TrainingSession[];
}

/** Etiketleme formu için saat oturumu ve aynı günün bağlanabilir kayıtları. Oturum yoksa null. */
export async function fetchExerciseToTag(id: string): Promise<Result<ExerciseToTag | null>> {
  const demo = demoStore();
  if (demo) return demo.fetchExerciseToTag(id);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase.from('exercise_sessions').select(exerciseColumns).eq('id', id).maybeSingle();
  if (error) return { ok: false, message: offline };
  if (!data) return { ok: true, value: null };
  const exercise = exerciseFromRow(data as ExerciseRow);
  const sessions = await fetchSessions(exercise.localDate);
  if (!sessions.ok) return sessions;
  return { ok: true, value: { exercise, candidates: linkCandidates(exercise, sessions.value) } };
}

/** Elle girilmiş bir kaydı saat oturumuna bağlar; başlangıç zamanı saatten gelir. */
export async function linkSession(
  sessionId: string,
  exercise: Pick<ExerciseSession, 'id' | 'startTime'>,
): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.linkSession(sessionId, exercise);
  if (!supabase) return { ok: false, message: offline };
  const { error } = await supabase
    .from('training_sessions')
    .update({ exercise_session_id: exercise.id, started_at: exercise.startTime })
    .eq('id', sessionId);
  if (error) return { ok: false, message: error.code === '23505' ? alreadyLinked : failed };
  return { ok: true, value: null };
}

/** "Seans değil": oturum etiketlenecekler listesinden çıkar (ör. yürüyüş). */
export async function dismissExercise(id: string): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.dismissExercise(id);
  if (!supabase) return { ok: false, message: offline };
  const { error } = await supabase
    .from('exercise_sessions')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', id);
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

/** Vücut görünümü: verilen günlerin (eskiden yeniye) check-in günleri ve ağrı kayıtları. */
export async function fetchPainHistory(dates: readonly string[]): Promise<Result<PainHistory>> {
  const demo = demoStore();
  if (demo) return demo.fetchPainHistory(dates);
  if (!supabase) return { ok: false, message: offline };
  const from = dates[0];
  const to = dates[dates.length - 1];
  if (!from || !to) return { ok: true, value: buildPainHistory([], [], []) };
  const [checkins, pain] = await Promise.all([
    supabase.from('daily_checkins').select('local_date').gte('local_date', from).lte('local_date', to),
    supabase.from('pain_reports').select('local_date, region, side, pain').gte('local_date', from).lte('local_date', to),
  ]);
  if (checkins.error || pain.error) return { ok: false, message: offline };
  return { ok: true, value: buildPainHistory(dates, checkins.data ?? [], pain.data ?? []) };
}
