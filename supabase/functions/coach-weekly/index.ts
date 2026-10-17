// Koçun haftalık yorumu (karar 0052). Uygulama biten haftanın sayılarını POST eder; fonksiyon doğrular, gerekiyorsa
// Claude'u çağırır, denetler ve `coach_weekly_summaries`'e yazar. Yalnız oturum açmış kullanıcı (auth: 'user').
// `?peek=1` yalnız saklanan sonuca bakar (model çağrılmaz); `?regenerate=1` elle yeniden yazmadır (hafta başına sınırlı).
// Anahtar yalnız Supabase secrets'ta.

import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { kbRules, kbSources } from '../_shared/coach/kb-data.ts';
import { readCoachEnv, supabaseWeeklyStore } from '../_shared/coach/service.ts';
import { runWeekly } from '../_shared/coach/weekly.ts';

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
    const params = new URL(req.url).searchParams;
    const result = await runWeekly(
      { userId, body, regenerate: params.get('regenerate') === '1', peek: params.get('peek') === '1', now: new Date() },
      { store: supabaseWeeklyStore(ctx.supabaseAdmin), messages: client.beta.messages, kb },
    );
    return Response.json(result.body, { status: result.httpStatus });
  }),
};
