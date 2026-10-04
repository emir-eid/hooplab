// Sekme ekranlarının kabı: tema zemini, üst güvenli alan, sekme çubuğu için alt boşluk.
// Gesture Handler'ın ScrollView'u: içindeki sürüklemeli kontroller (HRV grafiği) kaydırmayı bekletebilsin.

import { spacing } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GestureScrollView } from '@/components/gesture-scroll';
import { useTabBarSpace } from '@/components/tab-bar';
import { usePalette } from '@/theme/appearance';

export function Screen({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();

  return (
    <GestureScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[2.5], paddingBottom: tabBarSpace }}>
      {children}
    </GestureScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
