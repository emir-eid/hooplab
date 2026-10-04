// Seans kaydı (maket ekran 3): gün, tür, süre, RPE (0-10, değiştirilmiş CR-10) ve maçta oynanan dakika.
// Seans yükü (RPE × dakika) @hooplab/engine'de hesaplanır, saklanmaz.
// İçerik etiketleri (sıçrama, yön değiştirme...) Faz 2'de kas / tendon modeliyle gelir (karar 0015).

import { durationLimits, rpeScale, sessionLoad } from '@hooplab/engine';
import { layout, radius, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, FormScroll, useDockSpace } from '@/components/form';
import { ScaleSlider } from '@/components/scale-slider';
import { Stepper } from '@/components/stepper';
import { Text } from '@/components/text';
import { rpeLabel, sessionKindLabels, sessionKinds, type SessionKind } from '@/copy/labels';
import { insertSession } from '@/data/daily-log';
import { usePalette } from '@/theme/appearance';
import { addDays, toLocalDate } from '@/utils/local-date';

/** Maçta oynanan dakika için giriş sınırı; veritabanındaki CHECK ile aynı (uzatmalar dahil). */
const MINUTES_PLAYED_MAX = 90;

const days = [
  { offset: 0, label: 'Bugün' },
  { offset: -1, label: 'Dün' },
] as const;

export default function SessionNewScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const [now] = useState(() => new Date());
  const [dayOffset, setDayOffset] = useState<0 | -1>(0);
  const [kind, setKind] = useState<SessionKind | null>(null);
  const [durationMin, setDurationMin] = useState(90);
  const [rpe, setRpe] = useState<number | null>(null);
  const [minutesPlayed, setMinutesPlayed] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = rpe === null ? null : sessionLoad(rpe, durationMin);
  const anchor = rpe === null ? null : rpeLabel(rpe);

  async function save() {
    if (kind === null || rpe === null || saving) return;
    setSaving(true);
    setError(null);
    const result = await insertSession({
      localDate: toLocalDate(addDays(now, dayOffset)),
      kind,
      durationMin,
      rpe,
      minutesPlayed: kind === 'game' ? minutesPlayed : null,
    });
    if (result.ok) {
      router.back();
    } else {
      setError(result.message);
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <FormScroll contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader title="Seans kaydı" subtitle="Seans bittikten sonra, tüm seans için." />

        <FormBlock title="Gün">
          <ChipSet label="Gün">
            {days.map((day) => (
              <Chip
                key={day.offset}
                label={day.label}
                selected={dayOffset === day.offset}
                onPress={() => setDayOffset(day.offset)}
              />
            ))}
          </ChipSet>
        </FormBlock>

        <FormBlock title="Tür">
          <ChipSet label="Seans türü">
            {sessionKinds.map((k) => (
              <Chip key={k} label={sessionKindLabels[k]} selected={kind === k} onPress={() => setKind(k)} />
            ))}
          </ChipSet>
        </FormBlock>

        <FormBlock title="Süre">
          <Stepper
            value={durationMin}
            onChange={setDurationMin}
            step={5}
            min={5}
            max={durationLimits.max}
            unit="dakika"
            label="Süre"
          />
        </FormBlock>

        <FormBlock title="Zorluk · RPE" note={`${rpeScale.min}–${rpeScale.max}`}>
          {rpe === null ? (
            <Text variant="headline" tone="inkSecondary">
              Kaydırıcıya dokun veya sürükle
            </Text>
          ) : (
            <View style={styles.rpeHead}>
              <Text variant="numberM">{rpe}</Text>
              <Text variant="headline" tone="inkSecondary">
                {anchor ?? ''}
              </Text>
            </View>
          )}
          <ScaleSlider
            value={rpe}
            onChange={setRpe}
            min={rpeScale.min}
            max={rpeScale.max}
            label="Zorluk, RPE"
            {...(anchor ? { valueText: anchor } : {})}
            low="Dinlenme"
            high="Maksimal"
          />
        </FormBlock>

        {kind === 'game' ? (
          <FormBlock title="Oynanan dakika">
            <Stepper
              value={minutesPlayed}
              onChange={setMinutesPlayed}
              step={1}
              min={0}
              max={MINUTES_PLAYED_MAX}
              unit="dakika"
              label="Oynanan dakika"
            />
          </FormBlock>
        ) : null}

        <View style={[styles.result, { backgroundColor: palette.result }]}>
          <View>
            <Text variant="footnote" tone="onResult" style={styles.dim}>
              Seans yükü
            </Text>
            {load === null ? (
              <Text variant="subhead" tone="onResult" style={styles.pending}>
                RPE seçilince hesaplanır
              </Text>
            ) : (
              <View style={styles.resultValue}>
                <Text variant="numberL" tone="onResult">
                  {load}
                </Text>
                <Text variant="footnote" tone="onResult" style={styles.dim}>
                  AU
                </Text>
              </View>
            )}
          </View>
          <Text variant="footnoteMedium" tone="onResult" style={[styles.formula, styles.dim]}>
            {`RPE ${rpe ?? '–'}\n× ${durationMin} dk`}
          </Text>
        </View>
      </FormScroll>
      <FormDock label="Kaydet" onPress={save} disabled={kind === null || rpe === null} loading={saving} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rpeHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2.5],
  },
  result: {
    marginTop: layout.formGap,
    marginHorizontal: layout.cardInset,
    padding: spacing[4],
    borderRadius: radius.xxl,
    borderCurve: 'continuous',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resultValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  dim: { opacity: 0.65 },
  pending: { marginTop: spacing[2] },
  formula: { textAlign: 'right' },
});
