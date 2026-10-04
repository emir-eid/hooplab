import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  describeConnection,
  describeConnectOutcome,
  formatSyncTime,
  type SyncStatusRow,
  tokenDaysLeft,
} from './google-health-status.ts';

const now = new Date(2026, 9, 4, 15, 0); // 4 Ekim 2026 15:00, cihaz saatiyle

const connected: SyncStatusRow = {
  state: 'connected',
  connected_at: new Date(2026, 9, 2, 10, 0).toISOString(),
  synced_from: '2026-07-07',
  synced_through: '2026-10-04',
  last_success_at: new Date(2026, 9, 4, 14, 17).toISOString(),
  last_error: null,
};

test('hiç bağlanmamış kullanıcı', () => {
  const view = describeConnection(null, now);
  assert.equal(view.kind, 'none');
  assert.equal(view.summary, 'Bağlı değil');
});

test('bağlı: son senkron, aralık ve tahmini kalan gün', () => {
  const view = describeConnection(connected, now);
  assert.equal(view.kind, 'connected');
  assert.equal(view.lastSync, 'Bugün 14:17');
  assert.equal(view.range, '7 Tem – 4 Eki');
  assert.equal(view.tokenDaysLeft, 5);
  assert.equal(view.problem, null);
});

test('kısmi hata kullanıcıya kod değil açıklama olarak gösterilir', () => {
  const view = describeConnection({ ...connected, last_error: 'exercise:PERMISSION_DENIED' }, now);
  assert.ok(view.problem && !view.problem.includes('PERMISSION'));
});

test('süresi dolan izin yeniden bağlanma ister', () => {
  const view = describeConnection({ ...connected, state: 'reconnect_required', last_error: 'invalid_grant' }, now);
  assert.equal(view.kind, 'reconnect');
  assert.equal(view.tokenDaysLeft, 0);
  assert.ok(view.problem);
});

test('kalan gün 7 günden geriye sayar, sıfırın altına inmez', () => {
  assert.equal(tokenDaysLeft(now.toISOString(), now), 7);
  assert.equal(tokenDaysLeft(new Date(2026, 8, 1).toISOString(), now), 0);
  assert.equal(tokenDaysLeft(null, now), null);
});

test('senkron zamanı: bugün, dün, daha eski', () => {
  assert.equal(formatSyncTime(new Date(2026, 9, 4, 9, 5).toISOString(), now), 'Bugün 09:05');
  assert.equal(formatSyncTime(new Date(2026, 9, 3, 23, 59).toISOString(), now), 'Dün 23:59');
  assert.equal(formatSyncTime(new Date(2026, 8, 28, 7, 0).toISOString(), now), '28 Eyl 07:00');
  assert.equal(formatSyncTime('bozuk', now), '');
});

test('izin ekranından dönüş sonucu', () => {
  assert.equal(describeConnectOutcome('exp://192.168.1.2:8081/--/me/google-health?ghealth=connected')?.ok, true);
  assert.equal(describeConnectOutcome('hooplab://me/google-health?ghealth=denied')?.ok, false);
  assert.match(describeConnectOutcome('hooplab://me/google-health?ghealth=error&code=missing_scopes')?.message ?? '', /tüm kutuları/);
  assert.match(describeConnectOutcome('hooplab://me/google-health?ghealth=error&code=x')?.message ?? '', /Bağlanılamadı/);
  assert.equal(describeConnectOutcome('hooplab://me/google-health'), null);
});
