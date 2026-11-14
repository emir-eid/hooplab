// Ben → Bildirimler (karar 0045, 0058, 0060): hatırlatmaların açılıp kapatıldığı yer. Tercih Supabase'te tek satır;
// hatırlatmaları sunucu gönderir: iPhone uygulamasına Expo push, iPhone uygulaması kayıtlı değilse PWA'ya Web Push.
// Anahtar açılınca izin istenir ve bu cihaz kaydedilir; iOS izni reddedildiyse yalnız Ayarlar'dan açılabilir.

import { layout, spacing } from '@hooplab/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, StyleSheet, Switch, View } from 'react-native';

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
} from '@/data/notification-prefs';
import { useDemoScenario } from '@/demo/demo-mode';
import {
  ensureNotificationPermission,
  nativePushSupported,
  notificationPermission,
  registerNativePush,
  type PermissionState,
} from '@/notifications/native';
import { loadServerPrefs, saveServerPrefs, sendServerTest } from '@/notifications/server-prefs';
import { enableWebPush, webPermission, webPushSupport } from '@/notifications/web-push';
import { usePalette } from '@/theme/appearance';

export default function NotificationsScreen() {
  const palette = usePalette();
  const demo = useDemoScenario();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [testNote, setTestNote] = useState<string | null>(null);
  const isWeb = Platform.OS === 'web';
  const webSupport = webPushSupport();
  const available = (isWeb ? webSupport === 'ok' : nativePushSupported) && demo === null;

  useFocusEffect(
    useCallback(() => {
      if (!available) return;
      void loadServerPrefs().then(setPrefs);
      if (isWeb) setPermission(webPermission());
      else void notificationPermission().then(setPermission);
    }, [available, isWeb]),
  );

  // Web'de izin isteği dokunuşun içinde kalmalı (iOS): `enableWebPush` ilk await'ten önce çağrılır.
  const update = async (next: NotificationPrefs, turningOn: boolean) => {
    if (turningOn) {
      const granted = isWeb ? await enableWebPush() : await ensureNotificationPermission();
      setPermission(granted);
      if (granted !== 'granted') return;
      if (!isWeb && !(await registerNativePush())) {
        setTestNote('Bu iPhone bildirim için kaydedilemedi; bağlantını kontrol edip yeniden dene.');
        return;
      }
    }
    setPrefs(next);
    if (!(await saveServerPrefs(next))) setTestNote('Tercih kaydedilemedi; bağlantını kontrol edip yeniden dene.');
  };

  const sendTest = () => {
    setTestNote(null);
    void (async () => {
      if (!isWeb && (await ensureNotificationPermission()) === 'granted') await registerNativePush();
      if (!isWeb) setPermission(await notificationPermission());
      const ok = await sendServerTest();
      setTestNote(ok ? 'Gönderildi; birkaç saniye içinde gelir.' : 'Gönderilemedi. Önce bir hatırlatmayı açıp izin ver.');
    })();
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

  const unavailableNote =
    demo !== null
      ? 'Demoda bildirim zamanlanmaz. Demodan çıkınca kendi ayarların geçerli olur.'
      : !isWeb
        ? null
        : webSupport === 'install'
          ? "Bildirimler, uygulama Safari'den ana ekrana eklenince açılır. Ana ekrandaki HoopLab simgesinden açıp burayı yeniden dene."
          : webSupport === 'unconfigured'
            ? 'Bu derlemede bildirim ayarlı değil.'
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
        <ListGroup
          label="Deneme"
          footer={testNote ?? 'Birkaç saniye sonra bir bildirim gelir; uygulamayı arka plana alıp bekleyebilirsin.'}
        >
          <ListRow label="Deneme bildirimi gönder" onPress={sendTest} />
        </ListGroup>
      ) : null}

      {permission === 'denied' && isWeb && available ? (
        <ListGroup label="İzin">
          <ListRow label="Bildirim izni kapalı" detail="iPhone'da Ayarlar → Bildirimler → HoopLab'den açılır; sonra anahtarı yeniden aç." />
        </ListGroup>
      ) : null}

      {permission === 'denied' && nativePushSupported ? (
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
          {isWeb
            ? "Hatırlatmaları sunucu gönderir; tercihin, saat dilimin ve bu cihazın bildirim adresi Supabase'te durur. iPhone uygulaması kayıtlıysa hatırlatmalar oraya gider, buraya gelmez. Metinlerde sağlık değerin yazmaz."
            : "Hatırlatmaları sunucu Expo'nun bildirim servisiyle gönderir; tercihin, saat dilimin ve bu iPhone'un bildirim kimliği Supabase'te durur. Hatırlatmalar PWA'ya değil buraya gelir. Metinlerde sağlık değerin yazmaz."}
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
