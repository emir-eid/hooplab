// Bugün ekranının beslenme ve ter testi bölümleri (karar 0029). Sayılar motordan (packages/engine),
// metinler copy/nutrition'dan; burada yalnız yerleşim. Hedef rehber aralık; renk ve risk dili yok.

import { dayTypes, sweatTest, type DayType } from '@hooplab/engine';
import { layout, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip, ChipSet } from '@/components/chip';
import { ExplainButton } from '@/components/info-button';
import { GroupLabel, ListGroup, ListRow } from '@/components/list';
import { Text } from '@/components/text';
import { sessionKindLabels } from '@/copy/labels';
import {
  carbsDetail,
  carbsValue,
  dayTypeLabels,
  dayTypeNote,
  fluidTargetText,
  nutritionFooter,
  proteinDetail,
  proteinValue,
  sweatGainNote,
  sweatLossNote,
  sweatLossText,
  weightDetail,
  weightValue,
} from '@/copy/nutrition';
import type { TrainingSession } from '@/data/daily-log';
import type { NutritionView } from '@/data/nutrition-view';

function SectionHead({ title, explain }: { title: string; explain: 'nutrition' | 'sweatTest' }) {
  return (
    <View style={styles.sectionHead}>
      <GroupLabel>{title}</GroupLabel>
      <ExplainButton id={explain} style={styles.sectionInfo} />
    </View>
  );
}

/** Gün tipi çipleri ve günün karbonhidrat / protein hedefi; sabah kilosu satırı kilo formunu açar. */
export function NutritionSection({ view, onDayType }: { view: NutritionView; onDayType: (dayType: DayType | null) => void }) {
  const t = view.targets;
  // Kayıtlardan çıkan tipe dokunmak düzeltmeyi kaldırır.
  const choose = (d: DayType) => onDayType(d === view.inferred ? null : d);
  return (
    <>
      <SectionHead title="Beslenme · bugün" explain="nutrition" />
      <ListGroup footer={nutritionFooter}>
        <View style={styles.dayRow}>
          <ChipSet label="Gün tipi">
            {dayTypes.map((d) => (
              <Chip key={d} label={dayTypeLabels[d]} selected={view.dayType === d} onPress={() => choose(d)} />
            ))}
          </ChipSet>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {dayTypeNote(view.dayType, view.inferred, view.override)}
          </Text>
        </View>
        <ListRow label="Karbonhidrat" detail={carbsDetail(t)} value={carbsValue(t)} />
        <ListRow label="Protein" detail={proteinDetail(t)} value={proteinValue(t)} />
        <ListRow
          label="Sabah kilosu"
          detail={weightDetail(view.weight, view.todayWeight)}
          value={weightValue(view.weight)}
          onPress={() => router.push('/weight')}
        />
      </ListGroup>
    </>
  );
}

/** Bugün ve dün yapılan ter testleri: kayıp, ter oranı, notlar ve sıvı hedefi. */
export function SweatResults({ sessions, today }: { sessions: readonly TrainingSession[]; today: string }) {
  const tested = sessions
    .map((s) => ({ s, r: s.sweat ? sweatTest({ ...s.sweat, urineL: s.sweat.urineL ?? 0, durationMin: s.durationMin }) : null }))
    .filter((x): x is { s: TrainingSession; r: NonNullable<typeof x.r> } => x.r !== null);
  if (tested.length === 0) return null;
  return (
    <>
      <SectionHead title="Ter testi" explain="sweatTest" />
      {tested.map(({ s, r }) => {
        const fluid = fluidTargetText(r);
        return (
          <Card key={s.id}>
            <Text variant="footnote" tone="inkMuted">
              {`${sessionKindLabels[s.kind]} · ${s.localDate === today ? 'bugün' : 'dün'} · ${s.durationMin} dk`}
            </Text>
            <Text variant="callout" style={styles.result}>
              {sweatLossText(r)}
            </Text>
            {r.lossNote ? (
              <Text variant="footnoteRegular" tone="inkSecondary" style={styles.note}>
                {sweatLossNote}
              </Text>
            ) : null}
            {r.gainNote ? (
              <Text variant="footnoteRegular" tone="inkSecondary" style={styles.note}>
                {sweatGainNote}
              </Text>
            ) : null}
            {fluid ? (
              <Text variant="footnoteRegular" tone="inkSecondary" style={styles.note}>
                {fluid}
              </Text>
            ) : null}
          </Card>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: layout.screenInset,
  },
  sectionInfo: { marginTop: spacing[3] },
  note: { marginTop: spacing[1.5] },
  dayRow: { paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  result: { marginTop: spacing[1] },
});
