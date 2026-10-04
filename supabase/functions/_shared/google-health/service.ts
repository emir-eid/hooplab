// Edge Function'ların ortak veritabanı ve ortam katmanı. Veritabanına yalnız service_role istemcisiyle
// (RLS'i atlar) erişilir; bu yüzden her sorgu user_id ile açıkça daraltılır.
// Günlüklere kişisel değer yazılmaz: yalnız kodlar ve sayımlar.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

import { type FetchLike, GoogleApiError, GoogleHealthClient, type OAuthClientConfig, refreshAccessToken, revokeToken } from './client.ts';
import { todayInTimeZone } from './dates.ts';
import { OAUTH_STATE_TTL_MS } from './oauth.ts';
import { planWindow, statusAfterSync, type SyncResult, type SyncStore, syncWindow } from './sync.ts';

export interface GoogleHealthEnv extends OAuthClientConfig {
  redirectUri: string;
  authUrl?: string;
  apiBase?: string;
  cronSecret?: string;
}

// Zorunlu sırlar eksikse null: fonksiyon 503 döner, yarım yapılandırmayla çalışmaz.
// Google uç noktalarının değiştirilebilmesi yalnız yerel denemedeki sahte sunucu içindir.
export function readEnv(get: (key: string) => string | undefined): GoogleHealthEnv | null {
  const clientId = get('GOOGLE_HEALTH_CLIENT_ID');
  const clientSecret = get('GOOGLE_HEALTH_CLIENT_SECRET');
  const supabaseUrl = get('SUPABASE_URL');
  const redirectUri = get('GHEALTH_REDIRECT_URI') ?? (supabaseUrl ? `${supabaseUrl}/functions/v1/ghealth-callback` : undefined);
  if (!clientId || !clientSecret || !redirectUri) return null;
  const env: GoogleHealthEnv = { clientId, clientSecret, redirectUri };
  const optional = {
    authUrl: get('GHEALTH_AUTH_URL'),
    tokenUrl: get('GHEALTH_TOKEN_URL'),
    revokeUrl: get('GHEALTH_REVOKE_URL'),
    apiBase: get('GHEALTH_API_BASE'),
    cronSecret: get('GHEALTH_CRON_SECRET'),
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value) (env as unknown as Record<string, string>)[key] = value;
  }
  return env;
}

type Db = SupabaseClient;

function dbError(where: string, error: { code?: string } | null): Error {
  return new Error(`${where}: veritabanı hatası ${error?.code ?? 'bilinmiyor'}`);
}

// --- OAuth durumu ---

export async function createOAuthState(
  db: Db,
  row: { state: string; userId: string; codeVerifier: string; returnUrl: string },
  now: Date,
): Promise<void> {
  // Süresi geçmiş durumlar temizlenir; tablo hiç büyümez.
  await db
    .from('google_health_oauth_states')
    .delete()
    .lt('created_at', new Date(now.getTime() - OAUTH_STATE_TTL_MS).toISOString());
  const { error } = await db.from('google_health_oauth_states').insert({
    state: row.state,
    user_id: row.userId,
    code_verifier: row.codeVerifier,
    return_url: row.returnUrl,
  });
  if (error) throw dbError('oauth durumu', error);
}

// Tek kullanımlık: okunurken silinir. Süresi geçmişse null.
export async function consumeOAuthState(
  db: Db,
  state: string,
  now: Date,
): Promise<{ userId: string; codeVerifier: string; returnUrl: string } | null> {
  const { data, error } = await db
    .from('google_health_oauth_states')
    .delete()
    .eq('state', state)
    .select('user_id, code_verifier, return_url, created_at')
    .maybeSingle();
  if (error) throw dbError('oauth durumu', error);
  if (!data) return null;
  if (now.getTime() - Date.parse(data.created_at as string) > OAUTH_STATE_TTL_MS) return null;
  return {
    userId: data.user_id as string,
    codeVerifier: data.code_verifier as string,
    returnUrl: data.return_url as string,
  };
}

// --- Bağlantı ---

export async function saveConnection(
  db: Db,
  userId: string,
  token: { refreshToken: string; scope: string | undefined },
  now: Date,
): Promise<void> {
  const { error: tokenError } = await db
    .from('google_health_tokens')
    .upsert({ user_id: userId, refresh_token: token.refreshToken, scope: token.scope ?? null }, { onConflict: 'user_id' });
  if (tokenError) throw dbError('token', tokenError);
  const { error } = await db.from('health_sync_status').upsert(
    { user_id: userId, state: 'connected', connected_at: now.toISOString(), last_error: null },
    { onConflict: 'user_id' },
  );
  if (error) throw dbError('durum', error);
}

