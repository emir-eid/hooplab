// Artı düğmesinin açtığı kısa sayfa: hangi kayıt eklenecek? Seçilen form bu sayfanın yerine açılır.

import { layout, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListGroup, ListRow } from '@/components/list';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

export default function AddScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
      <Text variant="title3" accessibilityRole="header" style={styles.title}>
        Kayıt ekle
      </Text>
      <ListGroup>
        <ListRow label="Sabah check-in" value="30 sn" onPress={() => router.replace('/checkin')} />
        <ListRow label="Seans kaydı" value="30 sn" onPress={() => router.replace('/session-new')} />
        <ListRow label="Öğün" value="15 sn" onPress={() => router.replace('/meal-new')} />
        <ListRow label="Su" value="2 sn" onPress={() => router.replace('/water')} />
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: spacing[6],
  },
  title: {
    marginHorizontal: layout.screenInset,
    marginBottom: spacing[2],
  },
});
