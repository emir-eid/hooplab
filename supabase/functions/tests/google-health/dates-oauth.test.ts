import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  chunkRange,
  civilToIso,
  daysBetween,
  durationSeconds,
  isIsoDate,
  todayInTimeZone,
} from '../../_shared/google-health/dates.ts';
import {
  buildAuthUrl,
  GOOGLE_HEALTH_SCOPES,
  isAllowedReturnUrl,
  isWellFormedState,
  missingScopes,
  pkceChallenge,
  randomToken,
  withOutcome,
} from '../../_shared/google-health/oauth.ts';

test('tarih aritmetiği ay ve yıl sınırını geçer', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2025-12-31', 1), '2026-01-01');
  assert.equal(daysBetween('2026-03-25', '2026-04-01'), 7);
});

test('geçersiz sivil tarih null döner', () => {
  assert.equal(civilToIso({ year: 2026, month: 2, day: 30 }), null);
  assert.equal(civilToIso(undefined), null);
  assert.equal(civilToIso({ year: 2026, month: 10, day: 4 }), '2026-10-04');
  assert.equal(isIsoDate('2026-13-01'), false);
});

test('aralık API sınırına göre parçalanır, uçlar boşluksuz birleşir', () => {
  const chunks = chunkRange('2026-07-07', '2026-10-05', 14);
  assert.equal(chunks.length, 7);
  assert.deepEqual(chunks[0], ['2026-07-07', '2026-07-21']);
  assert.equal(chunks.at(-1)?.[1], '2026-10-05');
  for (let i = 1; i < chunks.length; i++) assert.equal(chunks[i]?.[0], chunks[i - 1]?.[1]);
  for (const [from, to] of chunks) assert.ok(daysBetween(from, to) <= 14);
  assert.deepEqual(chunkRange('2026-10-01', '2026-10-01', 14), []);
});

test('bugünün tarihi sporcunun saat dilimine göre', () => {
  // 2026-10-04 21:30 UTC = İstanbul'da 5 Ekim 00:30, New York'ta 4 Ekim 17:30.
  const now = new Date('2026-10-04T21:30:00Z');
  assert.equal(todayInTimeZone('Europe/Istanbul', now), '2026-10-05');
  assert.equal(todayInTimeZone('America/New_York', now), '2026-10-04');
  assert.equal(todayInTimeZone('Gecersiz/Dilim', now), '2026-10-04');
  assert.equal(todayInTimeZone(null, now), '2026-10-04');
});

test('süre dizesi saniyeye çevrilir', () => {
  assert.equal(durationSeconds('3600s'), 3600);
  assert.equal(durationSeconds('10800.5s'), 10800.5);
  assert.equal(durationSeconds('PT1H'), null);
  assert.equal(durationSeconds(undefined), null);
});

test('PKCE S256: RFC 7636 Ek B test vektörü', async () => {
  assert.equal(
    await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  );
});

test('rastgele durum biçim denetiminden geçer, kısa veya yabancı karakterli durum geçmez', () => {
  const state = randomToken();
  assert.ok(isWellFormedState(state));
  assert.notEqual(state, randomToken());
  assert.equal(isWellFormedState('kisa'), false);
  assert.equal(isWellFormedState(`${'a'.repeat(40)}/`), false);
  assert.equal(isWellFormedState(null), false);
});

test('izin adresi çevrimdışı erişim, onay ve PKCE ister; yalnız salt okuma kapsamları', () => {
  const url = new URL(
    buildAuthUrl({ clientId: 'istemci', redirectUri: 'https://ornek.test/cb', state: 'durum', codeChallenge: 'meydan' }),
  );
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://ornek.test/cb');
  const scopes = url.searchParams.get('scope')?.split(' ') ?? [];
  assert.deepEqual(scopes, [...GOOGLE_HEALTH_SCOPES]);
  assert.ok(scopes.every((s) => s.endsWith('.readonly')));
});

test('eksik kapsam bulunur', () => {
  assert.deepEqual(missingScopes(GOOGLE_HEALTH_SCOPES.join(' ')), []);
  assert.deepEqual(missingScopes(GOOGLE_HEALTH_SCOPES.slice(1).join(' ')), [GOOGLE_HEALTH_SCOPES[0]]);
  assert.equal(missingScopes(undefined).length, GOOGLE_HEALTH_SCOPES.length);
});

test('dönüş adresi yalnız uygulama şeması veya yerel önizleme olabilir', () => {
  assert.ok(isAllowedReturnUrl('hooplab://me/google-health'));
  assert.ok(isAllowedReturnUrl('exp://192.168.1.20:8081/--/me/google-health'));
  assert.ok(isAllowedReturnUrl('http://localhost:8081/me/google-health'));
  assert.equal(isAllowedReturnUrl('https://kotu.example/cal'), false);
  assert.equal(isAllowedReturnUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedReturnUrl('http://localhost.kotu.example/'), false);
  assert.equal(isAllowedReturnUrl('http://kullanici:sifre@localhost/'), false);
  assert.equal(isAllowedReturnUrl(`hooplab://${'a'.repeat(600)}`), false);
  assert.equal(isAllowedReturnUrl(42), false);
});

test('sonuç uygulama adresine sorgu olarak eklenir', () => {
  const url = withOutcome('exp://192.168.1.20:8081/--/me/google-health', 'error', 'missing_scopes');
  assert.equal(url, 'exp://192.168.1.20:8081/--/me/google-health?ghealth=error&code=missing_scopes');
  assert.equal(withOutcome('hooplab://me/google-health', 'connected'), 'hooplab://me/google-health?ghealth=connected');
});
