// Vücut (karar 0018, 0027): döndürülebilir manken; iki görünüm.
// Ağrı: 1 gün / 3 gün / 1 hafta. 1 gün bugünün ağrısı renk ölçeğiyle; 3 gün / 1 hafta değerler birleştirilmez,
// ağrı girilen bölgeler işaretlenir ve gün gün yazılır. Bugünkü ağrıya ağrı izleme notu (tahmin) düşebilir.
// Bölge yükü (tahmin): toparlanma penceresinde (tendon 48, kas 72 saat) çalışan bölgeler nötr tonla
// işaretlenir; yük, seans sayısı ve olağan değer listede. Eşik, renk ölçeği ve risk dili yok.

import { notModeledRegions, sidesOf, spotKey, type BodyRegion, type BodySpot, type RegionLoad } from '@hooplab/engine';
import { contrastRatio, layout, radius, spacing, type Hex } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { bodyColors, painColor, type BodyColors } from '@/body/body-colors';
import { facingYaw } from '@/body/body-model';
import { BodyView } from '@/components/body-view';
import { Card } from '@/components/card';
import { Chip, ChipSet } from '@/components/chip';
import { GestureScrollView } from '@/components/gesture-scroll';
import { Icon } from '@/components/icon';
import { ExplainButton } from '@/components/info-button';
import { GroupLabel } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { useTabBarSpace } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { regionLabels } from '@/copy/labels';
import {
  defaultedNote,
  lastLoadedText,
  notModeledNote,
  painNoteFooter,
  painNoteText,
  regionEstimateLabel,
  regionLoadFooter,
  regionSessionsText,
  regionWindowText,
  spotName,
  typicalText,
  windowLabel,
  workedBodyLabel,
  workedEmpty,
  workedLegend,
  workedTitle,
} from '@/copy/region-load';
import { formatLoad } from '@/copy/training-load';
import { fetchPainHistory } from '@/data/daily-log';
import {
  bodyWindows,
  latestPainMap,
  painDays,
  spotsWithPain,
  windowDates,
  type BodyWindow,
  type PainHistory,
} from '@/data/pain-history';
import { painOf } from '@/data/pain-map';
import { fetchRegionLoad } from '@/data/region-load';
import type { RegionLoadView } from '@/data/region-load-view';
import { usePalette } from '@/theme/appearance';
import { formatShortDay } from '@/utils/format-date';
import { toLocalDate } from '@/utils/local-date';

type Mode = 'pain' | 'load';
const modes = ['pain', 'load'] as const;
const modeLabels: Record<Mode, string> = { pain: 'Ağrı', load: 'Bölge yükü' };

const windowLabels: Record<BodyWindow, string> = { 1: '1 gün', 3: '3 gün', 7: '1 hafta' };
const BODY_HEIGHT = 440;

