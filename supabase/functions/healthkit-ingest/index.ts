// Apple Health yüklemesi (karar 0061 sıra 3b). iPhone uygulaması HealthKit'ten hesapladığı günlük / gecelik değerleri,
// uyku oturumlarını, antrenmanları ve saatlik enerjiyi POST eder. Yalnız oturum açmış kullanıcı (auth: 'user') ve
// yalnız apple_health profili; sahibinin (google_health) hesabına 403 döner, veritabanı bekçisi de reddeder.
// Yanıtta sağlık değeri yok: yalnız sayımlar ya da hatalı alanların yolları.

import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { MAX_BODY_BYTES, runIngest } from '../_shared/healthkit/ingest.ts';
import { supabaseIngestStore } from '../_shared/healthkit/service.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const userId = ctx.userClaims?.id;
    if (!userId || ctx.userClaims?.role !== 'authenticated') {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    const text = await req.text();
    if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
      return Response.json({ error: 'body_too_large' }, { status: 413 });
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return Response.json({ error: 'invalid_body' }, { status: 400 });
    }

    try {
      const result = await runIngest({ userId, body, now: new Date() }, supabaseIngestStore(ctx.supabaseAdmin));
      return Response.json(result.body, { status: result.httpStatus });
    } catch (err) {
      console.error('healthkit-ingest', err instanceof Error ? err.message : 'bilinmiyor');
      return Response.json({ error: 'database' }, { status: 500 });
    }
  }),
};
