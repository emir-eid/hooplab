// PWA bildirimleri (karar 0058): ana ekrandaki web uygulamasında hatırlatmaları sunucu Web Push ile gönderir.
// Bu modül aboneliği (service worker + PushManager) kurar, tercihi ve aboneliği Supabase'e yazar. iPhone
// uygulamasında kullanılmaz; orada bildirimler telefonda zamanlanır (karar 0045).

import { Platform } from 'react-native';

import { defaultNotificationPrefs, type NotificationPrefs } from '@/data/notification-plan';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

import type { PermissionState } from './scheduler';

// Expo yalnız doğrudan `process.env.EXPO_PUBLIC_*` erişimini paketlemede yerine koyar; parçalanmamalı.
const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/**
 * `ok`: abone olunabilir. `install`: tarayıcı Web Push sunmuyor; iPhone'da yalnız ana ekrana eklenmiş uygulamada var.
 * `unconfigured`: derlemede VAPID açık anahtarı yok. `native`: iPhone uygulaması (yerel bildirim).
 */
export type WebPushSupport = 'ok' | 'install' | 'unconfigured' | 'native';

export function webPushSupport(): WebPushSupport {
  if (Platform.OS !== 'web') return 'native';
  if (!vapidPublicKey || !supabase) return 'unconfigured';
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'install';
  }
  return 'ok';
}

export function webPermission(): PermissionState {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'undetermined';
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * İzin ister ve abone olur. iOS izni yalnız dokunuşun içinde sorar: `requestPermission` ilk `await`'ten önce
 * çağrılır, bu yüzden bu fonksiyon anahtarın değişim olayından doğrudan çağrılmalı.
 */
export async function enableWebPush(): Promise<PermissionState> {
  if (webPushSupport() !== 'ok' || demoStore()) return 'denied';
  const asked = Notification.permission === 'default' ? Notification.requestPermission() : Promise.resolve(Notification.permission);
  const permission = await asked;
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'undetermined';
  return (await subscribe()) ? 'granted' : 'denied';
}

async function subscribe(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(vapidPublicKey) }));
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return false;
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' });
    return !error;
  } catch {
    return false;
  }
}

/** İzin zaten verilmişse aboneliği tazeler (tarayıcı adresi değiştirmiş olabilir); açılışta çağrılır. */
export async function refreshWebPush(): Promise<void> {
  if (webPushSupport() !== 'ok' || demoStore() || webPermission() !== 'granted') return;
  await subscribe();
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const toTime = (hour: number, minute: number) => `${pad2(hour)}:${pad2(minute)}`;
function fromTime(value: unknown, fallback: { hour: number; minute: number }): { hour: number; minute: number } {
  const m = typeof value === 'string' ? /^(\d{2}):(\d{2})/.exec(value) : null;
  return m ? { hour: Number(m[1]), minute: Number(m[2]) } : fallback;
}

/** PWA'da tercihin doğru kaynağı sunucu: gönderimi o yapar. Satır yoksa varsayılanlar (hepsi kapalı). */
export async function loadWebPrefs(): Promise<NotificationPrefs> {
  if (!supabase || demoStore()) return defaultNotificationPrefs;
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('checkin_enabled, checkin_time, match_enabled, match_time, reconnect_enabled')
    .maybeSingle();
  if (error || !data) return defaultNotificationPrefs;
  const d = defaultNotificationPrefs;
  return {
    checkin: { enabled: data.checkin_enabled === true, ...fromTime(data.checkin_time, d.checkin) },
    match: { enabled: data.match_enabled === true, ...fromTime(data.match_time, d.match) },
    reconnect: { enabled: data.reconnect_enabled === true },
  };
}

/** Tercihi ve cihazın saat dilimini yazar (sunucu yerel saati bununla hesaplar). */
export async function saveWebPrefs(prefs: NotificationPrefs): Promise<boolean> {
  if (!supabase || demoStore()) return false;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { error } = await supabase.from('notification_prefs').upsert(
    {
      user_id: auth.user.id,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      checkin_enabled: prefs.checkin.enabled,
      checkin_time: toTime(prefs.checkin.hour, prefs.checkin.minute),
      match_enabled: prefs.match.enabled,
      match_time: toTime(prefs.match.hour, prefs.match.minute),
      reconnect_enabled: prefs.reconnect.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  return !error;
}

/** Sunucudan bu kullanıcının aboneliklerine deneme bildirimi. */
export async function sendWebTest(): Promise<boolean> {
  if (!supabase || demoStore()) return false;
  const { error } = await supabase.functions.invoke('push-test', { body: {} });
  return !error;
}
