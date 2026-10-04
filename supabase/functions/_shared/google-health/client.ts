// Google Health API v4 ve OAuth token uç noktası için küçük istemci. fetch dışarıdan verilir (test).
// Sayfalama: list → nextPageToken; dailyRollUp → aynı gövde + pageToken (ghealth cmd/data.go).
// 429 ve 5xx iki kez yeniden denenir (1 sn, 2 sn); 401'de çağıran token'ı yeniler.

import type {
  DailyRollUpDataPointsResponse,
  DailyRollupDataPoint,
  DataPoint,
  ListDataPointsResponse,
  Settings,
  TokenResponse,
} from './api-types.ts';
import { isoToCivil } from './dates.ts';
import { GOOGLE_REVOKE_URL, GOOGLE_TOKEN_URL } from './oauth.ts';

export const GOOGLE_HEALTH_API_BASE = 'https://health.googleapis.com/v4';

// Bileklik ailesi: Fitbit / Google cihazları; iPhone (HealthKit) ve elle girilen veri hariç.
// Adım ve mesafe iki kaynaktan gelir (LESSONS); bu aile çift sayımı önler.
export const WEARABLES_FAMILY = 'users/me/dataSourceFamilies/google-wearables';

const MAX_PAGES = 50;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type Sleeper = (ms: number) => Promise<void>;

export class GoogleApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'GoogleApiError';
    this.status = status;
    this.code = code;
  }
}

// Hata gövdesinden yalnız kısa durum kodu alınır; mesaj kişisel veri içerebilir diye saklanmaz.
async function errorFrom(res: Response): Promise<GoogleApiError> {
  let code = `http_${res.status}`;
  try {
    const body = (await res.json()) as { error?: { status?: string } | string };
    if (typeof body.error === 'string') code = body.error;
    else if (body.error?.status) code = body.error.status;
  } catch {
    // gövde JSON değil
  }
  return new GoogleApiError(res.status, code, `Google isteği başarısız: ${res.status} ${code}`);
}

async function withRetry(fetchImpl: FetchLike, sleep: Sleeper, url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url, init);
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 2) return res;
    await res.body?.cancel();
    await sleep(1000 * 2 ** attempt);
  }
}

export interface OAuthClientConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
  revokeUrl?: string;
}

export async function exchangeCode(
  fetchImpl: FetchLike,
  config: OAuthClientConfig,
  params: { code: string; codeVerifier: string; redirectUri: string },
): Promise<TokenResponse> {
  const res = await fetchImpl(config.tokenUrl ?? GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      code_verifier: params.codeVerifier,
      redirect_uri: params.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  if (!res.ok) throw await errorFrom(res);
  return (await res.json()) as TokenResponse;
}

// Yenileme token'ı düşmüşse (Testing modunda 7. gün) Google `invalid_grant` döner.
export async function refreshAccessToken(
  fetchImpl: FetchLike,
  config: OAuthClientConfig,
  refreshToken: string,
): Promise<TokenResponse> {
  const res = await fetchImpl(config.tokenUrl ?? GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  if (!res.ok) throw await errorFrom(res);
  const token = (await res.json()) as TokenResponse;
  if (!token.access_token) throw new GoogleApiError(500, 'no_access_token', 'Google erişim token’ı dönmedi');
  return token;
}

// Bağlantı kesilirken token Google'da da geçersiz kılınır (en iyi çaba).
export async function revokeToken(fetchImpl: FetchLike, config: OAuthClientConfig, token: string): Promise<boolean> {
  const res = await fetchImpl(config.revokeUrl ?? GOOGLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });
  await res.body?.cancel();
  return res.ok;
}

export class GoogleHealthClient {
  private readonly fetchImpl: FetchLike;
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly sleep: Sleeper;

  constructor(
    fetchImpl: FetchLike,
    accessToken: string,
    baseUrl: string = GOOGLE_HEALTH_API_BASE,
    sleep: Sleeper = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {
    this.fetchImpl = fetchImpl;
    this.accessToken = accessToken;
    this.baseUrl = baseUrl;
    this.sleep = sleep;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.accessToken}` };
    if (init.body) headers['Content-Type'] = 'application/json';
    const res = await withRetry(this.fetchImpl, this.sleep, `${this.baseUrl}${path}`, { ...init, headers });
    if (!res.ok) throw await errorFrom(res);
    return (await res.json()) as T;
  }

  getSettings(): Promise<Settings> {
    return this.request<Settings>('/users/me/settings');
  }

  async list(
    dataType: string,
    filter: string,
    options: { pageSize: number; dataSourceFamily?: string },
  ): Promise<DataPoint[]> {
    const points: DataPoint[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const query = new URLSearchParams({ filter, pageSize: String(options.pageSize) });
      if (options.dataSourceFamily) query.set('dataSourceFamily', options.dataSourceFamily);
      if (pageToken) query.set('pageToken', pageToken);
      const res = await this.request<ListDataPointsResponse>(
        `/users/me/dataTypes/${dataType}/dataPoints?${query.toString()}`,
      );
      points.push(...(res.dataPoints ?? []));
      pageToken = res.nextPageToken || undefined;
      if (!pageToken) return points;
    }
    throw new GoogleApiError(500, 'too_many_pages', `${dataType}: sayfa sınırı aşıldı`);
  }

  // [fromIso, toIso) sivil günler; tek istekte API sınırını (14 / 90 gün) aşmamalı.
  async dailyRollUp(
    dataType: string,
    fromIso: string,
    toIso: string,
    dataSourceFamily?: string,
  ): Promise<DailyRollupDataPoint[]> {
    const points: DailyRollupDataPoint[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      // pageSize verilmez: discovery belgesi 10000'e izin verdiğini söylese de API dailyRollUp'ta
      // INVALID_ARGUMENT döndürüyor (LESSONS). Pencere en fazla 90 gün, varsayılan sayfa 1440 nokta.
      const body: Record<string, unknown> = {
        range: { start: { date: isoToCivil(fromIso) }, end: { date: isoToCivil(toIso) } },
        windowSizeDays: 1,
      };
      if (dataSourceFamily) body.dataSourceFamily = dataSourceFamily;
      if (pageToken) body.pageToken = pageToken;
      const res = await this.request<DailyRollUpDataPointsResponse>(
        `/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      points.push(...(res.rollupDataPoints ?? []));
      pageToken = res.nextPageToken || undefined;
      if (!pageToken) return points;
    }
    throw new GoogleApiError(500, 'too_many_pages', `${dataType}: sayfa sınırı aşıldı`);
  }
}
