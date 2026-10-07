// Sabah kilosu (karar 0029, PRODUCT §4): günde bir, isteğe bağlı. Beslenme hedefleri bundan gram olarak hesaplanır.
// Kilo kişisel veridir: yalnız Supabase'de (RLS) ya da demoda bellekte durur.

import { isValidWeight, targetWeightDays, weightLimits } from '@hooplab/engine';
import { layout, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { Text } from '@/components/text';
import { TextFieldRow } from '@/components/text-field';
import { fetchNutrition, saveWeight } from '@/data/nutrition';
import { usePalette } from '@/theme/appearance';
import { formatDecimalInput, parseDecimal } from '@/utils/decimal';
import { toLocalDate } from '@/utils/local-date';

export default function WeightScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const [today] = useState(() => toLocalDate(new Date()));
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bugün girilmişse alan onunla dolu gelir.
  useEffect(() => {
    let cancelled = false;
    void fetchNutrition(today).then((r) => {
      if (!cancelled && r.ok && r.value.todayWeight !== null) setText(formatDecimalInput(r.value.todayWeight));
    });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const kg = parseDecimal(text);
  const valid = kg !== null && isValidWeight(kg);

  async function save() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const r = await saveWeight(today, kg);
    if (r.ok) router.back();
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader title="Sabah kilosu" subtitle="Uyanınca, tuvaletten sonra, kahvaltıdan önce." />
        <FormBlock title="Bugün">
          <View style={styles.field}>
            <TextFieldRow
              label="Kilo (kg)"
              value={text}
              onChangeText={setText}
              keyboardType="decimal-pad"
              placeholder="ör. 92,4"
              autoFocus
            />
          </View>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {text.trim() !== '' && !valid
              ? `${weightLimits.min}-${weightLimits.max} kg arasında bir değer gir.`
              : `Karbonhidrat ve protein hedefleri son ${targetWeightDays} günün ortalamasıyla hesaplanır. Kilo yalnız senin hesabında saklanır.`}
          </Text>
        </FormBlock>
      </GestureScrollView>
      <FormDock label="Kaydet" onPress={save} disabled={!valid} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  field: { marginHorizontal: -layout.cardPadding },
  note: { marginTop: spacing[2.5] },
});
