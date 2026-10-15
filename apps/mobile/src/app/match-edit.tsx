// Maç ekle / düzenle (karar 0046): tarih, başlama saati (maçın oynandığı yerin saati) ve iç saha / deplasman.
// Tarih düzenlemede değişmez; saat ve yer isteğe bağlı. Kaydedince takvim, Bugün ve bildirim planı yenilenir.

import {
  addIsoDays,
  defaultMatchTime,
  matchTimeStepMinutes,
  stepClock,
  venues,
  type Match,
  type Venue,
} from '@hooplab/engine';
import { layout, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { StepButton } from '@/components/step-button';
import { Text } from '@/components/text';
import { matchRowLabel, venueLabels } from '@/copy/match';
import { matchDaysAhead } from '@/data/match-view';
import { deleteMatch, fetchMatches, saveMatch } from '@/data/matches';
import { refreshNotifications } from '@/notifications/scheduler';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

export default function MatchEditScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const params = useLocalSearchParams<{ date?: string }>();
  const [today] = useState(() => toLocalDate(new Date()));
  const editing = typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : null;
  const [date, setDate] = useState(editing ?? today);
  const [time, setTime] = useState<string | null>(defaultMatchTime);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [taken, setTaken] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Düzenlemede kayıtlı saat ve yer; yeni maçta o günlerde zaten maç var mı diye bakmak için takvim.
  useEffect(() => {
    let cancelled = false;
    void fetchMatches(addIsoDays(today, -1), addIsoDays(today, matchDaysAhead)).then((r) => {
      if (cancelled || !r.ok) return;
      setTaken(r.value);
      const existing = editing ? r.value.find((m) => m.date === editing) : undefined;
      if (existing) {
        setTime(existing.startTime);
        setVenue(existing.venue);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editing, today]);

  const last = addIsoDays(today, matchDaysAhead);
  const clash = editing === null && taken.some((m) => m.date === date);
  const tomorrow = addIsoDays(today, 1);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await saveMatch({ date, startTime: time, venue });
    if (r.ok) {
      void refreshNotifications();
      router.back();
    } else {
      setError(r.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing || busy) return;
    setBusy(true);
    const r = await deleteMatch(editing);
    if (r.ok) {
      void refreshNotifications();
      router.back();
    } else {
      setError(r.message);
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader
          title={editing ? 'Maç' : 'Maç ekle'}
          subtitle="Saat, maçın oynandığı yerin saatiyle. Öğün, sıvı ve şekerleme saatleri bundan hesaplanır."
        />
        <FormBlock title="Gün">
          <View style={styles.stepper}>
            <StepButton
              icon="chevronBack"
              label="Önceki gün"
              enabled={editing === null && date > today}
              onPress={() => setDate((d) => addIsoDays(d, -1))}
            />
            <Text variant="callout" style={styles.value}>
              {matchRowLabel({ date, startTime: null, venue: null }, today, tomorrow)}
            </Text>
            <StepButton
              icon="chevron"
              label="Sonraki gün"
              enabled={editing === null && date < last}
              onPress={() => setDate((d) => addIsoDays(d, 1))}
            />
          </View>
          {clash ? (
            <Text variant="caption" tone="inkMuted" style={styles.note}>
              Bu günde zaten maç var; kaydedersen saati ve yeri güncellenir.
            </Text>
          ) : null}
        </FormBlock>

        <FormBlock title="Başlama saati">
          {time !== null ? (
            <View style={styles.stepper}>
              <StepButton
                icon="chevronBack"
                label={`${matchTimeStepMinutes} dakika erken`}
                enabled
                onPress={() => setTime((t) => (t === null ? t : stepClock(t, -1)))}
              />
              <Text variant="callout" style={[styles.value, styles.clock]} accessibilityLabel={`Saat ${time}`}>
                {time}
              </Text>
              <StepButton icon="chevron" label={`${matchTimeStepMinutes} dakika geç`} enabled onPress={() => setTime((t) => (t === null ? t : stepClock(t, 1)))} />
            </View>
          ) : null}
          <View style={time !== null ? styles.below : undefined}>
            <ChipSet label="Saat">
              <Chip
                label="Saat belli değil"
                role="checkbox"
                selected={time === null}
                onPress={() => setTime(time === null ? defaultMatchTime : null)}
              />
            </ChipSet>
          </View>
        </FormBlock>

        <FormBlock title="Yer" note="isteğe bağlı">
          <ChipSet label="Yer">
            {venues.map((v) => (
              <Chip key={v} label={venueLabels[v]} selected={venue === v} onPress={() => setVenue(venue === v ? null : v)} />
            ))}
          </ChipSet>
        </FormBlock>

        {editing ? (
          <Pressable
            onPress={() => void remove()}
            accessibilityRole="button"
            disabled={busy}
            style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
            <Text variant="callout" style={{ color: palette.destructive }}>
              Maçı takvimden sil
            </Text>
          </Pressable>
        ) : null}
      </GestureScrollView>
      <FormDock label="Kaydet" onPress={() => void save()} disabled={false} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  value: { flex: 1, textAlign: 'center' },
  clock: { fontVariant: ['tabular-nums'] },
  note: { marginTop: spacing[2.5] },
  below: { marginTop: spacing[3] },
  delete: { marginTop: spacing[6], marginHorizontal: layout.screenInset, alignItems: 'center', paddingVertical: spacing[3] },
  pressed: { opacity: 0.6 },
});
