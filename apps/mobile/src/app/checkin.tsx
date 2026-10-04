// Sabah check-in (maket ekran 2): beş soru 1-5 (5 = en iyi, karar 0017) ve ağrı haritası.
// Aynı gün yeniden açılırsa o günün kaydı yüklenir ve güncellenir.

import { isCompleteWellness, wellnessItems, wellnessScale, type WellnessAnswers } from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { PainMapPicker } from '@/components/pain-map-picker';
import { ScaleQuestion } from '@/components/scale-question';
import { Text } from '@/components/text';
import { wellnessLabels } from '@/copy/labels';
import { fetchCheckin, saveCheckin } from '@/data/daily-log';
import type { PainMap } from '@/data/pain-map';
import { usePalette } from '@/theme/appearance';
import { toLocalDate } from '@/utils/local-date';

export default function CheckinScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  // Form açıkken gece yarısı geçse de kayıt açıldığı güne yazılır.
  const [localDate] = useState(() => toLocalDate(new Date()));
  const [answers, setAnswers] = useState<Partial<WellnessAnswers>>({});
  const [pain, setPain] = useState<PainMap>({});
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCheckin(localDate).then((result) => {
      if (cancelled) return;
      if (result.ok && result.value) {
        setAnswers(result.value.answers);
        setPain(result.value.pain);
        setExisting(true);
      }
      if (!result.ok) setError(result.message);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [localDate]);

  const answered = wellnessItems.filter((item) => answers[item] !== undefined).length;

  async function save() {
    if (!isCompleteWellness(answers) || saving) return;
    setSaving(true);
    setError(null);
    const result = await saveCheckin(localDate, { answers, pain });
    if (result.ok) {
      router.back();
    } else {
      setError(result.message);
      setSaving(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: dockSpace }} keyboardShouldPersistTaps="handled">
        <FormHeader
          title="Sabah check-in"
          subtitle={existing ? 'Bugünkü kaydın. Değiştirip yeniden kaydedebilirsin.' : 'Beş soru, yaklaşık 30 saniye.'}
        />
        <View
          style={styles.dots}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Cevaplanan soru"
          accessibilityValue={{ min: 0, max: wellnessItems.length, now: answered }}>
          {wellnessItems.map((item) => (
            <View
              key={item}
              style={[styles.dot, { backgroundColor: answers[item] !== undefined ? palette.ink : palette.track }]}
            />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={palette.inkMuted} style={styles.loading} />
        ) : (
          <>
            {wellnessItems.map((item) => (
              <ScaleQuestion
                key={item}
                title={wellnessLabels[item].title}
                low={wellnessLabels[item].low}
                high={wellnessLabels[item].high}
                min={wellnessScale.min}
                max={wellnessScale.max}
                value={answers[item]}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [item]: value }))}
              />
            ))}
            <FormBlock title="Ağrı ve sertlik" note="0–10">
              <PainMapPicker value={pain} onChange={setPain} />
            </FormBlock>
            <Text variant="captionRegular" tone="inkMuted" style={styles.fine}>
              Göğüs ağrısı, çarpıntı, bayılma hissi gibi bir durum varsa bu formu bırak ve bir doktora başvur.
            </Text>
          </>
        )}
      </ScrollView>
      <FormDock
        label="Kaydet"
        onPress={save}
        disabled={loading || answered < wellnessItems.length}
        loading={saving}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dots: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginTop: spacing[3.5],
    marginHorizontal: layout.screenInset,
  },
  dot: {
    flex: 1,
    height: size.progress,
    borderRadius: radius.full,
  },
  loading: { marginTop: spacing[10] },
  fine: {
    marginTop: spacing[3],
    marginHorizontal: layout.screenInset,
  },
});
