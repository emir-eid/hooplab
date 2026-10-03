import type { ThemePreference } from '@hooplab/theme';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

import { useSession } from '@/auth/session';
import { ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { useAppearance } from '@/theme/appearance';

const themeLabels: Record<ThemePreference, string> = {
  system: 'Sistem',
  light: 'Açık',
  dark: 'Koyu',
};

export default function MeScreen() {
  const { preferences } = useAppearance();
  const { session, signOut } = useSession();

  const confirmSignOut = () => {
    // react-native-web'de Alert düğme göstermez; web önizlemesinde onaysız çıkılır.
    if (Platform.OS === 'web') {
      void signOut();
      return;
    }
    Alert.alert('Çıkış yapılsın mı?', 'Yeniden girmek için e-posta ve şifren gerekecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen>
      <PageHeader title="Ben" />
      <ListGroup label="Ayarlar">
        <ListRow
          label="Görünüm"
          value={themeLabels[preferences.theme]}
          onPress={() => router.push('/me/appearance')}
        />
      </ListGroup>
      <ListGroup label="Hesap" footer={session?.user.email}>
        <ListRow label="Çıkış yap" onPress={confirmSignOut} />
      </ListGroup>
    </Screen>
  );
}