export default function BodyScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const colors = useMemo(() => bodyColors(palette), [palette]);

  const [mode, setMode] = useState<Mode>('pain');
  const [range, setRange] = useState<BodyWindow>(1);
  const [history, setHistory] = useState<PainHistory | null>(null);
  const [regionView, setRegionView] = useState<RegionLoadView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BodySpot | null>(null);
  const [focus, setFocus] = useState<{ yaw: number; token: number } | null>(null);

  // Check-in formundan dönünce ve aralık değişince tazelenir.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchPainHistory(windowDates(new Date(), range)).then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setHistory(result.value);
          setError(null);
        } else {
          setError(result.message);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [range]),
  );

  // Bölge yükü ve ağrı izleme notu aralıktan bağımsız; seans veya check-in formundan dönünce tazelenir.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const now = new Date();
      fetchRegionLoad(toLocalDate(now), now).then((result) => {
        if (cancelled) return;
        if (result.ok) setRegionView(result.value);
        else setError(result.message);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const single = range === 1;
  const today = history ? latestPainMap(history) : null;
  const marked = useMemo(() => (history ? spotsWithPain(history) : []), [history]);
  const paint = useMemo(
    () => (mode === 'load' ? workedPaint(colors, regionView) : paintFor(colors, single, history, marked)),
    [mode, colors, single, history, marked, regionView],
  );

  const select = (spot: BodySpot | null, turn: boolean) => {
    setSelected(spot);
    if (spot && turn) setFocus({ yaw: facingYaw(spot), token: Date.now() });
  };

  const missing = history ? history.dates.length - history.checkinDates.size : 0;

  return (
    <GestureScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[2.5], paddingBottom: tabBarSpace }}>
      <PageHeader title="Vücut" />

      <View style={styles.filter}>
        <ChipSet label="Görünüm">
          {modes.map((m) => (
            <Chip key={m} label={modeLabels[m]} selected={mode === m} onPress={() => setMode(m)} />
          ))}
        </ChipSet>
        {mode === 'pain' ? (
          <ChipSet label="Aralık">
            {bodyWindows.map((w) => (
              <Chip key={w} label={windowLabels[w]} selected={range === w} onPress={() => setRange(w)} />
            ))}
          </ChipSet>
        ) : (
          <View style={styles.windowRow}>
            <EstimateBadge />
            <Text variant="caption" tone="inkMuted" style={styles.windowText}>
              {regionWindowText}
            </Text>
            <ExplainButton id="regionWindow" />
          </View>
        )}
      </View>

      <BodyView
        colors={colors}
        paint={paint}
        selected={selected}
        onSelect={(spot) => select(spot, false)}
        focus={focus}
        height={BODY_HEIGHT}
        accessibilityLabel={
          mode === 'load'
            ? workedBodyLabel
            : marked.length > 0
              ? 'Vücut modeli. Ağrı girilen bölgeler aşağıda listeleniyor.'
              : 'Vücut modeli. Bu aralıkta ağrı girilmedi.'
        }
      />

      <View style={styles.legendRow}>
        {mode === 'load' ? (
          <SwatchLegend color={colors.worked} label={workedLegend} />
        ) : single ? (
          <PainLegend colors={colors} />
        ) : (
          <SwatchLegend color={colors.marked} label="Ağrı girilen bölge" />
        )}
        <Text variant="caption2" tone="inkMuted">
          Kaydırarak döndür, bölgeye dokun
        </Text>
      </View>

      {error ? (
        <Card>
          <Text variant="subhead" style={{ color: palette.statusInk.red }} accessibilityRole="alert">
            {error}
          </Text>
        </Card>
      ) : null}

      {mode === 'load' ? (
        <RegionLoadSection
          view={regionView}
          colors={colors}
          selected={selected}
          onSelect={(region) => select({ region, side: sidesOf(region)[0]! }, true)}
          onClose={() => setSelected(null)}
        />
      ) : (
        <>
          {selected && history ? (
            <SpotCard spot={selected} history={history} single={single} colors={colors} onClose={() => setSelected(null)} />
          ) : null}

          {regionView && regionView.notes.length > 0 ? <PainNotes view={regionView} /> : null}

          {history && single && !today ? (
            <Pressable onPress={() => router.push('/checkin')} accessibilityRole="button">
              {({ pressed }) => (
                <Card style={pressed ? styles.pressed : undefined}>
                  <Text variant="headline">Bugün check-in yok</Text>
                  <Text variant="footnoteRegular" tone="inkSecondary">
                    Ağrı haritası sabah check-in'inden gelir. Doldurmak için dokun.
                  </Text>
                </Card>
              )}
            </Pressable>
          ) : null}

          {history && (today || !single) ? (
            <>
              <GroupLabel>{single ? 'Bugün ağrı girilen bölgeler' : `Son ${windowLabels[range]}`}</GroupLabel>
              <Card style={styles.listCard}>
                {marked.length === 0 ? (
                  <Text variant="subhead" tone="inkSecondary" style={styles.empty}>
                    {single ? 'Bugün ağrı girmedin.' : 'Bu aralıkta ağrı girilmedi.'}
                  </Text>
                ) : (
                  marked.map((spot, i) => (
                    <SpotRow
                      key={spotKey(spot)}
                      spot={spot}
                      history={history}
                      single={single}
                      colors={colors}
                      first={i === 0}
                      selected={selected !== null && spotKey(selected) === spotKey(spot)}
                      onPress={() => select(spot, true)}
                    />
                  ))
                )}
              </Card>
              {!single && missing > 0 ? (
                <Text variant="captionRegular" tone="inkMuted" style={styles.note}>
                  {`${history.dates.length} günün ${missing} gününde check-in yok ("–").`}
                </Text>
              ) : null}
            </>
          ) : null}

          <Text variant="captionRegular" tone="inkMuted" style={styles.note}>
            Ağrı haritası senin girdiğin değerlerdir, teşhis değildir.
          </Text>
        </>
      )}
    </GestureScrollView>
  );
}

