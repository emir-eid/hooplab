// Koç sekmesi: soru-cevap (karar 0032, 0037). Üstte soru alanı ve örnek sorular (klavye alttan açılır, alan
// görünür kalır), altta yanıtlar en yeni önce. Model metni yalnız sunucudaki denetimden geçtiyse gelir; yönlendirme,
// "kaynak yok" ve doping uyarısı uygulamanın sabit metinleri (copy/coach-ask). Dayanak rozetleri ve Dayanaklar
// sayfası günlük özetle ortak (coach-card).

import { layout, radius, spacing, type } from '@hooplab/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { AuditSentence } from '../../../../../supabase/functions/_shared/coach/audit.ts';
import type { StoredAskResponse } from '../../../../../supabase/functions/_shared/coach/contract.ts';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { CitedSentence, openBasis } from '@/components/coach-card';
import { GroupLabel } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { coachBadge, coachFailureReason, coachOmittedNote } from '@/copy/coach';
import { sources } from '@/copy/sources';
import {
  askAction,
  askBasisAction,
  askDemoNote,
  askFailedTitle,
  askFieldLabel,
  askFooter,
  askGeneralNote,
  askHistoryLabel,
  askIntro,
  askInvalidBody,
  askLimitBody,
  askLoadingHistory,
  askNoSource,
  askPlaceholder,
  askRejected,
  askRemaining,
  askRouted,
  askSamples,
  askSamplesLabel,
  askThinking,
  askTitle,
  askTooLong,
  askTooShort,
  askWhen,
  dopingWarning,
  questionLength,
} from '@/copy/coach-ask';
import { askCoach, fetchAskHistory, type AskEntry } from '@/data/coach-ask';
import { coachSnapshotFor } from '@/data/coach-context';
import { useDemoScenario } from '@/demo/demo-mode';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

// Demo senaryosu değişince ekran baştan kurulur (Bugün gibi): geçmiş yeniden okunur.
export default function CoachRoute() {
  const demo = useDemoScenario();
  return <CoachScreen key={demo ?? 'real'} demo={demo !== null} />;
}

function CoachScreen({ demo }: { demo: boolean }) {
  const palette = usePalette();
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<AskEntry[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const today = toLocalDate(new Date());

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchAskHistory().then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setHistory(r.value);
          setHistoryError(null);
        } else {
          setHistoryError(r.message);
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const usedToday = history?.filter((e) => e.localDate === today && !e.demo).length ?? 0;
  const trimmed = question.trim();

  async function ask() {
    if (pending) return;
    if (trimmed.length < questionLength.min) return setNotice(askTooShort);
    if (trimmed.length > questionLength.max) return setNotice(askTooLong);
    setNotice(null);
    setPending(trimmed);
    const date = toLocalDate(new Date());
    const r = await askCoach(trimmed, date, await coachSnapshotFor(date));
    setPending(null);
    if (!r.ok) return setNotice(r.message);
    const response = r.value.response;
    if (response.status === 'limit') return setNotice(askLimitBody);
    if (response.status === 'invalid') return setNotice(askInvalidBody);
    setQuestion('');
    const entry: AskEntry = { id: `new-${Date.now()}`, createdAt: new Date().toISOString(), localDate: date, question: trimmed, answer: response, demo: r.value.demo };
    // Sunucu satırı yazdı; geçmiş yeniden okunur. Okunamazsa yeni yanıt yine görünür.
    const fresh = await fetchAskHistory();
    setHistory(fresh.ok ? fresh.value : (prev) => [entry, ...(prev ?? [])]);
  }

  return (
    <Screen>
      <PageHeader title={askTitle} />

      <Card>
        <View style={styles.header}>
          <Text variant="footnote" tone="inkMuted">
            {askFieldLabel}
          </Text>
          <View style={[styles.badge, { backgroundColor: palette.track }]}>
            <Text variant="caption2Strong" tone="inkSecondary">
              {coachBadge}
            </Text>
          </View>
        </View>
        <Text variant="footnoteRegular" tone="inkSecondary">
          {askIntro}
        </Text>
        <TextInput
          value={question}
          onChangeText={(t) => {
            setQuestion(t);
            if (notice) setNotice(null);
          }}
          placeholder={askPlaceholder}
          placeholderTextColor={palette.inkMuted}
          selectionColor={palette.ink}
          accessibilityLabel={askFieldLabel}
          multiline
          maxLength={questionLength.max}
          editable={!pending}
          style={[styles.input, { color: palette.ink, backgroundColor: palette.cardMuted }]}
        />
        {notice ? (
          <Text variant="footnoteMedium" accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: palette.statusInk.red }}>
            {notice}
          </Text>
        ) : null}
        <PrimaryButton label={askAction} onPress={() => void ask()} disabled={trimmed.length === 0} loading={pending !== null} style={styles.button} />
        {history && !demo ? (
          <Text variant="caption" tone="inkMuted" style={styles.center}>
            {askRemaining(usedToday)}
          </Text>
        ) : null}
      </Card>

      {pending ? (
        <Card>
          <Text variant="callout">{pending}</Text>
          <View style={styles.waiting} accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={palette.inkMuted} />
            <Text variant="footnoteRegular" tone="inkSecondary" style={styles.flex}>
              {askThinking}
            </Text>
          </View>
        </Card>
      ) : null}

      {history === null && !historyError ? (
        <Text variant="footnoteRegular" tone="inkMuted" style={styles.inset}>
          {askLoadingHistory}
        </Text>
      ) : null}
      {historyError ? (
        <Text variant="footnoteRegular" tone="inkMuted" style={styles.inset}>
          {historyError}
        </Text>
      ) : null}
      {history && history.length > 0 ? (
        <>
          <GroupLabel>{askHistoryLabel}</GroupLabel>
          {history.map((entry) => (
            <AnswerCard key={entry.id} entry={entry} today={today} />
          ))}
        </>
      ) : null}

      {/* Yeni yanıt soru kartının hemen altında görünsün diye örnekler en altta; geçmiş yokken zaten kartın altında. */}
      <GroupLabel>{askSamplesLabel}</GroupLabel>
      <View style={styles.samples}>
        {askSamples.map((sample) => (
          <Chip key={sample} label={sample} selected={false} role="button" onPress={() => setQuestion(sample)} />
        ))}
      </View>
    </Screen>
  );
}

