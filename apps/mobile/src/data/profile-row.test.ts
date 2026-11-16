import assert from 'node:assert/strict';
import { test } from 'node:test';

import { defaultProfile, profileUpdate, toProfile } from './profile-row.ts';

test('satır yoksa ya da bozuksa sahibinin profili', () => {
  assert.deepEqual(toProfile(null), defaultProfile);
  assert.deepEqual(toProfile(undefined), defaultProfile);
  assert.deepEqual(toProfile({}), defaultProfile);
  assert.deepEqual(toProfile({ data_source: 'Apple_Health', sport: 'tenis', sex: 'K', cycle_tracking: 'true' }), defaultProfile);
});

test('Apple yolu yalnız açıkça apple_health yazan satırla açılır', () => {
  assert.deepEqual(toProfile({ data_source: 'apple_health', sport: 'fitness' }), { ...defaultProfile, dataSource: 'apple_health', sport: 'fitness' });
  assert.deepEqual(toProfile({ data_source: 'google_health', sport: 'basketbol', answered_at: '2026-11-16T15:30:00Z' }), defaultProfile);
});

test('ilk giriş soruları yalnız açıkça boş answered_at ile açılır (karar 0061 sıra 4c)', () => {
  assert.equal(toProfile({ answered_at: null }).answered, false);
  assert.equal(toProfile({ answered_at: '2026-11-16T15:30:00Z' }).answered, true);
  assert.equal(toProfile({}).answered, true);
});

test('döngü ve korunma yalnız kadın profilinde okunur ve yazılır', () => {
  assert.deepEqual(toProfile({ sex: 'erkek', cycle_tracking: true, hormonal_contraception: 'var' }), { ...defaultProfile, sex: 'erkek' });
  const f = toProfile({ sex: 'kadin', cycle_tracking: true, hormonal_contraception: 'belirtmek_istemiyorum' });
  assert.equal(f.cycleTracking, true);
  assert.equal(f.contraception, 'belirtmek_istemiyorum');
  const now = '2026-11-16T15:30:00.000Z';
  assert.deepEqual(profileUpdate({ sex: 'erkek', cycleTracking: true, contraception: 'var' }, now), {
    sex: 'erkek',
    cycle_tracking: false,
    hormonal_contraception: null,
    answered_at: now,
  });
  assert.deepEqual(profileUpdate({ sex: 'kadin', cycleTracking: false, contraception: 'var' }, now).hormonal_contraception, null);
  assert.deepEqual(profileUpdate({ sex: 'kadin', cycleTracking: true, contraception: 'yok' }, now), {
    sex: 'kadin',
    cycle_tracking: true,
    hormonal_contraception: 'yok',
    answered_at: now,
  });
  assert.equal(profileUpdate({ sex: null, cycleTracking: false, contraception: null }, now).sex, null);
});
