// Bugün ekranının beslenme, öğün, su ve ter testi bölümleri (karar 0029, 0030, 0031). Sayılar motordan
// (packages/engine), metinler copy/nutrition'dan; burada yalnız yerleşim. Hedef rehber aralık, kayıtlı alım tahmin.
// Renk yalnız kategori (karbonhidrat / protein / su); risk rengi ve uyarı yok.

import { dayTypes, sweatTest, type DayType } from '@hooplab/engine';
import { layout, radius, size, spacing, withAlpha, type Nutrient } from '@hooplab/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip, ChipSet } from '@/components/chip';
import { Icon, type IconName } from '@/components/icon';
import { ExplainButton } from '@/components/info-button';
import { GroupLabel, ListGroup, ListRow } from '@/components/list';
import { NutrientRing } from '@/components/nutrient-ring';
import { SwipeDelete } from '@/components/swipe-delete';
import { Text } from '@/components/text';
import { sessionKindLabels } from '@/copy/labels';
import {
  carbsRing,
  dayTypeLabels,
  dayTypeNote,
  fluidTargetText,
  intakeFooter,
  mealDetail,
  mealSlotLabels,
  mealsSummary,
  mealValue,
  nutrientLabels,
  nutritionFooter,
  proteinRing,
  sweatGainNote,
  sweatLossNote,
  sweatLossText,
  waterRing,
  weightDetail,
  weightValue,
  type RingText,
} from '@/copy/nutrition';
import type { TrainingSession } from '@/data/daily-log';
import type { NutritionView } from '@/data/nutrition-view';
import { usePalette } from '@/theme/appearance';

function SectionHead({ title, explain }: { title: string; explain: 'nutrition' | 'sweatTest' }) {
  return (
    <View style={styles.sectionHead}>
      <GroupLabel>{title}</GroupLabel>
      <ExplainButton id={explain} style={styles.sectionInfo} />
    </View>
  );
}

function RingColumn({
  nutrient,
  text,
  unit,
  amount,
  range,
  onPress,
}: {
  nutrient: Nutrient;
  text: RingText;
  unit: string;
  amount: number;
  range: readonly [number, number] | null;
  onPress?: () => void;
}) {
  const palette = usePalette();
  const body = (
    <>
      <NutrientRing
        nutrient={nutrient}
        value={text.value}
        unit={unit}
        amount={amount}
        range={range}
        icon={nutrient === 'water' ? <Icon name="drop" color={palette.nutrient.water} size={14} strokeWidth={2.2} /> : undefined}
      />
      <Text variant="footnote" style={styles.ringLabel}>
        {nutrientLabels[nutrient]}
      </Text>
      <Text variant="caption2" tone="inkMuted" style={styles.ringCaption}>
        {text.target}
      </Text>
      {text.position ? (
        <Text variant="caption2" tone="inkSecondary" style={styles.ringCaption}>
          {text.position}
        </Text>
      ) : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.ringCol} accessible accessibilityLabel={text.label}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text.label}
      accessibilityHint="Su kaydını açar"
      style={({ pressed }) => [styles.ringCol, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

function QuickAdd({ nutrient, icon, label, onPress }: { nutrient: Nutrient; icon: IconName; label: string; onPress: () => void }) {
  const palette = usePalette();
  const color = palette.nutrient[nutrient];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ekle`}
      style={({ pressed }) => [styles.quick, { backgroundColor: withAlpha(color, 0.12) }, pressed && styles.pressed]}>
      <Icon name={icon} color={color} size={18} strokeWidth={2.2} />
      <Text variant="subhead">{label}</Text>
    </Pressable>
  );
}

interface NutritionSectionProps {
  view: NutritionView;
  onDayType: (dayType: DayType | null) => void;
  onDeleteMeal: (id: string) => void;
  /** Bugünkü ter testinin seans sonrası sıvı hedefi (L); yoksa null. */
  sweatFluidL: readonly [number, number] | null;
}

/** Halkalar (karbonhidrat, protein, su), hızlı ekleme, gün tipi; katlanır öğün listesi ve sabah kilosu. */
export function NutritionSection({ view, onDayType, onDeleteMeal, sweatFluidL }: NutritionSectionProps) {
  const palette = usePalette();
  const [open, setOpen] = useState(false);
  const t = view.targets;
  const i = view.intake;
  // Kayıtlardan çıkan tipe dokunmak düzeltmeyi kaldırır.
  const choose = (d: DayType) => onDayType(d === view.inferred ? null : d);
  return (
    <>
      <SectionHead title="Beslenme · bugün" explain="nutrition" />
      <Card>
        <View style={styles.rings}>
          <RingColumn nutrient="carbs" text={carbsRing(i, t)} unit="g" amount={i.carbsG} range={t.carbsG} />
          <RingColumn nutrient="protein" text={proteinRing(i, t)} unit="g" amount={i.proteinG} range={t.proteinG} />
          <RingColumn
            nutrient="water"
            text={waterRing(view.fluidL, sweatFluidL)}
            unit="L"
            amount={view.fluidL}
            range={null}
            onPress={() => router.push('/water')}
          />
        </View>
        <View style={styles.quickRow}>
          <QuickAdd nutrient="carbs" icon="meal" label="Öğün" onPress={() => router.push('/meal-new')} />
          <QuickAdd nutrient="water" icon="drop" label="Su" onPress={() => router.push('/water')} />
        </View>
        <View style={[styles.dayRow, { borderTopColor: palette.line }]}>
          <ChipSet label="Gün tipi">
            {dayTypes.map((d) => (
              <Chip key={d} label={dayTypeLabels[d]} selected={view.dayType === d} onPress={() => choose(d)} />
            ))}
          </ChipSet>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {dayTypeNote(view.dayType, view.inferred, view.override)}
          </Text>
        </View>
      </Card>
      <View style={styles.listGap} />
      <ListGroup footer={i.meals > 0 ? intakeFooter(i) : nutritionFooter}>
        <ListRow
          label="Öğünler"
          detail={mealsSummary(i)}
          value={i.meals === 0 ? 'Ekle' : open ? 'Gizle' : 'Göster'}
          onPress={i.meals === 0 ? () => router.push('/meal-new') : () => setOpen((o) => !o)}
          {...(i.meals > 0 ? { expanded: open } : {})}
        />
        {open
          ? view.meals.map((m) => (
              <SwipeDelete key={m.id} label={mealSlotLabels[m.slot]} onDelete={() => onDeleteMeal(m.id)}>
                <ListRow
                  label={mealSlotLabels[m.slot]}
                  detail={mealDetail(m, t)}
                  value={mealValue(m)}
                  onPress={() => router.push({ pathname: '/meal-new', params: { id: m.id } })}
                />
              </SwipeDelete>
            ))
          : null}
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
  dayRow: { marginTop: spacing[4], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth },
  rings: { flexDirection: 'row', justifyContent: 'space-between' },
  ringCol: { flex: 1, alignItems: 'center' },
  ringLabel: { marginTop: spacing[2] },
  ringCaption: { textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: spacing[2.5], marginTop: spacing[4] },
  quick: {
    flex: 1,
    height: size.hitTarget,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
  },
  listGap: { height: spacing[3] },
  pressed: { opacity: 0.6 },
  result: { marginTop: spacing[1] },
});
