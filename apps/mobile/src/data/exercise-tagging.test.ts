import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  exerciseLabel,
  exerciseSummary,
  type ExerciseSession,
  formatStartClock,
  linkCandidates,
  pendingExercises,
  suggestDurationMin,
  suggestKind,
  wallClockMinutes,
} from './exercise-tagging.ts';

// Sentetik oturumlar.
function exercise(over: Partial<ExerciseSession> & Pick<ExerciseSession, 'id'>): ExerciseSession {
  return {
    localDate: '2026-01-05',
    startTime: '2026-01-05T15:00:00Z',
    endTime: '2026-01-05T16:32:00Z',
    startUtcOffsetS: 10_800,
    exerciseType: 'SPORT',
    displayName: null,
    avgHrBpm: null,
    dismissed: false,
    ...over,
  };
}

test('basketbol ve "Spor" için tür önerilmez; kesin tipler önceden seçilir', () => {
  assert.equal(suggestKind('SPORT'), null);
  assert.equal(suggestKind('BASKETBALL'), null);
  assert.equal(suggestKind('STRENGTH_TRAINING'), 'strength');
  assert.equal(suggestKind('CROSSFIT'), 'conditioning');
  assert.equal(suggestKind('YOGA'), 'mobility');
  assert.equal(suggestKind('WALKING'), null);
  assert.equal(suggestKind('SURFING'), null);
});

test('ad: bilinen tip Türkçe, bilinmeyende saatin adı, o da yoksa genel ad', () => {
  assert.equal(exerciseLabel({ exerciseType: 'BASKETBALL', displayName: 'Basketball' }), 'Basketbol');
  assert.equal(exerciseLabel({ exerciseType: 'SURFING', displayName: 'Sörf' }), 'Sörf');
  assert.equal(exerciseLabel({ exerciseType: 'EXERCISE_TYPE_UNSPECIFIED', displayName: null }), 'Egzersiz');
});

test('süre: başından sonuna, 5 dakikalık adıma yuvarlanır, sınırlar içinde kalır', () => {
  const e = exercise({ id: 'a' }); // 92 dk
  assert.equal(wallClockMinutes(e), 92);
  assert.equal(suggestDurationMin(e), 90);
  assert.equal(suggestDurationMin({ startTime: '2026-01-05T15:00:00Z', endTime: '2026-01-05T15:03:00Z' }), 5);
  assert.equal(suggestDurationMin({ startTime: '2026-01-05T00:00:00Z', endTime: '2026-01-05T12:00:00Z' }), 600);
  assert.equal(suggestDurationMin({ startTime: '2026-01-05T16:00:00Z', endTime: '2026-01-05T15:00:00Z' }), null);
  assert.equal(suggestDurationMin({ startTime: 'bozuk', endTime: '2026-01-05T15:00:00Z' }), null);
});

test('başlangıç saati oturumun yapıldığı yerin saatiyle gösterilir', () => {
  assert.equal(formatStartClock({ startTime: '2026-01-05T15:05:00Z', startUtcOffsetS: 10_800 }), '18:05');
  assert.equal(formatStartClock({ startTime: '2026-01-05T23:30:00Z', startUtcOffsetS: 10_800 }), '02:30');
  assert.equal(formatStartClock({ startTime: '2026-01-05T15:05:00Z', startUtcOffsetS: -18_000 }), '10:05');
  assert.equal(formatStartClock({ startTime: 'bozuk', startUtcOffsetS: 0 }), '');
});

test('bekleyenler: bağlanan ve "Seans değil" denen düşer, eskiden yeniye sıralanır', () => {
  const late = exercise({ id: 'late', startTime: '2026-01-05T17:00:00Z', endTime: '2026-01-05T18:00:00Z' });
  const early = exercise({ id: 'early', startTime: '2026-01-05T08:00:00Z', endTime: '2026-01-05T09:00:00Z' });
  const linked = exercise({ id: 'linked' });
  const dismissed = exercise({ id: 'walk', exerciseType: 'WALKING', dismissed: true });
  const sessions = [
    { id: 's1', localDate: '2026-01-05', exerciseSessionId: 'linked' },
    { id: 's2', localDate: '2026-01-05', exerciseSessionId: null },
  ];
  assert.deepEqual(
    pendingExercises([late, linked, dismissed, early], sessions).map((e) => e.id),
    ['early', 'late'],
  );
});

test('eşleşme adayları: aynı gün, henüz bağlanmamış elle girilen kayıtlar', () => {
  const sessions = [
    { id: 'same-day', localDate: '2026-01-05', exerciseSessionId: null },
    { id: 'already-linked', localDate: '2026-01-05', exerciseSessionId: 'x' },
    { id: 'other-day', localDate: '2026-01-04', exerciseSessionId: null },
  ];
  assert.deepEqual(
    linkCandidates({ localDate: '2026-01-05' }, sessions).map((s) => s.id),
    ['same-day'],
  );
});

test('özet: gün bugün / dün / kısa gün adı; nabız yoksa yazılmaz', () => {
  const e = exercise({ id: 'a', avgHrBpm: 142 });
  assert.deepEqual(exerciseSummary(e, '2026-01-06', '2026-01-05'), {
    title: 'Spor',
    detail: 'Dün · 18:00 · 92 dk · ort. 142 nabız',
  });
  assert.equal(exerciseSummary(e, '2026-01-05', '2026-01-04').detail, 'Bugün · 18:00 · 92 dk · ort. 142 nabız');
  assert.equal(
    exerciseSummary({ ...e, avgHrBpm: null }, '2026-01-09', '2026-01-08').detail,
    'Pzt · 18:00 · 92 dk',
  );
});
