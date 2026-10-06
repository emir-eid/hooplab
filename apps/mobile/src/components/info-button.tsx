// Küçük "i" rozeti (maket: kaynak rozeti): dokununca açıklama alt sayfası ya da yöntem ekranı açılır.
// Görünür boyutu küçük, dokunma alanı hitSlop ile en az 44 pt.

import { radius, size } from '@hooplab/theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { explainers, type ExplainerId } from '@/copy/explainers';
import { usePalette } from '@/theme/appearance';

// Açılan sayfada gösterilecek güncel değer (ör. "1,9"). Adres parametresine konmaz: web'de adres satırında
// sağlık verisi görünmesin; bellekte, son açılan değer olarak tutulur.
const shownValues = new Map<ExplainerId, string>();

export function openExplainer(id: ExplainerId, value?: string) {
  if (value) shownValues.set(id, value);
  else shownValues.delete(id);
  router.push({ pathname: '/explain/[id]', params: { id } });
}

export function explainerValue(id: ExplainerId): string | undefined {
  return shownValues.get(id);
}

interface InfoButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export function InfoButton({ onPress, accessibilityLabel, style }: InfoButtonProps) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={(size.hitTarget - size.citeBadge) / 2}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.badge, { backgroundColor: palette.ink }, pressed && styles.pressed, style]}>
      <Text variant="micro" tone="onInk">
        i
      </Text>
    </Pressable>
  );
}

/** Açıklama sayfasını açan rozet. */
export function ExplainButton({ id, value, style }: { id: ExplainerId; value?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <InfoButton onPress={() => openExplainer(id, value)} accessibilityLabel={`${explainers[id].title}: bu ne?`} style={style} />
  );
}

const styles = StyleSheet.create({
  badge: {
    width: size.citeBadge,
    height: size.citeBadge,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
