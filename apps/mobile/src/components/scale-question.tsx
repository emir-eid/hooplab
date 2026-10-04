// Check-in sorusu (maket: .q, .seg, .ends): beş segment, tek dokunuş. Ekran okuyucuda radyo grubu.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface ScaleQuestionProps {
  title: string;
  low: string;
  high: string;
  min: number;
  max: number;
  value: number | undefined;
  onChange: (value: number) => void;
}

export function ScaleQuestion({ title, low, high, min, max, value, onChange }: ScaleQuestionProps) {
  const palette = usePalette();
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
      <View style={styles.label}>
        <Text variant="callout">{title}</Text>
        <Text variant="footnoteMedium" tone="inkMuted">
          {value === undefined ? '–' : `${value} / ${max}`}
        </Text>
      </View>
      <View style={[styles.seg, { backgroundColor: palette.cardMuted }]} accessibilityRole="radiogroup" accessibilityLabel={title}>
        {options.map((option) => {
          const selected = option === value;
          const hint = option === min ? low : option === max ? high : undefined;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={hint ? `${option}, ${hint}` : String(option)}
              style={[
                styles.option,
                selected && { backgroundColor: palette.strong, boxShadow: palette.shadow.selected },
              ]}>
              <Text variant="digit" tone={selected ? 'onStrong' : 'inkMuted'}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ends} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text variant="micro" tone="inkMuted">
          {low}
        </Text>
        <Text variant="micro" tone="inkMuted">
          {high}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: layout.formGap,
    marginHorizontal: layout.cardInset,
    paddingTop: spacing[3.5],
    paddingHorizontal: spacing[3.5],
    paddingBottom: spacing[3],
    borderRadius: radius.xl,
    borderCurve: 'continuous',
  },
  label: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing[0.5],
  },
  seg: {
    marginTop: spacing[2.5],
    padding: 3,
    gap: spacing[0.5],
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    height: size.segment,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ends: {
    marginTop: spacing[1.5],
    paddingHorizontal: spacing[1],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
