// Öğün ekle / düzelt (karar 0030, PRODUCT §4 "öğün başına 15 saniye"): listeden besine dokun, porsiyonu − / + ile
// ayarla; paketli ürün için etiketteki gramı gir; son öğünü tek dokunuşla tekrarla. Gramları motor hesaplar
// (packages/engine, research/foods/foods.json). Kalori yok. Öğün kişisel veridir: yalnız Supabase'de ya da demoda.

import {
  foodById,
  foodGroups,
  foods,
  isValidCustom,
  mealLimits,
  mealSlots,
  portionMultipliers,
  type Food,
  type Meal,
  type MealItem,
  type MealSlot,
} from '@hooplab/engine';
import { layout, radius, size, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip, ChipSet } from '@/components/chip';
import { FormBlock, FormDock, FormHeader, useDockSpace } from '@/components/form';
import { GestureScrollView } from '@/components/gesture-scroll';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { TextFieldRow } from '@/components/text-field';
import {
  customItemText,
  defaultSlot,
  foodGroupLabels,
  foodPortionText,
  formatPortions,
  portionsText,
  mealItemsText,
  mealListNote,
  mealMacrosText,
  mealSlotLabels,
} from '@/copy/nutrition';
import { deleteMeal, fetchMeal, fetchRecentMeals, isValidMeal, saveMeal } from '@/data/nutrition';
import { usePalette } from '@/theme/appearance';
import { parseDecimal } from '@/utils/decimal';
import { toLocalDate } from '@/utils/local-date';

const multipliers: readonly number[] = portionMultipliers;

/** Çarpan dizisinde bir adım; listenin ucunda null (aşağıda null = kaldır). */
function stepPortions(current: number, delta: 1 | -1): number | null {
  const i = multipliers.indexOf(current);
  return multipliers[i + delta] ?? null;
}

function itemKey(item: MealItem, index: number): string {
  return 'food' in item ? `f:${item.food}` : `c:${index}`;
}

