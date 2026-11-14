// Kök düzende bir kez (karar 0045, 0058, 0060): uygulama açıkken gelen bildirim de afiş olarak görünür; oturum
// açıkken uygulama her öne gelişte bildirim kaydı tazelenir (iPhone'da Expo push token'ı, PWA'da Web Push aboneliği)
// ve tercihteki saat dilimi cihazınkine eşitlenir; bildirime dokununca ilgili ekran açılır (kapalıyken açılışta da).

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { clearLegacyLocalNotifications, nativePushSupported, registerNativePush } from '@/notifications/native';
import { syncTimeZone } from '@/notifications/server-prefs';
import { refreshWebPush } from '@/notifications/web-push';

const routes = new Set(['/checkin', '/me/google-health', '/']);

if (nativePushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function refresh() {
  if (nativePushSupported) {
    void clearLegacyLocalNotifications();
    void registerNativePush();
  } else {
    void refreshWebPush();
  }
  void syncTimeZone();
}

export function useNotifications(signedIn: boolean, ready: boolean) {
  useEffect(() => {
    if (!signedIn) return;
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [signedIn]);

  const response = nativePushSupported ? Notifications.useLastNotificationResponse() : null;
  useEffect(() => {
    if (!ready || !signedIn || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const route = response.notification.request.content.data?.route;
    Notifications.clearLastNotificationResponse();
    if (typeof route === 'string' && routes.has(route)) router.push(route as '/checkin' | '/me/google-health' | '/');
  }, [response, ready, signedIn]);
}
