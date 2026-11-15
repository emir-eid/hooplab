// Koçun profil okuması (karar 0061): satır yoksa varsayılan, hata varsa varsayılana düşmez.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

import { DEFAULT_PROFILE } from '../../_shared/coach/kb.ts';
import { readProfile } from '../../_shared/coach/service.ts';

function fakeDb(result: { data: unknown; error: { code: string } | null }, seen: string[] = []): SupabaseClient {
  const chain = {
    select(cols: string) {
      seen.push(`select ${cols}`);
      return chain;
    },
    eq(col: string, value: string) {
      seen.push(`eq ${col}=${value}`);
      return chain;
    },
    maybeSingle: async () => result,
  };
  return {
    from(table: string) {
      seen.push(`from ${table}`);
      return chain;
    },
  } as unknown as SupabaseClient;
}

test('profil satırı kullanıcıya daraltılarak okunur ve eşlenir', async () => {
  const seen: string[] = [];
  const profile = await readProfile(fakeDb({ data: { data_source: 'apple_health', sport: 'fitness', sex: 'kadin' }, error: null }, seen), 'u1');
  assert.deepEqual(profile, { source: 'apple_health', sport: 'fitness', sex: 'kadin' });
  assert.deepEqual(seen, ['from profiles', 'select data_source, sport, sex', 'eq user_id=u1']);
});

test('satır yoksa veritabanının varsayılanı (sahibinin profili)', async () => {
  assert.deepEqual(await readProfile(fakeDb({ data: null, error: null }), 'u1'), DEFAULT_PROFILE);
});

test('okuma hatası varsayılana düşmez, hata fırlatır', async () => {
  await assert.rejects(readProfile(fakeDb({ data: null, error: { code: '42501' } }), 'u1'), /profiles: veritabanı hatası 42501/);
});
