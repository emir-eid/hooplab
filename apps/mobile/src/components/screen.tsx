// Sekme ekranlarının kabı: tema zemini, üst güvenli alan, sekme çubuğu için alt boşluk.

import { spacing } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarSpace } from '@/components/tab-bar';
import { usePalette } from '@/theme/appearance';

export function Screen({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[2.5], paddingBottom: tabBarSpace }}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
