// Koçun veritabanı ve ortam katmanı. Veritabanına yalnız service_role istemcisiyle (RLS'i atlar) erişilir;
// bu yüzden her sorgu user_id ile açıkça daraltılır (google-health/service.ts gibi).

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

import type { CoachStore, NewSummaryRow, SummaryRow } from './daily.ts';

export interface CoachEnv {
  apiKey: string;
  /** Yalnız yerel denemedeki sahte sunucu için; bulutta boş (SDK varsayılanı). */
  baseURL?: string;
}

/** Anahtar yoksa null: fonksiyon 503 döner. Değer hiçbir yere yazılmaz. */
export function readCoachEnv(get: (key: string) => string | undefined): CoachEnv | null {
  const apiKey = get('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  const baseURL = get('COACH_ANTHROPIC_BASE_URL');
  return baseURL ? { apiKey, baseURL } : { apiKey };
}

function dbError(where: string, error: { code?: string } | null): Error {
  return new Error(`${where}: veritabanı hatası ${error?.code ?? 'bilinmiyor'}`);
}

export function supabaseCoachStore(db: SupabaseClient): CoachStore {
  return {
    async listDay(userId, localDate) {
      const { data, error } = await db
        .from('coach_summaries')
        .select('status, created_at, audit, error')
        .eq('user_id', userId)
        .eq('local_date', localDate)
        .order('created_at', { ascending: false });
      if (error) throw dbError('coach_summaries okunamadı', error);
      return (data ?? []) as SummaryRow[];
    },
    async insert(row: NewSummaryRow) {
      const { error } = await db.from('coach_summaries').insert(row);
      if (error) throw dbError('coach_summaries yazılamadı', error);
    },
  };
}
