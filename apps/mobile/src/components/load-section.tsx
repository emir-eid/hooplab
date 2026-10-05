// Antrenman yükü bölümleri (karar 0025): Trend'de ayrıntı, Bugün'de yalnız oran 1,5'i geçince tek satırlık not.
// Sayılar motordan (packages/engine), metinler copy/training-load'dan; burada yalnız yerleşim. Risk rengi yok.

import { layout, radius, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { GroupLabel, ListGroup, ListRow } from '@/components/list';
import { LoadChart } from '@/components/load-chart';
import { Tile } from '@/components/recovery-section';
import { Text } from '@/components/text';
import { formatDecimal } from '@/copy/recovery';
import {
  estimateLabel,
  formatChange,
  formatLoad,
  formatRatio,
  loadMethodNote,
  monotonyNote,
  ratioNote,
  spikeBody,
  spikeTitle,
  strainNote,
  untaggedDetail,
  untaggedLabel,
} from '@/copy/training-load';
import type { TrainingLoadView } from '@/data/training-load-view';
import { usePalette } from '@/theme/appearance';
import { formatShortDate } from '@/utils/format-date';

const dash = '–';

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
          RPE × dakika · 4 hafta
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
            <Text variant="footnote" tone="inkSecondary">
              {day ? formatShortDate(day.date) : 'Son 7 gün'}
            </Text>
            <View style={styles.valueRow}>
              <Text variant="metric">{day ? (day.load === null ? dash : formatLoad(day.load)) : weekValue}</Text>
              <Text variant="footnote" tone="inkMuted">
                AU
              </Text>
            </View>
          </View>
          <View style={styles.chartHeadRight}>
            {day ? (
              <Text variant="caption" tone="inkMuted">
                {day.load === null ? 'kayıt öncesi' : 'günlük yük'}
              </Text>
            ) : (
              <>
                <Text variant="caption" tone="inkMuted">
                  {r.previousWeek === null ? 'önceki 7 gün: kayıt az' : `önceki 7 gün ${formatLoad(r.previousWeek)}`}
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
          accessibilityLabel={`Antrenman yükü, son ${view.chart.length} gün. Son 7 gün ${weekValue} AU${r.ratio !== null ? `, alıştığın seviyenin ${formatDecimal(r.ratio)} katı` : ''}.`}
        />
        <View style={styles.legend}>
          <Text variant="caption2" tone="inkMuted">
            Belirgin: son 7 gün
          </Text>
          <Text variant="caption2" tone="inkMuted">
            Soluk: öncesi
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
          value={r.ratio === null ? dash : formatRatio(r.ratio)}
          unit=""
          note={ratioNote(r)}
          flagged={false}
          state={null}
        />
        <Tile
          label="4 hafta ort."
          value={r.weeklyAverage === null ? dash : formatLoad(r.weeklyAverage)}
          unit="AU/hafta"
          note={r.weeklyAverage === null ? '28 günlük kayıttan sonra' : 'son 28 gün / 4'}
          flagged={false}
          state={null}
        />
        <Tile
          label="Monotonluk"
          value={r.monotony === null ? dash : formatDecimal(r.monotony)}
          unit=""
          note={r.monotony === null ? 'son 7 günde değişim yok veya kayıt az' : monotonyNote}
          flagged={false}
          state={null}
        />
        <Tile
          label="Gerilim"
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
