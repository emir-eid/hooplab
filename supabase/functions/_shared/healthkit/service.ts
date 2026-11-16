// healthkit-ingest'in veritabanı katmanı. Yalnız service_role istemcisiyle (RLS'i atlar) erişilir; bu yüzden profil
// sorgusu user_id ile açıkça daraltılır, satırlara user_id ingest.ts'te eklenir. Günlüğe yalnız hata kodu yazılır.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

import type { IngestStore } from './ingest.ts';

function dbError(where: string, error: { code?: string } | null): Error {
  return new Error(`${where}: veritabanı hatası ${error?.code ?? 'bilinmiyor'}`);
}

export function supabaseIngestStore(db: SupabaseClient): IngestStore {
  return {
    async dataSource(userId) {
      const { data, error } = await db.from('profiles').select('data_source').eq('user_id', userId).maybeSingle();
      if (error) throw dbError('profiles', error);
      return (data?.data_source as string | undefined) ?? null;
    },
    async consented(userId) {
      const { data, error } = await db.from('profiles').select('consented_at').eq('user_id', userId).maybeSingle();
      if (error) throw dbError('profiles', error);
      return data?.consented_at != null;
    },
    async cycleEnabled(userId) {
      const { data, error } = await db.from('profiles').select('sex, cycle_tracking').eq('user_id', userId).maybeSingle();
      if (error) throw dbError('profiles', error);
      return data?.sex === 'kadin' && data?.cycle_tracking === true;
    },
    async upsert(table, onConflict, rows) {
      const { error } = await db.from(table).upsert(rows, { onConflict });
      if (error) throw dbError(table, error);
    },
    async keysInWindow(table, key, userId, window) {
      // cycle_days'in kaynak sütunu yok: satırı yalnız Apple profili yazabilir (veritabanı bekçisi).
      let query = db.from(table).select(key).eq('user_id', userId);
      if (table !== 'cycle_days') query = query.eq('source', 'apple_health');
      const { data, error } = await query.gte('local_date', window.from).lte('local_date', window.to);
      if (error) throw dbError(table, error);
      return ((data ?? []) as unknown as Record<string, string>[]).map((r) => r[key] as string);
    },
    async deleteKeys(table, key, userId, keys) {
      // Silinecekler azdır (HealthKit'te silinen kayıt); yine de URL'yi kısa tutmak için parça parça.
      for (let i = 0; i < keys.length; i += 100) {
        let query = db.from(table).delete().eq('user_id', userId);
        if (table !== 'cycle_days') query = query.eq('source', 'apple_health');
        const { error } = await query.in(key, keys.slice(i, i + 100));
        if (error) throw dbError(table, error);
      }
    },
  };
}