function AnswerCard({ entry, today }: { entry: AskEntry; today: string }) {
  const palette = usePalette();
  const { answer } = entry;
  return (
    <Card style={styles.answer}>
      <View style={styles.questionRow}>
        <Text variant="callout" style={styles.flex}>
          {entry.question}
        </Text>
        <Text variant="caption" tone="inkMuted">
          {askWhen(entry.createdAt, entry.localDate, today)}
        </Text>
      </View>

      <View style={[styles.body, { borderTopColor: palette.line }]}>
        <AnswerBody answer={answer} />
      </View>

      {answer.status === 'answered' ? (
        <>
          <Text variant="caption" tone="inkMuted">
            {entry.demo ? askDemoNote : askFooter}
            {answer.omitted > 0 ? ` ${coachOmittedNote(answer.omitted)}` : ''}
            {!answer.withNumbers ? ` ${askGeneralNote}` : ''}
          </Text>
          <Pressable
            onPress={() => openBasis(answer.sentences, null)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={askBasisAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
            <Text variant="callout" tone="inkSecondary">
              {askBasisAction}
            </Text>
          </Pressable>
        </>
      ) : null}

      {answer.category === 'supplement' ? (
        <View style={[styles.warning, { borderTopColor: palette.line }]}>
          <Text variant="callout">{dopingWarning.title}</Text>
          <Text variant="footnoteRegular" tone="inkSecondary">
            {dopingWarning.body}
          </Text>
          <Text variant="caption" tone="inkMuted">
            {`Kaynak: ${dopingWarning.sources.map((id) => `${sources[id].cite} · ${sources[id].kind}`).join('; ')}`}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function AnswerBody({ answer }: { answer: StoredAskResponse }) {
  switch (answer.status) {
    case 'answered':
      return <Sentences sentences={answer.sentences} />;
    case 'no_source':
      return <Message {...askNoSource} />;
    case 'rejected':
      return <Message {...askRejected} />;
    case 'routed':
      return <Message {...askRouted[answer.category]} />;
    case 'failed':
      return <Message title={askFailedTitle} body={coachFailureReason(answer.error)} />;
  }
}

/** Yanıt cümleleri ayrı satırlarda; alıntılı her cümlenin sonunda numaralı rozet (özetteki gibi). */
function Sentences({ sentences }: { sentences: AuditSentence[] }) {
  let mark = 0;
  return (
    <View style={styles.sentences}>
      {sentences.map((s, i) => (
        <CitedSentence
          key={i}
          text={s.text}
          mark={s.numbers.length + s.sources.length > 0 ? ++mark : null}
          variant="bodyCompact"
          onPress={() => openBasis(sentences, i)}
        />
      ))}
    </View>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.message}>
      <Text variant="callout">{title}</Text>
      <Text variant="footnoteRegular" tone="inkSecondary">
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  badge: { paddingHorizontal: spacing[2], paddingVertical: spacing[0.5], borderRadius: radius.full },
  input: {
    marginTop: spacing[2],
    minHeight: 88,
    maxHeight: 180,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingHorizontal: spacing[3.5],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    fontFamily: type.body.fontFamily,
    fontSize: type.body.fontSize,
    lineHeight: type.body.lineHeight,
    letterSpacing: type.body.letterSpacing,
    textAlignVertical: 'top',
  },
  button: { marginTop: spacing[2] },
  center: { textAlign: 'center', marginTop: spacing[1] },
  samples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginHorizontal: layout.screenInset,
  },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing[2.5], marginTop: spacing[2] },
  flex: { flex: 1 },
  inset: { marginHorizontal: layout.screenInset, marginTop: spacing[4] },
  answer: { gap: spacing[3] },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  body: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing[3] },
  sentences: { gap: spacing[2] },
  message: { gap: spacing[1] },
  warning: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing[3], gap: spacing[1] },
  action: { alignSelf: 'flex-start' },
  pressed: { opacity: 0.6 },
});
