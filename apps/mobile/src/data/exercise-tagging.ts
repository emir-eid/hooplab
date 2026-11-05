// Seans etiketleme (karar 0020): saatin kaydettiği egzersiz oturumları ile elle girilen seans kayıtlarının
// eşleşmesi. Saat zamanı ve süreyi verir; tür ve RPE kullanıcıdan gelir. Bu dosya saf: veri erişimi daily-log.ts'te.

import { durationLimits } from '@hooplab/engine';

import { kcalShort } from '../copy/energy.ts';
import type { SessionKind } from '../copy/labels.ts';
import { formatShortDate, formatShortDay } from '../utils/format-date.ts';

/** Saat oturumu, uygulamanın ihtiyaç duyduğu alanlarla. */
export interface ExerciseSession {
  id: string;
  localDate: string;
  startTime: string;
  endTime: string;
  /** Oturumun başladığı yerin UTC farkı (saniye); yoksa cihaz saati kullanılır. */
  startUtcOffsetS: number | null;
  exerciseType: string;
  displayName: string | null;
  avgHrBpm: number | null;
  /** Saatin saydığı aktif süre (duraklatmalar hariç, saniye). */
  activeDurationS: number | null;
  distanceM: number | null;
  steps: number | null;
  /** Saatin oturum kalorisi (bileklik tahmini, karar 0043). */
  kcal: number | null;
  dismissed: boolean;
}

/** Eşleşme için seans kaydının gereken kısmı. */
export interface LinkableSession {
  id: string;
  localDate: string;
  exerciseSessionId: string | null;
}

/** Google Health'in ölçülen egzersiz tiplerinin Türkçe adları (LESSONS, 2026-10-04 ölçümü). */
const exerciseTypeLabels: Record<string, string> = {
  BASKETBALL: 'Basketbol',
  SPORT: 'Spor',
  STRENGTH_TRAINING: 'Kuvvet antrenmanı',
  CROSSFIT: 'Crossfit',
  YOGA: 'Yoga',
  WALKING: 'Yürüyüş',
};

/**
 * Türü kesin belli olan tipler için önceden seçilecek seans türü. Basketbol ve "Spor" için öneri yok:
 * maç, takım antrenmanı ve şut ayrımını yalnız kullanıcı yapabilir. Öneri yalnız başlangıç seçimidir.
 */
const suggestedKinds: Record<string, SessionKind> = {
  STRENGTH_TRAINING: 'strength',
  CROSSFIT: 'conditioning',
  YOGA: 'mobility',
};

export function exerciseLabel(e: Pick<ExerciseSession, 'exerciseType' | 'displayName'>): string {
  return exerciseTypeLabels[e.exerciseType] ?? e.displayName ?? 'Egzersiz';
}

export function suggestKind(exerciseType: string): SessionKind | null {
  return suggestedKinds[exerciseType] ?? null;
}

/** Oturumun başından sonuna geçen dakika (ara verilen süre dahil), 1 dakikadan kısa değil. Tarih bozuksa null. */
export function wallClockMinutes(e: Pick<ExerciseSession, 'startTime' | 'endTime'>): number | null {
  const ms = Date.parse(e.endTime) - Date.parse(e.startTime);
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.max(1, Math.round(ms / 60_000));
}

/**
 * Seans formunun süre önerisi: seansın tamamı (ısınma ve aralar dahil; yuk.json → seans-yuku),
 * formun 5 dakikalık adımına yuvarlanır. Kullanıcı değiştirebilir.
 */
export function suggestDurationMin(e: Pick<ExerciseSession, 'startTime' | 'endTime'>): number | null {
  const min = wallClockMinutes(e);
  if (min === null) return null;
  return Math.min(durationLimits.max, Math.max(5, Math.round(min / 5) * 5));
}

/** Başlangıç saati "18:05", oturumun yapıldığı yerin saatiyle (seyahatte cihaz saatinden farklı olabilir). */
export function formatStartClock(e: Pick<ExerciseSession, 'startTime' | 'startUtcOffsetS'>): string {
  return formatClock(e.startTime, e.startUtcOffsetS);
}

