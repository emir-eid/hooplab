// Kök düzende bir kez (karar 0045): uygulama açıkken gelen bildirim de afiş olarak görünür; oturum açıkken
// uygulama her öne gelişte plan yenilenir; bildirime dokununca ilgili ekran açılır (kapalıyken açılışta da).

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { notificationsSupported, refreshNotifications } from '@/notifications/scheduler';

const routes = new Set(['/checkin', '/me/google-health']);

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function useNotifications(signedIn: boolean, ready: boolean) {
  useEffect(() => {
    if (!notificationsSupported || !signedIn) return;
    void refreshNotifications();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotifications();
    });
    return () => sub.remove();
  }, [signedIn]);

  const response = notificationsSupported ? Notifications.useLastNotificationResponse() : null;
  useEffect(() => {
    if (!ready || !signedIn || !response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const route = response.notification.request.content.data?.route;
    Notifications.clearLastNotificationResponse();
    if (typeof route === 'string' && routes.has(route)) router.push(route as '/checkin' | '/me/google-health');
  }, [response, ready, signedIn]);
}
