// Haftalık rapor (karar 0040): pazartesi-pazar haftasının yük, toparlanma, gece notları, check-in, ağrı,
// beslenme ve kilo özeti. Sayılar motordan ve görünümden (data/weekly-report-view), metinler copy/weekly-report'tan;
// burada yalnız yerleşim. Risk rengi yok: durum renkleri Bugün'deki günün durumu, yük renkleri seans türü (karar 0026).

import { addIsoDays, weekLength, weekStartOf, shortSleep, type DayLevel, type MetricReading } from '@hooplab/engine';
import { layout, loadGroups, radius, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DemoBar } from '@/components/demo-bar';
import { Icon } from '@/components/icon';
import { ExplainButton, openExplainer } from '@/components/info-button';
import { GroupFooter, GroupLabel, ListGroup, ListRow } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { Tile } from '@/components/recovery-section';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { previousWeekEnergyText, weeklyEnergyDetail, weeklyEnergyFooter, weeklyEnergyLabel } from '@/copy/energy';
import { wellnessLabels } from '@/copy/labels';
import { bandDigits, bandNote, formatBand, formatDecimal, formatRolling, formatSleep, levelLabels, levelStates } from '@/copy/recovery';
import { spotName } from '@/copy/region-load';
import { averageWeeksLabel, formatLoad, formatRatio, loadGroupLabels } from '@/copy/training-load';
import {
  aboveText,
  checkinBaselineText,
  checkinCountText,
  currentLoadNote,
  currentRecoveryNote,
  dayTypesText,
  fluidText,
  averageNote,
  historyFooter,
  historyNote,
  ratioTileNote,
  levelCountsText,
  lowDaysText,
  mealDaysText,
  nightKindLabels,
  nightsFooter,
  nutritionFooter,
  painFooter,
  phaseText,
  positionsText,
  previousWeekText,
  sessionsText,
  sleepText,
  weekRangeText,
  weeklyTitle,
  weightChangeText,
  weightFooter,
} from '@/copy/weekly-report';
import { fetchWeeklyReport } from '@/data/weekly-report';
import type { WeeklyReport, WeeklyReportView } from '@/data/weekly-report-view';
import { useDemoScenario } from '@/demo/demo-mode';
import { usePalette } from '@/theme/appearance';
import { formatShortDate, formatShortDay } from '@/utils/format-date';
import { toLocalDate } from '@/utils/local-date';

const dash = '–';

/** Varsayılan hafta: biten son hafta (bugünün haftasından bir önceki). */
function defaultWeek(today: string): string {
  return addIsoDays(weekStartOf(today), -weekLength);
}

function isIsoWeek(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && weekStartOf(value) === value;
}

export default function WeeklyRoute() {
  const demo = useDemoScenario();
  const params = useLocalSearchParams<{ week?: string }>();
  const today = toLocalDate(new Date());
  const current = weekStartOf(today);
  const week = isIsoWeek(params.week) && params.week <= current ? params.week : defaultWeek(today);
  return <WeeklyScreen key={`${demo ?? 'real'}:${week}`} week={week} today={today} demo={demo} />;
}

