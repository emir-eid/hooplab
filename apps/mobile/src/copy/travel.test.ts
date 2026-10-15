// Seyahat kartının metinleri (karar 0047): sentetik seyahatlerle.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addIsoDays, travelReading, type Trip } from '@hooplab/engine';

import { offsetLabel, travelNote, tripRowLabel } from './travel.ts';

const depart = '2026-11-10';
const at = (d: number) => addIsoDays(depart, d);
const note = (offsetHours: number, day: number, returnIn: number | null = 10) =>
  travelNote(travelReading(at(day), [{ departDate: depart, returnDate: returnIn === null ? null : at(returnIn), offsetHours }]));

test('saat farkı etiketi ve takvim satırı', () => {
  assert.equal(offsetLabel(0), 'Saat farkı yok');
  assert.equal(offsetLabel(7), '+7 sa (doğu)');
  assert.equal(offsetLabel(-6), '−6 sa (batı)');
  const t: Trip = { departDate: depart, returnDate: null, offsetHours: 0 };
  assert.equal(tripRowLabel(t), 'Sal 10 Kasım → dönüş belli değil');
});

test('seyahat yoksa kart yok; saat farksız yolculuk günü yorgunluk notları', () => {
  assert.equal(travelNote(null), null);
  const n = note(0, 0)!;
  assert.equal(n.title, 'Bugün yolculuk · Saat farkı yok');
  assert.deepEqual(n.lines.map((l) => l.label), ['Yolculuk', 'Kafein ve alkol', 'Saat farkı']);
  assert.match(n.lines[1]!.text, /en az 6 saat önce/);
});

test('doğuya jet lag: öncesi, yolculuk, varış yerinde kalan uyum ve ilk 72 saat', () => {
  const before = note(7, -3)!;
  assert.equal(before.title, 'Seyahat · 3 gün sonra · +7 sa (doğu)');
  assert.match(before.lines[0]!.text, /~7 günde uyar \(doğuda saat dilimi başına ~1 gün\)/);
  assert.match(before.lines[1]!.text, /30-60 dakika öne çek/);
  const go = note(7, 0)!;
  assert.ok(go.lines.some((l) => l.label === 'Uyum' && /~7 gün/.test(l.text)));
  const d3 = note(7, 2)!;
  assert.equal(d3.title, 'Seyahat · 3. gün · +7 sa (doğu)');
  assert.match(d3.lines[0]!.text, /Kalan uyum: ~5 gün/);
  assert.match(d3.lines[1]!.text, /ilk 72 saatte/);
});

test('batıya: yarım gün; dönüşte ters yön; büyük doğu farkında not', () => {
  assert.match(note(-8, -1)!.lines[0]!.text, /batıda saat dilimi başına ~0,5 gün/);
  const back = note(-8, 10)!;
  assert.equal(back.title, 'Bugün dönüş · −8 sa (batı)');
  assert.ok(back.lines.some((l) => /Eve dönünce uyum: ~8 gün \(doğuda/.test(l.text)));
  assert.ok(note(10, 0, null)!.lines.some((l) => l.label === 'Büyük fark'));
});
