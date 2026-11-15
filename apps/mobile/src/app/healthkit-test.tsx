// HealthKit deneme ekranı (karar 0061, uygulama sırası 2). Hiçbir menüde yok; yalnız hooplab://healthkit-test
// bağlantısıyla açılır. İzin ister, son günlerin örneklerini tip başına sayar; değer göstermez, saklamaz,
// göndermez. Apple yolu (sıra 3) gelince kaldırılır.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { probeDays, runHealthKitProbe, shortType, type ProbeResult } from '@/health/healthkit-probe';
import { usePalette } from '@/theme/appearance';

type State = { phase: 'idle' } | { phase: 'running' } | { phase: 'done'; result: ProbeResult } | { phase: 'failed'; error: string };

function time(iso: string | null): string {
  if (!iso) return 'örnek yok';
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function HealthKitTestScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ phase: 'idle' });

  const run = async () => {
    setState({ phase: 'running' });
    try {
      setState({ phase: 'done', result: await runHealthKitProbe(new Date()) });
    } catch (err) {
      setState({ phase: 'failed', error: err instanceof Error ? err.message.slice(0, 200) : 'bilinmeyen hata' });
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + spacing[3], paddingBottom: Math.max(insets.bottom, spacing[4]) + spacing[4] }}>
      <View style={styles.head}>
        <View style={styles.topRow}>
          <Text variant="title2" accessibilityRole="header">
            HealthKit denemesi
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Text variant="callout" tone="inkSecondary">
              Kapat
            </Text>
          </Pressable>
        </View>
        <Text variant="footnoteRegular" tone="inkSecondary">
          {`Yalnız sayar: son ${probeDays} günde tip başına kaç örnek okunabildi. Değer gösterilmez, hiçbir yere gönderilmez.`}
        </Text>
      </View>

      {Platform.OS !== 'ios' ? (
        <Text variant="bodyCompact" style={styles.inset}>
          HealthKit yalnız iPhone uygulamasında var.
        </Text>
      ) : (
        <Pressable
          onPress={run}
          disabled={state.phase === 'running'}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: palette.ink, opacity: state.phase === 'running' ? 0.5 : 1 }]}>
          <Text variant="buttonLarge" style={{ color: palette.bg }}>
            {state.phase === 'running' ? 'Okunuyor…' : 'İzin iste ve say'}
          </Text>
        </Pressable>
      )}

      {state.phase === 'failed' ? (
        <Text variant="bodyCompact" style={styles.inset}>
          {`Hata: ${state.error}`}
        </Text>
      ) : null}

      {state.phase === 'done' ? (
        <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
          <Text variant="bodyCompact">{`Sağlık verisi: ${state.result.available ? 'var' : 'yok'}`}</Text>
          <Text variant="bodyCompact">{`Korumalı veri açık (kilit açık): ${state.result.protectedDataAvailable ? 'evet' : 'hayır'}`}</Text>
          <Text variant="bodyCompact">
            {`İzin isteği: ${state.result.authError ? `hata (${state.result.authError})` : state.result.authorized === null ? '—' : state.result.authorized ? 'tamamlandı' : 'tamamlanmadı'}`}
          </Text>
          {state.result.rows.map((r) => (
            <View key={r.type} style={styles.row}>
              <Text variant="subhead">{shortType(r.type)}</Text>
              <Text variant="footnoteRegular" tone="inkSecondary">
                {r.error ? `okunamadı: ${r.error}` : `${r.count} örnek · son: ${time(r.latest)} · ${r.ms} ms`}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { paddingHorizontal: layout.screenInset, gap: spacing[2], marginBottom: spacing[4] },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inset: { paddingHorizontal: layout.screenInset },
  button: {
    marginHorizontal: layout.cardInset,
    borderRadius: radius.full,
    minHeight: size.cta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { marginHorizontal: layout.cardInset, marginTop: spacing[4], borderRadius: radius.xxxl, padding: layout.cardPadding, gap: spacing[2] },
  row: { gap: 2, paddingTop: spacing[2] },
});
