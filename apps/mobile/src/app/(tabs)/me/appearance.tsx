import { Switch } from 'react-native';

import { GroupFooter, GroupLabel, ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { ThemePicker } from '@/components/theme-picker';
import { useAppearance } from '@/theme/appearance';

export default function AppearanceScreen() {
  const { preferences, palette, setThemePreference, setAnimateAura } = useAppearance();
  return (
    <Screen>
      <PageHeader title="Görünüm" backLabel="Ben" />

      <GroupLabel>Tema</GroupLabel>
      <ThemePicker value={preferences.theme} onChange={setThemePreference} />
      <GroupFooter>
        Sistem, iPhone'un Ekran ve Parlaklık ayarını izler; akşam koyuya, sabah açığa kendisi geçer.
      </GroupFooter>

      <ListGroup label="Hareket" footer="iPhone'da Hareketi Azalt açıksa hale her zaman durur.">
        <ListRow
          label="Haleyi canlandır"
          accessory={
            <Switch
              value={preferences.animateAura}
              onValueChange={setAnimateAura}
              trackColor={{ true: palette.status.green }}
              accessibilityLabel="Haleyi canlandır"
            />
          }
        />
      </ListGroup>
    </Screen>
  );
}
