import type { ThemePreference } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useSession } from '@/auth/session';
import { ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { fetchSyncStatus } from '@/data/google-health';
import { describeConnection } from '@/data/google-health-status';
import { useDataSource, useProfile } from '@/data/profile';
import { privacyUrl } from '@/copy/consent';
import { profileSummary } from '@/copy/profile';
import { appleSyncSupported, syncAppleHealth } from '@/health/apple-sync';
import { describeAppleSync } from '@/health/apple-sync-status';
import { useAppleSyncState } from '@/health/use-apple-sync';
import { anyEnabled } from '@/data/notification-prefs';
import type { DemoScenario } from '@/demo/demo-data';
import { startDemo, stopDemo, useDemoScenario } from '@/demo/demo-mode';
import { unregisterNativePush } from '@/notifications/native';
import { loadServerPrefs } from '@/notifications/server-prefs';
import { useAppearance } from '@/theme/appearance';

const themeLabels: Record<ThemePreference, string> = {
  system: 'Sistem',
  light: 'Açık',
  dark: 'Koyu',
};

// Davetli için silme yolu (karar 0061 sıra 6): talep üzerine, hesabı açan siler; sahibinde yalnız saklama yeri.
const privacyFooters = {
  owner: "Veriler Supabase'te (Frankfurt, AB) saklanır.",
  invited: "Veriler Supabase'te (Frankfurt, AB) saklanır. Hesabının ve tüm verinin silinmesini istediğinde uygulamanın sahibine yaz.",
} as const;

// Demo açılıp kapanınca ekran baştan kurulur ve Google Health özeti yeniden okunur.
export default function MeRoute() {
  const demo = useDemoScenario();
  return <MeScreen key={demo ?? 'real'} demo={demo} />;
}

function MeScreen({ demo }: { demo: DemoScenario | null }) {
  const { preferences } = useAppearance();
  const { session, signOut } = useSession();
  const [healthSummary, setHealthSummary] = useState<string | undefined>(undefined);
  const [notificationSummary, setNotificationSummary] = useState<string | undefined>(undefined);
  // Apple Health profilinde Google Health bağlantısı yok (karar 0061); satır ve durum sorgusu gösterilmez.
  const source = useDataSource();
  const google = source === 'google_health';
  // Profil soruları (karar 0061 sıra 4c): cinsiyet, döngü takibi, korunma; sonradan buradan değişir.
  const profile = useProfile();

  useFocusEffect(
    useCallback(() => {
      if (google) {
        void fetchSyncStatus().then((result) => {
          setHealthSummary(result.ok ? describeConnection(result.value, new Date()).summary : undefined);
        });
      }
      void loadServerPrefs().then((p) => setNotificationSummary(anyEnabled(p) ? 'Açık' : 'Kapalı'));
    }, [google]),
  );

  const confirmSignOut = () => {
    // react-native-web'de Alert düğme göstermez; web önizlemesinde onaysız çıkılır.
    if (Platform.OS === 'web') {
      void signOut();
      return;
    }
    // Çıkış yapılmış telefona hatırlatma gitmesin: önce bu iPhone'un bildirim kaydı silinir (karar 0060).
    Alert.alert('Çıkış yapılsın mı?', 'Yeniden girmek için e-posta ve şifren gerekecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => void unregisterNativePush().then(signOut) },
    ]);
  };

  return (
    <Screen>
      <PageHeader title="Ben" />
      {google ? (
        <ListGroup label="Veri">
          <ListRow
            label="Google Health"
            {...(healthSummary ? { value: healthSummary } : {})}
            onPress={() => router.push('/me/google-health')}
          />
        </ListGroup>
      ) : null}
      {source === 'apple_health' && !demo ? <AppleHealthGroup /> : null}
      <ListGroup label="Ayarlar">
        <ListRow
          label="Görünüm"
          value={themeLabels[preferences.theme]}
          onPress={() => router.push('/me/appearance')}
        />
        <ListRow
          label="Bildirimler"
          {...(notificationSummary ? { value: notificationSummary } : {})}
          onPress={() => router.push('/me/notifications')}
        />
      </ListGroup>
      {demo ? (
        <ListGroup label="Demo" footer="Demo sporcu: tüm veriler sentetik ve yalnız bu cihazın belleğinde. Çıkınca girdiğin kayıtlar silinir.">
          <ListRow label="Demodan çık" onPress={stopDemo} />
        </ListGroup>
      ) : (
        <>
          <ListGroup label="Demo" footer="Sentetik bir sporcunun verisiyle gezinmek için. Senin verine dokunmaz, sunucuya bağlanmaz.">
            <ListRow label="Demo sporcuyu göster" onPress={() => startDemo()} />
          </ListGroup>
          <ListGroup label="Hesap" footer={session?.user.email}>
            <ListRow label="Profil" value={profileSummary(profile)} onPress={() => router.push('/profile')} />
            <ListRow label="Şifreyi değiştir" onPress={() => router.push('/password')} />
            <ListRow label="Çıkış yap" onPress={confirmSignOut} />
          </ListGroup>
          <ListGroup label="Gizlilik" footer={google ? privacyFooters.owner : privacyFooters.invited}>
            <ListRow label="Gizlilik politikası" onPress={() => void WebBrowser.openBrowserAsync(privacyUrl)} />
          </ListGroup>
        </>
      )}
    </Screen>
  );
}

/** Apple Sağlık eşitleme durumu (karar 0061 sıra 3d). Dokununca eşitler; izin ekranı ilk dokunuşta açılır. */
function AppleHealthGroup() {
  const { state, running } = useAppleSyncState();
  if (!appleSyncSupported) {
    return (
      <ListGroup label="Veri" footer="Apple Sağlık verisi yalnız iPhone uygulamasından eşitlenir; burada eşitlenmiş veri görünür.">
        <ListRow label="Apple Sağlık" value="iPhone'da" />
      </ListGroup>
    );
  }
  const summary = state ? describeAppleSync(state, running, new Date()) : null;
  return (
    <ListGroup label="Veri" {...(summary ? { footer: summary.detail } : {})}>
      <ListRow
        label="Apple Sağlık"
        {...(summary ? { value: summary.value } : {})}
        onPress={() => {
          if (!running) void syncAppleHealth('manual');
        }}
      />
    </ListGroup>
  );
}
