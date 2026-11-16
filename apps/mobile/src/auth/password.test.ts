import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkNewPassword, describePasswordError, MIN_PASSWORD_LENGTH, mustChangePassword } from './password.ts';

test('geçici şifre ekranı yalnız açıkça true bayrakla açılır (sahibinde çıkmaz)', () => {
  assert.equal(mustChangePassword({ user_metadata: { must_change_password: true } }), true);
  assert.equal(mustChangePassword({ user_metadata: { must_change_password: false } }), false);
  assert.equal(mustChangePassword({ user_metadata: { must_change_password: 'true' } }), false);
  assert.equal(mustChangePassword({ user_metadata: {} }), false);
  assert.equal(mustChangePassword({ user_metadata: null }), false);
  assert.equal(mustChangePassword({}), false);
  assert.equal(mustChangePassword(null), false);
});

test('yeni şifre: uzunluk, yalnız boşluk, tekrar', () => {
  const ok = 'a'.repeat(MIN_PASSWORD_LENGTH);
  assert.equal(checkNewPassword(ok, ok), null);
  assert.match(checkNewPassword('kisa', 'kisa')!, /en az/);
  const spaces = ' '.repeat(MIN_PASSWORD_LENGTH);
  assert.match(checkNewPassword(spaces, spaces)!, /boşluk/);
  assert.match(checkNewPassword(ok, ok + 'x')!, /aynı değil/);
});

test('şifre hataları Türkçe', () => {
  assert.match(describePasswordError({ code: 'same_password' }), /eskisiyle/);
  assert.match(describePasswordError({ code: 'weak_password' }), /zayıf/);
  assert.match(describePasswordError({ name: 'AuthRetryableFetchError' }), /ulaşılamadı/);
  assert.match(describePasswordError({ code: 'bilinmeyen' }), /değiştirilemedi/);
  assert.match(describePasswordError(null), /ayarlanmamış/);
});
