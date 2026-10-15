// Yerel bildirimler (karar 0045): tercihleri saklar, izni ister, planı (data/notification-plan.ts) telefona zamanlar.
// Uygulama her öne gelişte, check-in kaydında ve tercih değişince planı baştan kurar: önce HoopLab'in kendi
// bildirimleri silinir, sonra plan yeniden yazılır. Demo ve web önizlemesinde hiçbir şey zamanlanmaz.

import { addIsoDays } from '@hooplab/engine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { fetchCheckin } from '@/data/daily-log';
import { fetchSyncStatus } from '@/data/google-health';
import { fetchMatches } from '@/data/matches';
import {
  anyEnabled,
  checkinDaysAhead,
  parseNotificationPrefs,
  planNotifications,
  type NotificationPrefs,
  type PlannedNotification,
} from '@/data/notification-plan';
import { demoStore } from '@/demo/demo-mode';
import { toLocalDate } from '@/utils/local-date';

const PREFS_KEY = 'hooplab.notifications.v1';
const ID_PREFIX = 'hooplab-';
/** Deneme bildirimi plan yenilenirken silinmez. */
const TEST_ID = `${ID_PREFIX}test`;

export const notificationsSupported = Platform.OS !== 'web';

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    return parseNotificationPrefs(await AsyncStorage.getItem(PREFS_KEY));
  } catch {
    return parseNotificationPrefs(null);
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function notificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'denied';
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'denied';
}

/** İzin yoksa ister (iOS bir kez sorar; reddedilirse yalnız Ayarlar'dan açılır). */
export async function ensureNotificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'denied';
  const current = await notificationPermission();
  if (current !== 'undetermined') return current;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return asked.granted ? 'granted' : 'denied';
}

async function clearOwn(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX) && n.identifier !== TEST_ID)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

async function schedule(plan: readonly PlannedNotification[]): Promise<void> {
  for (const n of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: n.title, body: n.body, data: { route: n.route } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at },
    });
  }
}

/** Ayar ekranındaki deneme: birkaç saniye sonra tek bildirim (iznin ve afişin çalıştığını görmek için). */
export async function sendTestNotification(): Promise<boolean> {
  if ((await ensureNotificationPermission()) !== 'granted') return false;
  await Notifications.scheduleNotificationAsync({
    identifier: TEST_ID,
    content: { title: 'HoopLab', body: 'Bildirimler çalışıyor.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
  return true;
}

let running: Promise<void> | null = null;

/**
 * Planı baştan kurar. Aynı anda gelen çağrılar tek çalışmada birleşir. Veri alınamazsa (çevrimdışı) eldeki
 * bilgiyle kurar: check-in bilinmiyorsa bugünkü hatırlatma kalır, bağlantı bilinmiyorsa izin hatırlatması yazılmaz.
 */
export function refreshNotifications(): Promise<void> {
  if (!notificationsSupported || demoStore()) return Promise.resolve();
  running ??= (async () => {
    try {
      const prefs = await loadNotificationPrefs();
      if (!anyEnabled(prefs) || (await notificationPermission()) !== 'granted') {
        await clearOwn();
        return;
      }
      const now = new Date();
      const today = toLocalDate(now);
      const [checkin, sync, matches] = await Promise.all([
        prefs.checkin.enabled ? fetchCheckin(today) : Promise.resolve(null),
        prefs.reconnect.enabled ? fetchSyncStatus() : Promise.resolve(null),
        prefs.match.enabled ? fetchMatches(today, addIsoDays(today, checkinDaysAhead)) : Promise.resolve(null),
      ]);
      const plan = planNotifications(prefs, {
        now,
        checkinDoneToday: checkin?.ok === true && checkin.value !== null,
        sync: sync?.ok && sync.value ? { state: sync.value.state, connected_at: sync.value.connected_at } : null,
        matches: matches?.ok ? matches.value : [],
      });
      await clearOwn();
      await schedule(plan);
    } catch (err) {
      console.warn('Bildirimler zamanlanamadı:', err);
    } finally {
      running = null;
    }
  })();
  return running;
}
