// Yerel bildirim planı (karar 0045): saatler cihazın yerel saatiyle; metinlerde sağlık değeri yok.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  anyEnabled,
  checkinDaysAhead,
  defaultNotificationPrefs,
  formatClock,
  parseNotificationPrefs,
  planNotifications,
  stepCheckinTime,
  type NotificationPrefs,
} from './notification-plan.ts';

const prefs = (over: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  checkin: { enabled: true, hour: 8, minute: 30 },
  reconnect: { enabled: true },
  match: { enabled: false, hour: 9, minute: 0 },
  ...over,
});
const at = (d: Date) => [d.getDate(), d.getHours(), d.getMinutes()];

test('kapalıyken plan boş; varsayılan ikisi de kapalı', () => {
  assert.equal(anyEnabled(defaultNotificationPrefs), false);
  assert.deepEqual(
    planNotifications(defaultNotificationPrefs, { now: new Date(2026, 9, 15, 7, 0), checkinDoneToday: false, sync: null }),
    [],
  );
});

test('check-in: seçilen saatte, ileriye 7 gün; saati geçmiş ya da yapılmış bugün atlanır', () => {
  const now = new Date(2026, 9, 15, 7, 0);
  const plan = planNotifications(prefs({ reconnect: { enabled: false } }), { now, checkinDoneToday: false, sync: null });
  assert.equal(plan.length, checkinDaysAhead);
  assert.deepEqual(at(plan[0]!.at), [15, 8, 30]);
  assert.deepEqual(at(plan.at(-1)!.at), [21, 8, 30]);
  assert.equal(plan[0]!.id, 'hooplab-checkin-2026-10-15');
  assert.equal(plan[0]!.route, '/checkin');

  const done = planNotifications(prefs({ reconnect: { enabled: false } }), { now, checkinDoneToday: true, sync: null });
  assert.equal(done.length, checkinDaysAhead - 1);
  assert.deepEqual(at(done[0]!.at), [16, 8, 30]);

  const late = planNotifications(prefs({ reconnect: { enabled: false } }), { now: new Date(2026, 9, 15, 9, 0), checkinDoneToday: false, sync: null });
  assert.deepEqual(at(late[0]!.at), [16, 8, 30]);
  // Ay sonu taşar.
  const monthEnd = planNotifications(prefs({ reconnect: { enabled: false } }), { now: new Date(2026, 9, 30, 9, 0), checkinDoneToday: false, sync: null });
  assert.equal(monthEnd[1]!.id, 'hooplab-checkin-2026-11-01');
});

test('bağlıyken izin hatırlatması yok (karar 0053: izin 7 günde dolmaz)', () => {
  const only = prefs({ checkin: { enabled: false, hour: 8, minute: 30 } });
  const connected = new Date(2026, 9, 12, 11, 55);
  for (const now of [new Date(2026, 9, 15, 12, 0), new Date(2026, 9, 19, 9, 0), new Date(2026, 9, 25, 9, 0)]) {
    assert.deepEqual(planNotifications(only, { now, checkinDoneToday: false, sync: { state: 'connected', connected_at: connected.toISOString() } }), []);
  }
  assert.deepEqual(planNotifications(only, { now: new Date(2026, 9, 15), checkinDoneToday: false, sync: { state: 'disconnected', connected_at: null } }), []);
});

test('senkron durmuşsa bir sonraki sabah 09:00 tek hatırlatma', () => {
  const only = prefs({ checkin: { enabled: false, hour: 8, minute: 30 } });
  const sync = { state: 'reconnect_required' as const, connected_at: null };
  const before = planNotifications(only, { now: new Date(2026, 9, 19, 7, 0), checkinDoneToday: false, sync });
  assert.deepEqual(at(before[0]!.at), [19, 9, 0]);
  const after = planNotifications(only, { now: new Date(2026, 9, 19, 12, 0), checkinDoneToday: false, sync });
  assert.deepEqual(at(after[0]!.at), [20, 9, 0]);
  assert.equal(after.length, 1);
});

