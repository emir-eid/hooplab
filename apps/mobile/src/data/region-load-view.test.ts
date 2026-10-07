// Bölge yükü görünümü: sentetik satırlarla.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildRegionLoadView, regionFrom, regionLookbackDays, type RegionSessionRow } from './region-load-view.ts';

const today = '2026-10-31';
const now = new Date('2026-10-31T09:00:00+03:00');

function row(local_date: string, over: Partial<RegionSessionRow> = {}): RegionSessionRow {
  return { local_date, rpe: 6, duration_min: 60, kind: 'team_practice', content_tags: null, started_at: null, ...over };
}

test('kıyas için 31 günlük seans çekilir (3 günlük pencere + 28 gün)', () => {
  assert.equal(regionLookbackDays, 31);
  assert.equal(regionFrom(today), '2026-10-01');
});

test('etiketsiz seanslar en uzun pencerede sayılır; daha eskisi ve etiketlisi sayılmaz', () => {
  const view = buildRegionLoadView(
    [row('2026-10-31'), row('2026-10-29'), row('2026-10-28'), row('2026-10-30', { content_tags: ['jump'] })],
    today,
    { earliest: '2026-10-28', now, painToday: null, painYesterday: null },
  );
  assert.equal(view.defaultedSessions, 2);
  assert.equal(view.anyRecovering, true);
  assert.equal(view.checkinToday, false);
  assert.deepEqual(view.notes, []);
});

test('ağrı notu: dün yüklenen bölgede ağrı azalmadı', () => {
  const view = buildRegionLoadView([row('2026-10-30', { kind: 'shooting' })], today, {
    earliest: '2026-10-30',
    now,
    painToday: [{ region: 'patellar_tendon', side: 'right', pain: 3 }],
    painYesterday: [{ region: 'patellar_tendon', side: 'right', pain: 3 }],
  });
  assert.equal(view.checkinToday, true);
  assert.deepEqual(view.notes.map((n) => n.reasons), [['notDecreasing']]);
});

test('boş dizi etiketli seans hiçbir bölgeyi çalıştırmaz', () => {
  const view = buildRegionLoadView([row('2026-10-31', { kind: 'mobility', content_tags: [] })], today, {
    earliest: '2026-10-31',
    now,
    painToday: null,
    painYesterday: null,
  });
  assert.equal(view.anyRecovering, false);
  assert.equal(view.defaultedSessions, 0);
});
