// Trend: haftalık rapora giriş (karar 0040) ve antrenman yükü (karar 0025). Uyku ve toparlanma eğrileri sonra.

import { addIsoDays, weekEndOf, weekLength, weekStartOf } from '@hooplab/engine';
import { layout, spacing } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ComingSoon } from '@/components/coming-soon';
import { DemoBar } from '@/components/demo-bar';
import { ListGroup, ListRow } from '@/components/list';
import { TrainingLoadSection } from '@/components/load-section';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { weekRangeText, weeklyTitle } from '@/copy/weekly-report';
import { createFocusGate } from '@/data/revision';
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

  // Etiketleme formu kapanınca yük yeniden hesaplanır; veri değişmediyse sekme dönüşünde çekilmez (data/revision.ts).
  const [gate] = useState(createFocusGate);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let settled = false;
      const today = toLocalDate(new Date());
      if (!gate.shouldFetch(today)) return;
      gate.started(today);
      fetchTrainingLoad(today).then((r) => {
        settled = true;
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
        if (!settled) gate.invalidate();
      };
    }, [gate]),
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
      <View style={styles.weekly}>
        <WeeklyEntry />
      </View>
      {load ? <TrainingLoadSection view={load} /> : null}
      <View style={styles.later}>
        <ComingSoon title="Haftalar boyunca" body="Uyku ve toparlanma eğrileri de hesap motoruyla birlikte burada olacak." />
      </View>
    </Screen>
  );
}

/** Biten son haftanın raporuna giriş; sayı göstermez (rapor ekranı kendi verisini çeker). */
function WeeklyEntry() {
  const lastWeek = addIsoDays(weekStartOf(toLocalDate(new Date())), -weekLength);
  return (
    <ListGroup>
      <ListRow
        label={weeklyTitle}
        detail={`Biten hafta · ${weekRangeText(lastWeek, weekEndOf(lastWeek))}`}
        onPress={() => router.push({ pathname: '/weekly', params: { week: lastWeek } })}
      />
    </ListGroup>
  );
}

const styles = StyleSheet.create({
  weekly: { marginTop: spacing[2] },
  error: { marginTop: spacing[3], marginHorizontal: layout.screenInset },
  later: { marginTop: layout.cardGap },
});
