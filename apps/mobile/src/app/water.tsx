// Su kaydı (karar 0031, rules/hidrasyon.json → sivi-alim-kaydi): hızlı ekleme 250 / 500 / 750 mL ya da elle mL;
// bugünün içişleri kaydırarak silinir. Hedef yok; ter testi yapılan gün seans sonrası hedef yanında yazar.
// İçişler kişisel veridir: yalnız Supabase'de ya da demoda bellekte.

import { fluidEntryLimits, fluidQuickAddMl, isValidFluidMl, sweatTest } from '@hooplab/engine';
import { layout, radius, size, spacing, withAlpha } from '@hooplab/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/list';
import { SwipeDelete } from '@/components/swipe-delete';
import { Text } from '@/components/text';
import { TextFieldRow } from '@/components/text-field';
import { formatDecimal } from '@/copy/recovery';
import { fluidEntryText, fluidTargetText, waterNote } from '@/copy/nutrition';
import { fetchSessions } from '@/data/daily-log';
import { addFluid, deleteFluid, fetchNutrition } from '@/data/nutrition';
import type { FluidEntry } from '@/data/nutrition-view';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

function clock(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function WaterScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const [today] = useState(() => toLocalDate(new Date()));
  const [entries, setEntries] = useState<FluidEntry[]>([]);
  const [liters, setLiters] = useState(0);
  const [sweatNote, setSweatNote] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetchNutrition(today);
    if (!r.ok) return setError(r.message);
    setEntries(r.value.fluids);
    setLiters(r.value.fluidL);
    setError(null);
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      void load();
      // Bugünkü ter testinin sıvı hedefi (varsa); alınamazsa not görünmez.
      void fetchSessions(today).then((r) => {
        if (!r.ok) return;
        const tested = r.value
          .map((s) => (s.sweat ? sweatTest({ ...s.sweat, urineL: s.sweat.urineL ?? 0, durationMin: s.durationMin }) : null))
          .find((x) => x?.shortRecoveryFluidL);
        setSweatNote(tested ? fluidTargetText(tested) : null);
      });
    }, [load, today]),
  );

  async function add(ml: number) {
    const r = await addFluid(today, ml);
    if (!r.ok) return setError(r.message);
    await load();
  }

  async function remove(id: string) {
    const r = await deleteFluid(id);
    if (!r.ok) return setError(r.message);
    await load();
  }

  const customMl = custom.trim() === '' ? null : Number(custom.trim());
  const customValid = customMl !== null && isValidFluidMl(customMl);

  async function addCustom() {
    if (!customValid || customMl === null) return;
    await add(customMl);
    setCustom('');
  }

  const water = palette.nutrient.water;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader title="Su" subtitle="Dokun, eklensin. Yanlış eklediysen bugünün listesinde sola kaydırıp sil." />

        <FormBlock title="Bugün" note={`${formatDecimal(liters, 1)} L`}>
          <View style={styles.quickRow}>
            {fluidQuickAddMl.map((ml) => (
              <Pressable
                key={ml}
                onPress={() => void add(ml)}
                accessibilityRole="button"
                accessibilityLabel={`${ml} mililitre ekle`}
                style={({ pressed }) => [styles.quick, { backgroundColor: withAlpha(water, 0.12) }, pressed && styles.pressed]}>
                <Icon name="drop" color={water} size={18} strokeWidth={2.2} />
                <Text variant="subhead">{`${ml} mL`}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.field}>
            <TextFieldRow
              label="Başka"
              accessibilityLabel="Başka miktar, mililitre"
              value={custom}
              onChangeText={setCustom}
              keyboardType="number-pad"
              placeholder={`mL, ${fluidEntryLimits.minMl}-${fluidEntryLimits.maxMl}`}
              onSubmitEditing={() => void addCustom()}
            />
          </View>
          <Pressable
            onPress={() => void addCustom()}
            disabled={!customValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !customValid }}
            style={({ pressed }) => [styles.addCustom, { backgroundColor: palette.cardMuted }, !customValid && styles.disabled, pressed && styles.pressed]}>
            <Text variant="subhead">Ekle</Text>
          </Pressable>
          {sweatNote ? (
            <Text variant="caption" tone="inkSecondary" style={styles.note}>
              {`Bugünkü ter testine göre: ${sweatNote}`}
            </Text>
          ) : null}
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {waterNote}
          </Text>
        </FormBlock>

        {entries.length > 0 ? (
          <View style={[styles.list, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
            {entries.map((e, i) => (
              <View key={e.id} style={i > 0 ? { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth } : undefined}>
                <SwipeDelete label={fluidEntryText(e.ml)} onDelete={() => void remove(e.id)}>
                  <ListRow label={fluidEntryText(e.ml)} value={clock(e.createdAt)} />
                </SwipeDelete>
              </View>
            ))}
          </View>
        ) : null}
      </GestureScrollView>
      <FormDock label="Bitti" onPress={() => router.back()} disabled={false} loading={false} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  quickRow: { flexDirection: 'row', gap: spacing[2] },
  quick: {
    flex: 1,
    height: size.cta,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  field: { marginHorizontal: -layout.cardPadding, marginTop: spacing[2] },
  addCustom: { marginTop: spacing[2], height: size.hitTarget, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: spacing[2.5] },
  list: { marginHorizontal: layout.cardInset, marginTop: spacing[4], borderRadius: radius.xl, borderCurve: 'continuous', overflow: 'hidden' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
