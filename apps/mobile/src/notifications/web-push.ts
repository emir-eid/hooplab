// PWA bildirimleri (karar 0058): ana ekrandaki web uygulamasında hatırlatmaları sunucu Web Push ile gönderir.
// Bu modül aboneliği (service worker + PushManager) kurar ve Supabase'e yazar; tercih `server-prefs.ts`'te. iPhone
// uygulamasında kullanılmaz; orada sunucu Expo push servisiyle gönderir (karar 0060, `native.ts`).

import { Platform } from 'react-native';

import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

import type { PermissionState } from './native';

// Expo yalnız doğrudan `process.env.EXPO_PUBLIC_*` erişimini paketlemede yerine koyar; parçalanmamalı.
const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/**
 * `ok`: abone olunabilir. `install`: tarayıcı Web Push sunmuyor; iPhone'da yalnız ana ekrana eklenmiş uygulamada var.
 * `unconfigured`: derlemede VAPID açık anahtarı yok. `native`: iPhone uygulaması (Expo push, `native.ts`).
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
