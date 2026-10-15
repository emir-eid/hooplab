// Ben → Bildirimler (karar 0045): yerel hatırlatmaların açılıp kapatıldığı yer. Anahtar açılınca izin istenir;
// iOS izni reddedildiyse yalnız Ayarlar'dan açılabilir. Tercih bu cihazda saklanır, sunucuya gitmez.

import { layout, radius, spacing } from '@hooplab/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import {
  checkinTimeRange,
  defaultNotificationPrefs,
  formatClock,
  stepCheckinTime,
  type NotificationPrefs,
} from '@/data/notification-plan';
import { TOKEN_LIFETIME_DAYS } from '@/data/google-health-status';
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

  const step = (direction: 1 | -1) => {
    const t = stepCheckinTime(prefs.checkin.hour, prefs.checkin.minute, direction);
    void update({ ...prefs, checkin: { ...prefs.checkin, ...t } }, false);
  };
  const minutes = prefs.checkin.hour * 60 + prefs.checkin.minute;
  const clock = formatClock(prefs.checkin.hour, prefs.checkin.minute);

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
        {prefs.checkin.enabled ? (
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
        ) : null}
      </ListGroup>

      <ListGroup
        label="Google Health"
        footer={`Google izni ${TOKEN_LIFETIME_DAYS} günde bir yenilenmeli. Dolmadan bir gün önce ve son saatlerde, senkron durmuşsa ertesi sabah hatırlatır.`}
      >
        <ListRow
          label="İzin hatırlatması"
          accessory={toggle('Google Health izin hatırlatması', prefs.reconnect.enabled, (v) =>
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

function StepButton({
  icon,
  label,
  enabled,
  onPress,
}: {
  icon: 'chevron' | 'chevronBack';
  label: string;
  enabled: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      hitSlop={spacing[2]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: palette.band, opacity: enabled ? 1 : 0.35 },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} color={palette.ink} size={16} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  clock: { minWidth: 48, textAlign: 'center', fontVariant: ['tabular-nums'] },
  step: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  note: { marginHorizontal: layout.screenInset, marginTop: spacing[4] },
});
