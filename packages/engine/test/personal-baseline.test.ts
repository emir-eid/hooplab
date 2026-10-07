// Solunum bandı ve tek gece notu, check-in z-skoru (karar 0028): sentetik verilerle.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addIsoDays,
  checkinBaseline,
  readCheckin,
  readRespiration,
  type CheckinDay,
  type DayValue,
  type WellnessAnswers,
} from '../src/index.ts';

const today = '2026-10-31';
const day = (n: number) => addIsoDays(today, -n);

/** 35 gece: önceki 28 gün 15,0 / 15,4 dönüşümlü, son 7 gün `recent`, son gece `last`. */
function nights(recent: number, last: number | null): DayValue[] {
  const out: DayValue[] = [];
  for (let i = 34; i >= 7; i--) out.push({ date: day(i), value: i % 2 ? 15.0 : 15.4 });
  for (let i = 6; i >= 1; i--) out.push({ date: day(i), value: recent });
  if (last !== null) out.push({ date: today, value: last });
  return out;
}

test('solunum bandı ham değerle: ortalama 15,2, 7 günlük ortalama bandın üstünde', () => {
  const r = readRespiration(nights(16.5, 16.5), today);
  assert.ok(r.band && Math.abs(r.band.mean - 15.2) < 1e-9);
  assert.equal(r.position, 'above');
  assert.equal(r.nightHigh, false);
});

test('tek gece notu: son gece bandın ortalamasının 3 nefes/dk veya fazla üstünde', () => {
  assert.equal(readRespiration(nights(15.2, 18.2), today).nightHigh, true);
  assert.equal(readRespiration(nights(15.2, 18.1), today).nightHigh, false);
});

test('tek gece notu: bant yoksa veya son gece eski ise null', () => {
  const short = [{ date: today, value: 20 }, { date: day(1), value: 15 }, { date: day(2), value: 15 }];
  assert.equal(readRespiration(short, today).nightHigh, null);
  // Son ölçüm iki gün önce: bugünün ve dünün gecesi yok.
  const stale = nights(15.2, null).filter((n) => n.date < day(1));
  assert.equal(readRespiration(stale, today).nightHigh, null);
  // Dünün gecesi sayılır (bugünkü senkron henüz gelmemiş olabilir).
  const yesterday = nights(15.2, null).map((n) => (n.date === day(1) ? { ...n, value: 19 } : n));
  assert.equal(readRespiration(yesterday, today).nightHigh, true);
});

const answers = (v: number, fatigue = v): WellnessAnswers => ({ sleep_quality: v, fatigue, soreness: v, stress: v, mood: v });

/** Önceki 28 günde n check-in: toplamlar 19 ve 21 dönüşümlü (ortalama 20). */
function history(n: number): CheckinDay[] {
  const out: CheckinDay[] = [];
  for (let i = 1; i <= n; i++) {
    out.push({ date: day(i), answers: i % 2 ? { ...answers(4), mood: 3 } : { ...answers(4), mood: 5 } });
  }
  return out;
}

test('check-in z-skoru: önceki 28 günün ortalaması ve örneklem SD\'si, bugün hariç', () => {
  const r = readCheckin([...history(14), { date: today, answers: answers(4) }], today);
  assert.equal(r.baselineN, 14);
  assert.equal(r.baselineMean, 20);
  assert.ok(r.baselineSd !== null && Math.abs(r.baselineSd - Math.sqrt(14 / 13)) < 1e-9);
  assert.equal(r.total, 20);
  assert.equal(r.z, 0);
  assert.equal(r.low, false);
});

test('check-in: z ≤ −1 not düşer, en çok düşen madde başta', () => {
  const r = readCheckin([...history(14), { date: today, answers: answers(4, 2) }], today);
  assert.equal(r.total, 18);
  assert.ok(r.z !== null && r.z <= checkinBaseline.zNoteMax);
  assert.equal(r.low, true);
  assert.equal(r.drops[0]?.item, 'fatigue');
  assert.equal(r.drops[0]?.drop, 2);
  // Ruh hali ortalaması 4, bugün 4: düşüş yok, listede değil.
  assert.ok(!r.drops.some((d) => d.item === 'mood'));
});

test('check-in: 12 değerden az başlangıçta z yok; 28 günden eski kayıt sayılmaz', () => {
  const few = readCheckin([...history(11), { date: today, answers: answers(2) }], today);
  assert.equal(few.z, null);
  assert.equal(few.baselineMean, null);
  assert.equal(few.total, 10);
  const old = history(14).map((d) => ({ ...d, date: addIsoDays(d.date, -28) }));
  assert.equal(readCheckin([...old, { date: today, answers: answers(4) }], today).baselineN, 0);
});

test('check-in: bugün yoksa veya eksikse z yok; SD 0 ise z yok', () => {
  const none = readCheckin(history(14), today);
  assert.equal(none.total, null);
  assert.equal(none.z, null);
  assert.equal(none.baselineMean, 20);
  const flat: CheckinDay[] = Array.from({ length: 14 }, (_, i) => ({ date: day(i + 1), answers: answers(4) }));
  const r = readCheckin([...flat, { date: today, answers: answers(2) }], today);
  assert.equal(r.baselineSd, 0);
  assert.equal(r.z, null);
  assert.equal(readCheckin([...history(14), { date: today, answers: { fatigue: 3 } }], today).total, null);
});