export default function MealScreen() {
  const palette = usePalette();
  const dockSpace = useDockSpace();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' && params.id !== '' ? params.id : null;
  const [today] = useState(() => toLocalDate(new Date()));
  const [localDate, setLocalDate] = useState(today);
  const [slot, setSlot] = useState<MealSlot>(() => defaultSlot(new Date().getHours()));
  const [items, setItems] = useState<MealItem[]>([]);
  const [recent, setRecent] = useState<Meal[]>([]);
  const [custom, setCustom] = useState({ label: '', carbs: '', protein: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (editId) {
      void fetchMeal(editId).then((r) => {
        if (cancelled) return;
        if (!r.ok) return setError(r.message);
        if (!r.value) return setError('Öğün bulunamadı.');
        setLocalDate(r.value.localDate);
        setSlot(r.value.slot);
        setItems([...r.value.items]);
      });
    } else {
      void fetchRecentMeals(today).then((r) => {
        if (!cancelled && r.ok) setRecent(r.value);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [editId, today]);

  const portionsOf = (food: Food) => {
    const item = items.find((i) => 'food' in i && i.food === food.id);
    return item && 'food' in item ? item.portions : null;
  };

  function addFood(food: Food) {
    setItems((list) => {
      const at = list.findIndex((i) => 'food' in i && i.food === food.id);
      if (at === -1) return list.length >= mealLimits.items ? list : [...list, { food: food.id, portions: 1 }];
      // Seçili besine yeniden dokunmak bir porsiyon adımı artırır.
      const cur = list[at];
      if (!cur || !('food' in cur)) return list;
      const next = stepPortions(cur.portions, 1);
      return next === null ? list : list.map((i, k) => (k === at ? { food: cur.food, portions: next } : i));
    });
  }

  function step(index: number, delta: 1 | -1) {
    setItems((list) => {
      const cur = list[index];
      if (!cur) return list;
      if (!('food' in cur)) return delta === -1 ? list.filter((_, k) => k !== index) : list;
      const next = stepPortions(cur.portions, delta);
      if (next === null) return delta === -1 ? list.filter((_, k) => k !== index) : list;
      return list.map((i, k) => (k === index ? { food: cur.food, portions: next } : i));
    });
  }

  const customItem = {
    label: custom.label.trim() === '' ? null : custom.label.trim(),
    carbsG: custom.carbs.trim() === '' ? 0 : (parseDecimal(custom.carbs) ?? Number.NaN),
    proteinG: custom.protein.trim() === '' ? 0 : (parseDecimal(custom.protein) ?? Number.NaN),
  };
  const customValid = isValidCustom(customItem) && items.length < mealLimits.items;

  function addCustom() {
    if (!customValid) return;
    setItems((list) => [...list, customItem]);
    setCustom({ label: '', carbs: '', protein: '' });
  }

  // Düzeltmede bütün kalemler kaldırıldıysa kaydetmek öğünü siler (karar 0031); ayrı bir sil düğmesi yok.
  const deletes = editId !== null && items.length === 0;
  const valid = deletes || isValidMeal(items);

  async function save() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    const r = deletes && editId ? await deleteMeal(editId) : await saveMeal({ id: editId, localDate, slot, items });
    if (r.ok) router.back();
    else {
      setError(r.message);
      setBusy(false);
    }
  }

  const round = (control: 'plus' | 'minus', label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.round, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
      <Icon name={control} color={palette.ink} size={16} strokeWidth={2.4} />
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <GestureScrollView contentContainerStyle={{ paddingBottom: dockSpace }}>
        <FormHeader
          title={editId ? 'Öğünü düzelt' : 'Öğün ekle'}
          subtitle="Listeden dokun, porsiyonu − / + ile ayarla. Kalori sayılmaz; karbonhidrat ve protein kaba bir tahmindir."
        />

        <FormBlock title="Öğün">
          <ChipSet label="Öğün">
            {mealSlots.map((s) => (
              <Chip key={s} label={mealSlotLabels[s]} selected={slot === s} onPress={() => setSlot(s)} />
            ))}
          </ChipSet>
        </FormBlock>

        {!editId && recent.length > 0 ? (
          <FormBlock title="Son öğünler" note="tekrarla">
            <View style={styles.recent}>
              {recent.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setItems([...m.items])}
                  accessibilityRole="button"
                  accessibilityHint="Bu öğünün kalemlerini seçer"
                  style={({ pressed }) => [styles.recentRow, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
                  <Text variant="footnote" tone="inkMuted">
                    {mealSlotLabels[m.slot]}
                  </Text>
                  <Text variant="subhead" numberOfLines={1}>
                    {mealItemsText(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormBlock>
        ) : null}

        <FormBlock title="Seçilenler" note={items.length ? mealMacrosText(items) : undefined}>
          {items.length === 0 ? (
            <Text variant="footnoteRegular" tone="inkMuted">
              {editId
                ? 'Öğünde kalem kalmadı. Kaydedersen öğün silinir.'
                : 'Henüz bir şey seçilmedi. Aşağıdaki listeden dokun ya da etiketten ekle.'}
            </Text>
          ) : (
            items.map((item, index) => {
              const food = 'food' in item ? foodById(item.food) : undefined;
              const name = 'food' in item ? (food?.name ?? 'Listede yok') : (item.label ?? 'Etiketten');
              const detail = 'food' in item ? (food ? foodPortionText(food) : '') : customItemText(item);
              return (
                <View key={itemKey(item, index)} style={[styles.selected, index > 0 && { borderTopColor: palette.line, borderTopWidth: 1 }]}>
                  <View style={styles.flex}>
                    <Text variant="rowLabel">{name}</Text>
                    <Text variant="caption" tone="inkMuted">
                      {detail}
                    </Text>
                  </View>
                  {round('minus', 'food' in item && item.portions > multipliers[0]! ? `${name}, azalt` : `${name}, kaldır`, () => step(index, -1))}
                  {'food' in item ? (
                    <View style={styles.portions} accessible accessibilityLabel={portionsText(item.portions)}>
                      <Text variant="subhead">{formatPortions(item.portions)}</Text>
                      <Text variant="caption2" tone="inkMuted">
                        porsiyon
                      </Text>
                    </View>
                  ) : null}
                  {'food' in item ? round('plus', `${name}, artır`, () => step(index, 1)) : null}
                </View>
              );
            })
          )}
        </FormBlock>

        {foodGroups.map((g) => (
          <FormBlock key={g} title={foodGroupLabels[g]}>
            {foods
              .filter((f) => f.group === g)
              .map((f, i) => {
                const p = portionsOf(f);
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => addFood(f)}
                    accessibilityRole="button"
                    accessibilityLabel={`${f.name}, ${foodPortionText(f)}`}
                    accessibilityState={{ selected: p !== null }}
                    style={({ pressed }) => [styles.food, i > 0 && { borderTopColor: palette.line, borderTopWidth: 1 }, pressed && styles.pressed]}>
                    <View style={styles.flex}>
                      <Text variant="rowLabel">{f.name}</Text>
                      <Text variant="caption" tone="inkMuted">
                        {foodPortionText(f)}
                      </Text>
                    </View>
                    {p !== null ? (
                      <View style={[styles.badge, { backgroundColor: palette.strong }]}>
                        <Text variant="caption2Strong" tone="onStrong">
                          {portionsText(p)}
                        </Text>
                      </View>
                    ) : (
                      <Icon name="plus" color={palette.inkMuted} size={18} strokeWidth={2.2} />
                    )}
                  </Pressable>
                );
              })}
          </FormBlock>
        ))}

        <FormBlock title="Etiketten" note="paketli ürün, gram">
          <View style={styles.field}>
            <TextFieldRow
              label="Ad"
              accessibilityLabel="Ürün adı, isteğe bağlı"
              value={custom.label}
              onChangeText={(label) => setCustom((c) => ({ ...c, label }))}
              placeholder="isteğe bağlı"
              maxLength={mealLimits.labelMax}
            />
            <TextFieldRow
              label="Karbonhidrat"
              accessibilityLabel="Karbonhidrat, gram"
              value={custom.carbs}
              onChangeText={(carbs) => setCustom((c) => ({ ...c, carbs }))}
              keyboardType="decimal-pad"
              placeholder="g"
            />
            <TextFieldRow
              label="Protein"
              accessibilityLabel="Protein, gram"
              value={custom.protein}
              onChangeText={(protein) => setCustom((c) => ({ ...c, protein }))}
              keyboardType="decimal-pad"
              placeholder="g"
            />
          </View>
          <Pressable
            onPress={addCustom}
            disabled={!customValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !customValid }}
            style={({ pressed }) => [styles.addCustom, { backgroundColor: palette.cardMuted }, !customValid && styles.disabled, pressed && styles.pressed]}>
            <Text variant="subhead">Seçilenlere ekle</Text>
          </Pressable>
          <Text variant="caption" tone="inkMuted" style={styles.note}>
            {mealListNote}
          </Text>
        </FormBlock>

      </GestureScrollView>
      <FormDock label={deletes ? 'Kaydet ve sil' : 'Kaydet'} onPress={save} disabled={!valid} loading={busy} error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, gap: spacing[0.5] },
  field: { marginHorizontal: -layout.cardPadding },
  note: { marginTop: spacing[2.5] },
  recent: { gap: spacing[2] },
  recentRow: { borderRadius: radius.lg, borderCurve: 'continuous', paddingHorizontal: spacing[3], paddingVertical: spacing[2.5], gap: spacing[0.5] },
  selected: { flexDirection: 'row', alignItems: 'center', gap: spacing[2.5], paddingVertical: spacing[2.5] },
  portions: { minWidth: 48, alignItems: 'center' },
  round: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  food: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: size.row, paddingVertical: spacing[2] },
  badge: { minWidth: 32, height: 24, paddingHorizontal: spacing[2], borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  addCustom: { marginTop: spacing[3], height: size.hitTarget, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
