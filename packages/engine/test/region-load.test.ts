// Kas ve tendon bölge yükü motoru: sentetik seanslarla (gerçek kayıt yok).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  addIsoDays,
  contentTags,
  defaultContentTags,
  modeledRegions,
  notModeledRegions,
  painNotes,
  readRegionLoad,
  regionsLoadedOn,
  regionWindowDays,
  sessionKinds,
  sessionRegions,
  tagRegions,
  type RegionLoad,
  type RegionSession,
} from '../src/index.ts';

const today = '2026-10-31';
const day = (daysAgo: number) => addIsoDays(today, -daysAgo);

function s(daysAgo: number, over: Partial<RegionSession> = {}): RegionSession {
  return { date: day(daysAgo), rpe: 5, durationMin: 60, kind: 'team_practice', tags: null, ...over };
}

const region = (r: { regions: RegionLoad[] }, name: RegionLoad['region']) => {
  const found = r.regions.find((x) => x.region === name);
  assert.ok(found, name);
  return found;
};

test('her tür için hazır etiket var; etiketler bilinen kümeden', () => {
  for (const kind of sessionKinds) {
    for (const t of defaultContentTags[kind]) assert.ok(contentTags.includes(t), `${kind}: ${t}`);
  }
});

test('modeldeki bölgeler: eşlemenin birleşimi; ayak bileği ve bel yok', () => {
  assert.deepEqual(
    [...modeledRegions],
    ['calf', 'achilles', 'patellar_tendon', 'quadriceps', 'hamstring', 'adductor', 'hip', 'shoulder'],
  );
  for (const r of notModeledRegions) assert.ok(!modeledRegions.includes(r), r);
});

test('pencere: tendon 2 takvim günü (48 saat), kas 3 takvim günü (72 saat)', () => {
  assert.equal(regionWindowDays('patellar_tendon'), 2);
  assert.equal(regionWindowDays('achilles'), 2);
  assert.equal(regionWindowDays('quadriceps'), 3);
  assert.equal(regionWindowDays('shoulder'), 3);
});

test('etiketsiz seans türün hazır etiketleriyle sayılır; boş dizi hiçbir bölgeyi çalıştırmaz', () => {
  assert.deepEqual([...sessionRegions({ kind: 'shooting', tags: null })].sort(), [...tagRegions.jump].sort());
  assert.equal(sessionRegions({ kind: 'game', tags: [] }).size, 0);
  assert.deepEqual([...sessionRegions({ kind: 'mobility', tags: ['upper_strength'] })], ['shoulder']);
});

test('bölge yükü: pencere içindeki eşlenen seansların yükü bölünmeden toplanır', () => {
  const r = readRegionLoad(
    [
      s(0, { kind: 'shooting', tags: null, rpe: 4, durationMin: 50 }), // sıçrama: patellar, Aşil → 200
      s(1, { kind: 'strength', tags: ['lower_strength'], rpe: 7, durationMin: 60 }), // quad, ham, kalça → 420
      s(2, { kind: 'game', tags: ['cod', 'sprint'], rpe: 8, durationMin: 100 }), // quad, add, ham, baldır, Aşil → 800
    ],
    today,
  );
  const patellar = region(r, 'patellar_tendon');
  assert.equal(patellar.load, 200);
  assert.equal(patellar.sessions, 1);
  assert.equal(patellar.defaultedSessions, 1);
  // Aşil tendon: 48 saat. İki gün önceki maç pencere dışında.
  assert.equal(region(r, 'achilles').load, 200);
  assert.equal(region(r, 'achilles').lastLoaded, today);
  // Quadriceps kas: 72 saat. Dünkü kuvvet ve iki gün önceki maç.
  const quad = region(r, 'quadriceps');
  assert.equal(quad.load, 1220);
  assert.equal(quad.sessions, 2);
  assert.equal(quad.recovering, true);
  assert.equal(quad.windowStart, day(2));
  // Omuz hiç çalışmadı.
  const shoulder = region(r, 'shoulder');
  assert.equal(shoulder.load, 0);
  assert.equal(shoulder.recovering, false);
  assert.equal(shoulder.lastLoaded, null);
  assert.equal(shoulder.daysSinceLoaded, null);
});

test('RPE 0 seans yük getirmez ama bölge pencerede çalışmış sayılır', () => {
  const r = readRegionLoad([s(0, { rpe: 0, tags: ['upper_strength'] })], today);
  assert.equal(region(r, 'shoulder').load, 0);
  assert.equal(region(r, 'shoulder').recovering, true);
});

test('geçersiz ve gelecekteki seans atlanır', () => {
  const r = readRegionLoad([s(0, { rpe: 11, tags: ['jump'] }), s(-1, { tags: ['jump'] }), s(0, { durationMin: 0, tags: ['jump'] })], today);
  assert.equal(region(r, 'patellar_tendon').sessions, 0);
});

