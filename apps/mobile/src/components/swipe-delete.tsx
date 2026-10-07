// Sağdan sola kaydırınca "Sil" açılan satır (iOS listelerindeki gibi; karar 0031). Dokunmak siler; onay yok,
// çünkü eylem kaydırma + dokunma ile zaten iki adımlı. Hareket gesture-handler'ın ReanimatedSwipeable'ında,
// UI iş parçacığında; yay ve eşikler kütüphanenin. Hareketi Azalt açıkken de kaydırma parmağı izler (konum değişimi
// kullanıcının kendi hareketi), ekstra animasyon yok.

import { size, spacing } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

/** Açılan eylemin genişliği; dokunma hedefi 44 pt'nin üstünde. */
const actionWidth = 84;

export function SwipeDelete({ children, label, onDelete }: { children: ReactNode; label: string; onDelete: () => void }) {
  const palette = usePalette();
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={actionWidth / 2}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <Pressable
          onPress={() => {
            methods.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${label}, sil`}
          style={({ pressed }) => [styles.action, { backgroundColor: palette.destructive }, pressed && styles.pressed]}>
          <Icon name="trash" color={palette.onDestructive} size={20} strokeWidth={2} />
          <Text variant="caption2Strong" style={{ color: palette.onDestructive }}>
            Sil
          </Text>
        </Pressable>
      )}>
      {/* Satır zemini kart rengi: kayarken arkadaki eylem görünür, satırın altı değil. */}
      <View
        style={{ backgroundColor: palette.card }}
        accessibilityActions={[{ name: 'delete', label: 'Sil' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'delete') onDelete();
        }}>
        {children}
      </View>
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: actionWidth,
    minHeight: size.row,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  pressed: { opacity: 0.7 },
});
