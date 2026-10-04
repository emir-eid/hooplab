// Demo şeridi (karar 0022): verinin sentetik olduğunu söyler ve günün senaryosunu seçtirir (maketteki durum anahtarı).

import { layout, radius, spacing } from '@hooplab/theme';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Text } from '@/components/text';
import { levelLabels } from '@/copy/recovery';
import { demoScenarios, type DemoScenario } from '@/demo/demo-data';
import { setDemoScenario } from '@/demo/demo-mode';
import { usePalette } from '@/theme/appearance';

const scenarioLabels: Record<DemoScenario, string> = {
  green: levelLabels.ready,
  yellow: levelLabels.caution,
  red: levelLabels.recover,
};

export function DemoBar({ scenario }: { scenario: DemoScenario }) {
  const palette = usePalette();
  return (
    <View style={[styles.bar, { backgroundColor: palette.chip }]}>
      <Text variant="caption" tone="inkSecondary">
        Demo sporcu · sentetik veri
      </Text>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Demo günü">
        {demoScenarios.map((s) => (
          <Chip key={s} label={scenarioLabels[s]} selected={s === scenario} onPress={() => setDemoScenario(s)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginTop: spacing[3],
    marginHorizontal: layout.cardInset,
    padding: spacing[3],
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    gap: spacing[2],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1.5] },
});
