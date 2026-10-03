import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeAuthError } from './auth-errors.ts';

test('yanlış e-posta veya şifre', () => {
  assert.equal(describeAuthError({ code: 'invalid_credentials', status: 400 }), 'E-posta veya şifre hatalı.');
});

test('ağ hatası koddan önce gelir', () => {
  assert.match(describeAuthError({ name: 'AuthRetryableFetchError', status: 0 }), /ulaşılamadı/);
  assert.match(describeAuthError({ code: 'invalid_credentials', status: 0 }), /ulaşılamadı/);
});

test('istemci kurulmamışsa ayrı mesaj', () => {
  assert.match(describeAuthError(null), /ayarlanmamış/);
});

test('bilinmeyen kod genel mesaja düşer ve İngilizce sunucu metni sızmaz', () => {
  const text = describeAuthError({ code: 'unexpected_failure', status: 500 });
  assert.equal(text, 'Giriş yapılamadı. Biraz sonra tekrar dene.');
});
