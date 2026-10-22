// Açıklama alt sayfası (karar 0026): bir ölçüm ya da hesap ne, nasıl okunur, neye göre, kaynakları.
// Metin copy/explainers'tan; burada yalnız yerleşim.

import { layout, radius, spacing } from '@hooplab/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { explainerContext } from '@/components/info-button';
import { GroupFooter, GroupLabel, ListGroup, ListRow } from '@/components/list';
import { Text } from '@/components/text';
import { basisLabels, explainers, isExplainerId, medicalNote, type Explainer } from '@/copy/explainers';
import { sources } from '@/copy/sources';
import { usePalette } from '@/theme/appearance';

// Static web çıktısında (PWA, karar 0054) her açıklama kendi sayfasıyla derlenir: barındırma tarafında
// dinamik rota yönlendirmesi gerekmez. Tek sayfa çıktısı (demo) ve native bunu kullanmaz.
export function generateStaticParams(): { id: string }[] {
  return Object.keys(explainers).map((id) => ({ id }));
}

export default function ExplainScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!isExplainerId(id)) {
    return (
      <View style={[styles.root, { backgroundColor: palette.bg }]}>
        <Text variant="bodyCompact" style={styles.inset}>
          Bu açıklama bulunamadı.
        </Text>
      </View>
    );
  }

  const e: Explainer = explainers[id];
  const estimate = e.basis === 'estimate';
  const { value, rows } = explainerContext(id);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[4] }}>
      <View style={styles.head}>
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: estimate ? palette.track : palette.cardMuted }]}>
            <Text variant="caption2Strong" tone="inkSecondary">
              {basisLabels[e.basis]}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}>
            <Text variant="callout" tone="inkSecondary">
              Kapat
            </Text>
          </Pressable>
        </View>
        <View style={styles.titleRow}>
          <Text variant="title2" accessibilityRole="header" style={styles.title}>
            {e.title}
          </Text>
          {value ? (
            <Text variant="title2" tone="inkSecondary" accessibilityLabel={`Şu anki değerin ${value}`}>
              {value}
            </Text>
          ) : null}
        </View>
      </View>

      <GroupLabel>Kısaca</GroupLabel>
      <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
        <Text variant="bodyCompact">{e.hint}</Text>
        {e.goal ? (
          <View style={styles.block}>
            <Text variant="footnote" tone="inkSecondary">
              Neyi hedefliyoruz?
            </Text>
            <Text variant="bodyCompact">{e.goal}</Text>
          </View>
        ) : null}
        {rows && rows.length > 0 ? (
          <View style={styles.block}>
            <Text variant="footnote" tone="inkSecondary">
              Senin değerlerin
            </Text>
            {rows.map((r) => (
              <View key={r.label} style={styles.row}>
                <Text variant="bodyCompact" tone="inkSecondary" style={styles.rowLabel}>
                  {r.label}
                </Text>
                <Text variant="bodyCompact">{r.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <GroupLabel>Bu ne?</GroupLabel>
      <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
        <Text variant="bodyCompact">{e.what}</Text>
      </View>

      <GroupLabel>Nasıl okunur?</GroupLabel>
      <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
        {e.read.map((line) => (
          <View key={line} style={styles.bullet}>
            <View style={[styles.dot, { backgroundColor: palette.inkMuted }]} />
            <Text variant="bodyCompact" style={styles.bulletText}>
              {line}
            </Text>
          </View>
        ))}
      </View>

      <GroupLabel>Neye göre?</GroupLabel>
      <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
        <Text variant="bodyCompact">{e.reference}</Text>
      </View>
      {e.limits ? <GroupFooter>{e.limits}</GroupFooter> : null}

      {e.sources.length > 0 ? (
        <ListGroup label="Kaynaklar" footer={e.medical ? medicalNote : undefined}>
          {e.sources.map((s) => (
            <ListRow key={s} label={sources[s].cite} detail={sources[s].kind} />
          ))}
        </ListGroup>
      ) : e.medical ? (
        <GroupFooter>{medicalNote}</GroupFooter>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inset: { margin: layout.screenInset },
  head: {
    paddingTop: spacing[6],
    paddingHorizontal: layout.screenInset,
    gap: spacing[2],
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[3] },
  title: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.full,
  },
  card: {
    marginHorizontal: layout.cardInset,
    padding: layout.cardPadding,
    borderRadius: radius.xxxl,
    borderCurve: 'continuous',
    gap: spacing[2.5],
  },
  block: { gap: spacing[1] },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] },
  rowLabel: { flexShrink: 1 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2.5] },
  dot: { width: 5, height: 5, borderRadius: radius.full, marginTop: 9 },
  bulletText: { flex: 1 },
});
