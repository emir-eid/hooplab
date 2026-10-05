// Trend: antrenman yükü (karar 0025). Uyku ve toparlanma eğrileri sonra.

import { layout, spacing } from '@hooplab/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ComingSoon } from '@/components/coming-soon';
import { DemoBar } from '@/components/demo-bar';
import { TrainingLoadSection } from '@/components/load-section';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { fetchTrainingLoad } from '@/data/training-load';
import type { TrainingLoadView } from '@/data/training-load-view';
import type { DemoScenario } from '@/demo/demo-data';
import { useDemoScenario } from '@/demo/demo-mode';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

// Demo senaryosu değişince ekran baştan kurulur (Bugün ile aynı).
export default function TrendRoute() {
  const demo = useDemoScenario();
  return <TrendScreen key={demo ?? 'real'} demo={demo} />;
}

function TrendScreen({ demo }: { demo: DemoScenario | null }) {
  const palette = usePalette();
  const [load, setLoad] = useState<TrainingLoadView | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Etiketleme formu kapanınca yük yeniden hesaplanır.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchTrainingLoad(toLocalDate(new Date())).then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setLoad(r.value);
          setError(null);
        } else {
          setError(r.message);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <Screen>
      <PageHeader title="Trend" />
      {demo ? <DemoBar scenario={demo} /> : null}
      {error ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {load ? <TrainingLoadSection view={load} /> : null}
      <View style={styles.later}>
        <ComingSoon title="Haftalar boyunca" body="Uyku ve toparlanma eğrileri de hesap motoruyla birlikte burada olacak." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: spacing[3], marginHorizontal: layout.screenInset },
  later: { marginTop: layout.cardGap },
});
