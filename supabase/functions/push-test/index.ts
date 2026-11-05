// PWA'da "Deneme bildirimi gönder" (karar 0058): giriş yapmış kullanıcının kendi aboneliklerine sabit bir deneme
// bildirimi. Yükte sağlık değeri yok.

import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { pushTexts } from '../_shared/push/plan.ts';
import { readPushEnv, sendToUser } from '../_shared/push/send.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const userId = ctx.userClaims?.id;
    if (!userId || ctx.userClaims?.role !== 'authenticated') return Response.json({ error: 'unauthorized' }, { status: 401 });
    const env = readPushEnv((key) => Deno.env.get(key));
    if (!env) return Response.json({ error: 'not_configured' }, { status: 503 });
    try {
      const result = await sendToUser(ctx.supabaseAdmin, env, userId, { ...pushTexts.test, route: '/', tag: 'hooplab-test' });
      return Response.json(result, { status: result.sent > 0 ? 200 : result.failed > 0 ? 502 : 404 });
    } catch {
      return Response.json({ error: 'database' }, { status: 500 });
    }
  }),
};
