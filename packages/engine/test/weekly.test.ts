// Haftalık rapor motoru (karar 0040): sentetik seans ve tartılarla (gerçek kayıt yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addIsoDays,
  elapsedDates,
  isWeekStart,
  meanOf,
  readCompletedWeekLoad,
  readTrainingLoad,
  readWeeklyCheckin,
  readWeeklyLoad,
  readWeeklyWeight,
  tally,
  weekDates,
  weekPhase,
  weekStartOf,
  weeklyHistoryWeeks,
  type LoadSession,
} from '../src/index.ts';

// 2026-10-12 pazartesi, 2026-10-18 pazar.
const monday = '2026-10-12';
const sunday = '2026-10-18';

test('hafta pazartesi başlar', () => {
  assert.equal(weekStartOf('2026-10-12'), monday);
  assert.equal(weekStartOf('2026-10-14'), monday);
  assert.equal(weekStartOf(sunday), monday);
  assert.equal(weekStartOf('2026-10-19'), '2026-10-19');
  // Yıl sınırı: 2027-01-01 cuma → 2026-12-28 pazartesi.
  assert.equal(weekStartOf('2027-01-01'), '2026-12-28');
  assert.equal(isWeekStart(monday), true);
  assert.equal(isWeekStart(sunday), false);
  assert.deepEqual(weekDates(monday), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', sunday]);
  assert.throws(() => weekDates(sunday));
});

test('haftanın evresi ve geçen günleri', () => {
  assert.equal(weekPhase(monday, '2026-10-14'), 'current');
  assert.equal(weekPhase(monday, sunday), 'current');
  assert.equal(weekPhase(monday, '2026-10-19'), 'complete');
  assert.equal(weekPhase('2026-10-19', sunday), 'future');
  assert.deepEqual(elapsedDates(monday, '2026-10-13'), ['2026-10-12', '2026-10-13']);
  assert.equal(elapsedDates(monday, '2026-10-30').length, 7);
});

/** Pazardan geriye `days` gün, her gün 60 dk × RPE 5 = 300 AU; `skip` günleri boş. */
function history(end: string, days: number, skip: (daysAgo: number) => boolean = () => false): LoadSession[] {
  const out: LoadSession[] = [];
  for (let i = 0; i < days; i++) if (!skip(i)) out.push({ date: addIsoDays(end, -i), rpe: 5, durationMin: 60 });
  return out;
}

test('tamamlanmış hafta pazarda biter, pazar seansı girilmemiş olsa da', () => {
  // Pazar dinlenme (seans yok), pazartesi yeni haftanın seansı var: hesap yine 12-18 Ekim.
  const sessions = [...history(sunday, 60, (i) => i === 0), { date: '2026-10-19', rpe: 8, durationMin: 100 }];
  const r = readCompletedWeekLoad(sessions, monday);
  assert.equal(r.asOf, sunday);
  assert.equal(r.week, 6 * 300);
  // Trend'in "bugün = pazar" okuması dinlenme pazarında cumartesiye kayar; rapor kaymaz.
  assert.equal(readTrainingLoad(sessions.filter((s) => s.date <= sunday), sunday).asOf, '2026-10-17');
});

test('tamamlanmış hafta: toplam, önceki hafta, değişim ve geçmiş haftalar', () => {
  // Bu hafta her gün; önceki haftalarda pazarlar dinlenme.
  const sessions = history(sunday, 70, (i) => i >= 7 && i % 7 === 0);
  const r = readWeeklyLoad(sessions, monday, '2026-10-20');
  assert.equal(r.phase, 'complete');
  assert.equal(r.total, 7 * 300);
  assert.equal(r.previousTotal, 6 * 300);
  assert.ok(Math.abs(r.change! - 1 / 6) < 1e-9);
  assert.equal(r.days.length, 7);
  assert.equal(r.history.length, weeklyHistoryWeeks);
  assert.deepEqual(
    r.history.map((h) => h.weekStart),
    ['2026-10-05', '2026-09-28', '2026-09-21', '2026-09-14'],
  );
  assert.ok(r.history.every((h) => h.total === 6 * 300 && h.monotony !== null));
  // Bu haftanın her günü aynı: değişim 0, monotonluk hesaplanmaz.
  assert.equal(r.end?.monotony, null);
});

test('süren hafta: bugüne kadarki toplam, değişim ve monotonluk yok', () => {
  const sessions = history('2026-10-14', 40);
  const r = readWeeklyLoad(sessions, monday, '2026-10-14');
  assert.equal(r.phase, 'current');
  assert.equal(r.total, 3 * 300);
  assert.equal(r.days.length, 3);
  assert.equal(r.change, null);
  assert.equal(r.end, null);
  assert.equal(r.previousTotal, 7 * 300);
});

test('ilk kayıttan önce başlayan hafta: toplam bilinmiyor', () => {
  const sessions = [{ date: '2026-10-15', rpe: 5, durationMin: 60 }];
  const done = readWeeklyLoad(sessions, monday, '2026-10-25');
  assert.equal(done.total, null);
  assert.equal(done.previousTotal, null);
  const now = readWeeklyLoad(sessions, monday, '2026-10-16');
  assert.equal(now.total, null);
  assert.deepEqual(
    now.days.map((d) => d.date),
    ['2026-10-15', '2026-10-16'],
  );
  // historyStart (en eski kayıt) haftanın başındaysa bugüne kadarki toplam hesaplanır.
  assert.equal(readWeeklyLoad(sessions, monday, '2026-10-16', { historyStart: monday }).total, 300);
  assert.throws(() => readWeeklyLoad(sessions, '2026-10-19', '2026-10-16'));
});

test('sayım ve ortalama', () => {
  assert.deepEqual(tally(['ready', 'caution', 'ready', null]), { ready: 2, caution: 1 });
  assert.equal(meanOf([1, null, 3]), 2);
  assert.equal(meanOf([null]), null);
});

test('haftalık kilo: ortalama ve önceki haftaya göre fark', () => {
  const weights = [
    { date: '2026-10-06', value: 92 },
    { date: '2026-10-08', value: 93 },
    { date: '2026-10-13', value: 91.5 },
    { date: '2026-10-15', value: 92.5 },
    { date: '2026-10-17', value: null },
    { date: '2026-10-19', value: 99 }, // sonraki hafta
  ];
  const w = readWeeklyWeight(weights, monday, '2026-10-20');
  assert.equal(w.n, 2);
  assert.equal(w.mean, 92);
  assert.equal(w.previousMean, 92.5);
  assert.equal(w.change, -0.5);
  // Süren haftada bugünden sonrası sayılmaz.
  assert.equal(readWeeklyWeight(weights, monday, '2026-10-13').n, 1);
  assert.equal(readWeeklyWeight([], monday, sunday).change, null);
});

test('haftalık check-in: ortalama, başlangıç, düşük günler, en çok düşen madde', () => {
  const answers = (v: number, fatigue = v) => ({ sleep_quality: v, fatigue, soreness: v, stress: v, mood: v });
  const days = [];
  // Başlangıç: haftadan önceki 28 günde 14 check-in, toplam 20 ve 21 sırayla (SD > 0).
  for (let i = 1; i <= 14; i++) days.push({ date: addIsoDays(monday, -i), answers: i % 2 ? answers(4) : { ...answers(4), mood: 5 } });
  // Hafta: pazartesi olağan, salı yorgunluk 1 (toplam 17), çarşamba eksik check-in.
  days.push({ date: monday, answers: answers(4) });
  days.push({ date: '2026-10-13', answers: answers(4, 1) });
  days.push({ date: '2026-10-14', answers: { sleep_quality: 3 } });

  const w = readWeeklyCheckin(days, monday, sunday);
  assert.equal(w.n, 2);
  assert.equal(w.meanTotal, 18.5);
  assert.equal(w.baselineN, 14);
  assert.equal(w.baselineMean, 20.5);
  assert.deepEqual(w.lowDates, ['2026-10-13']);
  assert.equal(w.items[0]?.item, 'fatigue');
  assert.equal(w.items[0]?.mean, 2.5);
  assert.equal(w.items[0]?.baselineMean, 4);

  // Başlangıç yetersiz: kıyas yok, maddeler kendi sırasıyla.
  const thin = readWeeklyCheckin(days.filter((d) => d.date >= monday), monday, sunday);
  assert.equal(thin.baselineMean, null);
  assert.equal(thin.items[0]?.item, 'sleep_quality');
  assert.deepEqual(readWeeklyCheckin([], monday, sunday).items, []);
});
