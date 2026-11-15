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
    async upsert(table, onConflict, rows) {
      const { error } = await db.from(table).upsert(rows, { onConflict });
      if (error) throw dbError(table, error);
    },
  };
}
