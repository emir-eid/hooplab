// iPhone uygulaması bildirimleri, Expo push servisi (karar 0060): mesaj, fiş ve makbuz okuma. Token'lar sentetik.

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { expoHeaders, expoMessages, isExpoPushToken, readReceipts, readTickets } from '../../_shared/push/expo.ts';

const payload = { title: "Sabah check-in'i", body: 'Metin', route: '/checkin', tag: 'hooplab-checkin' };

test('token biçimi: Expo token kabul, başka değer ret', () => {
  assert.equal(isExpoPushToken('ExponentPushToken[abcDEF123_-]'), true);
  assert.equal(isExpoPushToken('ExpoPushToken[abc]'), true);
  assert.equal(isExpoPushToken('ExponentPushToken[]'), false);
  assert.equal(isExpoPushToken('https://push.example.test/x'), false);
  assert.equal(isExpoPushToken(undefined), false);
});

test('mesaj: başlık, metin, açılacak ekran; ses, birleştirme anahtarı ve bir saatlik ömür; bozuk token atlanır', () => {
  const messages = expoMessages(['ExponentPushToken[a]', 'bozuk'], payload);
  assert.deepEqual(messages, [
    {
      to: 'ExponentPushToken[a]',
      title: payload.title,
      body: payload.body,
      data: { route: '/checkin' },
      sound: 'default',
      collapseId: 'hooplab-checkin',
      ttl: 3600,
    },
  ]);
});

test('fişler mesaj sırasıyla: ok, uygulama silinmiş, başka hata', () => {
  const response = {
    data: [
      { status: 'ok', id: 'fis-1' },
      { status: 'error', message: 'x', details: { error: 'DeviceNotRegistered' } },
      { status: 'error', message: 'y', details: { error: 'MessageRateExceeded' } },
    ],
  };
  assert.deepEqual(readTickets(response, 3), [{ kind: 'ok', ticketId: 'fis-1' }, { kind: 'gone' }, { kind: 'error' }]);
});

test('yanıt bozuk ya da eksikse fişler hata sayılır (gönderilmiş sayılmaz)', () => {
  assert.deepEqual(readTickets(null, 2), [{ kind: 'error' }, { kind: 'error' }]);
  assert.deepEqual(readTickets({ errors: [{ code: 'TOO_MANY_REQUESTS' }] }, 1), [{ kind: 'error' }]);
  assert.deepEqual(readTickets({ data: [{ status: 'ok' }] }, 1), [{ kind: 'error' }]);
});

test('makbuz: silinmiş cihaz ayrılır; gelmeyen makbuz kesinleşmiş sayılmaz', () => {
  const response = {
    data: {
      'fis-1': { status: 'ok' },
      'fis-2': { status: 'error', details: { error: 'DeviceNotRegistered' } },
      'fis-3': { status: 'error', details: { error: 'MessageTooBig' } },
    },
  };
  assert.deepEqual(readReceipts(response, ['fis-1', 'fis-2', 'fis-3', 'fis-4']), {
    gone: ['fis-2'],
    settled: ['fis-1', 'fis-2', 'fis-3'],
  });
  assert.deepEqual(readReceipts(null, ['fis-1']), { gone: [], settled: [] });
});

test('erişim token\'ı yalnız verilirse başlığa girer', () => {
  assert.equal(expoHeaders().authorization, undefined);
  assert.equal(expoHeaders('sentetik').authorization, 'Bearer sentetik');
});
