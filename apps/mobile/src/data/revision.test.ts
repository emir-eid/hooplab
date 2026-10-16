import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bumpDataRevision, createFocusGate, dataRevision, focusRefreshMs, isDataWrite } from './revision.ts';

const base = 'https://ornek.supabase.co';

test('yalnız veri yazan istekler sürümü değiştirir', () => {
  assert.equal(isDataWrite('GET', `${base}/rest/v1/meals?select=id`), false);
  assert.equal(isDataWrite('HEAD', `${base}/rest/v1/meals`), false);
  assert.equal(isDataWrite('POST', `${base}/rest/v1/meals`), true);
  assert.equal(isDataWrite('patch', `${base}/rest/v1/meals?id=eq.1`), true);
  assert.equal(isDataWrite('DELETE', `${base}/rest/v1/fluid_intakes?id=eq.1`), true);
  assert.equal(isDataWrite('POST', `${base}/rest/v1/rpc/save_morning_checkin`), true);
  assert.equal(isDataWrite('POST', `${base}/functions/v1/ghealth-sync`), true);
  assert.equal(isDataWrite('DELETE', `${base}/functions/v1/ghealth-connect`), true);
  // Koç kendi özetini yönetir; oturum yenileme veri değildir.
  assert.equal(isDataWrite('POST', `${base}/functions/v1/coach-daily?peek=1`), false);
  assert.equal(isDataWrite('POST', `${base}/functions/v1/coach-ask`), false);
  assert.equal(isDataWrite('POST', `${base}/auth/v1/token?grant_type=refresh_token`), false);
});

test('odak kapısı: ilk odakta çeker, değişiklik yoksa çekmez', () => {
  let t = 0;
  let rev = 0;
  const gate = createFocusGate(() => t, () => rev);
  assert.equal(gate.shouldFetch('2026-10-16'), true);
  gate.started('2026-10-16');
  t += 60_000;
  assert.equal(gate.shouldFetch('2026-10-16'), false);

  // Bir form kaydetti.
  rev++;
  assert.equal(gate.shouldFetch('2026-10-16'), true);
  gate.started('2026-10-16');
  assert.equal(gate.shouldFetch('2026-10-16'), false);

  // Gün döndü.
  assert.equal(gate.shouldFetch('2026-10-17'), true);

  // Süre doldu (senkron yeni veri yazmış olabilir).
  t += focusRefreshMs;
  assert.equal(gate.shouldFetch('2026-10-16'), true);
});

test('yarıda bırakılan çekişten sonra yeniden çekilir', () => {
  const gate = createFocusGate(() => 0, () => 0);
  gate.started('2026-10-16');
  assert.equal(gate.shouldFetch('2026-10-16'), false);
  gate.invalidate();
  assert.equal(gate.shouldFetch('2026-10-16'), true);
});

test('çekiş sırasında yazma olursa sonraki odak yeniden çeker', () => {
  const gate = createFocusGate(() => 0);
  gate.started('2026-10-16');
  const before = dataRevision();
  bumpDataRevision();
  assert.equal(dataRevision(), before + 1);
  assert.equal(gate.shouldFetch('2026-10-16'), true);
});
