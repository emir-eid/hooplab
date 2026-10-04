// Google Health bağlantısı: POST izin adresini üretir, DELETE bağlantıyı keser.
// Yalnız oturum açmış kullanıcı (auth: 'user', JWT JWKS ile doğrulanır). Sır uygulamaya hiç gitmez.

import { withSupabase } from 'npm:@supabase/server@1.9.0';

import { buildAuthUrl, isAllowedReturnUrl, pkceChallenge, randomToken } from '../_shared/google-health/oauth.ts';
import { createOAuthState, disconnect, readEnv } from '../_shared/google-health/service.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims?.id;
    if (!userId || ctx.userClaims?.role !== 'authenticated') {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }
    const env = readEnv((key) => Deno.env.get(key));
    if (!env) return Response.json({ error: 'not_configured' }, { status: 503 });

    if (req.method === 'POST') {
      let body: { returnUrl?: unknown };
      try {
        body = (await req.json()) as { returnUrl?: unknown };
      } catch {
        return Response.json({ error: 'invalid_body' }, { status: 400 });
      }
      if (!isAllowedReturnUrl(body.returnUrl)) {
        return Response.json({ error: 'invalid_return_url' }, { status: 400 });
      }
      const state = randomToken();
      const codeVerifier = randomToken(48);
      await createOAuthState(ctx.supabaseAdmin, { state, userId, codeVerifier, returnUrl: body.returnUrl }, new Date());
      const url = buildAuthUrl({
        ...(env.authUrl ? { authUrl: env.authUrl } : {}),
        clientId: env.clientId,
        redirectUri: env.redirectUri,
        state,
        codeChallenge: await pkceChallenge(codeVerifier),
      });
      return Response.json({ url });
    }

    if (req.method === 'DELETE') {
      await disconnect(ctx.supabaseAdmin, env, userId, fetch);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }),
};
