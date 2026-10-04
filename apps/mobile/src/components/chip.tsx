// Seçilebilir çip (maket: .chipset button). Seçiliyken `strong` zemin; rozet bir sayı taşır (ağrı değeri).

import { radius, size, spacing } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  badge?: number;
  /** Ekran okuyucu için: tekli seçimde radio, çoklu seçimde checkbox, seçim değilse button. */
  role?: 'radio' | 'checkbox' | 'button';
  accessibilityHint?: string;
}

export function Chip({ label, selected, onPress, badge, role = 'radio', accessibilityHint }: ChipProps) {
  const palette = usePalette();
  const state = role === 'button' ? { expanded: selected } : { checked: selected };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={state}
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? palette.strong : palette.cardMuted },
        pressed && styles.pressed,
      ]}>
      <Text variant="chip" tone={selected ? 'onStrong' : 'inkSecondary'}>
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: selected ? palette.derived.onStrongBadge : palette.track }]}>
          <Text variant="caption2Strong" tone={selected ? 'onStrong' : 'ink'}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ChipSet({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <View style={styles.set} accessibilityRole={label ? 'radiogroup' : undefined} accessibilityLabel={label}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  set: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
  },
  chip: {
    height: size.chipLarge,
    paddingHorizontal: spacing[3.5],
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pressed: { opacity: 0.8 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing[1.5],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
