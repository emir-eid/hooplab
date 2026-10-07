import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatDecimalInput, parseDecimal } from './decimal.ts';

test('virgül ve nokta kabul edilir; boş, eksi ve harf reddedilir', () => {
  assert.equal(parseDecimal('80,4'), 80.4);
  assert.equal(parseDecimal(' 80.4 '), 80.4);
  assert.equal(parseDecimal('92'), 92);
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal('-1'), null);
  assert.equal(parseDecimal('8o'), null);
  assert.equal(parseDecimal('1,2,3'), null);
});

test('giriş alanı biçimi: virgül, gereksiz sıfır yok', () => {
  assert.equal(formatDecimalInput(80.4), '80,4');
  assert.equal(formatDecimalInput(80), '80');
  assert.equal(formatDecimalInput(1.25, 2), '1,25');
});
