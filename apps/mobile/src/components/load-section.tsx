// Antrenman yükü bölümleri (karar 0025): Trend'de ayrıntı, Bugün'de yalnız oran 1,5'i geçince tek satırlık not.
// Sayılar motordan (packages/engine), metinler copy/training-load'dan; burada yalnız yerleşim. Risk rengi yok;
// renk yalnız seans türünü gösterir ve her zaman yanında adı ve değeri yazar (karar 0026).

import { layout, loadGroups, radius, spacing, type LoadGroup } from '@hooplab/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ExplainButton } from '@/components/info-button';
import { GroupLabel, ListGroup, ListRow } from '@/components/list';
import { LoadChart } from '@/components/load-chart';
import { Tile } from '@/components/recovery-section';
import { Text } from '@/components/text';
import { formatDecimal } from '@/copy/recovery';
import {
  averagePendingNote,
  averageWeeksLabel,
  averageWindowNote,
  estimateLabel,
  formatChange,
  formatLoad,
  formatRatio,
  lastWeekLabel,
  lastWeekLegend,
  loadGroupLabels,
  loadMethodNote,
  loadSectionNote,
  monotonyEmpty,
  monotonyNote,
  previousWeekEmpty,
  previousWeekLabel,
  ratioNote,
  spikeBody,
  spikeTitle,
  strainNote,
  untaggedDetail,
  untaggedLabel,
  weekPartsLabel,
} from '@/copy/training-load';
import type { LoadParts, TrainingLoadView } from '@/data/training-load-view';
import { usePalette } from '@/theme/appearance';
import { formatShortDate } from '@/utils/format-date';

const dash = '–';

/** Renk karesi + tür adı + değer. Değer metin renginde; renk yalnız karede (dataviz). */
function GroupValue({ group, value }: { group: LoadGroup; value: number }) {
  const palette = usePalette();
  return (
    <View style={styles.groupValue}>
      <View style={[styles.swatch, { backgroundColor: palette.loadGroup[group] }]} />
      <Text variant="caption" tone="inkSecondary">
        {loadGroupLabels[group]}
      </Text>
      <Text variant="caption" tone="inkMuted">
        {formatLoad(value)}
      </Text>
    </View>
  );
}

const present = (parts: LoadParts): LoadGroup[] => loadGroups.filter((g) => parts[g] > 0);

function openTagging(view: TrainingLoadView) {
  const next = view.untagged[0];
  if (next) router.push({ pathname: '/session-new', params: { exercise: next.id } });
}

/** Bugün: oran 1,5 ve üstündeyse tek satır; dokununca Trend. Değilse hiçbir şey. */
export function LoadSpikeRow({ view }: { view: TrainingLoadView }) {
  if (!view.reading.spike) return null;
  return (
    <ListGroup footer={`${estimateLabel}: sakatlık riski değil, yalnız ani bir artış.`}>
      <ListRow label={spikeTitle} detail="Antrenman yükü · ayrıntı Trend'de" onPress={() => router.push('/trend')} />
    </ListGroup>
  );
}

