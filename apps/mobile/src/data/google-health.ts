// Google Health bağlantısının veri erişimi. Sır uygulamaya hiç girmez: izin adresi, senkron ve bağlantı
// kesme Edge Functions'ta (karar 0019); uygulama yalnız kendi durum satırını okur (RLS).

import type { Result } from '@/data/daily-log';
import { describeFunctionFailure, type SyncStatusRow } from '@/data/google-health-status';
import { demoStore } from '@/demo/demo-mode';
import { demoUnavailable } from '@/demo/demo-store';
import { supabase } from '@/lib/supabase';

const offline = 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.';

/**
 * Başarısız fonksiyon çağrısının kullanıcıya söylenen hali. supabase-js, 2xx dışı yanıtta hatanın
 * `context` alanına Response'u koyar; durum kodu ve fonksiyonun `{ error }` kodu oradan okunur.
 */
async function functionFailure(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return fallback;
  let code: string | undefined;
  try {
    const body: unknown = await context.clone().json();
    const value = (body as { error?: unknown } | null)?.error;
    code = typeof value === 'string' ? value : undefined;
  } catch {
    code = undefined;
  }
  return describeFunctionFailure(context.status, code, fallback);
}

export async function fetchSyncStatus(): Promise<Result<SyncStatusRow | null>> {
  const demo = demoStore();
  if (demo) return demo.fetchSyncStatus();
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('health_sync_status')
    .select('state, connected_at, synced_from, synced_through, last_success_at, last_error')
    .maybeSingle();
  if (error) return { ok: false, message: offline };
  return { ok: true, value: (data as SyncStatusRow | null) ?? null };
}

/** Google izin ekranının adresi; dönüşte uygulamaya `returnUrl` ile gelinir. */
export async function startConnect(returnUrl: string): Promise<Result<string>> {
  if (demoStore()) return { ok: false, message: demoUnavailable };
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase.functions.invoke<{ url?: string }>('ghealth-connect', {
    body: { returnUrl },
  });
  if (error || !data?.url) {
    return { ok: false, message: await functionFailure(error, 'Bağlantı başlatılamadı. Biraz sonra yeniden dene.') };
  }
  return { ok: true, value: data.url };
}

export async function syncNow(): Promise<Result<'ok' | 'partial' | 'reconnect_required' | 'not_connected'>> {
  if (demoStore()) return { ok: false, message: demoUnavailable };
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase.functions.invoke<{ outcome?: string }>('ghealth-sync', { body: {} });
  const outcome = data?.outcome;
  if (error || !outcome || outcome === 'error') {
    return { ok: false, message: await functionFailure(error, 'Senkron tamamlanamadı. Saatlik senkron yeniden deneyecek.') };
  }
  return { ok: true, value: outcome as 'ok' | 'partial' | 'reconnect_required' | 'not_connected' };
}

export async function disconnectGoogleHealth(): Promise<Result<null>> {
  if (demoStore()) return { ok: false, message: demoUnavailable };
  if (!supabase) return { ok: false, message: offline };
  const { error } = await supabase.functions.invoke('ghealth-connect', { method: 'DELETE' });
  return error ? { ok: false, message: 'Bağlantı kesilemedi. Biraz sonra yeniden dene.' } : { ok: true, value: null };
}
