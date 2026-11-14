// iPhone uygulamasında bildirimler (karar 0060): hatırlatmaları sunucu Expo push servisiyle gönderir. Bu modül izni
// ister, cihazın Expo push token'ını Supabase `push_devices`'a yazar (kayıtlı cihaz varsa PWA'ya gönderilmez) ve
// çıkışta siler. Eski yerel plan (karar 0045) kaldırıldı; telefonda kalmış zamanlanmış hatırlatmalar ve cihazdaki
// eski tercih bir kez temizlenir. Demo ve web'de hiçbir şey yapılmaz.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export const nativePushSupported = Platform.OS === 'ios';

/** Eski yerel planın (karar 0045) cihazdaki izleri: tercih anahtarı ve zamanlanmış bildirim kimlik öneki. */
const LEGACY_PREFS_KEY = 'hooplab.notifications.v1';
const LEGACY_ID_PREFIX = 'hooplab-';

export async function notificationPermission(): Promise<PermissionState> {
  if (!nativePushSupported) return 'denied';
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

/** İzin yoksa ister (iOS bir kez sorar; reddedilirse yalnız Ayarlar'dan açılır). */
export async function ensureNotificationPermission(): Promise<PermissionState> {
  if (!nativePushSupported) return 'denied';
  const current = await notificationPermission();
  if (current !== 'undetermined') return current;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return asked.granted ? 'granted' : 'denied';
}

function projectId(): string | undefined {
  const fromExtra = (Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined)?.eas?.projectId;
  if (typeof fromExtra === 'string' && fromExtra.length > 0) return fromExtra;
  const fromEas = Constants.easConfig?.projectId;
  return typeof fromEas === 'string' && fromEas.length > 0 ? fromEas : undefined;
}

let lastToken: string | null = null;

/**
 * İzin verilmişse cihazın Expo push token'ını kaydeder (aynı token yeniden yazılınca satır çoğalmaz). Token Expo'nun
 * sunucusundan alınır; çevrimdışıysa sonraki açılışta yeniden denenir. Başarıda true.
 */
export async function registerNativePush(): Promise<boolean> {
  if (!nativePushSupported || demoStore() || !supabase) return false;
  if ((await notificationPermission()) !== 'granted') return false;
  const id = projectId();
  if (!id) return false;
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    const { error } = await supabase.from('push_devices').upsert({ token }, { onConflict: 'token' });
    if (error) return false;
    lastToken = token;
    return true;
  } catch {
    return false;
  }
}

/** Çıkışta bu cihazın kaydını siler: çıkış yapılmış telefona hatırlatma gitmez. Hata çıkışı durdurmaz. */
export async function unregisterNativePush(): Promise<void> {
  if (!nativePushSupported || demoStore() || !supabase) return;
  try {
    const token = lastToken ?? (projectId() ? (await Notifications.getExpoPushTokenAsync({ projectId: projectId()! })).data : null);
    if (token) await supabase.from('push_devices').delete().eq('token', token);
  } catch {
    // Çevrimdışı: kayıt sunucuda kalır; uygulama silinirse Expo makbuzuyla düşer.
  }
  lastToken = null;
}

/** Eski yerel planın zamanladığı hatırlatmaları ve cihazdaki eski tercihi siler (sunucuyla çift gelmesin). */
export async function clearLegacyLocalNotifications(): Promise<void> {
  if (!nativePushSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(LEGACY_ID_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    await AsyncStorage.removeItem(LEGACY_PREFS_KEY);
  } catch {
    // Bir sonraki açılışta yeniden denenir.
  }
}