function paintFor(
  colors: BodyColors,
  single: boolean,
  history: PainHistory | null,
  marked: readonly BodySpot[],
): Record<string, Hex> {
  const paint: Record<string, Hex> = {};
  if (!history) return paint;
  if (single) {
    const today = latestPainMap(history);
    if (!today) return paint;
    for (const spot of marked) {
      const color = painColor(colors, painOf(today, spot));
      if (color) paint[spotKey(spot)] = color;
    }
  } else {
    for (const spot of marked) paint[spotKey(spot)] = colors.marked;
  }
  return paint;
}

/** Bölge yükü görünümü: penceresinde çalışan bölgenin iki tarafı da işaretlenir (seanslar iki taraflı). */
function workedPaint(colors: BodyColors, view: RegionLoadView | null): Record<string, Hex> {
  const paint: Record<string, Hex> = {};
  for (const r of view?.reading.regions ?? []) {
    if (!r.recovering) continue;
    for (const side of sidesOf(r.region)) paint[spotKey({ region: r.region, side })] = colors.worked;
  }
  return paint;
}

/** Dolgu üstünde en okunur metin rengi. */
function readableOn(fill: Hex, candidates: readonly Hex[]): Hex {
  return candidates.reduce((best, c) => (contrastRatio(fill, c) > contrastRatio(fill, best) ? c : best));
}

function dayText(pain: number | null): string {
  return pain === null ? '–' : String(pain);
}

function SpotRow({
  spot,
  history,
  single,
  colors,
  first,
  selected,
  onPress,
}: {
  spot: BodySpot;
  history: PainHistory;
  single: boolean;
  colors: BodyColors;
  first: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  const days = painDays(history, spot);
  const todayPain = days[days.length - 1]?.pain ?? 0;
  const swatch = single ? painColor(colors, todayPain) : colors.marked;
  const value = single ? `${todayPain} / 10` : days.map((d) => dayText(d.pain)).join(' · ');
  const spoken = single
    ? `${todayPain} / 10`
    : days.map((d) => `${formatShortDay(d.date)} ${d.pain === null ? 'check-in yok' : d.pain}`).join(', ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${spotName(spot)}, ${spoken}`}
      accessibilityHint="Modelde göstermek için dokun"
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.swatch, { backgroundColor: swatch ?? colors.pad }]} />
      <Text variant="rowLabel" style={styles.rowLabel}>
        {spotName(spot)}
      </Text>
      <Text variant={single ? 'digit' : 'caption2Strong'} tone={single ? 'ink' : 'inkSecondary'}>
        {value}
      </Text>
    </Pressable>
  );
}

