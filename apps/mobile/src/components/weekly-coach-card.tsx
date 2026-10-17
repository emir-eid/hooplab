// Haftalık rapordaki koç yorumu kartı (karar 0052). Yalnız biten haftada; önce yalnız bakılır (peek, model çağrılmaz),
// yorum yoksa kullanıcı "Koç yorumu yaz" der (istek üzerine, kullanıcı kararı). Model metni yalnız sunucudaki
// denetimden geçtiyse gelir; cümle sonundaki rozet o cümlenin dayanaklarını açar. Metinler copy/coach'tan.

import { radius, spacing } from '@hooplab/theme';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AuditSentence } from '../../../../supabase/functions/_shared/coach/audit.ts';
import type { WeeklyResponse } from '../../../../supabase/functions/_shared/coach/contract.ts';

import { Card } from '@/components/card';
import { Action, Actions, CitedSentence, Message, openBasis, Waiting } from '@/components/coach-card';
import { Text } from '@/components/text';
import {
  coachBadge,
  coachBasisAction,
  coachFailureReason,
  coachFooter,
  coachOmittedNote,
  coachRegenerateAction,
  weeklyCoachChecking,
  weeklyCoachCurrent,
  weeklyCoachDemoNote,
  weeklyCoachFailedTitle,
  weeklyCoachIntro,
  weeklyCoachInvalidBody,
  weeklyCoachLabel,
  weeklyCoachLimitBody,
  weeklyCoachRejectedBody,
  weeklyCoachRejectedTitle,
  weeklyCoachWriteAction,
  weeklyCoachWriting,
  weeklyNumbersLabel,
} from '@/copy/coach';
import { fetchCoachWeekly, type WeeklyCoachMode, type WeeklyCoachReply } from '@/data/coach-weekly';
import type { WeeklySnapshot } from '@/data/coach-weekly-snapshot';
import { usePalette } from '@/theme/appearance';

type Phase = { kind: 'checking' } | { kind: 'writing' } | { kind: 'reply'; reply: WeeklyCoachReply } | { kind: 'error'; message: string };

export function WeeklyCoachCard({ snapshot }: { snapshot: WeeklySnapshot }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });
  const [limited, setLimited] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCoachWeekly(snapshot, 'peek').then((r) => {
      if (cancelled) return;
      setPhase(r.ok ? { kind: 'reply', reply: r.value } : { kind: 'error', message: r.message });
    });
    return () => {
      cancelled = true;
    };
  }, [snapshot]);

  async function write(mode: WeeklyCoachMode) {
    const previous = phase;
    setPhase({ kind: 'writing' });
    const r = await fetchCoachWeekly(snapshot, mode);
    if (r.ok && r.value.response.status === 'limit' && previous.kind === 'reply' && previous.reply.response.status === 'accepted') {
      setLimited(true);
      return setPhase(previous);
    }
    setPhase(r.ok ? { kind: 'reply', reply: r.value } : { kind: 'error', message: r.message });
  }

  const response: WeeklyResponse | null = phase.kind === 'reply' ? phase.reply.response : null;
  const demo = phase.kind === 'reply' && phase.reply.demo;
  const canRewrite = !demo && !limited;

  return (
    <Card>
      <CardHeader />
      {phase.kind === 'checking' ? <Waiting text={weeklyCoachChecking} /> : null}
      {phase.kind === 'writing' ? <Waiting text={weeklyCoachWriting} /> : null}
      {phase.kind === 'error' ? <Message body={phase.message} /> : null}

      {response?.status === 'none' ? (
        <>
          <Message body={weeklyCoachIntro} />
          <Actions>
            <Action label={weeklyCoachWriteAction} onPress={() => void write('generate')} />
          </Actions>
        </>
      ) : null}

      {response?.status === 'accepted' ? <Sentences sentences={response.sentences} /> : null}
      {response?.status === 'rejected' ? <Message title={weeklyCoachRejectedTitle} body={weeklyCoachRejectedBody} /> : null}
      {response?.status === 'failed' ? <Message title={weeklyCoachFailedTitle} body={coachFailureReason(response.error)} /> : null}
      {response?.status === 'invalid' ? <Message title={weeklyCoachFailedTitle} body={weeklyCoachInvalidBody} /> : null}
      {response?.status === 'limit' || limited ? <Message body={weeklyCoachLimitBody} /> : null}

      {response?.status === 'accepted' ? (
        <>
          <Text variant="caption" tone="inkMuted" style={styles.footer}>
            {demo ? weeklyCoachDemoNote : coachFooter}
            {response.omitted > 0 ? ` ${coachOmittedNote(response.omitted)}` : ''}
          </Text>
          <Actions>
            <Action label={coachBasisAction} onPress={() => openBasis(response.sentences, null, weeklyNumbersLabel)} />
            {canRewrite ? <Action label={coachRegenerateAction} onPress={() => void write('regenerate')} /> : null}
          </Actions>
        </>
      ) : null}
      {response && (response.status === 'rejected' || response.status === 'failed') && canRewrite ? (
        <Actions>
          <Action label={coachRegenerateAction} onPress={() => void write('regenerate')} />
        </Actions>
      ) : null}
    </Card>
  );
}

/** Süren hafta: yorum hafta bitince yazılabilir. */
export function WeeklyCoachPending() {
  return (
    <Card>
      <CardHeader />
      <Message body={weeklyCoachCurrent} />
    </Card>
  );
}

function CardHeader() {
  const palette = usePalette();
  return (
    <View style={styles.header}>
      <Text variant="footnote" tone="inkSecondary" accessibilityRole="header">
        {weeklyCoachLabel}
      </Text>
      <View style={[styles.badge, { backgroundColor: palette.track }]}>
        <Text variant="caption2Strong" tone="inkSecondary">
          {coachBadge}
        </Text>
      </View>
    </View>
  );
}

/** Cümleler sırayla; alıntılı her cümlenin sonunda numaralı rozet (Dayanaklar sayfasıyla aynı numara). */
function Sentences({ sentences }: { sentences: AuditSentence[] }) {
  let mark = 0;
  return (
    <View style={styles.sentences}>
      {sentences.map((s, i) => {
        const cited = s.numbers.length + s.sources.length > 0;
        return (
          <CitedSentence
            key={i}
            text={s.text}
            mark={cited ? ++mark : null}
            variant={i === 0 ? 'callout' : 'bodyCompact'}
            onPress={() => openBasis(sentences, i, weeklyNumbersLabel)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  badge: { paddingHorizontal: spacing[2], paddingVertical: spacing[0.5], borderRadius: radius.full },
  sentences: { marginTop: spacing[2], gap: spacing[2.5] },
  footer: { marginTop: spacing[3] },
});
