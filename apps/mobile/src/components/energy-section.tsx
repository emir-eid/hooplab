// Bugün'de "Yakılan enerji" kartı (karar 0043): bilekliğin günlük toplamı, bugün şu ana kadar; dün ve 7 gün ortalaması
// etiketli satırlarda (karar 0042 düzeni). Saatlik veri varsa kartın içinde saatlik grafik (karar 0044): dokunarak
// saat seçilir, oklarla geriye günler gezilir; başlık seçili saati, sağda günün toplamını gösterir. Tahmin: eşik,
// hedef ve durum rengi yok; alımla yan yana konmaz.

import { layout, radius, spacing } from '@hooplab/theme';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { EnergyHourChart } from '@/components/energy-hour-chart';
import { Icon } from '@/components/icon';
import { ExplainButton } from '@/components/info-button';
import { Tile } from '@/components/recovery-section';
import { Text } from '@/components/text';
import {
  averageLabel,
  dayNote,
  energyChartHint,
  energyChartSpoken,
  energyDayLabel,
  energyNote,
  energyPageRows,
  energyRows,
  energyTitle,
  formatKcal,
  hourNote,
  hourRange,
  kcal as kcalText,
} from '@/copy/energy';
import type { EnergyView } from '@/data/energy-view';
import { usePalette } from '@/theme/appearance';

const dash = '–';

export function EnergyCard({ view, today }: { view: EnergyView; today: string }) {
  if (view.days.length === 0) return <EnergyTile view={view} />;
  return <EnergyChartCard view={view} today={today} />;
}

/** Saatlik veri yokken (ör. senkron henüz çalışmadı): yalnız günlük değerler. */
function EnergyTile({ view }: { view: EnergyView }) {
  const { reading } = view;
  return (
    <View style={styles.grid}>
      <Tile
        label={energyTitle}
        explain="energy"
        value={reading.today === null ? dash : formatKcal(reading.today)}
        unit="kcal"
        note={energyNote(reading, view.updatedAt)}
        rows={energyRows(reading)}
        pageRows={energyPageRows(reading)}
        flagged={false}
        state={null}
        wide
      />
    </View>
  );
}

function EnergyChartCard({ view, today }: { view: EnergyView; today: string }) {
  const { reading, days } = view;
  const [dayIndex, setDayIndex] = useState(days.length - 1);
  const [hour, setHour] = useState<number | null>(null);
  const day = days[Math.min(dayIndex, days.length - 1)]!;
  const isToday = day.date === today;
  const selectedValue = hour !== null ? day.hours[hour] ?? null : null;
  const max = Math.max(...days.flatMap((d) => d.hours.filter((v): v is number => v !== null)), 1);

  const goTo = (i: number) => {
    setHour(null);
    setDayIndex(i);
  };

  // Sağ sütun: saat seçiliyken günün toplamı; bugünde dün ve ortalama; geçmiş günde ortalama.
  const right =
    hour !== null
      ? [{ label: isToday ? 'Bugün şu ana kadar' : 'Günün toplamı', value: kcalText(day.total) }]
      : isToday
        ? energyRows(reading)
        : [{ label: averageLabel(reading.averageN), value: kcalText(reading.average) }];

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headLeft} accessibilityLiveRegion="polite">
          <View style={styles.titleRow}>
            <Text variant="footnote" tone="inkSecondary">
              {hour !== null ? hourRange(hour) : energyTitle}
            </Text>
            <ExplainButton
              id="energy"
              value={reading.today === null ? undefined : `${formatKcal(reading.today)} kcal`}
              rows={energyPageRows(reading)}
            />
          </View>
          <View style={styles.valueRow}>
            <Text variant="metric">
              {hour !== null
                ? selectedValue === null
                  ? dash
                  : formatKcal(selectedValue)
                : day.total === null
                  ? dash
                  : formatKcal(day.total)}
            </Text>
            <Text variant="footnote" tone="inkMuted">
              kcal
            </Text>
          </View>
          <Text variant="caption" tone="inkMuted">
            {hour !== null ? hourNote(isToday && hour === day.partialHour) : dayNote(day, today, reading, view.updatedAt)}
          </Text>
        </View>
        <View style={styles.headRight}>
          {right.map((r) => (
            <Text key={r.label} variant="caption" tone="inkMuted" style={styles.rightText}>
              {`${r.label} ${r.value}`}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.dayNav}>
        <DayArrow direction="back" enabled={dayIndex > 0} onPress={() => goTo(dayIndex - 1)} />
        <Text variant="footnoteMedium" tone="inkSecondary" style={styles.dayLabel}>
          {energyDayLabel(day.date, today)}
        </Text>
        <DayArrow direction="forward" enabled={dayIndex < days.length - 1} onPress={() => goTo(dayIndex + 1)} />
      </View>

      <EnergyHourChart
        hours={day.hours}
        max={max}
        partialHour={day.partialHour}
        selected={hour}
        onSelect={setHour}
        accessibilityLabel={energyChartSpoken(day, today)}
      />
      <Text variant="caption2" tone="inkMuted" style={styles.hint}>
        {energyChartHint}
      </Text>
    </Card>
  );
}

function DayArrow({ direction, enabled, onPress }: { direction: 'back' | 'forward'; enabled: boolean; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      hitSlop={spacing[2]}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Önceki gün' : 'Sonraki gün'}
      accessibilityState={{ disabled: !enabled }}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: palette.band, opacity: enabled ? 1 : 0.35 },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={direction === 'back' ? 'chevronBack' : 'chevron'} color={palette.ink} size={16} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    marginHorizontal: layout.cardInset,
    marginTop: layout.cardGap,
  },
  card: { paddingHorizontal: spacing[3] },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingHorizontal: spacing[1],
  },
  headLeft: { flex: 1 },
  headRight: { alignItems: 'flex-end', flexShrink: 0 },
  rightText: { textAlign: 'right' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[1], marginTop: spacing[2] },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingHorizontal: spacing[1],
  },
  dayLabel: { flex: 1, textAlign: 'center' },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  hint: { paddingHorizontal: spacing[1], marginTop: spacing[1.5] },
});
