// Bugün'deki koç kartı (karar 0032): günlük özet, cümle sonunda dayanak rozetleri (maket: .cite), kodla eklenen
// yönlendirme notları. Model metni yalnız sunucudaki denetimden geçtiyse gelir; geçmezse ya da yazılamazsa kart
// bunu söyler ve değerlerin açıklamalarına (Bugün'deki "i" düğmeleri) yönlendirir. Metinler copy/coach'tan.
//
// Akış: önce yalnız bakılır (peek). O gün özet yoksa ve check-in yapıldıysa yazdırılır; check-in yoksa beklenir,
// kullanıcı isterse check-in'siz yazdırır. Yeniden yazma elle ve günde sınırlı.

import { radius, size, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import type { DailyResponse } from '../../../../supabase/functions/_shared/coach/contract.ts';

import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { openExplainer } from '@/components/info-button';
import { Text } from '@/components/text';
import {
  coachBadge,
  coachBasisAction,
  coachCardLabel,
  coachChecking,
  coachDemoNote,
  coachFailedTitle,
  coachFailureReason,
  coachFooter,
  coachInvalidBody,
  coachLimitBody,
  coachOmittedNote,
  coachRegenerateAction,
  coachRejectedBody,
  coachRejectedTitle,
  coachWaitBody,
  coachWaitTitle,
  coachWriteNowAction,
  coachWriting,
  routingNoteTexts,
  summaryLayout,
  summaryTopicLabels,
  type SummaryLine,
  type SummaryTopic,
  type BasisTarget,
} from '@/copy/coach';
import { fetchCoachDaily, type CoachMode, type CoachReply } from '@/data/coach';
import type { CoachSnapshot } from '@/data/coach-snapshot';
import { usePalette } from '@/theme/appearance';

// --- Dayanaklar sayfasının verisi ---
// Adres parametresine konmaz (web'de adres satırında sağlık verisi görünmesin); bellekte, son açılan özet.
let shownBasis: { sentences: AuditSentence[]; only: number | null } = { sentences: [], only: null };

export function coachBasis() {
  return shownBasis;
}

function openBasis(sentences: AuditSentence[], only: number | null) {
  shownBasis = { sentences, only };
  router.push('/coach-basis');
}

export function openTarget(target: Exclude<BasisTarget, null>) {
  if (target.kind === 'method') router.push('/recovery-method');
  else openExplainer(target.id);
}

const cited = (s: AuditSentence) => s.numbers.length + s.sources.length > 0;

type Phase = { kind: 'checking' } | { kind: 'writing' } | { kind: 'reply'; reply: CoachReply } | { kind: 'error'; message: string };

export function CoachCard({ snapshot, checkinDone }: { snapshot: CoachSnapshot; checkinDone: boolean }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });
  // Yeniden yazma sınıra takılınca gösterilen özet kaybolmaz; sınır notu altında görünür.
  const [limited, setLimited] = useState(false);

  // Ekran her odaklandığında anlık değerler yeniden kurulur; saklanan özet varsa sunucu onu döner, model çağrılmaz.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const peek = await fetchCoachDaily(snapshot, 'peek');
      if (cancelled) return;
      if (!peek.ok) return setPhase({ kind: 'error', message: peek.message });
      if (peek.value.response.status !== 'none' || !checkinDone) return setPhase({ kind: 'reply', reply: peek.value });
      setPhase({ kind: 'writing' });
      const written = await fetchCoachDaily(snapshot, 'generate');
      if (cancelled) return;
      setPhase(written.ok ? { kind: 'reply', reply: written.value } : { kind: 'error', message: written.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [snapshot, checkinDone]);

  async function write(mode: CoachMode) {
    const previous = phase;
    setPhase({ kind: 'writing' });
    const r = await fetchCoachDaily(snapshot, mode);
    if (r.ok && r.value.response.status === 'limit' && previous.kind === 'reply') {
      setLimited(true);
      return setPhase(previous);
    }
    setPhase(r.ok ? { kind: 'reply', reply: r.value } : { kind: 'error', message: r.message });
  }

  const response: DailyResponse | null = phase.kind === 'reply' ? phase.reply.response : null;
  const demo = phase.kind === 'reply' && phase.reply.demo;

  return (
    <Card>
        <Header />
        {phase.kind === 'checking' ? <Waiting text={coachChecking} /> : null}
        {phase.kind === 'writing' ? <Waiting text={coachWriting} /> : null}
        {phase.kind === 'error' ? <Message body={phase.message} /> : null}

        {response?.status === 'none' ? (
          <>
            <Message title={coachWaitTitle} body={coachWaitBody} />
            <Actions>
              <Action label={coachWriteNowAction} onPress={() => void write('generate')} />
            </Actions>
          </>
        ) : null}

        {response?.status === 'accepted' ? <Summary sentences={response.sentences} /> : null}
        {response?.status === 'rejected' ? <Message title={coachRejectedTitle} body={coachRejectedBody} /> : null}
        {response?.status === 'failed' ? <Message title={coachFailedTitle} body={coachFailureReason(response.error)} /> : null}
        {response?.status === 'invalid' ? <Message title={coachFailedTitle} body={coachInvalidBody} /> : null}
        {response?.status === 'limit' ? <Message body={coachLimitBody} /> : null}

        {response && 'notes' in response ? <RoutingNotes notes={response.notes} /> : null}

        {response?.status === 'accepted' ? (
          <>
            <Text variant="caption" tone="inkMuted" style={styles.footer}>
              {demo ? coachDemoNote : coachFooter}
              {response.omitted > 0 ? ` ${coachOmittedNote(response.omitted)}` : ''}
            </Text>
            <Actions>
              <Action label={coachBasisAction} onPress={() => openBasis(response.sentences, null)} />
              {demo || limited ? null : <Action label={coachRegenerateAction} onPress={() => void write('regenerate')} />}
            </Actions>
          </>
        ) : null}
        {limited ? <Message body={coachLimitBody} /> : null}
        {response && (response.status === 'rejected' || response.status === 'failed') && !demo && !limited ? (
          <Actions>
            <Action label={coachRegenerateAction} onPress={() => void write('regenerate')} />
          </Actions>
        ) : null}
    </Card>
  );
}