export async function disconnect(db: Db, env: GoogleHealthEnv, userId: string, fetchImpl: FetchLike): Promise<void> {
  const { data } = await db.from('google_health_tokens').select('refresh_token').eq('user_id', userId).maybeSingle();
  if (data?.refresh_token) {
    try {
      await revokeToken(fetchImpl, env, data.refresh_token as string);
    } catch {
      // Google'a ulaşılamasa da yerel token silinir.
    }
  }
  const { error: deleteError } = await db.from('google_health_tokens').delete().eq('user_id', userId);
  if (deleteError) throw dbError('token', deleteError);
  const { error } = await db
    .from('health_sync_status')
    .upsert({ user_id: userId, state: 'disconnected', last_error: null }, { onConflict: 'user_id' });
  if (error) throw dbError('durum', error);
}

// --- Senkron ---

export type SyncOutcome = 'ok' | 'partial' | 'not_connected' | 'reconnect_required' | 'error';

export interface SyncUserResult {
  outcome: SyncOutcome;
  counts?: SyncResult['counts'];
  window?: SyncResult['window'];
  errors?: SyncResult['errors'];
}

function storeFor(db: Db, userId: string): SyncStore {
  const upsert = async (table: string, onConflict: string, rows: object[]) => {
    const { error } = await db.from(table).upsert(
      rows.map((r) => ({ ...r, user_id: userId })),
      { onConflict },
    );
    if (error) throw dbError(table, error);
  };
  return {
    upsertDaily: (rows) => upsert('health_daily', 'user_id,local_date', rows),
    upsertSleep: (rows) => upsert('sleep_sessions', 'user_id,source_id', rows),
    upsertExercise: (rows) => upsert('exercise_sessions', 'user_id,source_id', rows),
  };
}

async function updateStatus(db: Db, userId: string, fields: Record<string, unknown>): Promise<void> {
  const { error } = await db.from('health_sync_status').update(fields).eq('user_id', userId);
  if (error) throw dbError('durum', error);
}

export async function syncUser(
  db: Db,
  env: GoogleHealthEnv,
  userId: string,
  options: { fetch: FetchLike; now: Date },
): Promise<SyncUserResult> {
  const { now } = options;
  const { data: token, error: tokenError } = await db
    .from('google_health_tokens')
    .select('refresh_token')
    .eq('user_id', userId)
    .maybeSingle();
  if (tokenError) throw dbError('token', tokenError);
  if (!token) return { outcome: 'not_connected' };

  const { data: status } = await db
    .from('health_sync_status')
    .select('time_zone, synced_from, synced_through')
    .eq('user_id', userId)
    .maybeSingle();
  await updateStatus(db, userId, { last_attempt_at: now.toISOString() });

  let accessToken: string;
  try {
    const refreshed = await refreshAccessToken(options.fetch, env, token.refresh_token as string);
    accessToken = refreshed.access_token as string;
    if (refreshed.refresh_token && refreshed.refresh_token !== token.refresh_token) {
      await db.from('google_health_tokens').update({ refresh_token: refreshed.refresh_token }).eq('user_id', userId);
    }
  } catch (err) {
    if (err instanceof GoogleApiError && err.code === 'invalid_grant') {
      // Testing modunda 7. gün: token düştü. Kullanıcı uygulamadan yeniden bağlanır.
      await db.from('google_health_tokens').delete().eq('user_id', userId);
      await updateStatus(db, userId, { state: 'reconnect_required', last_error: err.code.slice(0, 200) });
      return { outcome: 'reconnect_required' };
    }
    await updateStatus(db, userId, { last_error: (err instanceof GoogleApiError ? err.code : 'token_refresh').slice(0, 200) });
    return { outcome: 'error' };
  }

  const client = new GoogleHealthClient(options.fetch, accessToken, env.apiBase);
  let timeZone = (status?.time_zone as string | null) ?? null;
  try {
    timeZone = (await client.getSettings()).timeZone ?? timeZone;
  } catch {
    // Ayar okunamazsa son bilinen saat dilimiyle devam edilir.
  }

  const today = todayInTimeZone(timeZone, now);
  const window = planWindow((status?.synced_through as string | null) ?? null, today);
  let result: SyncResult;
  try {
    result = await syncWindow(client, storeFor(db, userId), window);
  } catch (err) {
    const code = err instanceof GoogleApiError ? err.code : 'internal';
    await updateStatus(db, userId, { last_error: code.slice(0, 200), time_zone: timeZone });
    return { outcome: 'error', window };
  }

  const next = statusAfterSync(result, today, (status?.synced_from as string | null) ?? null);
  await updateStatus(db, userId, {
    time_zone: timeZone,
    ...(next.advance ? { ...next.advance, last_success_at: now.toISOString() } : {}),
    last_error: next.lastError,
  });
  return {
    outcome: next.outcome,
    counts: result.counts,
    window,
    errors: result.errors,
  };
}