function SpotCard({
  spot,
  history,
  single,
  colors,
  onClose,
}: {
  spot: BodySpot;
  history: PainHistory;
  single: boolean;
  colors: BodyColors;
  onClose: () => void;
}) {
  const palette = usePalette();
  const days = painDays(history, spot);
  const last = days[days.length - 1];
  return (
    <Card>
      <View style={styles.cardHead}>
        <Text variant="headline" accessibilityRole="header">
          {spotName(spot)}
        </Text>
        <CloseButton onPress={onClose} />
      </View>
      {single ? (
        <Text variant="subhead" tone="inkSecondary">
          {last?.pain === null || last === undefined
            ? 'Bugün check-in yok.'
            : last.pain === 0
              ? 'Bugün ağrı yok.'
              : `Bugün ${last.pain} / 10`}
        </Text>
      ) : (
        <View style={styles.days}>
          {days.map((d) => {
            const fill = d.pain !== null && d.pain > 0 ? painColor(colors, d.pain) : null;
            return (
              <View
                key={d.date}
                style={styles.day}
                accessible
                accessibilityLabel={`${formatShortDay(d.date)}: ${d.pain === null ? 'check-in yok' : `${d.pain} / 10`}`}>
                <Text variant="micro" tone="inkMuted">
                  {formatShortDay(d.date)}
                </Text>
                <View
                  style={[
                    styles.dayValue,
                    { backgroundColor: fill ?? palette.cardMuted },
                  ]}>
                  <Text
                    variant="caption2Strong"
                    tone={d.pain === null ? 'inkMuted' : 'inkSecondary'}
                    style={fill ? { color: readableOn(fill, [palette.ink, palette.bg]) } : undefined}>
                    {dayText(d.pain)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

/** Bölge yükü: seçili bölgenin kartı, penceresinde çalışan bölgeler, çalışmayanlar ve notlar. */
function RegionLoadSection({
  view,
  colors,
  selected,
  onSelect,
  onClose,
}: {
  view: RegionLoadView | null;
  colors: BodyColors;
  selected: BodySpot | null;
  onSelect: (region: BodyRegion) => void;
  onClose: () => void;
}) {
  const palette = usePalette();
  if (!view) return null;
  const regions = view.reading.regions;
  const worked = regions.filter((r) => r.recovering);
  const rest = regions.filter((r) => !r.recovering);
  const picked = selected ? regions.find((r) => r.region === selected.region) : undefined;
  const notModeled = selected !== null && notModeledRegions.includes(selected.region);

  return (
    <>
      {picked ? <RegionCard r={picked} onClose={onClose} /> : null}
      {notModeled ? (
        <Card>
          <View style={styles.cardHead}>
            <Text variant="headline" accessibilityRole="header">
              {regionLabels[selected.region]}
            </Text>
            <CloseButton onPress={onClose} />
          </View>
          <Text variant="subhead" tone="inkSecondary">
            {notModeledNote}
          </Text>
        </Card>
      ) : null}

      <SectionHead title={workedTitle} explain="regionLoad" />
      <Card style={styles.listCard}>
        {worked.length === 0 ? (
          <Text variant="subhead" tone="inkSecondary" style={styles.empty}>
            {workedEmpty}
          </Text>
        ) : (
          worked.map((r, i) => (
            <Pressable
              key={r.region}
              onPress={() => onSelect(r.region)}
              accessibilityRole="button"
              accessibilityState={{ selected: picked?.region === r.region }}
              accessibilityLabel={`${regionLabels[r.region]}, ${windowLabel(r)}: ${formatLoad(r.load)} AU, ${regionSessionsText(r)}, ${typicalText(r)}`}
              accessibilityHint="Modelde göstermek için dokun"
              style={({ pressed }) => [
                styles.row,
                i > 0 && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.swatch, { backgroundColor: colors.worked }]} />
              <View style={styles.rowText}>
                <Text variant="rowLabel">{regionLabels[r.region]}</Text>
                <Text variant="caption" tone="inkMuted">
                  {`${regionSessionsText(r)} · ${typicalText(r)}`}
                </Text>
              </View>
              <Text variant="digit">{`${formatLoad(r.load)} AU`}</Text>
            </Pressable>
          ))
        )}
      </Card>
      {rest.length > 0 ? (
        <Text variant="captionRegular" tone="inkMuted" style={styles.note}>
          {`Bu sürede çalışmayan: ${rest.map((r) => regionLabels[r.region]).join(', ')}.`}
        </Text>
      ) : null}
      {view.defaultedSessions > 0 ? (
        <Text variant="captionRegular" tone="inkMuted" style={styles.note}>
          {defaultedNote(view.defaultedSessions)}
        </Text>
      ) : null}
      <Text variant="captionRegular" tone="inkMuted" style={styles.note}>
        {`${regionLoadFooter} ${notModeledNote}`}
      </Text>
    </>
  );
}

function RegionCard({ r, onClose }: { r: RegionLoad; onClose: () => void }) {
  return (
    <Card>
      <View style={styles.cardHead}>
        <View style={styles.cardTitle}>
          <Text variant="headline" accessibilityRole="header">
            {regionLabels[r.region]}
          </Text>
          <EstimateBadge />
        </View>
        <CloseButton onPress={onClose} />
      </View>
      {r.recovering ? (
        <>
          <View style={styles.regionValue}>
            <Text variant="numberM">{formatLoad(r.load)}</Text>
            <Text variant="footnote" tone="inkMuted">
              {`AU · ${windowLabel(r)}`}
            </Text>
          </View>
          <Text variant="subhead" tone="inkSecondary">
            {`Toparlanıyor: ${regionSessionsText(r)}, ${typicalText(r)}.`}
          </Text>
        </>
      ) : (
        <Text variant="subhead" tone="inkSecondary">
          {`Son ${r.windowHours} saatte çalışmadı. Son yüklenme: ${lastLoadedText(r)}.`}
        </Text>
      )}
    </Card>
  );
}

function PainNotes({ view }: { view: RegionLoadView }) {
  const palette = usePalette();
  return (
    <>
      <SectionHead title="Ağrı izleme" explain="painMonitoring" />
      <Card style={styles.listCard}>
        {view.notes.map((n, i) => (
          <View
            key={spotKey(n)}
            accessible
            accessibilityLabel={`${regionEstimateLabel}. ${spotName(n)}: ${painNoteText(n)}`}
            style={[styles.noteRow, i > 0 && { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.cardTitle}>
              <Text variant="rowLabel">{spotName(n)}</Text>
              <EstimateBadge />
            </View>
            <Text variant="footnoteRegular" tone="inkSecondary">
              {painNoteText(n)}
            </Text>
          </View>
        ))}
      </Card>
      <Text variant="captionRegular" tone="inkMuted" style={styles.note}>
        {painNoteFooter}
      </Text>
    </>
  );
}

function SectionHead({ title, explain }: { title: string; explain: 'regionLoad' | 'painMonitoring' }) {
  return (
    <View style={styles.sectionHead}>
      <GroupLabel>{title}</GroupLabel>
      <ExplainButton id={explain} style={styles.sectionInfo} />
    </View>
  );
}

function EstimateBadge() {
  const palette = usePalette();
  return (
    <View style={[styles.badge, { backgroundColor: palette.track }]}>
      <Text variant="caption2Strong" tone="inkSecondary">
        {regionEstimateLabel}
      </Text>
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Seçimi kapat"
      hitSlop={spacing[2]}
      style={({ pressed }) => [styles.close, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
      <Icon name="close" color={palette.inkSecondary} size={14} strokeWidth={2.2} />
    </Pressable>
  );
}

function PainLegend({ colors }: { colors: BodyColors }) {
  return (
    <View style={styles.legend} accessible accessibilityLabel="Renk ölçeği: açık 1, koyu 10">
      <Text variant="caption2" tone="inkMuted">
        1
      </Text>
      <Svg width={64} height={8}>
        <Defs>
          <LinearGradient id="body-pain-scale" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.painLow} />
            <Stop offset="1" stopColor={colors.painHigh} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" rx={4} fill="url(#body-pain-scale)" />
      </Svg>
      <Text variant="caption2" tone="inkMuted">
        10
      </Text>
    </View>
  );
}

function SwatchLegend({ color, label }: { color: Hex; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="caption2" tone="inkMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filter: { marginTop: spacing[3], paddingHorizontal: layout.screenInset, gap: spacing[2.5] },
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: 36 },
  windowText: { flex: 1 },
  legendRow: {
    marginTop: spacing[2],
    paddingHorizontal: layout.screenInset,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  listCard: { paddingVertical: spacing[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
  },
  rowLabel: { flex: 1 },
  rowText: { flex: 1, gap: spacing[0.5] },
  noteRow: { paddingVertical: spacing[3], gap: spacing[1] },
  swatch: { width: 10, height: 10, borderRadius: radius.full },
  empty: { paddingVertical: spacing[3] },
  note: { marginTop: spacing[3], paddingHorizontal: layout.screenInset },
  pressed: { opacity: 0.6 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: layout.screenInset,
  },
  sectionInfo: { marginTop: spacing[3] },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  regionValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1.5],
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] },
  day: { alignItems: 'center', gap: spacing[1] },
  dayValue: {
    minWidth: 34,
    height: 28,
    paddingHorizontal: spacing[2],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
