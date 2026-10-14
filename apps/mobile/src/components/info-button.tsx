// Küçük "i" rozeti (maket: kaynak rozeti): dokununca açıklama alt sayfası ya da yöntem ekranı açılır.
// Görünür boyutu küçük, dokunma alanı hitSlop ile en az 44 pt.

import { radius, size } from '@hooplab/theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { explainers, type ExplainerId } from '@/copy/explainers';
import type { ValueRow } from '@/copy/recovery';
import { usePalette } from '@/theme/appearance';

/** Açılan sayfanın "Senin değerlerin" satırı (ör. "Son gece" · "45 ms"). */
export type ExplainerRow = ValueRow;

export interface ExplainerContext {
  /** Başlığın yanındaki güncel değer (ör. "1,9"). */
  value?: string;
  rows?: readonly ExplainerRow[];
}

// Açılan sayfada gösterilecek güncel değerler. Adres parametresine konmaz: web'de adres satırında
// sağlık verisi görünmesin; bellekte, son açılan değer olarak tutulur.
const shown = new Map<ExplainerId, ExplainerContext>();

export function openExplainer(id: ExplainerId, context?: string | ExplainerContext) {
  const c = typeof context === 'string' ? { value: context } : context;
  if (c && (c.value || (c.rows?.length ?? 0) > 0)) shown.set(id, c);
  else shown.delete(id);
  router.push({ pathname: '/explain/[id]', params: { id } });
}

export function explainerContext(id: ExplainerId): ExplainerContext {
  return shown.get(id) ?? {};
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
export function ExplainButton({
  id,
  value,
  rows,
  style,
}: {
  id: ExplainerId;
  value?: string;
  rows?: readonly ExplainerRow[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <InfoButton onPress={() => openExplainer(id, { value, rows })} accessibilityLabel={`${explainers[id].title}: bu ne?`} style={style} />
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
