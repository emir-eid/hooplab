// Bugün'de maç çevresi (karar 0046) ve seyahat (karar 0047): yarın, bugün ya da dün maç varsa kaynaklı notlar (öğün,
// sıvı, şekerleme saatleri maç saatinden); seyahat yaklaşıyorsa, yolculuk günüyse ya da jet lag sürüyorsa notlar;
// altında takvime giden satır. Notlar bağlam, risk değil: nötr kart, durum rengi yok.

import type { Match, MatchesAround, TravelReading } from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NoteCard } from '@/components/note-card';
import { Text } from '@/components/text';
import { matchAskTime, matchMeta, matchNote } from '@/copy/match';
import { travelNote } from '@/copy/travel';
import { usePalette } from '@/theme/appearance';
import { formatShortDate } from '@/utils/format-date';

export function MatchCard({ around, weightKg }: { around: MatchesAround; weightKg: number | null }) {
  const palette = usePalette();
  const note = matchNote(around, weightKg);
  if (!note) return null;
  const today = around.today;
  return (
    <NoteCard icon="ball" title={note.title} explainer="match" lines={note.lines}>
      {note.askTime && today ? (
        <Pressable
          onPress={() => router.push({ pathname: '/match-edit', params: { date: today.date } })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ask, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
          <Text variant="footnoteMedium">{matchAskTime}</Text>
          <Icon name="chevron" color={palette.inkMuted} size={14} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </NoteCard>
  );
}

export function TravelCard({ reading }: { reading: TravelReading | null }) {
  const note = travelNote(reading);
  if (!note) return null;
  return <NoteCard icon="plane" title={note.title} explainer="travel" lines={note.lines} />;
}

/** Takvime giden satır; sıradaki maç (bugünden sonra) yanında yazar. */
export function MatchCalendarRow({ next }: { next: Match | null }) {
  const palette = usePalette();
  const meta = next ? matchMeta(next) : '';
  const label = next ? `Sıradaki maç: ${formatShortDate(next.date)}${meta ? ` · ${meta}` : ''}` : 'Maç ve seyahat';
  return (
    <Pressable
      onPress={() => router.push('/matches')}
      accessibilityRole="button"
      accessibilityLabel={`Takvim. ${label}`}
      style={({ pressed }) => [styles.calendar, pressed && styles.pressed]}>
      <Text variant="caption" tone="inkSecondary">
        Takvim
      </Text>
      <View style={styles.calendarRight}>
        <Text variant="caption" tone="inkMuted" numberOfLines={1}>
          {label}
        </Text>
        <Icon name="chevron" color={palette.inkMuted} size={12} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ask: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  calendar: {
    marginTop: spacing[1.5],
    marginHorizontal: layout.cardInset + spacing[2],
    minHeight: size.hitTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  calendarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], flexShrink: 1 },
  pressed: { opacity: 0.7 },
});
