import type { ThemePreference } from '@hooplab/theme';
import { router } from 'expo-router';

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
    </Screen>
  );
}
