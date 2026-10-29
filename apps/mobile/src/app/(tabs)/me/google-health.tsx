// Google Health bağlantısı: durum, bağlan / yeniden bağlan, şimdi senkronla, bağlantıyı kes.
// İzin ekranı iPhone'da sistem tarayıcısında (ASWebAuthenticationSession), web'de aynı pencerede açılır;
// dönüşte uygulamaya gelinir.

import { spacing } from '@hooplab/theme';
import * as Linking from 'expo-linking';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { GroupFooter, ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { disconnectGoogleHealth, fetchSyncStatus, startConnect, syncNow } from '@/data/google-health';
import { refreshNotifications } from '@/notifications/scheduler';
import {
  type ConnectionView,
  describeConnection,
  describeConnectOutcome,
  type SyncStatusRow,
} from '@/data/google-health-status';

const RETURN_PATH = 'me/google-health';

export default function GoogleHealthScreen() {
  const [status, setStatus] = useState<SyncStatusRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  // Web'de dönüş bu sayfayı yeniden açar; sonuç adresin sorgusundan okunur.
  const params = useLocalSearchParams<{ ghealth?: string; code?: string }>();
  const [message, setMessage] = useState<string | null>(() =>
    params.ghealth
      ? (describeConnectOutcome(`?${new URLSearchParams({ ghealth: params.ghealth, ...(params.code ? { code: params.code } : {}) })}`)
          ?.message ?? null)
      : null,
  );

  const refresh = useCallback(async () => {
    const result = await fetchSyncStatus();
    if (result.ok) setStatus(result.value);
    else setMessage(result.message);
    setLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const view: ConnectionView = describeConnection(status, new Date());
  const connected = view.kind === 'connected';

  const connect = async () => {
    setBusy('connect');
    setMessage(null);
    const returnUrl = Linking.createURL(RETURN_PATH);
    const start = await startConnect(returnUrl);
    if (!start.ok) {
      setMessage(start.message);
      setBusy(null);
      return;
    }
    // Web'de (PWA) izin ekranına aynı pencerede gidilir: istekten sonra açılan pencereyi Safari engelleyebilir,
    // ana ekran kipinde açılan pencere uygulamaya geri bağlanamaz. Dönüş bu sayfayı sorguyla yeniden açar (karar 0054).
    if (Platform.OS === 'web') {
      window.location.assign(start.value);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(start.value, returnUrl);
    if (result.type === 'success') {
      const outcome = describeConnectOutcome(result.url);
      if (outcome) setMessage(outcome.message);
    }
    await refresh();
    // Yeni bağlantıyla izin hatırlatmaları yeniden kurulur (karar 0045).
    void refreshNotifications();
    setBusy(null);
  };

  const sync = async () => {
    setBusy('sync');
    setMessage(null);
    const result = await syncNow();
    if (!result.ok) setMessage(result.message);
    else if (result.value === 'partial') setMessage('Bazı veriler alınamadı. Saatlik senkron yeniden deneyecek.');
    await refresh();
    setBusy(null);
  };

  const disconnect = async () => {
    setBusy('disconnect');
    setMessage(null);
    const result = await disconnectGoogleHealth();
    setMessage(result.ok ? 'Bağlantı kesildi. Gelmiş veriler uygulamada kalır.' : result.message);
    await refresh();
    void refreshNotifications();
    setBusy(null);
  };

  const confirmDisconnect = () => {
    // react-native-web'de Alert düğme göstermez; web önizlemesinde onaysız kesilir.
    if (Platform.OS === 'web') {
      void disconnect();
      return;
    }
    Alert.alert('Bağlantı kesilsin mi?', 'Yeni veri gelmez. Gelmiş veriler uygulamada kalır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Bağlantıyı kes', style: 'destructive', onPress: () => void disconnect() },
    ]);
  };

  return (
    <Screen>
      <PageHeader title="Google Health" backLabel="Ben" />

      <ListGroup
        label="Durum"
        footer={
          view.problem ??
          'Fitbit verisi saatte bir kendiliğinden gelir. Google izni geri alınır ya da geçersiz olursa burada yeniden bağlanırsın.'
        }>
        <ListRow label="Bağlantı" value={loaded ? view.summary : '…'} />
        {view.lastSync ? <ListRow label="Son senkron" value={view.lastSync} /> : null}
        {view.range ? <ListRow label="Veri aralığı" value={view.range} /> : null}
      </ListGroup>

      {message ? <GroupFooter>{message}</GroupFooter> : null}

      {loaded && !connected ? (
        <View style={styles.action}>
          <PrimaryButton
            label={view.kind === 'reconnect' ? 'Yeniden bağlan' : 'Google Health’e bağlan'}
            onPress={() => void connect()}
            loading={busy === 'connect'}
            disabled={busy !== null}
          />
        </View>
      ) : null}

      {connected ? (
        <View style={styles.action}>
          <ListGroup>
            <ListRow
              label={busy === 'sync' ? 'Senkronlanıyor…' : 'Şimdi senkronla'}
              {...(busy === null ? { onPress: () => void sync() } : {})}
            />
            <ListRow label="İzni şimdi yenile" {...(busy === null ? { onPress: () => void connect() } : {})} />
            <ListRow label="Bağlantıyı kes" {...(busy === null ? { onPress: confirmDisconnect } : {})} />
          </ListGroup>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { marginTop: spacing[6] },
});
