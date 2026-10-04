// Google'ın izin ekranından döndüğü adres (OAuth redirect URI). Kimlik doğrulaması tek kullanımlık
// `state` ile yapılır: durum yoksa, süresi geçtiyse veya zaten kullanıldıysa hiçbir şey yazılmaz.
// Başarıda yenileme token'ı yalnız sunucu tablosuna yazılır, kullanıcı uygulamaya geri gönderilir ve
// ilk senkron arka planda başlar. HTML sunulamaz (özel alan adı yok); yanıtlar yönlendirme veya düz metin.

import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { exchangeCode, GoogleApiError } from '../_shared/google-health/client.ts';
import { isWellFormedState, missingScopes, withOutcome } from '../_shared/google-health/oauth.ts';
import { consumeOAuthState, readEnv, saveConnection, syncUser } from '../_shared/google-health/service.ts';

const redirect = (location: string) => new Response(null, { status: 302, headers: { Location: location } });
const text = (body: string, status: number) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

export default {
  fetch: withSupabase({ auth: 'none', cors: false }, async (req, ctx) => {
    if (req.method !== 'GET') return text('Yöntem desteklenmiyor.', 405);
    const env = readEnv((key) => Deno.env.get(key));
    if (!env) return text('Google Health bağlantısı yapılandırılmamış.', 503);

    const params = new URL(req.url).searchParams;
    const state = params.get('state');
    if (!isWellFormedState(state)) return text('Geçersiz bağlantı isteği. Uygulamadan yeniden dene.', 400);

    const now = new Date();
    const pending = await consumeOAuthState(ctx.supabaseAdmin, state, now);
    if (!pending) return text('Bağlantı isteğinin süresi dolmuş. Uygulamadan yeniden dene.', 400);

    // Kullanıcı izin vermediyse Google `error=access_denied` ile döner.
    if (params.get('error')) return redirect(withOutcome(pending.returnUrl, 'denied'));
    const code = params.get('code');
    if (!code) return redirect(withOutcome(pending.returnUrl, 'error', 'no_code'));

    try {
      const token = await exchangeCode(fetch, env, { code, codeVerifier: pending.codeVerifier, redirectUri: env.redirectUri });
      if (!token.refresh_token) return redirect(withOutcome(pending.returnUrl, 'error', 'no_refresh_token'));
      if (missingScopes(token.scope).length > 0) {
        return redirect(withOutcome(pending.returnUrl, 'error', 'missing_scopes'));
      }
      await saveConnection(ctx.supabaseAdmin, pending.userId, { refreshToken: token.refresh_token, scope: token.scope }, now);
    } catch (err) {
      const reason = err instanceof GoogleApiError ? err.code : 'internal';
      console.error('ghealth-callback', reason);
      return redirect(withOutcome(pending.returnUrl, 'error', reason.slice(0, 40)));
    }

    // İlk senkron (geriye dönük günler) arka planda; kullanıcı beklemez.
    const initialSync = syncUser(ctx.supabaseAdmin, env, pending.userId, { fetch, now }).catch((err) => {
      console.error('ghealth-callback ilk senkron', err instanceof Error ? err.message : 'bilinmiyor');
    });
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(initialSync);

    return redirect(withOutcome(pending.returnUrl, 'connected'));
  }),
};
