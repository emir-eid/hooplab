// PWA hatırlatmalarının gönderimi (karar 0058). Yalnız 15 dakikalık zamanlayıcı çağırır (pg_cron + pg_net,
// `x-hooplab-cron` başlığında Vault'taki paylaşılan sır). Tercihi ve aboneliği olan her kullanıcı için şu an
// gereken hatırlatmalar `push_log`'a yazılır; yazılabilenler (daha önce gönderilmemiş) gönderilir.
// Yanıtta sağlık değeri yok: yalnız sayımlar.

import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { duePushes, localClock, type PushPrefsRow } from '../_shared/push/plan.ts';
import { readPushEnv, secretsMatch, sendToUser } from '../_shared/push/send.ts';

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    const env = readPushEnv((key) => Deno.env.get(key));
    if (!env) return Response.json({ error: 'not_configured' }, { status: 503 });
    if (!(await secretsMatch(req.headers.get('x-hooplab-cron'), env.cronSecret))) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    const admin = ctx.supabaseAdmin;
    const now = new Date();

    const { data: prefsRows, error } = await admin
      .from('notification_prefs')
      .select('user_id, time_zone, checkin_enabled, checkin_time, match_enabled, match_time, reconnect_enabled')
      .or('checkin_enabled.eq.true,match_enabled.eq.true,reconnect_enabled.eq.true');
    if (error) return Response.json({ error: 'database' }, { status: 500 });

    let sent = 0;
    let failed = 0;
    for (const prefs of (prefsRows ?? []) as PushPrefsRow[]) {
      try {
        const clock = localClock(now, prefs.time_zone);
        if (!clock) continue;
        const [checkin, match, sync] = await Promise.all([
          admin.from('daily_checkins').select('id').eq('user_id', prefs.user_id).eq('local_date', clock.date).limit(1),
          admin.from('match_days').select('start_time').eq('user_id', prefs.user_id).eq('local_date', clock.date).maybeSingle(),
          admin.from('health_sync_status').select('state, last_success_at').eq('user_id', prefs.user_id).maybeSingle(),
        ]);
        if (checkin.error || match.error || sync.error) throw new Error('database');
        const due = duePushes(prefs, {
          now,
          checkinDone: (checkin.data ?? []).length > 0,
          ...(match.data ? { match: { startTime: (match.data.start_time as string | null) ?? null } } : {}),
          sync: sync.data ? { state: sync.data.state as string, lastSuccessAt: (sync.data.last_success_at as string | null) ?? null } : null,
        });
        for (const push of due) {
          // Önce günlüğe yaz: aynı anahtar zaten varsa (önceki çalışma gönderdi) satır dönmez, gönderilmez.
          const logged = await admin
            .from('push_log')
            .upsert({ user_id: prefs.user_id, kind: push.kind, key: push.key }, { onConflict: 'user_id,kind,key', ignoreDuplicates: true })
            .select('id');
          if (logged.error) throw new Error('database');
          if ((logged.data ?? []).length === 0) continue;
          const result = await sendToUser(admin, env, prefs.user_id, {
            title: push.title,
            body: push.body,
            route: push.route,
            tag: `hooplab-${push.kind}`,
          });
          sent += result.sent;
          failed += result.failed;
          // Hiçbir cihaza ulaşmadıysa (push servisi geçici hata) kayıt silinir; pencere içinde sonraki çalışma dener.
          if (result.sent === 0 && result.failed > 0) {
            await admin.from('push_log').delete().eq('user_id', prefs.user_id).eq('kind', push.kind).eq('key', push.key);
          }
        }
      } catch (err) {
        console.error('push-dispatch', err instanceof Error ? err.message : 'bilinmiyor');
        failed++;
      }
    }
    return Response.json({ users: (prefsRows ?? []).length, sent, failed });
  }),
};
