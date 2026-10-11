// Doğrudan gram (kullanıcı isteği, karar 0030 / 0031): Bugün'deki karbonhidrat ya da protein halkasına dokununca
// besin seçmeden gram girilir. Öğünün "etiketten" kalemiyle aynı veri: tek kalemli bir öğün olarak kaydedilir,
// Bugün'deki öğün listesinden düzeltilir ya da silinir. Kalori yok. Öğün kişisel veridir: yalnız Supabase'de ya da demoda.

import { isValidCustom, mealLimits, mealSlots, type MealSlot } from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { Text } from '@/components/text';
import { TextFieldRow, wideLabelWidth } from '@/components/text-field';
import { defaultSlot, mealSlotLabels } from '@/copy/nutrition';
import { saveMeal } from '@/data/nutrition';
import { usePalette } from '@/theme/appearance';
import { parseDecimal } from '@/utils/decimal';
import { toLocalDate } from '@/utils/local-date';

export default function GramsScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const params = useLocalSearchParams<{ focus?: string }>();
  // Dokunulan halkanın alanı klavyeyle açılır.
  const focus = params.focus === 'protein' ? 'protein' : 'carbs';
  const [today] = useState(() => toLocalDate(new Date()));
  const [slot, setSlot] = useState<MealSlot>(() => defaultSlot(new Date().getHours()));
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grams = (text: string) => (text.trim() === '' ? 0 : (parseDecimal(text) ?? Number.NaN));
  const item = { label: label.trim() === '' ? null : label.trim(), carbsG: grams(carbs), proteinG: grams(protein) };
  const valid = isValidCustom(item);
  const typed = carbs.trim() !== '' || protein.trim() !== '';

  async function save() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const r = await saveMeal({ id: null, localDate: today, slot, items: [item] });
    if (r.ok) router.back();
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader
          title="Gram ekle"
          subtitle="Besin seçmeden karbonhidrat ve proteini gram olarak gir. Öğün olarak kaydedilir; Bugün'deki öğün listesinden düzeltilir."
        />

        <FormBlock title="Gram">
          <View style={styles.field}>
            <TextFieldRow
              labelWidth={wideLabelWidth}
              label="Karbonhidrat"
              accessibilityLabel="Karbonhidrat, gram"
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="decimal-pad"
              placeholder="g"
              autoFocus={focus === 'carbs'}
            />
            <TextFieldRow
              labelWidth={wideLabelWidth}
              label="Protein"
              accessibilityLabel="Protein, gram"
              value={protein}
              onChangeText={setProtein}
              keyboardType="decimal-pad"
              placeholder="g"
              autoFocus={focus === 'protein'}
            />
            <TextFieldRow
              labelWidth={wideLabelWidth}
              label="Ad"
              accessibilityLabel="Ad, isteğe bağlı"
              value={label}
              onChangeText={setLabel}
              placeholder="isteğe bağlı"
              maxLength={mealLimits.labelMax}
            />
          </View>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {typed && !valid
              ? `Her biri 0-${mealLimits.customGramsMax} g arasında olmalı, en az biri sıfırdan büyük.`
              : 'Paket etiketinden ya da bildiğin bir değerden. Boş bırakılan alan 0 sayılır.'}
          </Text>
        </FormBlock>

        <FormBlock title="Öğün">
          <ChipSet label="Öğün">
            {mealSlots.map((s) => (
              <Chip key={s} label={mealSlotLabels[s]} selected={slot === s} onPress={() => setSlot(s)} />
            ))}
          </ChipSet>
        </FormBlock>

        <Pressable
          onPress={() => router.replace('/meal-new')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.link, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
          <Text variant="subhead">Listeden besin seç</Text>
        </Pressable>
      </GestureScrollView>
      <FormDock label="Kaydet" onPress={save} disabled={!valid} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  field: { marginHorizontal: -layout.cardPadding },
  note: { marginTop: spacing[2.5] },
  link: {
    marginHorizontal: layout.cardInset,
    marginTop: spacing[4],
    height: size.hitTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
