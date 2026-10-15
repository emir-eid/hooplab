// Maç çevresi kartının metinleri (karar 0046): sentetik maçlarla.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Match, MatchesAround } from '@hooplab/engine';

import { matchMeta, matchNote, matchRowLabel } from './match.ts';

const m = (startTime: string | null, venue: Match['venue'] = 'away'): Match => ({ date: '2026-11-02', startTime, venue });
const around = (over: Partial<MatchesAround>): MatchesAround => ({ yesterday: null, today: null, tomorrow: null, ...over });

test('maç yoksa kart yok', () => {
  assert.equal(matchNote(around({}), 80), null);
});

test('maç günü: öğün, sıvı, şekerleme saatleri ve gramlar; maçtan sonra', () => {
  const n = matchNote(around({ today: m('19:00') }), 80)!;
  assert.equal(n.title, 'Bugün maç · 19:00 · Deplasman');
  assert.deepEqual(
    n.lines.map((l) => l.label),
    ['Öğün 15:00–16:00', 'Sıvı 15:00–17:00', 'Şekerleme 12:30–16:50', 'Maçtan sonra'],
  );
  assert.match(n.lines[0]!.text, /80–240 g karbonhidrat/);
  assert.match(n.lines[1]!.text, /400–560 mL/);
  assert.match(n.lines[3]!.text, /saatte ~80 g/);
  assert.match(n.lines[3]!.text, /~80 dakika/);
  assert.equal(n.askTime, false);
});

test('maç saati yoksa saat sorulur; kilo yoksa g/kg', () => {
  const n = matchNote(around({ today: m(null, null) }), null)!;
  assert.equal(n.title, 'Bugün maç');
  assert.equal(n.askTime, true);
  assert.deepEqual(n.lines.map((l) => l.label), ['Maçtan sonra']);
  assert.match(n.lines[0]!.text, /saatte ~1 g\/kg/);
  assert.match(matchNote(around({ today: m('19:00') }), null)!.lines[0]!.text, /1–3 g\/kg/);
});

test('yarın maç: karbonhidrat ve uyku; dün maç: uyku ve toparlanma', () => {
  const before = matchNote(around({ tomorrow: m('20:30', 'home') }), 80)!;
  assert.equal(before.title, 'Yarın maç · 20:30 · İç saha');
  assert.deepEqual(before.lines.map((l) => l.label), ['Karbonhidrat', 'Uyku']);
  assert.match(before.lines[0]!.text, /6–8 g\/kg/);
  const after = matchNote(around({ yesterday: m('13:00') }), 80)!;
  assert.deepEqual(after.lines.map((l) => l.label), ['Dünkü maç', 'Toparlanma']);
  assert.match(after.lines[0]!.text, /Gündüz maçından sonraki gece uyku ortalama ~20 dakika/);
  assert.match(after.lines[1]!.text, /24–48 saat/);
  // Arka arkaya: dün ve bugün maç
  const b2b = matchNote(around({ yesterday: m('20:00'), today: m('19:00') }), 80)!;
  assert.ok(b2b.title.startsWith('Bugün maç'));
  assert.ok(b2b.lines.some((l) => l.label === 'Dünkü maç'));
});

test('takvim satırı ve meta', () => {
  assert.equal(matchMeta(m(null, null)), '');
  assert.equal(matchRowLabel(m('19:00'), '2026-11-02', '2026-11-03'), 'Bugün · Pzt 2 Kasım');
  assert.equal(matchRowLabel(m('19:00'), '2026-11-01', '2026-11-02'), 'Yarın · Pzt 2 Kasım');
});