test('maç sabahı (karar 0046): takvimdeki günlerde seçilen saatte; geçmiş saat atlanır; metinde yalnız maç saati', () => {
  const only = prefs({ checkin: { enabled: false, hour: 8, minute: 30 }, reconnect: { enabled: false }, match: { enabled: true, hour: 9, minute: 0 } });
  const matches = [
    { date: '2026-10-15', startTime: '19:00' },
    { date: '2026-10-18', startTime: null },
    { date: '2026-10-30', startTime: '20:00' },
  ];
  const plan = planNotifications(only, { now: new Date(2026, 9, 15, 7, 0), checkinDoneToday: false, sync: null, matches });
  assert.deepEqual(plan.map((p) => p.id), ['hooplab-match-2026-10-15', 'hooplab-match-2026-10-18']);
  assert.deepEqual(at(plan[0]!.at), [15, 9, 0]);
  assert.equal(plan[0]!.body, "Maç 19:00. Öğün ve sıvı saatleri Bugün'de.");
  assert.equal(plan[0]!.route, '/');
  assert.doesNotMatch(plan[1]!.body, /\d/);
  const late = planNotifications(only, { now: new Date(2026, 9, 15, 10, 0), checkinDoneToday: false, sync: null, matches });
  assert.deepEqual(late.map((p) => p.id), ['hooplab-match-2026-10-18']);
  assert.deepEqual(planNotifications(prefs({ match: { enabled: false, hour: 9, minute: 0 } }), { now: new Date(2026, 9, 15, 7, 0), checkinDoneToday: true, sync: null, matches }).filter((p) => p.kind === 'match'), []);
});

test('plan zamana göre sıralı; metinlerde sayı yok (kilit ekranında sağlık değeri görünmez)', () => {
  const connected = new Date(2026, 9, 12, 11, 55);
  const plan = planNotifications(prefs({ match: { enabled: true, hour: 9, minute: 0 } }), {
    now: new Date(2026, 9, 15, 7, 0),
    checkinDoneToday: false,
    sync: { state: 'connected', connected_at: connected.toISOString() },
    matches: [{ date: '2026-10-16', startTime: '19:00' }],
  });
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i]!.at >= plan[i - 1]!.at);
  // Maç bildiriminde yalnız başlama saati var (sağlık değeri değil).
  for (const p of plan) assert.doesNotMatch(`${p.title} ${p.body}`.replace(/\b\d{2}:\d{2}\b/, ''), /\d/);
  assert.equal(new Set(plan.map((p) => p.id)).size, plan.length);
});

test('saat seçimi 05:00-12:00 arasında 15 dakika adımla; bozuk tercih varsayılana düşer', () => {
  assert.deepEqual(stepCheckinTime(8, 30, 1), { hour: 8, minute: 45 });
  assert.deepEqual(stepCheckinTime(8, 0, -1), { hour: 7, minute: 45 });
  assert.deepEqual(stepCheckinTime(5, 0, -1), { hour: 5, minute: 0 });
  assert.deepEqual(stepCheckinTime(12, 0, 1), { hour: 12, minute: 0 });
  assert.equal(formatClock(7, 5), '07:05');

  assert.deepEqual(parseNotificationPrefs(null), defaultNotificationPrefs);
  assert.deepEqual(parseNotificationPrefs('bozuk'), defaultNotificationPrefs);
  assert.deepEqual(parseNotificationPrefs(JSON.stringify({ checkin: { enabled: true, hour: 3, minute: 0 }, reconnect: { enabled: 'evet' } })), {
    checkin: { enabled: true, hour: 8, minute: 30 },
    reconnect: { enabled: false },
    match: { enabled: false, hour: 9, minute: 0 },
  });
  const saved = prefs({ checkin: { enabled: true, hour: 7, minute: 15 } });
  assert.deepEqual(parseNotificationPrefs(JSON.stringify(saved)), saved);
});
