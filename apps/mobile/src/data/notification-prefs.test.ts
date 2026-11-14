// Hatırlatma tercihleri (karar 0060): saat seçimi ve sunucu satırı dönüşümü.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  anyEnabled,
  defaultNotificationPrefs,
  formatClock,
  prefsFromRow,
  rowFromPrefs,
  stepCheckinTime,
  type NotificationPrefs,
} from './notification-prefs.ts';

test('varsayılan hepsi kapalı', () => {
  assert.equal(anyEnabled(defaultNotificationPrefs), false);
  assert.equal(anyEnabled({ ...defaultNotificationPrefs, reconnect: { enabled: true } }), true);
});

test('saat seçimi 05:00-12:00 arasında 15 dakika adımla', () => {
  assert.deepEqual(stepCheckinTime(8, 30, 1), { hour: 8, minute: 45 });
  assert.deepEqual(stepCheckinTime(8, 0, -1), { hour: 7, minute: 45 });
  assert.deepEqual(stepCheckinTime(5, 0, -1), { hour: 5, minute: 0 });
  assert.deepEqual(stepCheckinTime(12, 0, 1), { hour: 12, minute: 0 });
  assert.equal(formatClock(7, 5), '07:05');
});

test('sunucu satırı: satır yoksa varsayılan; Postgres saati okunur; bozuk ya da aralık dışı saat varsayılana düşer', () => {
  assert.deepEqual(prefsFromRow(null), defaultNotificationPrefs);
  assert.deepEqual(
    prefsFromRow({ checkin_enabled: true, checkin_time: '07:45:00', match_enabled: false, match_time: '03:00:00', reconnect_enabled: true }),
    { checkin: { enabled: true, hour: 7, minute: 45 }, match: { enabled: false, hour: 9, minute: 0 }, reconnect: { enabled: true } },
  );
  assert.deepEqual(prefsFromRow({ checkin_time: 'bozuk' }).checkin, { enabled: false, hour: 8, minute: 30 });
});

test('tercihten satır ve geri: aynı tercih; saat dilimi boşsa UTC', () => {
  const prefs: NotificationPrefs = {
    checkin: { enabled: true, hour: 7, minute: 15 },
    match: { enabled: true, hour: 10, minute: 30 },
    reconnect: { enabled: false },
  };
  const row = rowFromPrefs(prefs, 'Europe/Istanbul');
  assert.deepEqual(row, {
    time_zone: 'Europe/Istanbul',
    checkin_enabled: true,
    checkin_time: '07:15',
    match_enabled: true,
    match_time: '10:30',
    reconnect_enabled: false,
  });
  assert.deepEqual(prefsFromRow(row), prefs);
  assert.equal(rowFromPrefs(prefs, '').time_zone, 'UTC');
});
