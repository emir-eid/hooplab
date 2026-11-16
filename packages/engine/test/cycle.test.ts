// Döngü (karar 0061 sıra 5; rules/dongu.json): başlangıçlar, döngü günü, evre, düzensiz bayrağı ve not. Veriler sentetik.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addIsoDays, cycleDayFor, cycleDaysBetween, cycleNote, menstrualOnsets, type FlowDay } from '../src/index.ts';

/** `start` gününden başlayan `days` günlük akış. */
function period(start: string, days = 5, startFlag = false): FlowDay[] {
  return Array.from({ length: days }, (_, i) => ({ date: addIsoDays(start, i), ...(i === 0 && startFlag ? { start: true } : {}) }));
}

// 28 günlük üç tam döngü: başlangıçlar 1 Oca, 29 Oca, 26 Şub, 26 Mar.
const onsetDates = ['2026-01-01', '2026-01-29', '2026-02-26', '2026-03-26'];
const regularFlow = onsetDates.flatMap((d) => period(d));

test('başlangıç: önceki 7 günde akış yoksa yeni adet; lekelenme aynı döngüde kalır; Sağlık işareti sayılır', () => {
  assert.deepEqual(menstrualOnsets(regularFlow), onsetDates);
  // Adetten 4 gün sonra tek günlük lekelenme: yeni döngü değil.
  assert.deepEqual(menstrualOnsets([...period('2026-01-01'), { date: '2026-01-09' }]), ['2026-01-01']);
  // 8 gün boşluktan sonra akış: yeni döngü.
  assert.deepEqual(menstrualOnsets([...period('2026-01-01'), { date: '2026-01-13' }]), ['2026-01-01', '2026-01-13']);
  // Sağlık "döngü başlangıcı" işaretlediyse boşluk kısa olsa da başlangıç.
  assert.deepEqual(menstrualOnsets([...period('2026-01-01'), { date: '2026-01-09', start: true }]), ['2026-01-01', '2026-01-09']);
  // Sıra ve yinelenen günler önemsiz.
  assert.deepEqual(menstrualOnsets([...regularFlow].reverse().concat(regularFlow)), onsetDates);
});

test('döngü günü: başlangıç günü 1; başlangıçtan önce gün yok', () => {
  const onsets = menstrualOnsets(regularFlow);
  assert.equal(cycleDayFor('2025-12-31', onsets), null);
  assert.equal(cycleDayFor('2026-03-26', onsets)?.cycleDay, 1);
  assert.equal(cycleDayFor('2026-04-10', onsets)?.cycleDay, 16);
});

test('evre: düzenli 28 günlük döngüde geri sayım (schmalenberger-2019 Tablo 2)', () => {
  const onsets = menstrualOnsets(regularFlow);
  const phaseOn = (day: number) => cycleDayFor(addIsoDays('2026-03-26', day - 1), onsets)?.phase;
  assert.equal(phaseOn(1), 'adet');
  assert.equal(phaseOn(7), 'adet');
  assert.equal(phaseOn(8), 'folikuler');
  assert.equal(phaseOn(13), 'folikuler'); // yumurtlama penceresi (−15 / −12) kaba evrede foliküler
  assert.equal(phaseOn(17), 'folikuler'); // 28 günde −12
  assert.equal(phaseOn(18), 'luteal'); // −11
  assert.equal(phaseOn(21), 'luteal'); // −8
  assert.equal(phaseOn(22), 'adet_oncesi'); // −7
  assert.equal(phaseOn(28), 'adet_oncesi'); // −1
  // Beklenen gün geçti, adet yok: evre boş, düzensiz değil (35. güne kadar).
  assert.deepEqual(cycleDayFor(addIsoDays('2026-03-26', 29), onsets), { date: '2026-04-24', cycleDay: 30, phase: null, irregular: false });
});

test('evre: beklenen uzunluk son 3 döngünün ortancası', () => {
  // Döngüler 24, 32, 26 gün → ortanca 26: adet öncesi 20-26. günler.
  const starts = ['2026-01-01', '2026-01-25', '2026-02-26', '2026-03-24'];
  const onsets = menstrualOnsets(starts.flatMap((d) => period(d)));
  assert.deepEqual(onsets, starts);
  const phaseOn = (day: number) => cycleDayFor(addIsoDays('2026-03-24', day - 1), onsets)?.phase;
  assert.equal(phaseOn(15), 'folikuler'); // −12
  assert.equal(phaseOn(16), 'luteal'); // −11
  assert.equal(phaseOn(19), 'luteal'); // −8
  assert.equal(phaseOn(20), 'adet_oncesi');
  assert.equal(phaseOn(26), 'adet_oncesi');
  assert.equal(phaseOn(27), null);
});

