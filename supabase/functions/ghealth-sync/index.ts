// Google Health senkronu. İki çağıran var:
//   * Uygulama ("Şimdi senkronla"): kullanıcı JWT'si; yalnız kendi verisi.
//   * Saatlik zamanlayıcı (pg_cron + pg_net): `x-hooplab-cron` başlığında Vault'taki paylaşılan sır;
//     bağlı tüm kullanıcılar. Supabase'in gizli anahtarı veritabanına konmaz, ayrı bir sır kullanılır.
// Yanıtta sağlık değeri yok: yalnız sonuç, sayımlar ve hata kodları.

import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { readEnv, syncUser, type SyncUserResult } from '../_shared/google-health/service.ts';

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

// Sabit süreli karşılaştırma: iki değerin özeti bayt bayt XOR'lanır.
async function secretsMatch(given: string | null, expected: string | undefined): Promise<boolean> {
  if (!given || !expected) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export default {
  fetch: withSupabase({ auth: ['user', 'none'] }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const env = readEnv((key) => Deno.env.get(key));
    if (!env) return Response.json({ error: 'not_configured' }, { status: 503 });
    const now = new Date();

    if (ctx.authMode === 'user') {
      const userId = ctx.userClaims?.id;
      if (!userId || ctx.userClaims?.role !== 'authenticated') {
        return Response.json({ error: 'unauthorized' }, { status: 401 });
      }
      const result = await syncUser(ctx.supabaseAdmin, env, userId, { fetch, now });
      return Response.json(result, { status: result.outcome === 'error' ? 502 : 200 });
    }

    if (!(await secretsMatch(req.headers.get('x-hooplab-cron'), env.cronSecret))) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    const { data, error } = await ctx.supabaseAdmin.from('google_health_tokens').select('user_id');
    if (error) return Response.json({ error: 'database' }, { status: 500 });

    const results: SyncUserResult['outcome'][] = [];
    for (const row of data ?? []) {
      try {
        results.push((await syncUser(ctx.supabaseAdmin, env, row.user_id as string, { fetch, now })).outcome);
      } catch (err) {
        console.error('ghealth-sync', err instanceof Error ? err.message : 'bilinmiyor');
        results.push('error');
      }
    }
    return Response.json({ users: results.length, outcomes: results });
  }),
};
