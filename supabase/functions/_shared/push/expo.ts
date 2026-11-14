// iPhone uygulamasına Expo push servisiyle gönderim (karar 0060). Saf işlevler + tek ağ çağrısı.
// Belge (2026-11-14 okundu): https://docs.expo.dev/push-notifications/sending-notifications/
//   * gönderim: POST https://exp.host/--/api/v2/push/send, en çok 100 mesaj; yanıt `data` mesaj sırasıyla fişler
//     (`{status: 'ok', id}` ya da `{status: 'error', details: {error: 'DeviceNotRegistered'}}`)
//   * makbuz: POST https://exp.host/--/api/v2/push/getReceipts `{ids}` (en çok 1000), ~15 dk sonra bakılır,
//     24 saatte silinir; `DeviceNotRegistered` gelen token'a bir daha gönderilmez.
// Expo yükü (başlık, metin, açılacak ekran) ve token'ı görür; yükte sağlık değeri yok.

/** Bildirim yükü (Web Push ve Expo için ortak). */
export interface PushPayload {
  title: string;
  body: string;
  route: string;
  /** Aynı etiketli bildirim bildirim merkezinde öncekinin yerine geçer. */
  tag: string;
}

export const EXPO_SEND_URL = 'https://exp.host/--/api/v2/push/send';
export const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
export const EXPO_MAX_MESSAGES = 100;
export const EXPO_MAX_RECEIPT_IDS = 1000;
/** Makbuza en erken bakılacak yaş (dakika) ve fişlerin tutulduğu en uzun süre (saat); Expo belgesine göre. */
export const RECEIPT_MIN_AGE_MINUTES = 15;
export const RECEIPT_MAX_AGE_HOURS = 24;

const EXPO_TOKEN = /^Expo(nent)?PushToken\[[^\]]{1,180}\]$/;

export function isExpoPushToken(value: unknown): value is string {
  return typeof value === 'string' && EXPO_TOKEN.test(value);
}

export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: { route: string };
  sound: 'default';
  /** Aynı türden önceki bildirimin yerine geçer (Web Push'taki `tag` karşılığı). */
  collapseId: string;
  /** Saatlerce gecikmiş bir sabah hatırlatması gösterilmez (Web Push TTL'iyle aynı). */
  ttl: number;
}

export function expoMessages(tokens: readonly string[], payload: PushPayload): ExpoMessage[] {
  return tokens.filter(isExpoPushToken).map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: { route: payload.route },
    sound: 'default',
    collapseId: payload.tag,
    ttl: 3600,
  }));
}

export type TicketResult = { kind: 'ok'; ticketId: string } | { kind: 'gone' } | { kind: 'error' };

/** Gönderim yanıtını mesaj sırasıyla okur. Yanıt bozuksa hepsi `error` (gönderilmiş sayılmaz). */
export function readTickets(response: unknown, count: number): TicketResult[] {
  const data = (response as { data?: unknown } | null)?.data;
  const out: TicketResult[] = [];
  for (let i = 0; i < count; i++) {
    const t = Array.isArray(data) ? (data[i] as { status?: unknown; id?: unknown; details?: { error?: unknown } } | undefined) : undefined;
    if (t?.status === 'ok' && typeof t.id === 'string' && t.id.length > 0) out.push({ kind: 'ok', ticketId: t.id });
    else if (t?.status === 'error' && t.details?.error === 'DeviceNotRegistered') out.push({ kind: 'gone' });
    else out.push({ kind: 'error' });
  }
  return out;
}

/** Makbuz yanıtı: uygulaması silinmiş cihazların fişleri ve sonucu kesinleşmiş (artık bakılmayacak) fişler. */
export function readReceipts(response: unknown, askedIds: readonly string[]): { gone: string[]; settled: string[] } {
  const data = (response as { data?: unknown } | null)?.data;
  const receipts = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const gone: string[] = [];
  const settled: string[] = [];
  for (const id of askedIds) {
    const r = receipts[id] as { status?: unknown; details?: { error?: unknown } } | undefined;
    if (!r) continue; // makbuz henüz yok: sonraki çalışmada yeniden bakılır
    settled.push(id);
    if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') gone.push(id);
  }
  return { gone, settled };
}

export function expoHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = { accept: 'application/json', 'content-type': 'application/json' };
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;
  return headers;
}

/** Tek POST; ağ ya da HTTP hatasında null (çağıran gönderilmemiş sayar). */
export async function postExpo(url: string, body: unknown, accessToken?: string, fetchFn: typeof fetch = fetch): Promise<unknown> {
  try {
    const res = await fetchFn(url, { method: 'POST', headers: expoHeaders(accessToken), body: JSON.stringify(body) });
    if (!res.ok) {
      console.error('expo-push', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    // Token ve yük günlüğe yazılmaz; yalnız hatanın adı ve iletisi (adres exp.host).
    console.error('expo-push', 'ağ', err instanceof Error ? `${err.name}: ${err.message}` : 'bilinmiyor');
    return null;
  }
}
