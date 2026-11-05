// Etiketlenmemiş saat oturumları (karar 0020, 0025): Trend'deki "Saatte N oturum etiketlenmedi" satırı buraya açılır.
// Yük penceresindeki (son 28 gün) oturumlar gün gün, saatin kaydettiği saat aralığı, tür, süre ve ölçümlerle;
// hatırlamayı kolaylaştırır. Satır etiketleme formunu açar ("Seans değil" de orada).

import { addIsoDays } from '@hooplab/engine';
import { layout } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { untaggedListEmpty, untaggedListFooter, untaggedListTitle } from '@/copy/training-load';
import { fetchPendingExercises } from '@/data/daily-log';
import { exerciseDayLabel, exerciseDetail, exerciseLabel, groupExercisesByDay, type ExerciseSession } from '@/data/exercise-tagging';
import { loadChartDays } from '@/data/training-load-view';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

export default function UntaggedScreen() {
  const palette = usePalette();
  const [today] = useState(() => toLocalDate(new Date()));
  const [exercises, setExercises] = useState<ExerciseSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Etiketleme formundan dönünce liste yenilenir: etiketlenen ya da kaldırılan oturum düşer.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void fetchPendingExercises(addIsoDays(today, -(loadChartDays - 1)), today).then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setExercises(r.value);
          setError(null);
        } else setError(r.message);
      });
      return () => {
        cancelled = true;
      };
    }, [today]),
  );

  const yesterday = addIsoDays(today, -1);
  const groups = exercises ? groupExercisesByDay(exercises) : [];
  return (
    <Screen>
      <PageHeader title={untaggedListTitle} backLabel="Trend" />
      {error ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {exercises && exercises.length === 0 ? (
        <ListGroup footer={untaggedListFooter}>
          <ListRow label={untaggedListEmpty} />
        </ListGroup>
      ) : null}
      {groups.map((g, i) => (
        <ListGroup
          key={g.localDate}
          label={exerciseDayLabel(g.localDate, today, yesterday)}
          footer={i === groups.length - 1 ? untaggedListFooter : undefined}>
          {g.exercises.map((e) => {
            const detail = exerciseDetail(e);
            return (
              <ListRow
                key={e.id}
                label={exerciseLabel(e)}
                detail={[detail.time, detail.metrics].filter((l) => l !== '').join('\n')}
                onPress={() => router.push({ pathname: '/session-new', params: { exercise: e.id } })}
              />
            );
          })}
        </ListGroup>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { marginHorizontal: layout.screenInset },
});
