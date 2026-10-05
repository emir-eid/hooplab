import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveBuildIdentity } from './build-identity.ts';

// Sentetik değerler; gerçek proje kimliği değildir.
const ID = '00000000-0000-4000-8000-000000000000';

test('değer yoksa kimlik boş: Expo Go ve web önizlemesi kimliksiz çalışır', () => {
  assert.deepEqual(resolveBuildIdentity({}), {});
  assert.deepEqual(resolveBuildIdentity({ HOOPLAB_IOS_BUNDLE_ID: '  ', HOOPLAB_EAS_PROJECT_ID: '' }), {});
});

test('tam kimlik: güncelleme adresi proje kimliğinden türetilir', () => {
  assert.deepEqual(
    resolveBuildIdentity({ HOOPLAB_IOS_BUNDLE_ID: 'io.github.ornek.hooplab', HOOPLAB_EAS_PROJECT_ID: ID, HOOPLAB_EAS_OWNER: 'ornek' }),
    { bundleIdentifier: 'io.github.ornek.hooplab', projectId: ID, updatesUrl: `https://u.expo.dev/${ID}`, owner: 'ornek' },
  );
});

test('bozuk değer derlemeyi durdurur', () => {
  assert.throws(() => resolveBuildIdentity({ HOOPLAB_IOS_BUNDLE_ID: 'hooplab' }), /HOOPLAB_IOS_BUNDLE_ID/);
  assert.throws(() => resolveBuildIdentity({ HOOPLAB_IOS_BUNDLE_ID: 'io.ornek.hoop lab' }), /HOOPLAB_IOS_BUNDLE_ID/);
  assert.throws(() => resolveBuildIdentity({ HOOPLAB_EAS_PROJECT_ID: 'b239' }), /HOOPLAB_EAS_PROJECT_ID/);
  assert.throws(() => resolveBuildIdentity({ HOOPLAB_EAS_OWNER: '@ornek' }), /HOOPLAB_EAS_OWNER/);
});
