// Yerel bildirim planı (karar 0045): saatler cihazın yerel saatiyle; metinlerde sağlık değeri yok.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TOKEN_LIFETIME_DAYS } from './google-health-status.ts';
import {
  anyEnabled,
  checkinDaysAhead,
  defaultNotificationPrefs,
  formatClock,
  parseNotificationPrefs,
  planNotifications,
  reconnectLeadHours,
  stepCheckinTime,
  type NotificationPrefs,
} from './notification-plan.ts';

const prefs = (over: Partial<NotificationPrefs> = {}): NotificationPrefs => ({
  checkin: { enabled: true, hour: 8, minute: 30 },
  reconnect: { enabled: true },
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

test('izin hatırlatması: bağlantıdan 7 gün sonra dolar; bir gün önce ve son saatlerde, geçmiş olan atlanır', () => {
  const connected = new Date(2026, 9, 12, 11, 55);
  const expiry = connected.getTime() + TOKEN_LIFETIME_DAYS * 86_400_000;
  const sync = { state: 'connected' as const, connected_at: connected.toISOString() };
  const only = prefs({ checkin: { enabled: false, hour: 8, minute: 30 } });

  const plan = planNotifications(only, { now: new Date(2026, 9, 15, 12, 0), checkinDoneToday: false, sync });
  assert.deepEqual(plan.map((p) => p.at.getTime()), reconnectLeadHours.map((h) => expiry - h * 3_600_000));
  assert.ok(plan.every((p) => p.route === '/me/google-health'));
  assert.equal(plan[0]!.title, 'Google Health izni yarın doluyor');

  const lastDay = planNotifications(only, { now: new Date(expiry - 10 * 3_600_000), checkinDoneToday: false, sync });
  assert.equal(lastDay.length, 1);
  assert.equal(lastDay[0]!.id, 'hooplab-reconnect-3h');

  assert.deepEqual(planNotifications(only, { now: new Date(expiry + 1000), checkinDoneToday: false, sync }), []);
  assert.deepEqual(planNotifications(only, { now: new Date(2026, 9, 15), checkinDoneToday: false, sync: { state: 'connected', connected_at: null } }), []);
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

test('plan zamana göre sıralı; metinlerde sayı yok (kilit ekranında sağlık değeri görünmez)', () => {
  const connected = new Date(2026, 9, 12, 11, 55);
  const plan = planNotifications(prefs(), {
    now: new Date(2026, 9, 15, 7, 0),
    checkinDoneToday: false,
    sync: { state: 'connected', connected_at: connected.toISOString() },
  });
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i]!.at >= plan[i - 1]!.at);
  for (const p of plan) assert.doesNotMatch(`${p.title} ${p.body}`, /\d/);
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
  });
  const saved = prefs({ checkin: { enabled: true, hour: 7, minute: 15 } });
  assert.deepEqual(parseNotificationPrefs(JSON.stringify(saved)), saved);
});
