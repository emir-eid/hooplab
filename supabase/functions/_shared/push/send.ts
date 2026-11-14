// Hatırlatma gönderimi. Kullanıcının kayıtlı iPhone uygulaması varsa (push_devices, karar 0060) Expo push servisiyle
// yalnız ona gider; hiçbiri yoksa ya da hiçbirine ulaşılamadıysa PWA aboneliklerine Web Push (karar 0058: VAPID ile
// imzalı, aes128gcm ile şifreli, npm:web-push). Push servisinde artık olmayan abonelik (404 / 410) ve uygulaması
// silinmiş cihaz (DeviceNotRegistered) silinir. Yükte yalnız başlık, metin ve açılacak ekran var.

import webpush from 'npm:web-push@3.6.7';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

import {
  EXPO_MAX_MESSAGES,
  EXPO_MAX_RECEIPT_IDS,
  EXPO_RECEIPTS_URL,
  EXPO_SEND_URL,
  RECEIPT_MAX_AGE_HOURS,
  RECEIPT_MIN_AGE_MINUTES,
  expoMessages,
  postExpo,
  readReceipts,
  readTickets,
  type PushPayload,
} from './expo.ts';

export type { PushPayload } from './expo.ts';

export interface PushEnv {
  /** Web Push (PWA); yoksa yalnız iPhone uygulamasına gönderilir. */
  vapid?: { publicKey: string; privateKey: string; subject: string };
  /** Expo "enhanced push security" açılırsa erişim token'ı (Supabase secrets `EXPO_ACCESS_TOKEN`); şimdilik yok. */
  expoAccessToken?: string;
  cronSecret?: string;
}

export function readPushEnv(get: (key: string) => string | undefined): PushEnv {
  const env: PushEnv = {};
  const publicKey = get('VAPID_PUBLIC_KEY');
  const privateKey = get('VAPID_PRIVATE_KEY');
  const subject = get('VAPID_SUBJECT');
  // VAPID iletişim adresi `mailto:` ya da `https:`; Apple localhost adresini reddeder.
  if (publicKey && privateKey && subject && /^(mailto:|https:\/\/)/.test(subject)) env.vapid = { publicKey, privateKey, subject };
  const expoAccessToken = get('EXPO_ACCESS_TOKEN');
  if (expoAccessToken) env.expoAccessToken = expoAccessToken;
  const cronSecret = get('GHEALTH_CRON_SECRET');
  if (cronSecret) env.cronSecret = cronSecret;
  return env;
}

export interface SendResult {
  sent: number;
  failed: number;
  removed: number;
  /** Hangi yol kullanıldı (yanıtta ve günlükte; adres ve token yazılmaz). */
  via: 'native' | 'web' | 'none';
}

interface DeviceRow {
  id: string;
  token: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendNative(admin: SupabaseClient, env: PushEnv, devices: DeviceRow[], payload: PushPayload) {
  let sent = 0;
  let failed = 0;
  let removed = 0;
  for (let i = 0; i < devices.length; i += EXPO_MAX_MESSAGES) {
    const batch = devices.slice(i, i + EXPO_MAX_MESSAGES);
    const messages = expoMessages(batch.map((d) => d.token), payload);
    const response = await postExpo(EXPO_SEND_URL, messages, env.expoAccessToken);
    const tickets = readTickets(response, batch.length);
    for (const [j, ticket] of tickets.entries()) {
      const device = batch[j]!;
      if (ticket.kind === 'ok') {
        sent++;
        await admin.from('push_tickets').insert({ device_id: device.id, ticket_id: ticket.ticketId });
        await admin.from('push_devices').update({ last_success_at: new Date().toISOString() }).eq('id', device.id);
      } else if (ticket.kind === 'gone') {
        await admin.from('push_devices').delete().eq('id', device.id);
        removed++;
      } else {
        failed++;
      }
    }
  }
  return { sent, failed, removed };
}

async function sendWeb(admin: SupabaseClient, env: PushEnv, subs: SubscriptionRow[], payload: PushPayload) {
  let sent = 0;
  let failed = 0;
  let removed = 0;
  const vapid = env.vapid;
  if (!vapid) return { sent, failed: subs.length, removed };
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        {
          vapidDetails: { subject: vapid.subject, publicKey: vapid.publicKey, privateKey: vapid.privateKey },
          TTL: 3600,
          urgency: 'normal',
        },
      );
      sent++;
      await admin.from('push_subscriptions').update({ last_success_at: new Date().toISOString() }).eq('id', sub.id);
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id);
        removed++;
      } else {
        // Adres ve anahtar günlüğe yazılmaz; yalnız durum kodu.
        console.error('push', status ?? 'bilinmiyor');
        failed++;
      }
    }
  }
  return { sent, failed, removed };
}