function formatClock(iso: string, offsetS: number | null): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  let h: number;
  let m: number;
  if (offsetS === null) {
    const d = new Date(t);
    h = d.getHours();
    m = d.getMinutes();
  } else {
    const d = new Date(t + offsetS * 1000);
    h = d.getUTCHours();
    m = d.getUTCMinutes();
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Listede ve formda tek satırlık özet: "Basketbol" / "Dün · 18:05 · 92 dk · ort. 142 nabız · ~640 kcal".
 * Gün, cihazın bugünü ve dünüyle karşılaştırılır; daha eskiyse kısa gün adı.
 */
export function exerciseSummary(
  e: ExerciseSession,
  today: string,
  yesterday: string,
): { title: string; detail: string } {
  const day = e.localDate === today ? 'Bugün' : e.localDate === yesterday ? 'Dün' : formatShortDay(e.localDate);
  const minutes = wallClockMinutes(e);
  const parts = [day, formatStartClock(e), minutes === null ? '' : `${minutes} dk`];
  if (e.avgHrBpm !== null) parts.push(`ort. ${e.avgHrBpm} nabız`);
  const kcal = kcalShort(e.kcal);
  if (kcal) parts.push(kcal);
  return { title: exerciseLabel(e), detail: parts.filter((p) => p !== '').join(' · ') };
}

/** "18:05–19:32"; bitiş de başlangıcın yerel saatiyle (oturum ortasında saat dilimi değişmez varsayılır). */
export function formatClockRange(e: Pick<ExerciseSession, 'startTime' | 'endTime' | 'startUtcOffsetS'>): string {
  const start = formatClock(e.startTime, e.startUtcOffsetS);
  const end = formatClock(e.endTime, e.startUtcOffsetS);
  return start && end ? `${start}–${end}` : start;
}

/** 5230 m → "5,2 km"; 1 km'nin altı "850 m". */
function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

/** 6432 → "6.432 adım" */
function formatSteps(steps: number): string {
  return `${String(Math.round(steps)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} adım`;
}

/**
 * Etiketlenmemiş oturumlar listesi için ayrıntı: zaman satırı ("18:05–19:32 · 92 dk, aktif 78 dk") ve ölçüm satırı
 * ("ort. 142 nabız · ~640 kcal · 5,2 km · 6.432 adım"; ölçüm yoksa boş). Hatırlayıp etiketlemeye yardım eder.
 */
export function exerciseDetail(e: ExerciseSession): { time: string; metrics: string } {
  const minutes = wallClockMinutes(e);
  const active = e.activeDurationS !== null && e.activeDurationS > 0 ? Math.round(e.activeDurationS / 60) : null;
  const duration =
    minutes === null ? '' : active !== null && active > 0 && active < minutes ? `${minutes} dk, aktif ${active} dk` : `${minutes} dk`;
  const metrics: string[] = [];
  if (e.avgHrBpm !== null) metrics.push(`ort. ${e.avgHrBpm} nabız`);
  const kcal = kcalShort(e.kcal);
  if (kcal) metrics.push(kcal);
  if (e.distanceM !== null && e.distanceM > 0) metrics.push(formatDistance(e.distanceM));
  if (e.steps !== null && e.steps > 0) metrics.push(formatSteps(e.steps));
  return { time: [formatClockRange(e), duration].filter((p) => p !== '').join(' · '), metrics: metrics.join(' · ') };
}

/** Gün başlığı: "Bugün", "Dün" ya da "Sal 14 Ekim". */
export function exerciseDayLabel(localDate: string, today: string, yesterday: string): string {
  return localDate === today ? 'Bugün' : localDate === yesterday ? 'Dün' : formatShortDate(localDate);
}

/** Oturumları güne göre toplar: en yeni gün önce, gün içinde saat sırasıyla. */
export function groupExercisesByDay(exercises: readonly ExerciseSession[]): { localDate: string; exercises: ExerciseSession[] }[] {
  const byDay = new Map<string, ExerciseSession[]>();
  for (const e of [...exercises].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))) {
    const list = byDay.get(e.localDate);
    if (list) list.push(e);
    else byDay.set(e.localDate, [e]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([localDate, list]) => ({ localDate, exercises: list }));
}

/** Etiket bekleyen saat oturumları: "Seans değil" denmemiş ve hiçbir seans kaydına bağlanmamış, eskiden yeniye. */
export function pendingExercises(
  exercises: readonly ExerciseSession[],
  sessions: readonly LinkableSession[],
): ExerciseSession[] {
  const linked = new Set(sessions.map((s) => s.exerciseSessionId).filter((id): id is string => id !== null));
  return exercises
    .filter((e) => !e.dismissed && !linked.has(e.id))
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

/** Saat oturumuyla aynı güne elle girilmiş, henüz hiçbir oturuma bağlanmamış seans kayıtları. */
export function linkCandidates<T extends LinkableSession>(exercise: Pick<ExerciseSession, 'localDate'>, sessions: readonly T[]): T[] {
  return sessions.filter((s) => s.localDate === exercise.localDate && s.exerciseSessionId === null);
}
