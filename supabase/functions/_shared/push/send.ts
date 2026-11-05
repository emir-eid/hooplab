// Web Push gönderimi (karar 0058): VAPID ile imzalı, aes128gcm ile şifreli istek (npm:web-push). Abonelik
// push servisinde artık yoksa (404 / 410) silinir. Yükte yalnız başlık, metin ve açılacak ekran var.

import webpush from 'npm:web-push@3.6.7';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.2';

export interface PushEnv {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  /** VAPID iletişim adresi (`mailto:` ya da `https:`); Apple localhost adresini reddeder. */
  vapidSubject: string;
  cronSecret?: string;
}

export function readPushEnv(get: (key: string) => string | undefined): PushEnv | null {
  const vapidPublicKey = get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = get('VAPID_PRIVATE_KEY');
  const vapidSubject = get('VAPID_SUBJECT');
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) return null;
  if (!/^(mailto:|https:\/\/)/.test(vapidSubject)) return null;
  const env: PushEnv = { vapidPublicKey, vapidPrivateKey, vapidSubject };
  const cronSecret = get('GHEALTH_CRON_SECRET');
  if (cronSecret) env.cronSecret = cronSecret;
  return env;
}

export interface PushPayload {
  title: string;
  body: string;
  route: string;
  /** Aynı etiketli bildirim bildirim merkezinde öncekinin yerine geçer. */
  tag: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Kullanıcının bütün aboneliklerine gönderir; başarılı gönderim sayısını döner. */
export async function sendToUser(
  admin: SupabaseClient,
  env: PushEnv,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number; removed: number }> {
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);
  if (error) throw new Error('database');
  let sent = 0;
  let failed = 0;
  let removed = 0;
  for (const sub of (data ?? []) as SubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        {
          vapidDetails: { subject: env.vapidSubject, publicKey: env.vapidPublicKey, privateKey: env.vapidPrivateKey },
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
