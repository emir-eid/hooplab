// Seans etiketleme (karar 0020): saatin kaydettiği egzersiz oturumları ile elle girilen seans kayıtlarının
// eşleşmesi. Saat zamanı ve süreyi verir; tür ve RPE kullanıcıdan gelir. Bu dosya saf: veri erişimi daily-log.ts'te.

import { durationLimits } from '@hooplab/engine';

import type { SessionKind } from '../copy/labels.ts';
import { formatShortDay } from '../utils/format-date.ts';

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
  const t = Date.parse(e.startTime);
  if (!Number.isFinite(t)) return '';
  let h: number;
  let m: number;
  if (e.startUtcOffsetS === null) {
    const d = new Date(t);
    h = d.getHours();
    m = d.getMinutes();
  } else {
    const d = new Date(t + e.startUtcOffsetS * 1000);
    h = d.getUTCHours();
    m = d.getUTCMinutes();
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Listede ve formda tek satırlık özet: "Basketbol" / "Dün · 18:05 · 92 dk · ort. 142 nabız".
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
  return { title: exerciseLabel(e), detail: parts.filter((p) => p !== '').join(' · ') };
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
