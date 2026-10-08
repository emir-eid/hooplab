// Koçun günlük özeti (karar 0032). Uygulama günün ilk açılışında motorun anlık değerlerini POST eder;
// fonksiyon doğrular, gerekiyorsa Claude'u çağırır, denetler ve `coach_summaries`'e yazar.
// Yalnız oturum açmış kullanıcı (auth: 'user'). `?regenerate=1` elle yeniden üretmedir (günde sınırlı).
// Yanıtta model metni yalnız denetimden geçtiyse bulunur. Anahtar yalnız Supabase secrets'ta.

import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { runDaily } from '../_shared/coach/daily.ts';
import { kbRules, kbSources } from '../_shared/coach/kb-data.ts';
import { readCoachEnv, supabaseCoachStore } from '../_shared/coach/service.ts';

const kb = { sources: kbSources, rules: kbRules };

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const userId = ctx.userClaims?.id;
    if (!userId || ctx.userClaims?.role !== 'authenticated') {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    const env = readCoachEnv((key) => Deno.env.get(key));
    if (!env) return Response.json({ error: 'not_configured' }, { status: 503 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'invalid_body' }, { status: 400 });
    }

    // Ücretsiz planda fonksiyon süresi 150 sn; tek yeniden deneme bu sınırın içinde kalır.
    const client = new Anthropic({ apiKey: env.apiKey, ...(env.baseURL ? { baseURL: env.baseURL } : {}), timeout: 60_000, maxRetries: 1 });
    const result = await runDaily(
      { userId, body, regenerate: new URL(req.url).searchParams.get('regenerate') === '1', now: new Date() },
      { store: supabaseCoachStore(ctx.supabaseAdmin), messages: client.beta.messages, kb },
    );
    return Response.json(result.body, { status: result.httpStatus });
  }),
};
