// Bugün: sabah check-in çağrısı veya özeti, bugünün seansları. Günün durumu Google Health senkronuyla gelecek.

import { sessionLoad, wellnessTotal, wellnessTotalRange } from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ComingSoon } from '@/components/coming-soon';
import { GroupLabel } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { sessionKindLabels } from '@/copy/labels';
import { fetchCheckin, fetchSessions, type Checkin, type TrainingSession } from '@/data/daily-log';
import { usePalette } from '@/theme/appearance';
import { formatDayHeader } from '@/utils/format-date';
import { toLocalDate } from '@/utils/local-date';

interface TodayLog {
  checkin: Checkin | null;
  sessions: TrainingSession[];
}

export default function TodayScreen() {
  const palette = usePalette();
  const [log, setLog] = useState<TodayLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form kapanınca ekran yeniden odaklanır ve günün kaydı tazelenir.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const today = toLocalDate(new Date());
      Promise.all([fetchCheckin(today), fetchSessions(today)]).then(([checkin, sessions]) => {
        if (cancelled) return;
        if (checkin.ok && sessions.ok) {
          setLog({ checkin: checkin.value, sessions: sessions.value });
          setError(null);
        } else {
          setError(!checkin.ok ? checkin.message : !sessions.ok ? sessions.message : null);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const total = log?.checkin ? wellnessTotal(log.checkin.answers) : null;

  return (
    <Screen>
      <PageHeader overline={formatDayHeader(new Date())} title="Bugün" />

      {log && !log.checkin ? (
        <Pressable
          onPress={() => router.push('/checkin')}
          accessibilityRole="button"
          accessibilityLabel="Sabah check-in, yaklaşık 30 saniye"
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: palette.strong, boxShadow: palette.shadow.float },
            pressed && styles.pressed,
          ]}>
          <Text variant="callout" tone="onStrong">
            Sabah check-in
          </Text>
          <View style={[styles.ctaPill, { backgroundColor: palette.derived.onStrongSubtle }]}>
            <Text variant="caption2Strong" tone="onStrong">
              30 sn
            </Text>
          </View>
        </Pressable>
      ) : null}

      {log?.checkin && total !== null ? (
        <Pressable onPress={() => router.push('/checkin')} accessibilityRole="button" accessibilityHint="Düzenlemek için dokun">
          {({ pressed }) => (
            <Card style={pressed ? styles.pressed : undefined}>
              <Text variant="footnote" tone="inkMuted">
                Sabah check-in
              </Text>
              <View style={styles.metricRow}>
                <Text variant="metric">{total}</Text>
                <Text variant="footnote" tone="inkMuted">
                  / {wellnessTotalRange.max}
                </Text>
              </View>
              <Text variant="caption" tone="inkMuted">
                Kendi geçmişinle karşılaştırma birkaç haftalık kayıttan sonra gelecek.
              </Text>
            </Card>
          )}
        </Pressable>
      ) : null}

      {error ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {log && log.sessions.length > 0 ? (
        <>
          <GroupLabel>Bugünün seansları</GroupLabel>
          <View style={[styles.list, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
            {log.sessions.map((s, i) => (
              <View key={s.id} style={[styles.row, i > 0 && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.rowText}>
                  <Text variant="rowLabel">{sessionKindLabels[s.kind]}</Text>
                  <Text variant="caption" tone="inkMuted">
                    {`${s.durationMin} dk · RPE ${s.rpe}${s.minutesPlayed !== null ? ` · ${s.minutesPlayed} dk oynadı` : ''}`}
                  </Text>
                </View>
                <Text variant="callout">{`${sessionLoad(s.rpe, s.durationMin) ?? '–'} AU`}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <ComingSoon
        title="Günün durumu"
        body="HRV, dinlenik nabız ve uykun kendi bandınla karşılaştırılıp burada özetlenecek. Önce Google Health bağlantısı kurulacak."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing[5],
    marginHorizontal: layout.cardInset,
    height: size.cta,
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaPill: {
    paddingHorizontal: spacing[2.5],
    height: 26,
    borderRadius: radius.full,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  error: {
    marginTop: spacing[3],
    marginHorizontal: layout.screenInset,
  },
  list: {
    marginHorizontal: layout.cardInset,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
  },
  row: {
    minHeight: size.row,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  rowText: { flex: 1, gap: spacing[0.5] },
});
