import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseSupabaseConfig } from './supabase-config.ts';

// Sentetik değerler: gerçek proje veya anahtar değil.
const URL_OK = 'https://abcdefghijklmnop.supabase.co';
const KEY_OK = 'sb_publishable_synthetic_TEST-key';

test('geçerli değerler kabul edilir, adres köke indirgenir', () => {
  assert.deepEqual(parseSupabaseConfig(`${URL_OK}/ `, ` ${KEY_OK} `), {
    ok: true,
    url: URL_OK,
    publishableKey: KEY_OK,
  });
});

test('eksik değer', () => {
  assert.deepEqual(parseSupabaseConfig(undefined, KEY_OK), { ok: false, problem: 'missing' });
  assert.deepEqual(parseSupabaseConfig(URL_OK, '  '), { ok: false, problem: 'missing' });
});

test('adres https olmalı (yerel geliştirme hariç)', () => {
  assert.equal(parseSupabaseConfig('abcdefghijklmnop.supabase.co', KEY_OK).ok, false);
  assert.deepEqual(parseSupabaseConfig('http://abcdefghijklmnop.supabase.co', KEY_OK), {
    ok: false,
    problem: 'invalid-url',
  });
  assert.equal(parseSupabaseConfig('http://127.0.0.1:54321', KEY_OK).ok, true);
});

test('gizli anahtar reddedilir', () => {
  assert.deepEqual(parseSupabaseConfig(URL_OK, 'sb_' + 'secret_synthetic'), { ok: false, problem: 'secret-key' });
});

test('publishable biçiminde olmayan anahtar reddedilir', () => {
  assert.deepEqual(parseSupabaseConfig(URL_OK, 'rastgele'), { ok: false, problem: 'invalid-key' });
  assert.deepEqual(parseSupabaseConfig(URL_OK, 'sb_publishable_ boşluk'), { ok: false, problem: 'invalid-key' });
});
