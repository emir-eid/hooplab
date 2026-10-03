import assert from 'node:assert/strict';
import { test } from 'node:test';

import { defaultAppearance } from '@hooplab/theme';

import { parseStoredAppearance } from './stored-appearance.ts';

test('kayıt yoksa varsayılan', () => {
  assert.deepEqual(parseStoredAppearance(null), defaultAppearance);
  assert.deepEqual(parseStoredAppearance(''), defaultAppearance);
});

test('geçerli kayıt olduğu gibi okunur', () => {
  assert.deepEqual(parseStoredAppearance('{"theme":"dark","animateAura":false}'), {
    theme: 'dark',
    animateAura: false,
  });
});

test('bozuk JSON varsayılana döner', () => {
  assert.deepEqual(parseStoredAppearance('{theme:'), defaultAppearance);
  assert.deepEqual(parseStoredAppearance('null'), defaultAppearance);
  assert.deepEqual(parseStoredAppearance('"dark"'), defaultAppearance);
});

test('bilinmeyen veya eksik alan yalnız o alanda varsayılana döner', () => {
  assert.deepEqual(parseStoredAppearance('{"theme":"sepia","animateAura":false}'), {
    theme: defaultAppearance.theme,
    animateAura: false,
  });
  assert.deepEqual(parseStoredAppearance('{"theme":"light"}'), {
    theme: 'light',
    animateAura: defaultAppearance.animateAura,
  });
});