function Header() {
  const palette = usePalette();
  return (
    <View style={styles.header}>
      <Text variant="footnote" tone="inkMuted">
        {coachCardLabel}
      </Text>
      <View style={[styles.badge, { backgroundColor: palette.track }]}>
        <Text variant="caption2Strong" tone="inkSecondary">
          {coachBadge}
        </Text>
      </View>
    </View>
  );
}

function Waiting({ text }: { text: string }) {
  const palette = usePalette();
  return (
    <View style={styles.waiting} accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={palette.inkMuted} />
      <Text variant="footnoteRegular" tone="inkSecondary" style={styles.flex}>
        {text}
      </Text>
    </View>
  );
}

function Message({ title, body }: { title?: string; body: string }) {
  return (
    <View style={styles.message}>
      {title ? <Text variant="callout">{title}</Text> : null}
      <Text variant="footnoteRegular" tone="inkSecondary">
        {body}
      </Text>
    </View>
  );
}

const topicIcons: Record<SummaryTopic, IconName> = { recovery: 'trend', load: 'body', nutrition: 'meal' };

/**
 * Özet: günün durumu cümlesi öne çıkar, kalan cümleler konu başlıkları altında ayrı satırlarda (summaryLayout).
 * Alıntılı her cümlenin sonunda numaralı rozet; dokununca o cümlenin dayanakları açılır.
 */
function Summary({ sentences }: { sentences: AuditSentence[] }) {
  const palette = usePalette();
  const { lead, sections } = summaryLayout(sentences);
  return (
    <View style={styles.summary}>
      {lead ? <Line line={lead} sentences={sentences} variant="callout" /> : null}
      {sections.map((section) => (
        <View key={section.topic} style={[styles.section, { borderTopColor: palette.line }]}>
          <View style={styles.sectionHead}>
            <View style={[styles.sectionIcon, { backgroundColor: palette.cardMuted }]}>
              <Icon name={topicIcons[section.topic]} color={palette.inkSecondary} size={15} />
            </View>
            <Text variant="footnote" tone="inkMuted" accessibilityRole="header">
              {summaryTopicLabels[section.topic]}
            </Text>
          </View>
          {section.lines.map((line) => (
            <Line key={line.index} line={line} sentences={sentences} variant="bodyCompact" />
          ))}
        </View>
      ))}
    </View>
  );
}

function Line({ line, sentences, variant }: { line: SummaryLine; sentences: AuditSentence[]; variant: 'callout' | 'bodyCompact' }) {
  const palette = usePalette();
  return (
    <Text variant={variant}>
      {line.sentence.text}
      {line.mark !== null ? (
        <Pressable
          onPress={() => openBasis(sentences, line.index)}
          hitSlop={(size.hitTarget - size.citeBadge) / 2}
          accessibilityRole="button"
          accessibilityLabel={`Dayanak ${line.mark}`}
          style={({ pressed }) => [styles.cite, { backgroundColor: palette.ink }, pressed && styles.pressed]}>
          <Text variant="micro" tone="onInk">
            {line.mark}
          </Text>
        </Pressable>
      ) : null}
    </Text>
  );
}

function RoutingNotes({ notes }: { notes: readonly (keyof typeof routingNoteTexts)[] }) {
  const palette = usePalette();
  if (notes.length === 0) return null;
  return (
    <View style={[styles.notes, { borderTopColor: palette.line }]}>
      {notes.map((note) => (
        <View key={note} style={styles.note}>
          <Text variant="callout">{routingNoteTexts[note].title}</Text>
          <Text variant="footnoteRegular" tone="inkSecondary">
            {routingNoteTexts[note].body}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
      <Text variant="callout" tone="inkSecondary">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  badge: { paddingHorizontal: spacing[2], paddingVertical: spacing[0.5], borderRadius: radius.full },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing[2.5], marginTop: spacing[2] },
  flex: { flex: 1 },
  message: { gap: spacing[1], marginTop: spacing[2] },
  summary: { marginTop: spacing[2], gap: spacing[3] },
  section: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing[3], gap: spacing[2] },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  sectionIcon: { width: 26, height: 26, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cite: {
    width: size.citeBadge,
    height: size.citeBadge,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[1],
    transform: [{ translateY: 3 }],
  },
  notes: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  note: { gap: spacing[1] },
  footer: { marginTop: spacing[3] },
  actions: { flexDirection: 'row', gap: spacing[5], marginTop: spacing[3] },
  pressed: { opacity: 0.6 },
});
