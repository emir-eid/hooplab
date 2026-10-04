// Vücut (karar 0018): döndürülebilir manken üzerinde ağrı haritası; 1 gün / 3 gün / 1 hafta.
// 1 gün: bugünün ağrısı renk ölçeğiyle. 3 gün / 1 hafta: değerler birleştirilmez, ağrı girilen bölgeler
// işaretlenir ve gün gün yazılır. Seansların bölgelere etkisi (tahmin) Faz 2'de kas / tendon modeliyle gelir.

import { spotKey, type BodySpot } from '@hooplab/engine';
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
import { GroupLabel } from '@/components/list';
import { PageHeader } from '@/components/page-header';
import { useTabBarSpace } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { regionLabels, sideLabels } from '@/copy/labels';
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
import { usePalette } from '@/theme/appearance';
import { formatShortDay } from '@/utils/format-date';

const windowLabels: Record<BodyWindow, string> = { 1: '1 gün', 3: '3 gün', 7: '1 hafta' };
const BODY_HEIGHT = 440;

export default function BodyScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const colors = useMemo(() => bodyColors(palette), [palette]);

  const [range, setRange] = useState<BodyWindow>(1);
  const [history, setHistory] = useState<PainHistory | null>(null);
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

  const single = range === 1;
  const today = history ? latestPainMap(history) : null;
  const marked = useMemo(() => (history ? spotsWithPain(history) : []), [history]);
  const paint = useMemo(() => paintFor(colors, single, history, marked), [colors, single, history, marked]);

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
        <ChipSet label="Aralık">
          {bodyWindows.map((w) => (
            <Chip key={w} label={windowLabels[w]} selected={range === w} onPress={() => setRange(w)} />
          ))}
        </ChipSet>
      </View>

      <BodyView
        colors={colors}
        paint={paint}
        selected={selected}
        onSelect={(spot) => select(spot, false)}
        focus={focus}
        height={BODY_HEIGHT}
        accessibilityLabel={
          marked.length > 0
            ? `Vücut modeli. Ağrı girilen bölgeler aşağıda listeleniyor.`
            : 'Vücut modeli. Bu aralıkta ağrı girilmedi.'
        }
      />

      <View style={styles.legendRow}>
        {single ? <PainLegend colors={colors} /> : <MarkLegend colors={colors} />}
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

      {selected && history ? (
        <SpotCard spot={selected} history={history} single={single} colors={colors} onClose={() => setSelected(null)} />
      ) : null}

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
        Ağrı haritası senin girdiğin değerlerdir, teşhis değildir. Seansların bölgelere etkisi (tahmin) kas ve tendon
        modeliyle eklenecek.
      </Text>
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

function spotName({ region, side }: BodySpot): string {
  return side === 'center' ? regionLabels[region] : `${regionLabels[region]} · ${sideLabels[side].toLocaleLowerCase('tr')}`;
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
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Seçimi kapat"
          hitSlop={spacing[2]}
          style={({ pressed }) => [styles.close, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
          <Icon name="close" color={palette.inkSecondary} size={14} strokeWidth={2.2} />
        </Pressable>
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

function MarkLegend({ colors }: { colors: BodyColors }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.swatch, { backgroundColor: colors.marked }]} />
      <Text variant="caption2" tone="inkMuted">
        Ağrı girilen bölge
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filter: { marginTop: spacing[3], paddingHorizontal: layout.screenInset },
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
  swatch: { width: 10, height: 10, borderRadius: radius.full },
  empty: { paddingVertical: spacing[3] },
  note: { marginTop: spacing[3], paddingHorizontal: layout.screenInset },
  pressed: { opacity: 0.6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
