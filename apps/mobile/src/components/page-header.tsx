// Ekran başlığı (maket: .top, .navbar + .ptitle). Geri düğmesi varsa başlığın üstünde durur.

import { fontFamily, layout, size, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface PageHeaderProps {
  title: string;
  /** Başlığın üstündeki küçük satır (ör. tarih). */
  overline?: string;
  /** Geri düğmesinin etiketi: bir önceki ekranın adı. */
  backLabel?: string;
}

export function PageHeader({ title, overline, backLabel }: PageHeaderProps) {
  const palette = usePalette();

  return (
    <View>
      {backLabel ? (
        <View style={styles.navbar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={`Geri: ${backLabel}`}
            hitSlop={spacing[2]}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Icon name="chevronBack" color={palette.ink} size={22} strokeWidth={2.2} />
            <Text variant="body" style={styles.backLabel}>
              {backLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={[styles.titles, backLabel ? styles.titlesAfterBack : null]}>
        {overline ? (
          <Text variant="subhead" tone="inkSecondary">
            {overline}
          </Text>
        ) : null}
        <Text variant="largeTitle" accessibilityRole="header">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: size.hitTarget,
    paddingHorizontal: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[0.5],
    minHeight: size.hitTarget,
  },
  backLabel: {
    fontFamily: fontFamily.bodyMedium,
  },
  pressed: { opacity: 0.6 },
  titles: {
    paddingHorizontal: layout.screenInset,
  },
  titlesAfterBack: {
    paddingTop: spacing[1.5],
  },
});