/**
 * Kullanıcıya gönderir (karar 0060): önce iPhone uygulaması; ona hiç ulaşılamadıysa (kayıt yok, hepsi silinmiş ya da
 * Expo geçici hata verdi) PWA abonelikleri. Böylece iki cihazda çift bildirim gelmez, native kayıt düşerse PWA devralır.
 */
export async function sendToUser(admin: SupabaseClient, env: PushEnv, userId: string, payload: PushPayload): Promise<SendResult> {
  const devices = await admin.from('push_devices').select('id, token').eq('user_id', userId);
  if (devices.error) throw new Error('database');
  const native = await sendNative(admin, env, (devices.data ?? []) as DeviceRow[], payload);
  if (native.sent > 0) return { ...native, via: 'native' };

  const subs = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId);
  if (subs.error) throw new Error('database');
  const web = await sendWeb(admin, env, (subs.data ?? []) as SubscriptionRow[], payload);
  const total = {
    sent: web.sent,
    failed: native.failed + web.failed,
    removed: native.removed + web.removed,
  };
  return { ...total, via: web.sent > 0 ? 'web' : 'none' };
}

/**
 * Expo makbuzları (karar 0060): 15 dakikadan eski fişlerin sonucu sorulur; uygulaması silinmiş cihaz kaydı silinir
 * (sonraki hatırlatma PWA'ya gider). Sonucu kesinleşen ve 24 saatten eski fişler silinir. Hata gönderimi durdurmaz.
 */
export async function checkReceipts(admin: SupabaseClient, env: PushEnv, now = new Date()): Promise<{ removedDevices: number }> {
  const oldest = new Date(now.getTime() - RECEIPT_MAX_AGE_HOURS * 3_600_000).toISOString();
  await admin.from('push_tickets').delete().lt('created_at', oldest);
  const newest = new Date(now.getTime() - RECEIPT_MIN_AGE_MINUTES * 60_000).toISOString();
  const { data, error } = await admin
    .from('push_tickets')
    .select('id, device_id, ticket_id')
    .lte('created_at', newest)
    .order('created_at')
    .limit(EXPO_MAX_RECEIPT_IDS);
  if (error || !data || data.length === 0) return { removedDevices: 0 };
  const rows = data as { id: number; device_id: string; ticket_id: string }[];
  const ids = rows.map((r) => r.ticket_id);
  const response = await postExpo(EXPO_RECEIPTS_URL, { ids }, env.expoAccessToken);
  if (response === null) return { removedDevices: 0 };
  const { gone, settled } = readReceipts(response, ids);
  const goneDevices = [...new Set(rows.filter((r) => gone.includes(r.ticket_id)).map((r) => r.device_id))];
  if (goneDevices.length > 0) await admin.from('push_devices').delete().in('id', goneDevices);
  const settledRows = rows.filter((r) => settled.includes(r.ticket_id)).map((r) => r.id);
  if (settledRows.length > 0) await admin.from('push_tickets').delete().in('id', settledRows);
  return { removedDevices: goneDevices.length };
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

/** Sabit süreli karşılaştırma (ghealth-sync ile aynı): iki değerin özeti bayt bayt XOR'lanır. */
export async function secretsMatch(given: string | null, expected: string | undefined): Promise<boolean> {
  if (!given || !expected) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}
