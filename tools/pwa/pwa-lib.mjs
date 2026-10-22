// PWA derlemesinin saf parçaları (karar 0054): ortam denetimi, Vercel yapılandırması, Google dönüş adresi.
// Yan etkisiz; build-pwa.mjs kullanır, pwa-lib.test.mjs denetler.

/** PWA'nın adresi (karar 0054, kullanıcı seçimi 2026-10-22). Yayın bu adreste yapılır. */
export const PWA_ORIGIN = 'https://app.hooplab.dev';

/** Google bağlantısı ekranının yolu; uygulamadaki RETURN_PATH ile aynı (me/google-health.tsx). */
export const GOOGLE_RETURN_PATH = '/me/google-health';

/** Supabase'in GHEALTH_WEB_RETURN_URL secret'ına yazılacak tek, sabit adres. */
export function pwaReturnUrl(origin = PWA_ORIGIN) {
  const url = new URL(GOOGLE_RETURN_PATH, origin);
  if (url.protocol !== 'https:' || url.origin !== origin.replace(/\/+$/, '')) throw new Error(`PWA adresi https kökeni olmalı: ${origin}`);
  return url.href;
}

/**
 * PWA gerçek projeye bağlı derlenir: Supabase adresi ve publishable anahtar şart (ikisi de herkese açık
 * değer, sır değil; CLAUDE.md §2). Gizli anahtar ya da demo bayrağı pakete girmemeli.
 */
export function publicEnvProblems(env) {
  const problems = [];
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url)) problems.push('EXPO_PUBLIC_SUPABASE_URL bulut proje adresi değil (https://<ref>.supabase.co).');
  if (!key) problems.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY boş.');
  else if (!key.startsWith('sb_publishable_')) problems.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY publishable anahtar değil (sb_publishable_ ile başlamalı).');
  if (env.EXPO_PUBLIC_HOOPLAB_DEMO_ONLY) problems.push('EXPO_PUBLIC_HOOPLAB_DEMO_ONLY ayarlı: PWA demo değil.');
  if (env.HOOPLAB_WEB_BASE_URL) problems.push('HOOPLAB_WEB_BASE_URL ayarlı: PWA kök adreste static çıktıyla derlenir (manifest yalnız orada, LESSONS).');
  return problems;
}

/**
 * Vercel'de statik klasör olarak yayınlanan çıktının yapılandırması. Rota başına HTML dosyası var
 * (static çıktı; açıklama sayfaları generateStaticParams ile), yönlendirme gerekmez.
 * HTML her açılışta yeniden doğrulanır ki yeni sürüm ana ekran kipinde takılı kalmasın; _expo/static
 * altındaki dosyaların adı içerik özetini taşır, uzun süre önbelleklenir.
 */
export function vercelConfig() {
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      // İki Cache-Control kuralı çakışmasın diye kaynaklar ayrık (Vercel'in çakışmada seçtiği belgelenmemiş).
      { source: '/:path((?!_expo/static/).*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      { source: '/_expo/static/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/manifest.webmanifest', headers: [{ key: 'Content-Type', value: 'application/manifest+json' }] },
    ],
  };
}
