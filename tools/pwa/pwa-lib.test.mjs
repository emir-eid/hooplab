import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GOOGLE_RETURN_PATH, PWA_ORIGIN, pwaReturnUrl, publicEnvProblems, vercelConfig } from './pwa-lib.mjs';

const ENV = { EXPO_PUBLIC_SUPABASE_URL: 'https://ornekproje.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_ornek' };

test('dönüş adresi PWA kökeni ve uygulamanın Google ekranı yolu', () => {
  assert.equal(pwaReturnUrl(), `${PWA_ORIGIN}${GOOGLE_RETURN_PATH}`);
  assert.equal(pwaReturnUrl('https://app.hooplab.dev/'), 'https://app.hooplab.dev/me/google-health');
});

test('dönüş adresi yalnız https kökeninden', () => {
  assert.throws(() => pwaReturnUrl('http://app.hooplab.dev'));
  assert.throws(() => pwaReturnUrl('https://app.hooplab.dev/alt'));
});

test('PWA ortamı: bulut adresi ve publishable anahtar şart', () => {
  assert.deepEqual(publicEnvProblems(ENV), []);
  assert.equal(publicEnvProblems({}).length, 2);
  assert.equal(publicEnvProblems({ ...ENV, EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321' }).length, 1);
  assert.equal(publicEnvProblems({ ...ENV, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_ornek' }).length, 1);
});

test('PWA ortamı: demo bayrağı ve alt yol kabul edilmez', () => {
  assert.equal(publicEnvProblems({ ...ENV, EXPO_PUBLIC_HOOPLAB_DEMO_ONLY: '1' }).length, 1);
  assert.equal(publicEnvProblems({ ...ENV, HOOPLAB_WEB_BASE_URL: '/app' }).length, 1);
});

test('Vercel: önbellek kuralları ayrık, HTML her açılışta doğrulanır', () => {
  const config = vercelConfig();
  assert.equal(config.cleanUrls, true);
  const cache = config.headers.filter((h) => h.headers.some((x) => x.key === 'Cache-Control'));
  assert.equal(cache.length, 2);
  const html = new RegExp(`^${cache[0].source.replace('/:path', '/')}$`);
  assert.ok(html.test('/explain/hrv'));
  assert.ok(!html.test('/_expo/static/js/web/entry-abc.js'));
  assert.match(cache[1].headers[0].value, /immutable/);
  assert.ok(!('rewrites' in config));
});
