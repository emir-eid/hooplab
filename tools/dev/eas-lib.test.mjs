import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { hasAscAppId, isValidAscAppId, needsAscAppId, withAscAppId, withoutAscAppId } from './eas-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = '{\n  "build": { "production": { "channel": "production" } },\n  "submit": { "production": {} }\n}\n';

test('yalnız gönderim yapan komutlar numara ister', () => {
  assert.equal(needsAscAppId(['submit', '--platform', 'ios']), true);
  assert.equal(needsAscAppId(['build', '--platform', 'ios', '--profile', 'production', '--auto-submit']), true);
  assert.equal(needsAscAppId(['build', '--auto-submit-with-profile=production']), true);
  assert.equal(needsAscAppId(['build', '--platform', 'ios']), false);
  assert.equal(needsAscAppId(['update', '--channel', 'production']), false);
  assert.equal(needsAscAppId(['--non-interactive', 'submit']), true);
  assert.equal(needsAscAppId([]), false);
});

test('numara yalnız rakam', () => {
  assert.equal(isValidAscAppId('1234567890'), true);
  assert.equal(isValidAscAppId(''), false);
  assert.equal(isValidAscAppId('12a4'), false);
  assert.equal(isValidAscAppId(undefined), false);
  assert.throws(() => withAscAppId(BASE, 'abc'));
});

test('numara her submit profiline eklenir, başka alan değişmez', () => {
  const out = JSON.parse(withAscAppId(BASE, '1234567890'));
  assert.deepEqual(out.submit.production, { ios: { ascAppId: '1234567890' } });
  assert.deepEqual(out.build, { production: { channel: 'production' } });
  assert.equal(hasAscAppId(withAscAppId(BASE, '1')), true);
});

test('var olan ios ayarları korunur', () => {
  const text = '{ "submit": { "production": { "ios": { "appleTeamId": "ABCDEFGHIJ" } } } }';
  assert.deepEqual(JSON.parse(withAscAppId(text, '42')).submit.production.ios, { appleTeamId: 'ABCDEFGHIJ', ascAppId: '42' });
});

test('yarıda kalan numara silinir, eklenip silinen metin özgün JSON\'a eşit', () => {
  const restored = withoutAscAppId(withAscAppId(BASE, '1234567890'));
  assert.deepEqual(JSON.parse(restored), JSON.parse(BASE));
  assert.equal(hasAscAppId(restored), false);
  const text = '{ "submit": { "production": { "ios": { "appleTeamId": "ABCDEFGHIJ", "ascAppId": "42" } } } }';
  assert.deepEqual(JSON.parse(withoutAscAppId(text)).submit.production.ios, { appleTeamId: 'ABCDEFGHIJ' });
});

test('submit bölümü yoksa metin olduğu gibi kalır', () => {
  const out = JSON.parse(withAscAppId('{ "build": {} }', '42'));
  assert.deepEqual(out, { build: {} });
});

test('bekçi: repodaki eas.json\'da ascAppId yok (karar 0009, 0024 eki)', () => {
  const text = readFileSync(path.join(ROOT, 'apps', 'mobile', 'eas.json'), 'utf8');
  assert.equal(hasAscAppId(text), false);
});
