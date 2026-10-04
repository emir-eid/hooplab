// Seans kaydı (maket ekran 3): gün, tür, süre, RPE (0-10, değiştirilmiş CR-10) ve maçta oynanan dakika.
// Seans yükü (RPE × dakika) @hooplab/engine'de hesaplanır, saklanmaz.
// İçerik etiketleri (sıçrama, yön değiştirme...) Faz 2'de kas / tendon modeliyle gelir (karar 0015).
//
// `?exercise=<id>` ile açılırsa saatin kaydettiği oturumu etiketler (karar 0020): gün ve süre saatten gelir,
// tür ve RPE kullanıcıdan. O güne elle girilmiş bir kayıt varsa ona bağlanabilir veya oturum "Seans değil" olur.

import { durationLimits, rpeScale, sessionLoad } from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { ScaleSlider } from '@/components/scale-slider';
import { Stepper } from '@/components/stepper';
import { Text } from '@/components/text';
import { rpeLabel, sessionKindLabels, sessionKinds, type SessionKind } from '@/copy/labels';
import {
  dismissExercise,
  fetchExerciseToTag,
  insertSession,
  linkSession,
  type ExerciseToTag,
  type TrainingSession,
} from '@/data/daily-log';
import { exerciseSummary, suggestDurationMin, suggestKind } from '@/data/exercise-tagging';
import { usePalette } from '@/theme/appearance';
import { addDays, toLocalDate } from '@/utils/local-date';

/** Maçta oynanan dakika için giriş sınırı; veritabanındaki CHECK ile aynı (uzatmalar dahil). */
const MINUTES_PLAYED_MAX = 90;

const days = [
  { offset: 0, label: 'Bugün' },
  { offset: -1, label: 'Dün' },
] as const;

type Busy = 'save' | 'link' | 'dismiss' | null;

