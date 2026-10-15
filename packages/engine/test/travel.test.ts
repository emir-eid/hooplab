// Seyahat ve jet lag (karar 0047): sentetik seyahatlerle.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { adaptationDays, addIsoDays, travelReading, upcomingTrips, type Trip } from '../src/index.ts';

const depart = '2026-11-10';
const at = (d: number) => addIsoDays(depart, d);
const trip = (offsetHours: number, returnIn: number | null = 10): Trip => ({
  departDate: depart,
  returnDate: returnIn === null ? null : at(returnIn),
  offsetHours,
});

test('uyum hızı: batıda günde 2 saat, doğuda günde 1 saat; yukarı yuvarlı', () => {
  assert.equal(adaptationDays(7, 'east'), 7);
  assert.equal(adaptationDays(7, 'west'), 4);
  assert.equal(adaptationDays(8, 'west'), 4);
  assert.equal(adaptationDays(0, 'east'), 0);
});

test('saat farkı yok ya da 3 saatten az: yalnız gidiş ve dönüş günü, jet lag yok', () => {
  const t = trip(0, 2);
  assert.equal(travelReading(at(-1), [t]), null);
  const go = travelReading(depart, [t])!;
  assert.equal(go.phase, 'departure');
  assert.equal(go.jetLag, false);
  assert.equal(go.direction, null);
  assert.equal(travelReading(at(1), [t]), null);
  assert.equal(travelReading(at(2), [t])!.phase, 'return');
  assert.equal(travelReading(at(3), [t]), null);
  assert.equal(travelReading(at(1), [trip(2, 4)]), null);
});

test('doğuya 7 saat: öncesinde 4 gün, varış yerinde gün gün kalan uyum, ilk 72 saat', () => {
  const t = trip(7, 10);
  assert.equal(travelReading(at(-5), [t]), null);
  const before = travelReading(at(-4), [t])!;
  assert.equal(before.phase, 'before');
  assert.equal(before.daysUntil, 4);
  assert.equal(before.totalDays, 7);
  const go = travelReading(depart, [t])!;
  assert.deepEqual([go.phase, go.dayAway, go.remainingDays, go.firstHours], ['departure', 1, 7, true]);
  const d3 = travelReading(at(2), [t])!;
  assert.deepEqual([d3.phase, d3.dayAway, d3.remainingDays, d3.firstHours], ['away', 3, 5, true]);
  assert.equal(travelReading(at(3), [t])!.firstHours, false);
  assert.equal(travelReading(at(8), [t])!.remainingDays, 0);
});

test('batıya 8 saat: 4 günde uyum; dönüşte ters yön (doğu) uyum sağlanan kadar', () => {
  const t = trip(-8, 10);
  assert.equal(travelReading(depart, [t])!.totalDays, 4);
  assert.equal(travelReading(at(2), [t])!.remainingDays, 2);
  const back = travelReading(at(10), [t])!;
  assert.deepEqual([back.phase, back.direction, back.totalDays, back.remainingDays], ['return', 'east', 8, 8]);
  assert.equal(travelReading(at(13), [t])!.remainingDays, 5);
  assert.equal(travelReading(at(18), [t]), null);
});

test('kısa kalış: dönüşte yalnız sağlanan uyum geri alınır', () => {
  // Doğuya 7 saat, 2 gün kalış: 2 saat uyum; dönüş batıya, günde 2 saat → 1 gün.
  const t = trip(7, 2);
  const back = travelReading(at(2), [t])!;
  assert.deepEqual([back.direction, back.totalDays, back.remainingDays], ['west', 1, 1]);
  assert.equal(travelReading(at(3), [t]), null);
});

test('doğuya 8 saatten fazla: geri alarak uyum notu; dönüş günü bilinmiyorsa uyum bitince not kalkar', () => {
  assert.equal(travelReading(depart, [trip(9, null)])!.eastDelayHint, true);
  assert.equal(travelReading(depart, [trip(8, null)])!.eastDelayHint, false);
  const open = trip(4, null);
  assert.equal(travelReading(at(3), [open])!.remainingDays, 1);
  assert.equal(travelReading(at(4), [open]), null);
});

test('birden çok seyahat: yolculuk günü öncelikli; geçersiz saat farkı yok sayılır', () => {
  const later: Trip = { departDate: at(3), returnDate: at(9), offsetHours: -6 };
  const now = trip(0, 0);
  assert.equal(travelReading(depart, [later, now])!.trip, now);
  assert.equal(travelReading(depart, [{ ...now, offsetHours: 20 }]), null);
});

test('takvimdeki seyahatler: bitmemiş olanlar, gidişe göre sıralı', () => {
  const past: Trip = { departDate: at(-20), returnDate: at(-15), offsetHours: 0 };
  const open: Trip = { departDate: at(-5), returnDate: null, offsetHours: 3 };
  assert.deepEqual(upcomingTrips(depart, [trip(0), past, open]), [open, trip(0)]);
});
