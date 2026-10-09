// Koç özetinin dayanakları (karar 0032): her cümlenin alıntıladığı günün sayıları (dokununca ilgili açıklama
// sayfası ya da günün durumunun yöntemi) ve kaynakları (künye ve tür). Rozetten açılınca yalnız o cümle,
// "Dayanaklar"dan açılınca hepsi. Veri bellekte (coach-card); adres satırına sağlık verisi konmaz.

import { layout, radius, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { coachBasis, openTarget } from '@/components/coach-card';
import { GroupFooter, GroupLabel, ListGroup, ListRow } from '@/components/list';
import { Text } from '@/components/text';
import { basisLabel, basisTarget, coachBadge } from '@/copy/coach';
import { medicalNote } from '@/copy/explainers';
import { sources } from '@/copy/sources';
import { usePalette } from '@/theme/appearance';

export default function CoachBasisScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { sentences, only } = coachBasis();
  // Rozet numarası özetteki alıntılı cümlelerin sırası; sayfada aynı numara görünür.
  let n = 0;
  const numbered = sentences.map((s) => ({ s, mark: s.numbers.length + s.sources.length > 0 ? ++n : null }));
  const shown = numbered.filter((x, i) => x.mark !== null && (only === null || i === only));

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[4] }}>
      <View style={styles.head}>
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: palette.track }]}>
            <Text variant="caption2Strong" tone="inkSecondary">
              {coachBadge}
            </Text>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
            <Text variant="callout" tone="inkSecondary">
              Kapat
            </Text>
          </Pressable>
        </View>
        <Text variant="title2" accessibilityRole="header">
          Dayanaklar
        </Text>
        <Text variant="footnoteRegular" tone="inkSecondary">
          Sayılar uygulamanın hesabından alıntı; yorumlar kanıt tabanındaki kaynak özetlerinden.
        </Text>
      </View>

      {shown.length === 0 ? (
        <Text variant="bodyCompact" style={styles.inset}>
          Gösterilecek dayanak yok.
        </Text>
      ) : null}

      {shown.map(({ s, mark }) => (
        <View key={mark}>
          <GroupLabel>{`Dayanak ${mark}`}</GroupLabel>
          <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
            <Text variant="bodyCompact">{s.text}</Text>
          </View>
          <View style={styles.list}>
            <ListGroup>
              {[
                ...s.numbers.map((id) => {
                  const target = basisTarget(id);
                  return (
                    <ListRow
                      key={`n-${id}`}
                      label={basisLabel(id)}
                      detail="Günün sayıları"
                      {...(target ? { onPress: () => openTarget(target) } : {})}
                    />
                  );
                }),
                ...s.sources.map((id) => {
                  const cite = (sources as Record<string, { cite: string; kind: string } | undefined>)[id];
                  return <ListRow key={`s-${id}`} label={cite?.cite ?? id} detail={cite?.kind ?? 'Kaynak'} />;
                }),
              ]}
            </ListGroup>
          </View>
        </View>
      ))}
      <GroupFooter>{medicalNote}</GroupFooter>
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
  },
  list: { marginTop: spacing[2] },
});
