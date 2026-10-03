// Ana kart (maket: .card). Koyu temada gölge yerine ince bir halka (palette.shadow.card).

import { layout, radius, spacing } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePalette } from '@/theme/appearance';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: layout.cardGap,
    marginHorizontal: layout.cardInset,
    padding: layout.cardPadding,
    borderRadius: radius.xxxl,
    borderCurve: 'continuous',
    gap: spacing[1],
  },
});
