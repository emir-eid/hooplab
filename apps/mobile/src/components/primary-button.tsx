// Ana düğme (maket: .dock .btn): kapsül, `strong` zemin. Yüklenirken etiketin yerine gösterge döner,
// düğme devre dışı kalır ve ekran okuyucuya "meşgul" bildirilir.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, disabled = false, loading = false, style }: PrimaryButtonProps) {
  const palette = usePalette();
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.strong, boxShadow: palette.shadow.float },
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator color={palette.onStrong} /> : <Text variant="buttonLarge" tone="onStrong">{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: size.primaryButton,
    marginHorizontal: layout.cardInset,
    paddingHorizontal: spacing[6],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
