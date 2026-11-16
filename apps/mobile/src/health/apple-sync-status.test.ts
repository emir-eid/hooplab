// Apple Sağlık durum satırı (karar 0061 sıra 3d).
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeAppleSync } from './apple-sync-status.ts';

const base = { cursor: null, syncedThrough: null, lastSuccessAt: null, lastError: null };
const now = new Date('2026-01-15T12:00:00');

test('durumlar: eşitleniyor, hata, yarım, başarılı, hiç', () => {
  assert.equal(describeAppleSync(base, true, now).value, 'Eşitleniyor');
  assert.equal(describeAppleSync({ ...base, lastError: 'upload_500' }, false, now).value, 'Eşitlenemedi');
  assert.ok(!describeAppleSync({ ...base, lastError: 'upload_500' }, false, now).detail.includes('upload'), 'kod gösterilmez');
  assert.equal(describeAppleSync({ ...base, cursor: '2026-01-08' }, false, now).value, 'Yarım kaldı');
  assert.match(describeAppleSync({ ...base, lastSuccessAt: new Date('2026-01-15T09:05:00').toISOString() }, false, now).value, /^09[:.]05$/);
  assert.equal(describeAppleSync(base, false, now).value, 'Henüz eşitlenmedi');
});