function WeeklyScreen({ week, today, demo }: { week: string; today: string; demo: ReturnType<typeof useDemoScenario> }) {
  const palette = usePalette();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWeeklyReport(week, today).then((r) => {
      if (cancelled) return;
      if (r.ok) setReport(r.value);
      else setError(r.message);
    });
    return () => {
      cancelled = true;
    };
  }, [week, today]);

  const current = weekStartOf(today);
  const firstWeek = report?.firstWeek ?? null;
  const canPrev = firstWeek !== null && week > firstWeek;
  const canNext = week < current;
  const go = (delta: number) => router.setParams({ week: addIsoDays(week, delta * weekLength) });

  return (
    <Screen>
      <PageHeader title={weeklyTitle} backLabel="Trend" />
      {demo ? <DemoBar scenario={demo} /> : null}

      <View style={styles.switcher}>
        <WeekArrow direction="back" enabled={canPrev} onPress={() => go(-1)} />
        <View style={styles.switcherText} accessibilityLiveRegion="polite">
          <Text variant="headline">{weekRangeText(week, addIsoDays(week, weekLength - 1))}</Text>
          <Text variant="caption" tone="inkMuted">
            {report ? phaseText(report.view) : ' '}
          </Text>
        </View>
        <WeekArrow direction="forward" enabled={canNext} onPress={() => go(1)} />
      </View>

      {error ? (
        <Text variant="footnoteMedium" style={[styles.error, { color: palette.statusInk.red }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {report ? <Report view={report.view} /> : null}
    </Screen>
  );
}

function WeekArrow({ direction, enabled, onPress }: { direction: 'back' | 'forward'; enabled: boolean; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      hitSlop={spacing[2]}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Önceki hafta' : 'Sonraki hafta'}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: palette.card, boxShadow: palette.shadow.card, opacity: enabled ? 1 : 0.35 },
        pressed && styles.pressed,
      ]}>
      <Icon name={direction === 'back' ? 'chevronBack' : 'chevron'} color={palette.ink} size={20} strokeWidth={2.2} />
    </Pressable>
  );
}

function Report({ view }: { view: WeeklyReportView }) {
  return (
    <>
      <View style={styles.aboutRow}>
        <Text variant="footnoteRegular" tone="inkMuted" style={styles.aboutText}>
          Her gün Bugün ve Trend'deki hesapla okunur; rapor yalnız toplar. Eşik yok.
        </Text>
        <ExplainButton id="weeklyReport" />
      </View>
      <LoadBlock view={view} />
      <RecoveryBlock view={view} />
      <NightsBlock view={view} />
      <CheckinBlock view={view} />
      <PainBlock view={view} />
      <NutritionBlock view={view} />
      <WeightBlock view={view} />
      <EnergyBlock view={view} />
    </>
  );
}

/** Pazartesi-pazar başlıkları; süren haftada gelmemiş günler soluk. */
function DayHeads({ view }: { view: WeeklyReportView }) {
  const all = Array.from({ length: weekLength }, (_, i) => addIsoDays(view.weekStart, i));
  return (
    <View style={styles.strip}>
      {all.map((d) => (
        <Text key={d} variant="micro" tone="inkMuted" style={[styles.stripCell, d > view.dates.at(-1)! && styles.future]}>
          {formatShortDay(d)}
        </Text>
      ))}
    </View>
  );
}

// --- Yük ---

const barHeight = 72;

function LoadBlock({ view }: { view: WeeklyReportView }) {
  const palette = usePalette();
  const l = view.load;
  const r = l.reading;
  const end = r.end;
  const max = Math.max(1, ...l.days.map((d) => d.load ?? 0));
  const all = Array.from({ length: weekLength }, (_, i) => addIsoDays(view.weekStart, i));

  if (l.empty) {
    return (
      <>
        <GroupLabel>Antrenman yükü</GroupLabel>
        <Card>
          <Text variant="bodyCompact">Henüz seans kaydı yok.</Text>
        </Card>
      </>
    );
  }

  return (
    <>
      <GroupLabel>Antrenman yükü</GroupLabel>
      <Card>
        <View style={styles.headRow}>
          <View>
            <View style={styles.titleRow}>
              <Text variant="footnote" tone="inkSecondary">
                {view.phase === 'complete' ? 'Haftanın yükü' : 'Bugüne kadar'}
              </Text>
              <ExplainButton id="loadChart" value={r.total === null ? undefined : `${formatLoad(r.total)} AU`} />
            </View>
            <View style={styles.valueRow}>
              <Text variant="metric">{r.total === null ? dash : formatLoad(r.total)}</Text>
              <Text variant="footnote" tone="inkMuted">
                AU
              </Text>
            </View>
          </View>
          <View style={styles.headRight}>
            <Text variant="caption" tone="inkMuted">
              {previousWeekText(view)}
            </Text>
            <Text variant="caption" tone="inkMuted">
              {sessionsText(view)}
            </Text>
          </View>
        </View>

        <View
          style={[styles.bars, { height: barHeight }]}
          accessible
          accessibilityLabel={`Günlük yük: ${l.days.map((d) => `${formatShortDay(d.date)} ${d.load === null ? 'kayıt öncesi' : `${formatLoad(d.load)} AU`}`).join(', ')}`}>
          {all.map((date) => {
            const day = l.days.find((d) => d.date === date);
            return (
              <View key={date} style={styles.barSlot}>
                {day && day.load !== null && day.load > 0 ? (
                  <View style={styles.barStack}>
                    {[...loadGroups].reverse().map((g) =>
                      day.parts[g] > 0 ? (
                        <View
                          key={g}
                          style={{ height: (day.parts[g] / max) * barHeight, backgroundColor: palette.loadGroup[g] }}
                        />
                      ) : null,
                    )}
                  </View>
                ) : (
                  <View style={[styles.barZero, { backgroundColor: day ? palette.dot : 'transparent' }]} />
                )}
              </View>
            );
          })}
        </View>
        <DayHeads view={view} />
        <View style={styles.groups}>
          {loadGroups.map((g) => (
            <View key={g} style={styles.groupValue}>
              <View style={[styles.swatch, { backgroundColor: palette.loadGroup[g] }]} />
              <Text variant="caption" tone="inkSecondary">
                {loadGroupLabels[g]}
              </Text>
              <Text variant="caption" tone="inkMuted">
                {formatLoad(l.parts[g])}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {end ? (
        <>
          <View style={styles.grid}>
            <Tile
              label={averageWeeksLabel}
              explain="weeklyAverage"
              value={end.weeklyAverage === null ? dash : formatLoad(end.weeklyAverage)}
              unit="AU/hafta"
              note={averageNote(end)}
              flagged={false}
              state={null}
            />
            <Tile
              label="Alıştığına göre"
              explain="ratio"
              value={end.ratio === null ? dash : formatRatio(end.ratio)}
              unit=""
              note={ratioTileNote(end)}
              flagged={false}
              state={null}
            />
            <Tile
              label="Monotonluk"
              explain="monotony"
              value={end.monotony === null ? dash : formatDecimal(end.monotony)}
              unit=""
              note={historyNote(
                r.history.map((h) => h.monotony),
                (n) => formatDecimal(n),
              )}
              flagged={false}
              state={null}
            />
            <Tile
              label="Gerilim"
              explain="strain"
              value={end.strain === null ? dash : formatLoad(end.strain)}
              unit="AU"
              note={historyNote(
                r.history.map((h) => h.strain),
                formatLoad,
              )}
              flagged={false}
              state={null}
            />
          </View>
          <GroupFooter>{historyFooter(r.history.map((h) => h.total))}</GroupFooter>
        </>
      ) : (
        <GroupFooter>{currentLoadNote}</GroupFooter>
      )}
    </>
  );
}

// --- Toparlanma ---

function LevelDot({ level, label }: { level: DayLevel; label: string }) {
  const palette = usePalette();
  const state = levelStates[level];
  return (
    <View style={styles.stripCell} accessible accessibilityLabel={label}>
      <View
        style={[
          styles.levelDot,
          state ? { backgroundColor: palette.status[state] } : { borderColor: palette.dot, borderWidth: 2 },
        ]}
      />
    </View>
  );
}

function RecoveryBlock({ view }: { view: WeeklyReportView }) {
  const r = view.recovery;
  if (r.empty) {
    return (
      <>
        <GroupLabel>Toparlanma</GroupLabel>
        <Card>
          <Text variant="bodyCompact">Bu hafta cihaz verisi yok.</Text>
        </Card>
      </>
    );
  }
  const remaining = weekLength - r.days.length;
  return (
    <>
      <GroupLabel>Toparlanma</GroupLabel>
      <Card>
        <Text variant="footnote" tone="inkSecondary">
          Günün durumu
        </Text>
        <View style={[styles.strip, styles.levelStrip]}>
          {r.days.map((d) => (
            <LevelDot key={d.date} level={d.level} label={`${formatShortDate(d.date)}: ${levelLabels[d.level]}`} />
          ))}
          {Array.from({ length: remaining }, (_, i) => (
            <View key={`f${i}`} style={styles.stripCell} />
          ))}
        </View>
        <DayHeads view={view} />
        <Text variant="caption" tone="inkMuted" style={styles.below}>
          {levelCountsText(r.counts)}
        </Text>
      </Card>

      <View style={styles.grid}>
        {r.hrv ? (
          <Tile
            label="HRV"
            explain="hrv"
            value={formatRolling(r.hrv)}
            unit="ms"
            note={`hafta ort. · ${bandNote(r.hrv)}`}
            rows={weekBandRows(r.hrv, "ms")}
            flagged={false}
            state={null}
          />
        ) : null}
        {r.rhr ? (
          <Tile
            label="Uyku nabzı"
            explain="rhr"
            value={formatRolling(r.rhr)}
            unit="atım/dk"
            note={`hafta ort. · ${bandNote(r.rhr)}`}
            rows={weekBandRows(r.rhr, "atım/dk")}
            flagged={false}
            state={null}
          />
        ) : null}
        <Tile
          label="Uyku"
          explain="sleep"
          value={r.sleepHours === null ? dash : formatSleep(r.sleepHours * 60)}
          unit="sa"
          note={sleepText(view)}
          rows={[{ label: "Hedef", value: `ort. en az ${formatSleep(shortSleep.minHours * 60)} sa` }]}
          flagged={false}
          state={null}
        />
      </View>
      {view.phase === 'current' ? <GroupFooter>{currentRecoveryNote}</GroupFooter> : null}
    </>
  );
}

/** Haftanın aralığı (haftadan önceki 4 hafta); "son gece" haftalık raporda anlamsız, yazılmaz. */
function weekBandRows(r: MetricReading, unit: string) {
  const band = formatBand(r, bandDigits(r));
  return [{ label: "Aralığın", value: band ? `${band} ${unit}` : "oluşuyor" }];
}

// --- Gece notları ---

function NightsBlock({ view }: { view: WeeklyReportView }) {
  if (view.nights.length === 0) return null;
  return (
    <ListGroup label="Gece notları" footer={nightsFooter}>
      {view.nights.map((n) => (
        <ListRow
          key={n.date}
          label={formatShortDate(n.date)}
          value={n.kinds.map((k) => nightKindLabels[k]).join(' · ')}
          onPress={() => openExplainer(n.kinds.length === 1 && n.kinds[0] === 'respiration' ? 'respiration' : 'illnessSigns')}
        />
      ))}
    </ListGroup>
  );
}

// --- Check-in ---

function CheckinBlock({ view }: { view: WeeklyReportView }) {
  const c = view.checkin;
  return (
    <>
      <GroupLabel>Sabah check-in</GroupLabel>
      <Card>
        <View style={styles.headRow}>
          <View>
            <View style={styles.titleRow}>
              <Text variant="footnote" tone="inkSecondary">
                Ortalama toplam
              </Text>
              <ExplainButton id="checkin" />
            </View>
            <View style={styles.valueRow}>
              <Text variant="metric">{c.meanTotal === null ? dash : formatDecimal(c.meanTotal)}</Text>
              <Text variant="footnote" tone="inkMuted">
                {checkinCountText(view)}
              </Text>
            </View>
          </View>
          <View style={styles.headRight}>
            <Text variant="caption" tone="inkMuted">
              {checkinBaselineText(view)}
            </Text>
            {c.n > 0 && c.baselineMean !== null ? (
              <Text variant="caption" tone="inkMuted">
                {lowDaysText(c.lowDates.length)}
              </Text>
            ) : null}
          </View>
        </View>
        {c.items.length ? (
          <View style={styles.items}>
            {c.items.map((it) => (
              <View key={it.item} style={styles.itemRow}>
                <Text variant="caption" tone="inkSecondary" style={styles.itemLabel}>
                  {wellnessLabels[it.item].title}
                </Text>
                {it.baselineMean === null ? null : (
                  <Text variant="caption" tone="inkMuted">
                    {`olağan ${formatDecimal(it.baselineMean)}`}
                  </Text>
                )}
                <Text variant="caption" tone="ink" style={styles.itemValue}>
                  {formatDecimal(it.mean)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </>
  );
}

// --- Ağrı ---

function PainBlock({ view }: { view: WeeklyReportView }) {
  const palette = usePalette();
  const p = view.pain;
  if (p.spots.length === 0) {
    return (
      <>
        <GroupLabel>Ağrı</GroupLabel>
        <Card>
          <Text variant="bodyCompact">
            {p.checkinDays === 0 ? 'Bu hafta check-in yok.' : `${p.checkinDays} check-in'de ağrı girilmedi.`}
          </Text>
        </Card>
      </>
    );
  }
  const remaining = weekLength - view.dates.length;
  return (
    <>
      <GroupLabel>Ağrı</GroupLabel>
      <Card>
        <DayHeads view={view} />
        {p.spots.map((s) => {
          const above = aboveText(s.aboveMonitoring);
          return (
            <View key={`${s.spot.region}:${s.spot.side}`} style={styles.painRow}>
              <View style={styles.painHead}>
                <Text variant="caption" tone="inkSecondary">
                  {spotName(s.spot)}
                </Text>
                {above ? (
                  <Text variant="caption" tone="inkMuted">
                    {above}
                  </Text>
                ) : null}
              </View>
              <View style={styles.strip}>
                {s.days.map((d) => (
                  <View
                    key={d.date}
                    style={[
                      styles.stripCell,
                      styles.painCell,
                      d.pain === null
                        ? { borderColor: palette.line, borderWidth: 1, borderStyle: 'dashed' }
                        : { backgroundColor: d.pain > 0 ? palette.track : 'transparent' },
                    ]}
                    accessible
                    accessibilityLabel={`${formatShortDate(d.date)}: ${d.pain === null ? 'check-in yok' : `ağrı ${d.pain}`}`}>
                    <Text variant={d.pain ? 'footnote' : 'caption'} tone={d.pain ? 'ink' : 'inkMuted'}>
                      {d.pain === null ? '' : String(d.pain)}
                    </Text>
                  </View>
                ))}
                {Array.from({ length: remaining }, (_, i) => (
                  <View key={`f${i}`} style={styles.stripCell} />
                ))}
              </View>
            </View>
          );
        })}
      </Card>
      <GroupFooter>{painFooter}</GroupFooter>
    </>
  );
}

// --- Beslenme ---

function NutritionBlock({ view }: { view: WeeklyReportView }) {
  const n = view.nutrition;
  return (
    <ListGroup label="Beslenme ve sıvı" footer={nutritionFooter}>
      <ListRow label={mealDaysText(view)} detail={dayTypesText(n.dayTypes, n.matchDays)} onPress={() => openExplainer('nutrition')} />
      {n.mealDays > 0 && n.noTarget < n.mealDays ? <ListRow label="Karbonhidrat" value={positionsText(n.carbs)} /> : null}
      {n.mealDays > 0 && n.noTarget < n.mealDays ? <ListRow label="Protein" value={positionsText(n.protein)} /> : null}
      {n.noTarget > 0 ? <ListRow label="Kilo olmadan hedef yok" value={`${n.noTarget} gün`} /> : null}
      <ListRow label="Su" value={fluidText(view)} />
      {n.sweatTests > 0 ? <ListRow label="Ter testi" value={`${n.sweatTests}`} /> : null}
    </ListGroup>
  );
}

// --- Kilo ---

function WeightBlock({ view }: { view: WeeklyReportView }) {
  const w = view.weight;
  const change = weightChangeText(view);
  return (
    <ListGroup label="Sabah kilosu" footer={weightFooter}>
      <ListRow
        label={w.mean === null ? 'Bu hafta tartı yok' : `${formatDecimal(w.mean)} kg`}
        detail={w.mean === null ? undefined : `${w.n} tartı${change ? ` · ${change}` : ''}`}
      />
    </ListGroup>
  );
}

// --- Yakılan enerji (karar 0043) ---

function EnergyBlock({ view }: { view: WeeklyReportView }) {
  const e = view.energy;
  const previous = previousWeekEnergyText(e);
  return (
    <ListGroup label="Yakılan enerji · tahmin" footer={weeklyEnergyFooter}>
      <ListRow
        label={weeklyEnergyLabel(e)}
        detail={weeklyEnergyDetail(e, view.phase === 'current')}
        onPress={() => openExplainer('energy')}
      />
      {previous ? <ListRow label="Önceki hafta" value={previous} /> : null}
    </ListGroup>
  );
}

const styles = StyleSheet.create({
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: layout.cardInset,
    marginTop: spacing[2],
  },
  switcherText: { alignItems: 'center', flex: 1 },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  error: { marginTop: spacing[3], marginHorizontal: layout.screenInset },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginHorizontal: layout.screenInset,
    marginTop: spacing[4],
  },
  aboutText: { flex: 1 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[3] },
  headRight: { alignItems: 'flex-end', flexShrink: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1], marginTop: spacing[2] },
  bars: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing[4] },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barStack: { width: 18, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barZero: { width: 18, height: 2, borderRadius: 1 },
  strip: { flexDirection: 'row', marginTop: spacing[1.5] },
  stripCell: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  future: { opacity: 0.4 },
  groups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing[4],
    rowGap: spacing[1],
    marginTop: spacing[3],
  },
  groupValue: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.gridGap,
    marginHorizontal: layout.cardInset,
    marginTop: layout.cardGap,
  },
  levelStrip: { marginTop: spacing[3] },
  levelDot: { width: 22, height: 22, borderRadius: radius.full },
  below: { marginTop: spacing[2] },
  items: { marginTop: spacing[3], gap: spacing[1] },
  itemRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  itemLabel: { flex: 1 },
  itemValue: { minWidth: 28, textAlign: 'right' },
  painRow: { marginTop: spacing[3] },
  painHead: { flexDirection: 'row', justifyContent: 'space-between' },
  painCell: { height: 28, borderRadius: 6, marginHorizontal: 2 },
});
