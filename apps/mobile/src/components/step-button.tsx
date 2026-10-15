// Küçük yuvarlak ileri / geri düğmesi: saat ve tarih seçicilerinde (bildirim saati, maç takvimi).

import { radius, spacing } from '@hooplab/theme';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { usePalette } from '@/theme/appearance';

export function StepButton({
  icon,
  label,
  enabled,
  onPress,
}: {
  icon: 'chevron' | 'chevronBack';
  label: string;
  enabled: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      hitSlop={spacing[2]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: palette.band, opacity: enabled ? 1 : 0.35 },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} color={palette.ink} size={16} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  step: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