test('geçmiş az: 2 tam döngüden azsa yalnız ileri sayım (adet 1-7, foliküler 8-12), sonrası evresiz', () => {
  const onsets = menstrualOnsets([...period('2026-01-01'), ...period('2026-01-29')]);
  const phaseOn = (day: number) => cycleDayFor(addIsoDays('2026-01-29', day - 1), onsets)?.phase;
  assert.equal(phaseOn(3), 'adet');
  assert.equal(phaseOn(12), 'folikuler');
  assert.equal(phaseOn(13), null);
  assert.equal(phaseOn(25), null);
});

test('düzenli aralık dışı kısa döngü: geri sayım yok, düzensiz de sayılmaz', () => {
  // 18 günlük bir döngü son üç döngünün içinde.
  const starts = ['2026-01-01', '2026-01-29', '2026-02-16', '2026-03-16'];
  const onsets = menstrualOnsets(starts.flatMap((d) => period(d)));
  const day = cycleDayFor('2026-04-08', onsets);
  assert.deepEqual(day, { date: '2026-04-08', cycleDay: 24, phase: null, irregular: false });
});

test('düzensiz: 35 günü aşan döngü, 35. günü geçen mevcut döngü, son 6 ayda Sağlık sapma kaydı', () => {
  const longCycle = menstrualOnsets(['2026-01-01', '2026-02-10', '2026-03-10', '2026-04-07'].flatMap((d) => period(d)));
  assert.deepEqual(cycleDayFor('2026-04-28', longCycle), { date: '2026-04-28', cycleDay: 22, phase: null, irregular: true });
  // Uzun döngü son üç döngünün dışına çıkınca düzensiz kalkar.
  const later = menstrualOnsets(['2026-01-01', '2026-02-10', '2026-03-10', '2026-04-07', '2026-05-05'].flatMap((d) => period(d)));
  assert.equal(cycleDayFor('2026-05-28', later)?.irregular, false);

  const onsets = menstrualOnsets(regularFlow);
  assert.deepEqual(cycleDayFor('2026-05-01', onsets), { date: '2026-05-01', cycleDay: 37, phase: null, irregular: true });
  assert.equal(cycleDayFor('2026-04-10', onsets, ['2026-01-15'])?.irregular, true);
  assert.equal(cycleDayFor('2026-04-10', onsets, ['2025-09-01'])?.irregular, false); // 182 günden eski
  assert.equal(cycleDayFor('2026-04-10', onsets, ['2026-04-20'])?.irregular, false); // günden sonra
});

test('aralık: yalnız başlangıcı olan günler; sınırlar dahil', () => {
  const days = cycleDaysBetween('2025-12-30', '2026-01-03', regularFlow);
  assert.deepEqual(days.map((d) => [d.date, d.cycleDay]), [['2026-01-01', 1], ['2026-01-02', 2], ['2026-01-03', 3]]);
});

test('not: yalnız adet öncesinde, HRV düşük ya da uyku nabzı yüksekken; korunmada zayıf; düzensizde hekim notu', () => {
  const pm = { phase: 'adet_oncesi' as const, irregular: false };
  assert.deepEqual(cycleNote(pm, ['hrv_low', 'sleep_short'], 'yok'), { kind: 'compatible', signals: ['hrv_low'], weak: false });
  assert.deepEqual(cycleNote(pm, ['rhr_high', 'hrv_low'], 'var'), { kind: 'compatible', signals: ['rhr_high', 'hrv_low'], weak: true });
  assert.deepEqual(cycleNote(pm, ['hrv_low'], 'belirtmek_istemiyorum'), { kind: 'compatible', signals: ['hrv_low'], weak: false });
  assert.equal(cycleNote(pm, ['sleep_short', 'hrv_high'], 'yok'), null);
  assert.equal(cycleNote({ phase: 'luteal', irregular: false }, ['hrv_low'], 'yok'), null);
  assert.equal(cycleNote({ phase: null, irregular: false }, ['hrv_low'], 'yok'), null);
  assert.equal(cycleNote(null, ['hrv_low'], 'yok'), null);
  assert.deepEqual(cycleNote({ phase: null, irregular: true }, [], 'yok'), { kind: 'irregular' });
});
