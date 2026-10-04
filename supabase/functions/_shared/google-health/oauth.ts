// Google OAuth (Web uygulaması istemcisi) yardımcıları. Akış: uygulama → ghealth-connect (durum + PKCE)
// → Google izin ekranı → ghealth-callback (kod değişimi) → uygulamaya geri dönüş.
// Uç noktalar: https://developers.google.com/identity/protocols/oauth2/web-server

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

// En az yetki: yalnız senkronun okuduğu kategoriler, hepsi salt okuma (ghealth readonly listesinden).
// settings: saat dilimi (günlük toplamlar sporcunun yerel gününe göre).
export const GOOGLE_HEALTH_SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.settings.readonly',
] as const;

// OAuth durumunun ömrü: izin ekranında bu süreden uzun kalınırsa yeniden başlatılır.
export const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

const BASE64URL = /^[A-Za-z0-9_-]+$/;

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

// RFC 7636 S256: challenge = BASE64URL(SHA256(verifier))
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

export function isWellFormedState(state: string | null): state is string {
  return state !== null && state.length >= 32 && state.length <= 128 && BASE64URL.test(state);
}

export function buildAuthUrl(params: {
  authUrl?: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(params.authUrl ?? GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_HEALTH_SCOPES.join(' '));
  // offline + consent: her bağlanışta yeni yenileme token'ı (Testing modunda 7 gün geçerli).
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'false');
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export function missingScopes(granted: string | undefined): string[] {
  const set = new Set((granted ?? '').split(/\s+/).filter(Boolean));
  return GOOGLE_HEALTH_SCOPES.filter((s) => !set.has(s));
}

// Uygulamaya dönüş adresi: yalnız uygulamanın kendi şemaları (hooplab, Expo Go'nun exp/exps) ve
// yerel web önizlemesi. Başka bir siteye yönlendirme yapılmaz (açık yönlendirme yok).
const APP_SCHEMES = new Set(['hooplab:', 'exp:', 'exps:']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isAllowedReturnUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 500) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (APP_SCHEMES.has(url.protocol)) return true;
  return (url.protocol === 'http:' || url.protocol === 'https:') && LOCAL_HOSTS.has(url.hostname);
}

export type ConnectOutcome = 'connected' | 'denied' | 'error';

export function withOutcome(returnUrl: string, outcome: ConnectOutcome, code?: string): string {
  const url = new URL(returnUrl);
  url.searchParams.set('ghealth', outcome);
  if (code) url.searchParams.set('code', code);
  return url.toString();
}
