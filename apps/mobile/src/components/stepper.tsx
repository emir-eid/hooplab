// Büyük sayaç (maket: .dur): eksi, büyük rakam ve birim, artı. Ekran okuyucuda ayarlanabilir öğe.

import { radius, size } from '@hooplab/theme';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  unit: string;
  label: string;
}

export function Stepper({ value, onChange, step, min, max, unit, label }: StepperProps) {
  const palette = usePalette();
  const change = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  const button = (delta: number) => {
    const disabled = delta < 0 ? value <= min : value >= max;
    return (
      <Pressable
        onPress={() => change(delta)}
        disabled={disabled}
        // Düğmeler ekran okuyucudan gizli; ayarlama ortadaki öğenin kaydırma hareketiyle yapılır.
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.cardMuted },
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}>
        <Icon name={delta < 0 ? 'minus' : 'plus'} color={palette.ink} size={22} strokeWidth={2.2} />
      </Pressable>
    );
  };

  return (
    <View style={styles.row}>
      {button(-step)}
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: `${value} ${unit}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => change(e.nativeEvent.actionName === 'increment' ? step : -step)}
        style={styles.value}>
        <Text variant="numberXL">{value}</Text>
        <Text variant="footnote" tone="inkMuted">
          {unit}
        </Text>
      </View>
      {button(step)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: size.stepper,
    height: size.stepper,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  value: {
    alignItems: 'center',
  },
});
