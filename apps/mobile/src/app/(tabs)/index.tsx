// Bugün: günün durumu ve gece verisi (karar 0021), sabah check-in çağrısı veya özeti,
// saatten gelen ve etiket bekleyen oturumlar (karar 0020), bugünün seansları; yük notu yalnız oran 1,5'i geçince (karar 0025).
// Check-in kendi son 4 haftasıyla z-skoruyla kıyaslanır; z ≤ −1 ise not, günün durumuna girmez (karar 0028).
// Beslenme hedefi (gün tipine göre) ve bugün / dünün ter testleri (karar 0029).
// Koçun günlük özeti (karar 0032): bütün görünümler gelince anlık değerler kurulur; kart check-in'in altında.

import { sessionLoad, sweatTest, wellnessTotal, wellnessTotalRange, type CheckinReading, type DayType } from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Aura } from '@/components/aura';
import { Card } from '@/components/card';
import { CoachCard } from '@/components/coach-card';
import { DemoBar } from '@/components/demo-bar';
import { ExplainButton } from '@/components/info-button';
import { GroupLabel, ListGroup, ListRow } from '@/components/list';
import { LoadSpikeRow } from '@/components/load-section';
import { NutritionSection, SweatResults } from '@/components/nutrition-section';
import { PageHeader } from '@/components/page-header';
import { NightData, RecoveryState } from '@/components/recovery-section';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { sessionKindLabels } from '@/copy/labels';
import { sweatSummary } from '@/copy/nutrition';
import { checkinLowBody, checkinLowTitle, checkinNote, formatZ } from '@/copy/personal-baseline';
import { levelStates } from '@/copy/recovery';
import { buildCoachSnapshot, type CoachSnapshot } from '@/data/coach-snapshot';
import {
  fetchCheckin,
  fetchCheckinReading,
  fetchPendingExercises,
  fetchSessions,
  type Checkin,
  type TrainingSession,
} from '@/data/daily-log';
import { exerciseSummary, type ExerciseSession } from '@/data/exercise-tagging';
import { deleteMeal, fetchNutrition, saveDayType } from '@/data/nutrition';
import type { NutritionView } from '@/data/nutrition-view';
import { fetchRecovery } from '@/data/recovery';
import { fetchRegionLoad } from '@/data/region-load';
import type { RecoveryView } from '@/data/recovery-view';
import { fetchTrainingLoad } from '@/data/training-load';
import type { TrainingLoadView } from '@/data/training-load-view';
import type { DemoScenario } from '@/demo/demo-data';
import { useDemoScenario } from '@/demo/demo-mode';
import { usePalette } from '@/theme/appearance';
import { formatDayHeader } from '@/utils/format-date';
import { addDays, toLocalDate } from '@/utils/local-date';

interface TodayLog {
  checkin: Checkin | null;
  sessions: TrainingSession[];
  /** Dünün seansları (yalnız ter testi sonucu için). */
  yesterdaySessions: TrainingSession[];
  /** Bugün ve dün saatin kaydettiği, henüz etiketlenmemiş oturumlar (seans formunun gün sınırıyla aynı). */
  pending: ExerciseSession[];
}

// Demo senaryosu değişince ekran baştan kurulur: veri yeniden çekilir, grafik seçimi gibi durumlar sıfırlanır.
export default function TodayRoute() {
  const demo = useDemoScenario();
  return <TodayScreen key={demo ?? 'real'} demo={demo} />;
}