export default function SessionNewScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const params = useLocalSearchParams<{ exercise?: string }>();
  const exerciseId = typeof params.exercise === 'string' && params.exercise !== '' ? params.exercise : null;

  const [now] = useState(() => new Date());
  const [dayOffset, setDayOffset] = useState<0 | -1>(0);
  const [kind, setKind] = useState<SessionKind | null>(null);
  const [durationMin, setDurationMin] = useState(90);
  const [rpe, setRpe] = useState<number | null>(null);
  const [minutesPlayed, setMinutesPlayed] = useState(20);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  // Saatten etiketlemede: undefined = yükleniyor, null = oturum bulunamadı.
  const [tag, setTag] = useState<ExerciseToTag | null | undefined>(exerciseId ? undefined : null);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    void fetchExerciseToTag(exerciseId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setTag(null);
        return;
      }
      setTag(result.value);
      if (result.value) {
        const { exercise } = result.value;
        setKind(suggestKind(exercise.exerciseType));
        const suggested = suggestDurationMin(exercise);
        if (suggested !== null) setDurationMin(suggested);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  const tagging = exerciseId !== null;
  const exercise = tag?.exercise ?? null;
  const load = rpe === null ? null : sessionLoad(rpe, durationMin);
  const anchor = rpe === null ? null : rpeLabel(rpe);

  async function run(kindOfWork: Exclude<Busy, null>, work: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    if (busy) return;
    setBusy(kindOfWork);
    setError(null);
    const result = await work();
    if (result.ok) {
      router.back();
    } else {
      setError(result.message);
      setBusy(null);
    }
  }

  function save() {
    if (kind === null || rpe === null) return;
    if (tagging && !exercise) return;
    void run('save', () =>
      insertSession({
        localDate: exercise ? exercise.localDate : toLocalDate(addDays(now, dayOffset)),
        kind,
        durationMin,
        rpe,
        minutesPlayed: kind === 'game' ? minutesPlayed : null,
        ...(exercise ? { exercise } : {}),
      }),
    );
  }

  function link(session: TrainingSession) {
    if (!exercise) return;
    void run('link', () => linkSession(session.id, exercise));
  }

  function dismiss() {
    if (!exercise) return;
    void run('dismiss', () => dismissExercise(exercise.id));
  }

  if (tagging && tag === undefined) {
    return (
      <View style={[styles.root, { backgroundColor: palette.bg }]}>
        <FormHeader title="Seansı etiketle" />
        <ActivityIndicator style={styles.loading} color={palette.inkMuted} accessibilityLabel="Yükleniyor" />
      </View>
    );
  }

  if (tagging && !exercise) {
    return (
      <View style={[styles.root, { backgroundColor: palette.bg }]}>
        <FormHeader title="Seansı etiketle" />
        <Text variant="subhead" tone="inkSecondary" style={styles.notice} accessibilityRole="alert">
          {error ?? 'Bu saat kaydı bulunamadı. Listeyi yenileyip yeniden dene.'}
        </Text>
      </View>
    );
  }

  const summary = exercise ? exerciseSummary(exercise, toLocalDate(now), toLocalDate(addDays(now, -1))) : null;
  const candidates = tag?.candidates ?? [];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader
          title={tagging ? 'Seansı etiketle' : 'Seans kaydı'}
          subtitle={tagging ? 'Saat zamanı kaydetti. Türünü ve zorluğunu sen ver.' : 'Seans bittikten sonra, tüm seans için.'}
        />

        {summary ? (
          <FormBlock title="Saatten">
            <Text variant="headline">{summary.title}</Text>
            <Text variant="subhead" tone="inkSecondary" style={styles.summaryDetail}>
              {summary.detail}
            </Text>
            <Pressable
              onPress={dismiss}
              disabled={busy !== null}
              accessibilityRole="button"
              accessibilityHint="Saat kaydı etiketlenecekler listesinden çıkar"
              hitSlop={spacing[2]}
              style={({ pressed }) => [styles.dismiss, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
              {busy === 'dismiss' ? (
                <ActivityIndicator color={palette.inkMuted} />
              ) : (
                <Text variant="chip" tone="inkSecondary">
                  Seans değil, listeden kaldır
                </Text>
              )}
            </Pressable>
          </FormBlock>
        ) : (
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
        )}

        {candidates.length > 0 ? (
          <FormBlock title="Bu seansı zaten girdin mi?">
            {candidates.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => link(s)}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel={`${sessionKindLabels[s.kind]}, ${s.durationMin} dakika, RPE ${s.rpe}`}
                accessibilityHint="Bu kaydı saat oturumuna bağlar"
                style={({ pressed }) => [
                  styles.candidate,
                  i > 0 && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.candidateText}>
                  <Text variant="rowLabel">{sessionKindLabels[s.kind]}</Text>
                  <Text variant="caption" tone="inkMuted">{`${s.durationMin} dk · RPE ${s.rpe}`}</Text>
                </View>
                {busy === 'link' ? (
                  <ActivityIndicator color={palette.inkMuted} />
                ) : (
                  <Text variant="callout">Bağla</Text>
                )}
              </Pressable>
            ))}
            <Text variant="caption" tone="inkMuted" style={styles.candidateNote}>
              Değilse aşağıdan yeni kayıt olarak etiketle.
            </Text>
          </FormBlock>
        ) : null}

        <FormBlock title="Tür">
          <ChipSet label="Seans türü">
            {sessionKinds.map((k) => (
              <Chip key={k} label={sessionKindLabels[k]} selected={kind === k} onPress={() => setKind(k)} />
            ))}
          </ChipSet>
        </FormBlock>

        <FormBlock title="Süre" {...(tagging ? { note: 'saatten, ısınma dahil' } : {})}>
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

      </GestureScrollView>
      <FormDock
        label="Kaydet"
        onPress={save}
        disabled={kind === null || rpe === null || (busy !== null && busy !== 'save')}
        loading={busy === 'save'}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { marginTop: spacing[10] },
  notice: {
    marginTop: spacing[6],
    marginHorizontal: layout.screenInset,
  },
  summaryDetail: { marginTop: spacing[1] },
  candidate: {
    minHeight: size.row,
    paddingVertical: spacing[2.5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  candidateText: { flex: 1, gap: spacing[0.5] },
  candidateNote: { marginTop: spacing[2] },
  pressed: { opacity: 0.6 },
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
  dismiss: {
    marginTop: spacing[3],
    height: size.chipLarge,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3.5],
    borderRadius: radius.full,
    justifyContent: 'center',
  },
});
