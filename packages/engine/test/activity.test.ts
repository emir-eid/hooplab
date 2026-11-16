// Aktivite (karar 0061 sıra 6): sentetik adım ve seanslarla (gerçek kayıt yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readSteps, readWeeklyActivity, type ActivitySession, type DayValue } from '../src/index.ts';

const day = (date: string, value: number | null): DayValue => ({ date, value });
// 2026-10-12 pazartesi, 2026-10-18 pazar.
const monday = '2026-10-12';

test('adım: bugün, dün ve bugünden önceki 7 günün ortalaması; sıfır ve boş gün sayılmaz', () => {
  const days = [
    day('2026-10-18', 4200),
    day('2026-10-17', 8000),
    day('2026-10-16', 6000),
    day('2026-10-15', 0),
    day('2026-10-14', null),
    day('2026-10-11', 9000),
    day('2026-10-10', 1000),
  ];
  const r = readSteps(days, '2026-10-18');
  assert.equal(r.today, 4200);
  assert.equal(r.yesterday, 8000);
  // 17, 16 ve 11 pencerede (11 = 7 gün önce); 10 pencere dışında.
  assert.equal(r.averageN, 3);
  assert.equal(r.average, (8000 + 6000 + 9000) / 3);
  const empty = readSteps([], '2026-10-18');
  assert.deepEqual(empty, { today: null, yesterday: null, average: null, averageN: 0 });
});

const s = (date: string, kind: string, durationMin: number, rpe: number): ActivitySession => ({ date, kind, durationMin, rpe });

test('haftalık aktivite: RPE ile orta / yüksek / hafif ayrılır, kuvvet günü RPE 5 ve üstü', () => {
  const r = readWeeklyActivity(
    [
      s('2026-10-12', 'conditioning', 40, 5),
      s('2026-10-13', 'conditioning', 30, 6),
      s('2026-10-14', 'conditioning', 20, 8),
      s('2026-10-14', 'conditioning', 10, 10),
      s('2026-10-15', 'conditioning', 25, 3),
      s('2026-10-12', 'strength', 50, 6),
      s('2026-10-12', 'strength', 20, 7),
      s('2026-10-16', 'strength', 45, 4),
      s('2026-10-17', 'mobility', 30, 6),
      s('2026-10-11', 'conditioning', 200, 6),
      s('2026-10-19', 'strength', 40, 8),
    ],
    monday,
    '2026-10-18',
  );
  assert.equal(r.moderateMinutes, 70);
  assert.equal(r.vigorousMinutes, 30);
  assert.equal(r.lightMinutes, 25);
  assert.equal(r.strengthDays, 1);
  assert.equal(r.aerobicMet, false);
  assert.equal(r.strengthMet, false);
  assert.equal(r.hasSessions, true);
});

test('haftalık aktivite: orta ve yüksek toplanmaz; biri alt sınırı geçerse karşılanır', () => {
  // 100 orta + 60 yüksek: toplam 160 ama ikisi de alt sınırın altında.
  const mixed = readWeeklyActivity([s('2026-10-12', 'conditioning', 100, 5), s('2026-10-13', 'conditioning', 60, 7)], monday, '2026-10-18');
  assert.equal(mixed.aerobicMet, false);
  const moderate = readWeeklyActivity([s('2026-10-12', 'conditioning', 150, 6)], monday, '2026-10-18');
  assert.equal(moderate.aerobicMet, true);
  const vigorous = readWeeklyActivity([s('2026-10-12', 'conditioning', 75, 9)], monday, '2026-10-18');
  assert.equal(vigorous.aerobicMet, true);
  const strength = readWeeklyActivity([s('2026-10-12', 'strength', 30, 5), s('2026-10-15', 'strength', 30, 5)], monday, '2026-10-18');
  assert.equal(strength.strengthMet, true);
});

test('haftalık aktivite: süren haftada bugünden sonrası sayılmaz; kayıt yoksa hasSessions false', () => {
  const r = readWeeklyActivity([s('2026-10-12', 'conditioning', 30, 5), s('2026-10-14', 'conditioning', 30, 5)], monday, '2026-10-13');
  assert.equal(r.moderateMinutes, 30);
  assert.equal(readWeeklyActivity([s('2026-10-12', 'mobility', 30, 5)], monday, '2026-10-18').hasSessions, false);
});
