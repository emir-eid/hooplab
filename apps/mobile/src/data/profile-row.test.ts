import assert from 'node:assert/strict';
import { test } from 'node:test';

import { defaultProfile, toProfile } from './profile-row.ts';

test('satır yoksa ya da bozuksa sahibinin profili', () => {
  assert.deepEqual(toProfile(null), defaultProfile);
  assert.deepEqual(toProfile(undefined), defaultProfile);
  assert.deepEqual(toProfile({}), defaultProfile);
  assert.deepEqual(toProfile({ data_source: 'Apple_Health', sport: 'tenis' }), defaultProfile);
});

test('Apple yolu yalnız açıkça apple_health yazan satırla açılır', () => {
  assert.deepEqual(toProfile({ data_source: 'apple_health', sport: 'fitness' }), { dataSource: 'apple_health', sport: 'fitness' });
  assert.deepEqual(toProfile({ data_source: 'google_health', sport: 'basketbol' }), defaultProfile);
});
