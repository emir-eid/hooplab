// Koçta soru-cevap (karar 0032, 0037). Uygulama soruyu, yerel günü ve varsa bugünün anlık değerlerini POST eder;
// fonksiyon doğrular, günlük sınırı uygular, soruyu Haiku'yla sınıflandırır, gerekiyorsa Sonnet'e tam kanıt
// tabanıyla sorar, denetler ve `coach_messages`'a yazar. Yalnız oturum açmış kullanıcı (auth: 'user').
// Yanıtta model metni yalnız denetimden geçtiyse bulunur. Anahtar yalnız Supabase secrets'ta; soru günlüğe yazılmaz.

import Anthropic from 'npm:@anthropic-ai/sdk@0.128.0';
import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { runAsk } from '../_shared/coach/ask.ts';
import { kbRules, kbSources } from '../_shared/coach/kb-data.ts';
import { readCoachEnv, supabaseAskStore } from '../_shared/coach/service.ts';

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

    // Süre ve yeniden deneme istek başına (ask.ts askTimeouts): ücretsiz plandaki 150 sn sınırının içinde.
    const client = new Anthropic({ apiKey: env.apiKey, ...(env.baseURL ? { baseURL: env.baseURL } : {}) });
    const result = await runAsk({ userId, body, now: new Date() }, { store: supabaseAskStore(ctx.supabaseAdmin), messages: client.beta.messages, kb });
    return Response.json(result.body, { status: result.httpStatus });
  }),
};