test('son yüklenme: gün ve saati bilinen seansta bitişten bu yana saat', () => {
  const now = new Date('2026-10-31T09:00:00Z');
  const watched = s(1, { tags: ['jump'], durationMin: 90, startedAt: '2026-10-30T18:00:00Z' });
  const r = readRegionLoad([watched, s(5, { tags: ['upper_strength'] })], today, { now });
  const patellar = region(r, 'patellar_tendon');
  assert.equal(patellar.daysSinceLoaded, 1);
  assert.equal(patellar.hoursSinceLoaded, 13.5);
  // Saati bilinmeyen (elle girilen) seans: yalnız gün.
  const shoulder = region(r, 'shoulder');
  assert.equal(shoulder.daysSinceLoaded, 5);
  assert.equal(shoulder.hoursSinceLoaded, null);
  assert.equal(shoulder.recovering, false);
});

test('son yüklenme gününde saati bilinmeyen bir seans da varsa saat gösterilmez', () => {
  const now = new Date('2026-10-31T09:00:00Z');
  const r = readRegionLoad(
    [s(1, { tags: ['jump'], startedAt: '2026-10-30T10:00:00Z' }), s(1, { tags: ['jump'], kind: 'shooting' })],
    today,
    { now },
  );
  assert.equal(region(r, 'patellar_tendon').hoursSinceLoaded, null);
});

test('kıyas: pencereden önceki 28 günde aynı uzunluktaki pencerelerin ortalaması', () => {
  // Pencereden önceki 28 günün her günü 300 AU sıçrama → 2 günlük pencerelerin ortalaması 600.
  const sessions: RegionSession[] = [];
  for (let i = 2; i < 2 + 28; i++) sessions.push(s(i, { tags: ['jump'], rpe: 5, durationMin: 60 }));
  const r = readRegionLoad(sessions, today);
  assert.equal(region(r, 'patellar_tendon').typical, 600);
  assert.equal(region(r, 'patellar_tendon').load, 0);
  // Kas penceresi 3 gün: kıyas aralığı bir gün geride başlar ve o gün kayıt geçmişinin dışında.
  assert.equal(region(r, 'quadriceps').typical, null);
});

test('kıyas: seans olmayan gün 0 sayılır; 28 günlük geçmiş yoksa null', () => {
  const r = readRegionLoad([s(30, { tags: ['upper_strength'], rpe: 6, durationMin: 50 })], today);
  // Omuz: pencere bugün ve önceki iki gün; kıyas aralığı 3-30 gün önce. Tek seans 30 gün önce (300 AU).
  // 26 pencereden yalnız ilki o günü içerir: 300 / 26.
  const shoulder = region(r, 'shoulder');
  assert.ok(shoulder.typical !== null && Math.abs(shoulder.typical - 300 / 26) < 1e-9);
  const short = readRegionLoad([s(10, { tags: ['upper_strength'] })], today);
  assert.equal(region(short, 'shoulder').typical, null);
  // Seanssız geçmiş başlangıcı (ör. ilk kayıt) verilirse aynı hesap yapılır.
  const withStart = readRegionLoad([], today, { historyStart: day(40) });
  assert.equal(region(withStart, 'shoulder').typical, 0);
});

test('regionsLoadedOn: o günün seanslarının bölgeleri', () => {
  const loaded = regionsLoadedOn([s(1, { kind: 'conditioning', tags: null }), s(0, { tags: ['upper_strength'] })], day(1));
  assert.deepEqual([...loaded].sort(), [...tagRegions.sprint].sort());
});

test('ağrı izleme: 5 üstü sabah ağrısı not düşer, 5 düşmez', () => {
  const notes = painNotes(
    [
      { region: 'ankle', side: 'left', pain: 6 },
      { region: 'calf', side: 'right', pain: 5 },
    ],
    null,
    new Set(),
  );
  assert.deepEqual(notes, [{ region: 'ankle', side: 'left', pain: 6, yesterdayPain: null, reasons: ['high'] }]);
});

test('ağrı izleme: dün yüklenen bölgede ağrı azalmadıysa not; azaldıysa veya dün ağrı yoksa not yok', () => {
  const loaded = new Set(['patellar_tendon'] as const);
  const yesterday = [
    { region: 'patellar_tendon', side: 'right', pain: 3 },
    { region: 'patellar_tendon', side: 'left', pain: 4 },
  ] as const;
  const notes = painNotes(
    [
      { region: 'patellar_tendon', side: 'right', pain: 3 }, // aynı: not
      { region: 'patellar_tendon', side: 'left', pain: 2 }, // azaldı: yok
      { region: 'hamstring', side: 'left', pain: 4 }, // dün yüklenmedi, dün ağrı yok: yok
    ],
    yesterday,
    loaded,
  );
  assert.deepEqual(notes, [
    { region: 'patellar_tendon', side: 'right', pain: 3, yesterdayPain: 3, reasons: ['notDecreasing'] },
  ]);
  // Dün ağrı yoktu (0) → yeni ağrı tek başına "azalmadı" sayılmaz.
  assert.deepEqual(painNotes([{ region: 'patellar_tendon', side: 'right', pain: 2 }], [], loaded), []);
});

test('ağrı izleme: bugün check-in yoksa not yok; dün check-in yoksa yalnız 5 üstü kuralı', () => {
  assert.deepEqual(painNotes(null, [], new Set()), []);
  const notes = painNotes([{ region: 'achilles', side: 'left', pain: 7 }], null, new Set(['achilles']));
  assert.deepEqual(notes[0]?.reasons, ['high']);
});
