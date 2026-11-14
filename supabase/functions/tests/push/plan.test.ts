// PWA hatırlatma planı (karar 0058): sentetik tercih ve anlarla.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { duePushes, localClock, pushTexts, type PushPrefsRow } from '../../_shared/push/plan.ts';

const prefs = (over: Partial<PushPrefsRow> = {}): PushPrefsRow => ({
  user_id: 'u',
  time_zone: 'Europe/Istanbul',
  checkin_enabled: true,
  checkin_time: '08:30:00',
  match_enabled: true,
  match_time: '09:00:00',
  reconnect_enabled: true,
  ...over,
});

// İstanbul UTC+3: 05:31Z = 08:31 yerel.
const at = (iso: string) => new Date(iso);
const base = { checkinDone: false, sync: null };

test('yerel saat kullanıcının diliminde; geçersiz dilimde gönderim yok', () => {
  assert.deepEqual(localClock(at('2026-03-01T21:30:00Z'), 'Europe/Istanbul'), { date: '2026-03-02', minutes: 30 });
  assert.equal(localClock(at('2026-03-01T21:30:00Z'), 'Mars/Olympus'), null);
  assert.deepEqual(duePushes(prefs({ time_zone: 'Mars/Olympus' }), { ...base, now: at('2026-03-02T05:31:00Z') }), []);
});

test('check-in: seçilen saatten sonraki bir saat içinde, check-in yapılmadıysa; anahtar yerel gün', () => {
  const due = duePushes(prefs({ match_enabled: false }), { ...base, now: at('2026-03-02T05:31:00Z') });
  assert.deepEqual(due.map((d) => [d.kind, d.key, d.route]), [['checkin', '2026-03-02', '/checkin']]);
  assert.deepEqual(duePushes(prefs(), { ...base, now: at('2026-03-02T05:29:00Z') }), [], 'saatten önce yok');
  assert.deepEqual(duePushes(prefs(), { ...base, now: at('2026-03-02T06:31:00Z') }), [], 'pencere geçti');
  assert.deepEqual(duePushes(prefs(), { ...base, checkinDone: true, now: at('2026-03-02T05:31:00Z') }), [], 'check-in yapılmış');
  assert.deepEqual(duePushes(prefs({ checkin_enabled: false }), { ...base, now: at('2026-03-02T05:31:00Z') }), []);
});

test('maç sabahı: yalnız maç günü, metinde yalnız maç saati', () => {
  const now = at('2026-03-02T06:01:00Z');
  const p = prefs({ checkin_enabled: false });
  assert.deepEqual(duePushes(p, { ...base, now }), [], 'maç yoksa yok');
  const [due] = duePushes(p, { ...base, now, match: { startTime: '19:00:00' } });
  assert.equal(due?.body, "Maç 19:00. Öğün ve sıvı saatleri Bugün'de.");
  assert.equal(duePushes(p, { ...base, now, match: { startTime: null } })[0]?.body, "Öğün ve sıvı notları Bugün'de.");
});

test('senkron durdu: 09:00 sonrası, her kopma için tek anahtar', () => {
  const p = prefs({ checkin_enabled: false, match_enabled: false });
  const sync = { state: 'reconnect_required', lastSuccessAt: '2026-03-01T10:17:03.123+00:00' };
  assert.deepEqual(duePushes(p, { ...base, sync, now: at('2026-03-02T05:31:00Z') }), [], '09:00 öncesi yok');
  const due = duePushes(p, { ...base, sync, now: at('2026-03-02T14:00:00Z') });
  assert.deepEqual(due.map((d) => [d.kind, d.key]), [['reconnect', '2026-03-01T10:17:03']]);
  assert.deepEqual(duePushes(p, { ...base, sync: { state: 'connected', lastSuccessAt: null }, now: at('2026-03-02T14:00:00Z') }), []);
});

test('metinler sayı içermez; maç metninde yalnız maç saati (kilit ekranında görünürler, karar 0045)', () => {
  for (const t of [pushTexts.checkin, pushTexts.reconnect, pushTexts.test]) assert.doesNotMatch(`${t.title} ${t.body}`, /\d/);
  const [match] = duePushes(prefs({ checkin_enabled: false, reconnect_enabled: false }), {
    ...base,
    now: at('2026-03-02T06:01:00Z'),
    match: { startTime: '19:00:00' },
  });
  assert.equal(match?.title, pushTexts.matchTitle);
  assert.doesNotMatch((match?.body ?? '').replace('19:00', ''), /\d/);
});
