// Seyahat ekle / düzenle (karar 0047): gidiş günü, dönüş günü (isteğe bağlı) ve varış yerinin saat farkı.
// Şehir sorulmaz; yalnız saat farkı. Kaydedince takvim ve Bugün yenilenir.

import { addIsoDays, jetLagRule, tripOffsetLimits, type Trip } from '@hooplab/engine';
import { layout, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { StepButton } from '@/components/step-button';
import { Text } from '@/components/text';
import { offsetLabel } from '@/copy/travel';
import { tripDaysAhead, tripLookbackDays } from '@/data/trip-view';
import { deleteTrip, fetchTrips, saveTrip } from '@/data/trips';
import { usePalette } from '@/theme/appearance';
import { formatShortDate } from '@/utils/format-date';
import { toLocalDate } from '@/utils/local-date';

/** Gidiş günü formda en fazla bu kadar geriye alınır (süren bir seyahati sonradan girmek için); görsel seçim. */
const departBackDays = 30;

export default function TripEditScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const params = useLocalSearchParams<{ id?: string }>();
  const [today] = useState(() => toLocalDate(new Date()));
  const editing = typeof params.id === 'string' && params.id.length > 0 ? params.id : null;
  const [depart, setDepart] = useState(today);
  const [ret, setRet] = useState<string | null>(addIsoDays(today, 3));
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    void fetchTrips(addIsoDays(today, -tripLookbackDays), addIsoDays(today, tripDaysAhead)).then((r) => {
      const t = r.ok ? r.value.find((x) => x.id === editing) : undefined;
      if (cancelled || !t) return;
      setDepart(t.departDate);
      setRet(t.returnDate);
      setOffset(t.offsetHours);
    });
    return () => {
      cancelled = true;
    };
  }, [editing, today]);

  const moveDepart = (days: number) => setDepart((d) => addIsoDays(d, days));
  // Gidiş dönüşü geçerse dönüş gidişe çekilir (gösterimde ve kayıtta).
  const back = ret !== null && ret < depart ? depart : ret;

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const trip: Trip = { departDate: depart, returnDate: back, offsetHours: offset, ...(editing ? { id: editing } : {}) };
    const r = await saveTrip(trip);
    if (r.ok) router.back();
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing || busy) return;
    setBusy(true);
    const r = await deleteTrip(editing);
    if (r.ok) router.back();
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  const jetLag = Math.abs(offset) >= jetLagRule.minTimeZones;
  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader title={editing ? 'Seyahat' : 'Seyahat ekle'} subtitle="Şehir sorulmaz; yalnız varacağın yerin saat farkı." />
        <FormBlock title="Gidiş">
          <View style={styles.stepper}>
            <StepButton icon="chevronBack" label="Önceki gün" enabled={depart > addIsoDays(today, -departBackDays)} onPress={() => moveDepart(-1)} />
            <Text variant="callout" style={styles.value}>
              {formatShortDate(depart)}
            </Text>
            <StepButton icon="chevron" label="Sonraki gün" enabled={depart < addIsoDays(today, tripDaysAhead)} onPress={() => moveDepart(1)} />
          </View>
        </FormBlock>

        <FormBlock title="Dönüş">
          {back !== null ? (
            <View style={styles.stepper}>
              <StepButton icon="chevronBack" label="Önceki gün" enabled={back > depart} onPress={() => setRet(addIsoDays(back, -1))} />
              <Text variant="callout" style={styles.value}>
                {formatShortDate(back)}
              </Text>
              <StepButton icon="chevron" label="Sonraki gün" enabled onPress={() => setRet(addIsoDays(back, 1))} />
            </View>
          ) : null}
          <View style={back !== null ? styles.below : undefined}>
            <ChipSet label="Dönüş">
              <Chip
                label="Dönüş belli değil"
                role="checkbox"
                selected={back === null}
                onPress={() => setRet(ret === null ? addIsoDays(depart, 3) : null)}
              />
            </ChipSet>
          </View>
        </FormBlock>

        <FormBlock title="Saat farkı" note="varılan yer − ev">
          <View style={styles.stepper}>
            <StepButton icon="chevronBack" label="Bir saat geri" enabled={offset > tripOffsetLimits.min} onPress={() => setOffset((o) => Math.max(tripOffsetLimits.min, o - 1))} />
            <Text variant="callout" style={[styles.value, styles.clock]}>
              {offsetLabel(offset)}
            </Text>
            <StepButton icon="chevron" label="Bir saat ileri" enabled={offset < tripOffsetLimits.max} onPress={() => setOffset((o) => Math.min(tripOffsetLimits.max, o + 1))} />
          </View>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {jetLag
              ? 'Jet lag beklenir: Bugün\'de gidişten birkaç gün önce başlayan uyum tahmini çıkar.'
              : `Varacağın yerin saati seninkinden ileriyse +, geriyse −. ${jetLagRule.minTimeZones} saatten az farkta yalnız yolculuk günü notu çıkar.`}
          </Text>
        </FormBlock>

        {editing ? (
          <Pressable
            onPress={() => void remove()}
            accessibilityRole="button"
            disabled={busy}
            style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
            <Text variant="callout" style={{ color: palette.destructive }}>
              Seyahati sil
            </Text>
          </Pressable>
        ) : null}
      </GestureScrollView>
      <FormDock label="Kaydet" onPress={() => void save()} disabled={false} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] },
  value: { flex: 1, textAlign: 'center' },
  clock: { fontVariant: ['tabular-nums'] },
  note: { marginTop: spacing[2.5] },
  below: { marginTop: spacing[3] },
  delete: { marginTop: spacing[6], marginHorizontal: layout.screenInset, alignItems: 'center', paddingVertical: spacing[3] },
  pressed: { opacity: 0.6 },
});