/** Trend: not, etiketsiz oturumlar, 28 günlük grafik, dört kart ve yöntem notu. */
export function TrainingLoadSection({ view }: { view: TrainingLoadView }) {
  const palette = usePalette();
  const r = view.reading;
  const [selected, setSelected] = useState<number | null>(null);
  const day = selected !== null ? view.chart[selected] : undefined;

  if (view.empty) {
    return (
      <>
        <GroupLabel>Antrenman yükü</GroupLabel>
        <Card>
          <Text variant="bodyCompact">Henüz seans kaydı yok. Seans kaydettikçe günlük ve haftalık yük burada birikir.</Text>
        </Card>
        {view.untagged.length > 0 ? (
          <ListGroup footer={untaggedDetail}>
            <ListRow label={untaggedLabel(view.untagged.length)} value="Etiketle" onPress={() => openTagging(view)} />
          </ListGroup>
        ) : null}
      </>
    );
  }

  const weekValue = r.week === null ? dash : formatLoad(r.week);

  return (
    <>
      <View style={styles.sectionHead}>
        <GroupLabel>Antrenman yükü</GroupLabel>
        <Text variant="caption" tone="inkMuted" style={styles.sectionNote}>
          {loadSectionNote}
        </Text>
      </View>

      {r.spike ? (
        <Card>
          <View style={[styles.badge, { backgroundColor: palette.track }]}>
            <Text variant="caption2Strong" tone="inkSecondary">
              {estimateLabel}
            </Text>
          </View>
          <Text variant="callout" style={styles.spikeTitle}>
            {spikeTitle}
          </Text>
          <Text variant="footnoteRegular" tone="inkSecondary">
            {spikeBody}
          </Text>
        </Card>
      ) : null}

      {view.untagged.length > 0 ? (
        <ListGroup footer={untaggedDetail}>
          <ListRow label={untaggedLabel(view.untagged.length)} value="Etiketle" onPress={() => openTagging(view)} />
        </ListGroup>
      ) : null}

      <Card style={styles.chartCard}>
        <View style={styles.chartHead}>
          <View accessibilityLiveRegion="polite">
            <View style={styles.titleRow}>
              <Text variant="footnote" tone="inkSecondary">
                {day ? formatShortDate(day.date) : lastWeekLabel}
              </Text>
              <ExplainButton id="loadChart" value={r.week === null ? undefined : `${weekValue} AU`} />
            </View>
            <View style={styles.valueRow}>
              <Text variant="metric">{day ? (day.load === null ? dash : formatLoad(day.load)) : weekValue}</Text>
              <Text variant="footnote" tone="inkMuted">
                AU
              </Text>
            </View>
          </View>
          <View style={styles.chartHeadRight}>
            {day ? (
              day.load === null || day.load === 0 ? (
                <Text variant="caption" tone="inkMuted">
                  {day.load === null ? 'kayıt öncesi' : 'seans yok'}
                </Text>
              ) : (
                present(day.parts).map((g) => <GroupValue key={g} group={g} value={day.parts[g]} />)
              )
            ) : (
              <>
                <Text variant="caption" tone="inkMuted">
                  {r.previousWeek === null ? previousWeekEmpty : `${previousWeekLabel} ${formatLoad(r.previousWeek)}`}
                </Text>
                {r.weekChange !== null ? (
                  <Text variant="caption" tone="inkMuted">
                    {`değişim ${formatChange(r.weekChange)}`}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </View>
        <LoadChart
          days={view.chart}
          reference={r.ratio !== null ? r.chronic : null}
          selected={selected}
          onSelect={setSelected}
          accessibilityLabel={`Antrenman yükü, son ${view.chart.length} gün. ${lastWeekLabel} ${weekValue} AU${r.ratio !== null ? `, alıştığın seviyenin ${formatDecimal(r.ratio)} katı` : ''}.`}
        />
        <View style={styles.groups} accessibilityLabel={weekPartsLabel}>
          {loadGroups.map((g) => (
            <GroupValue key={g} group={g} value={view.weekParts[g]} />
          ))}
        </View>
        <View style={styles.legend}>
          <Text variant="caption2" tone="inkMuted">
            {lastWeekLegend}
          </Text>
          {r.ratio !== null ? (
            <Text variant="caption2" tone="inkMuted">
              Kesikli: alıştığın günlük yük
            </Text>
          ) : null}
        </View>
      </Card>

      <View style={styles.grid}>
        <Tile
          label="Alıştığına göre"
          explain="ratio"
          value={r.ratio === null ? dash : formatRatio(r.ratio)}
          unit=""
          note={ratioNote(r)}
          flagged={false}
          state={null}
        />
        <Tile
          label={averageWeeksLabel}
          explain="weeklyAverage"
          value={r.weeklyAverage === null ? dash : formatLoad(r.weeklyAverage)}
          unit="AU/hafta"
          note={r.weeklyAverage === null ? averagePendingNote : averageWindowNote}
          flagged={false}
          state={null}
        />
        <Tile
          label="Monotonluk"
          explain="monotony"
          value={r.monotony === null ? dash : formatDecimal(r.monotony)}
          unit=""
          note={r.monotony === null ? monotonyEmpty : monotonyNote}
          flagged={false}
          state={null}
        />
        <Tile
          label="Gerilim"
          explain="strain"
          value={r.strain === null ? dash : formatLoad(r.strain)}
          unit="AU"
          note={strainNote}
          flagged={false}
          state={null}
        />
      </View>

      <Text variant="footnoteRegular" tone="inkMuted" style={styles.method}>
        {loadMethodNote}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionNote: { marginRight: layout.screenInset },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  spikeTitle: { marginTop: spacing[2], marginBottom: spacing[1] },
  chartCard: { paddingHorizontal: spacing[3] },
  chartHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[1],
  },
  chartHeadRight: { alignItems: 'flex-end' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  groups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing[4],
    rowGap: spacing[1],
    paddingHorizontal: spacing[1],
    marginTop: spacing[3],
  },
  groupValue: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingHorizontal: spacing[1],
    marginTop: spacing[1.5],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.gridGap,
    marginHorizontal: layout.cardInset,
    marginTop: layout.cardGap,
  },
  method: {
    marginTop: spacing[3],
    marginHorizontal: layout.screenInset,
  },
});
