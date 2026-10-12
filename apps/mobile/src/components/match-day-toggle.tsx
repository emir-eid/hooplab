// Bugün'de "Bugün maç var" işareti (karar 0036): tek dokunuşla açılıp kapanır. İşaret bir durum, risk değil:
// seçiliyken kart zemini ve top ikonu, değilken soluk zemin. Ana eylem (check-in) koyu kalır, işaret onunla yarışmaz.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { matchDayAsk, matchDayLabel, matchDayMark, matchDayNote, matchDayUnmark } from '@/copy/match-day';
import { usePalette } from '@/theme/appearance';

export function MatchDayToggle({ matchDay, onChange }: { matchDay: boolean; onChange: (matchDay: boolean) => void }) {
  const palette = usePalette();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange(!matchDay)}
        accessibilityRole="switch"
        accessibilityLabel={matchDayLabel}
        aria-checked={matchDay}
        style={({ pressed }) => [
          styles.row,
          matchDay ? { backgroundColor: palette.card, boxShadow: palette.shadow.card } : { backgroundColor: palette.cardMuted },
          pressed && styles.pressed,
        ]}>
        <View style={styles.label}>
          {matchDay ? <Icon name="ball" color={palette.ink} size={18} strokeWidth={2} /> : null}
          <Text variant="callout">{matchDay ? matchDayLabel : matchDayAsk}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: matchDay ? palette.track : palette.card }]}>
          <Text variant="caption2Strong">
            {matchDay ? matchDayUnmark : matchDayMark}
          </Text>
        </View>
      </Pressable>
      {matchDay ? (
        <Text variant="caption" tone="inkMuted" style={styles.note}>
          {matchDayNote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: layout.cardGap, marginHorizontal: layout.cardInset },
  row: {
    height: size.hitTarget,
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  pill: { paddingHorizontal: spacing[2.5], height: 26, borderRadius: radius.full, justifyContent: 'center' },
  note: { marginTop: spacing[1.5], marginHorizontal: spacing[2] },
  pressed: { opacity: 0.85 },
});