function TodayScreen({ demo }: { demo: DemoScenario | null }) {
  const palette = usePalette();
  const [log, setLog] = useState<TodayLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<RecoveryView | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [load, setLoad] = useState<TrainingLoadView | null>(null);
  const [checkinReading, setCheckinReading] = useState<CheckinReading | null>(null);
  const [nutrition, setNutrition] = useState<NutritionView | null>(null);
  const [coachSnapshot, setCoachSnapshot] = useState<CoachSnapshot | null>(null);

  // Form kapanınca ekran yeniden odaklanır ve günün kaydı tazelenir.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const today = toLocalDate(new Date());
      const yesterday = toLocalDate(addDays(new Date(), -1));
      const checkinP = fetchCheckin(today);
      const sessionsP = fetchSessions(today);
      const recoveryP = fetchRecovery(today);
      const nutritionP = fetchNutrition(today);
      const readingP = fetchCheckinReading(today);
      const loadP = fetchTrainingLoad(today);
      Promise.all([checkinP, sessionsP, fetchPendingExercises(yesterday, today), fetchSessions(yesterday)]).then(
        ([checkin, sessions, pending, yesterdaySessions]) => {
          if (cancelled) return;
          if (checkin.ok && sessions.ok && pending.ok) {
            setLog({
              checkin: checkin.value,
              sessions: sessions.value,
              pending: pending.value,
              yesterdaySessions: yesterdaySessions.ok ? yesterdaySessions.value : [],
            });
            setError(null);
          } else {
            setError(!checkin.ok ? checkin.message : !sessions.ok ? sessions.message : !pending.ok ? pending.message : null);
          }
        },
      );
      recoveryP.then((r) => {
        if (cancelled) return;
        if (r.ok) {
          setRecovery(r.value);
          setRecoveryError(null);
        } else {
          setRecoveryError(r.message);
        }
      });
      // Beslenme hedefi ikincil: alınamazsa bölüm görünmez.
      nutritionP.then((r) => {
        if (!cancelled) setNutrition(r.ok ? r.value : null);
      });
      // Check-in kıyası ikincil: alınamazsa kart yalnız toplamı gösterir.
      readingP.then((r) => {
        if (!cancelled) setCheckinReading(r.ok ? r.value : null);
      });
      // Yük notu ikincil: alınamazsa Bugün hata göstermez, not yalnız görünmez.
      loadP.then((r) => {
        if (!cancelled) setLoad(r.ok ? r.value : null);
      });
      // Koçun anlık değerleri: hepsi gelince bir kez. Alınamayan bölüm gönderilmez (özet eksik değerle yazılır).
      Promise.all([checkinP, sessionsP, recoveryP, nutritionP, readingP, loadP, fetchRegionLoad(today, new Date())]).then(
        ([checkin, sessions, recoveryR, nutritionR, reading, loadR, regions]) => {
          if (cancelled || !checkin.ok) return;
          setCoachSnapshot(
            buildCoachSnapshot({
              today,
              matchDay: false,
              recovery: recoveryR.ok ? recoveryR.value : null,
              checkin: reading.ok ? reading.value : null,
              load: loadR.ok ? loadR.value : null,
              regions: regions.ok ? regions.value : null,
              nutrition: nutritionR.ok ? nutritionR.value : null,
              sweat: sessions.ok ? todaySweat(sessions.value) : null,
            }),
          );
        },
      );
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const total = log?.checkin ? wellnessTotal(log.checkin.answers) : null;
  const today = toLocalDate(new Date());
  const yesterday = toLocalDate(addDays(new Date(), -1));
  const auraState = recovery ? levelStates[recovery.status.level] : null;

  async function removeMeal(id: string) {
    const r = await deleteMeal(id);
    if (!r.ok) return setError(r.message);
    const n = await fetchNutrition(today);
    if (n.ok) setNutrition(n.value);
  }

  // Bugünkü ter testinin seans sonrası sıvı hedefi; su halkasının altında yazar (karar 0031).
  const sweatFluidL =
    log?.sessions
      .map(sweatResult)
      .find((r) => r?.shortRecoveryFluidL)?.shortRecoveryFluidL ?? null;

  async function changeDayType(dayType: DayType | null) {
    const r = await saveDayType(today, dayType);
    if (!r.ok) return setError(r.message);
    const n = await fetchNutrition(today);
    if (n.ok) setNutrition(n.value);
  }

  return (
    <Screen>
      {auraState ? <Aura state={auraState} /> : null}
      <PageHeader overline={formatDayHeader(new Date())} title="Bugün" />
      {demo ? <DemoBar scenario={demo} /> : null}

      {recovery ? <RecoveryState view={recovery} /> : null}
      {recoveryError ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {recoveryError}
        </Text>
      ) : null}

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
        // Açıklama düğmesi düzenleme düğmesinin dışında: iç içe düğme olmaz (web'de geçersiz, ekran okuyucuda karışık).
        <Card>
          <View style={styles.titleRow}>
            <Text variant="footnote" tone="inkMuted">
              Sabah check-in
            </Text>
            <ExplainButton
              id="checkin"
              value={`${total} / ${wellnessTotalRange.max}${checkinReading?.z != null ? ` · ${formatZ(checkinReading.z)}` : ''}`}
            />
          </View>
          <Pressable
            onPress={() => router.push('/checkin')}
            accessibilityRole="button"
            accessibilityHint="Düzenlemek için dokun"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
            <>
              <View style={styles.metricRow}>
                <Text variant="metric">{total}</Text>
                <Text variant="footnote" tone="inkMuted">
                  / {wellnessTotalRange.max}
                </Text>
              </View>
              {checkinReading && checkinReading.total === total ? (
                <Text variant="caption" tone="inkMuted">
                  {checkinNote(checkinReading)}
                </Text>
              ) : null}
              {checkinReading?.low && checkinReading.total === total ? (
                <View style={[styles.checkinLow, { borderTopColor: palette.line }]}>
                  <Text variant="callout">{checkinLowTitle}</Text>
                  <Text variant="footnoteRegular" tone="inkSecondary">
                    {checkinLowBody(checkinReading)}
                  </Text>
                </View>
              ) : null}
            </>
          </Pressable>
        </Card>
      ) : null}

      {coachSnapshot && log ? <CoachCard snapshot={coachSnapshot} checkinDone={log.checkin !== null} /> : null}

      {error ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {load ? <LoadSpikeRow view={load} /> : null}

      {nutrition ? (
        <NutritionSection view={nutrition} onDayType={changeDayType} onDeleteMeal={(id) => void removeMeal(id)} sweatFluidL={sweatFluidL} />
      ) : null}

      {log ? <SweatResults sessions={[...log.sessions, ...log.yesterdaySessions]} today={today} /> : null}

      {log && log.pending.length > 0 ? (
        <ListGroup label="Saatten gelenler" footer="Saat zamanı ve süreyi kaydetti. Türünü ve zorluğunu sen ver; yük hesabına öyle girer.">
          {log.pending.map((e) => {
            const summary = exerciseSummary(e, today, yesterday);
            return (
              <ListRow
                key={e.id}
                label={summary.title}
                detail={summary.detail}
                value="Etiketle"
                onPress={() => router.push({ pathname: '/session-new', params: { exercise: e.id } })}
              />
            );
          })}
        </ListGroup>
      ) : null}

      {log && log.sessions.length > 0 ? (
        <>
          <View style={styles.groupHead}>
            <GroupLabel>Bugünün seansları</GroupLabel>
            <ExplainButton id="sessionLoad" style={styles.groupInfo} />
          </View>
          <View style={[styles.list, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
            {log.sessions.map((s, i) => (
              <View key={s.id} style={[styles.row, i > 0 && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.rowText}>
                  <Text variant="rowLabel">{sessionKindLabels[s.kind]}</Text>
                  <Text variant="caption" tone="inkMuted">
                    {`${s.durationMin} dk · RPE ${s.rpe}${s.minutesPlayed !== null ? ` · ${s.minutesPlayed} dk oynadı` : ''}${s.exerciseSessionId ? ' · saatle eşleşti' : ''}${sweatNote(s)}`}
                  </Text>
                </View>
                <Text variant="callout">{`${sessionLoad(s.rpe, s.durationMin) ?? '–'} AU`}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {recovery && !recovery.empty ? <NightData view={recovery} /> : null}
    </Screen>
  );
}

function sweatResult(s: TrainingSession) {
  return s.sweat ? sweatTest({ ...s.sweat, urineL: s.sweat.urineL ?? 0, durationMin: s.durationMin }) : null;
}

/** Bugünkü ter testlerinden en yenisi (koçun anlık değerleri için). */
function todaySweat(sessions: readonly TrainingSession[]) {
  return sessions.map(sweatResult).filter((r) => r !== null).at(-1) ?? null;
}

/** Seans satırına ter testinin kısa özeti. */
function sweatNote(s: TrainingSession): string {
  const r = sweatResult(s);
  return r ? ` · ${sweatSummary(r)}` : '';
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  groupHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  groupInfo: { marginRight: layout.screenInset, marginBottom: spacing[2] },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  checkinLow: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
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
