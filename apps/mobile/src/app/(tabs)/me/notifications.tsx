// Ben → Bildirimler (karar 0045): yerel hatırlatmaların açılıp kapatıldığı yer. Anahtar açılınca izin istenir;
// iOS izni reddedildiyse yalnız Ayarlar'dan açılabilir. Tercih bu cihazda saklanır, sunucuya gitmez.

import { layout, spacing } from '@hooplab/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';

import { ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { StepButton } from '@/components/step-button';
import { Text } from '@/components/text';
import {
  checkinTimeRange,
  defaultNotificationPrefs,
  formatClock,
  stepCheckinTime,
  type NotificationPrefs,
} from '@/data/notification-plan';
import { useDemoScenario } from '@/demo/demo-mode';
import {
  ensureNotificationPermission,
  loadNotificationPrefs,
  notificationPermission,
  notificationsSupported,
  refreshNotifications,
  saveNotificationPrefs,
  sendTestNotification,
  type PermissionState,
} from '@/notifications/scheduler';
import { usePalette } from '@/theme/appearance';

export default function NotificationsScreen() {
  const palette = usePalette();
  const demo = useDemoScenario();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const available = notificationsSupported && demo === null;

  useFocusEffect(
    useCallback(() => {
      void loadNotificationPrefs().then(setPrefs);
      void notificationPermission().then(setPermission);
    }, []),
  );

  const update = async (next: NotificationPrefs, turningOn: boolean) => {
    if (turningOn) {
      const granted = await ensureNotificationPermission();
      setPermission(granted);
      if (granted !== 'granted') return;
    }
    setPrefs(next);
    await saveNotificationPrefs(next);
    await refreshNotifications();
  };

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={!available}
      trackColor={{ true: palette.status.green }}
      accessibilityLabel={label}
    />
  );

  // Saatli tercihin (check-in, maç sabahı) saat seçici satırı.
  const timeRow = (key: 'checkin' | 'match') => {
    const p = prefs[key];
    const minutes = p.hour * 60 + p.minute;
    const clock = formatClock(p.hour, p.minute);
    const step = (direction: 1 | -1) => {
      const t = stepCheckinTime(p.hour, p.minute, direction);
      void update({ ...prefs, [key]: { ...p, ...t } }, false);
    };
    return (
      <ListRow
        label="Saat"
        accessory={
          <View style={styles.stepper}>
            <StepButton
              icon="chevronBack"
              label="15 dakika erken"
              enabled={available && minutes > checkinTimeRange.firstMinute}
              onPress={() => step(-1)}
            />
            <Text variant="callout" style={styles.clock} accessibilityLabel={`Saat ${clock}`}>
              {clock}
            </Text>
            <StepButton
              icon="chevron"
              label="15 dakika geç"
              enabled={available && minutes < checkinTimeRange.lastMinute}
              onPress={() => step(1)}
            />
          </View>
        }
      />
    );
  };

  const unavailableNote = !notificationsSupported
    ? 'Bildirimler yalnız iPhone uygulamasında çalışır; web önizlemesinde zamanlanmaz.'
    : demo !== null
      ? 'Demoda bildirim zamanlanmaz. Demodan çıkınca kendi ayarların geçerli olur.'
      : null;

  return (
    <Screen>
      <PageHeader title="Bildirimler" backLabel="Ben" />

      <ListGroup
        label="Sabah check-in'i"
        footer="Seçtiğin saatte tek bir hatırlatma; o gün check-in'i yaptıysan gelmez."
      >
        <ListRow
          label="Hatırlat"
          accessory={toggle("Sabah check-in'i hatırlatması", prefs.checkin.enabled, (v) =>
            void update({ ...prefs, checkin: { ...prefs.checkin, enabled: v } }, v),
          )}
        />
        {prefs.checkin.enabled ? timeRow('checkin') : null}
      </ListGroup>

      <ListGroup
        label="Maç sabahı"
        footer="Maç takvimindeki günlerde seçtiğin saatte; maç saatini ve öğün, sıvı notlarının Bugün'de olduğunu hatırlatır."
      >
        <ListRow
          label="Hatırlat"
          accessory={toggle('Maç sabahı hatırlatması', prefs.match.enabled, (v) =>
            void update({ ...prefs, match: { ...prefs.match, enabled: v } }, v),
          )}
        />
        {prefs.match.enabled ? timeRow('match') : null}
      </ListGroup>

      <ListGroup
        label="Google Health"
        footer="Google izni geçersiz olur ve senkron durursa ertesi sabah hatırlatır."
      >
        <ListRow
          label="Senkron durursa hatırlat"
          accessory={toggle('Google Health senkron hatırlatması', prefs.reconnect.enabled, (v) =>
            void update({ ...prefs, reconnect: { enabled: v } }, v),
          )}
        />
      </ListGroup>

      {available ? (
        <ListGroup label="Deneme" footer="Birkaç saniye sonra bir bildirim gelir; uygulamayı arka plana alıp bekleyebilirsin.">
          <ListRow
            label="Deneme bildirimi gönder"
            onPress={() => void sendTestNotification().then(() => notificationPermission()).then(setPermission)}
          />
        </ListGroup>
      ) : null}

      {permission === 'denied' && notificationsSupported ? (
        <ListGroup
          label="İzin"
          footer="Bildirim izni kapalı. iPhone'un Ayarlar uygulamasından açılabilir; açınca buraya dönüp anahtarı yeniden aç."
        >
          <ListRow label="Ayarlar'ı aç" onPress={() => void Linking.openSettings()} />
        </ListGroup>
      ) : null}

      {unavailableNote ? (
        <Text variant="footnoteRegular" tone="inkMuted" style={styles.note}>
          {unavailableNote}
        </Text>
      ) : (
        <Text variant="footnoteRegular" tone="inkMuted" style={styles.note}>
          Bildirimler bu telefonda zamanlanır; sunucuya gitmez. Metinlerde sağlık değerin yazmaz.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  clock: { minWidth: 48, textAlign: 'center', fontVariant: ['tabular-nums'] },
  note: { marginHorizontal: layout.screenInset, marginTop: spacing[4] },
});
