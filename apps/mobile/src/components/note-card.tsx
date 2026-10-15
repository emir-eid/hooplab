// Bugün'deki başlıklı not kartı (maç çevresi, seyahat; karar 0046, 0047): ikon, başlık, açıklama düğmesi, etiketli
// satırlar, altta kısa açıklama. Bağlam notu, risk değil: nötr kart, durum rengi yok.

import { spacing } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { ExplainButton } from '@/components/info-button';
import { Text } from '@/components/text';
import { explainers, type ExplainerId } from '@/copy/explainers';
import { usePalette } from '@/theme/appearance';

export function NoteCard({
  icon,
  title,
  explainer,
  lines,
  children,
}: {
  icon: IconName;
  title: string;
  explainer: ExplainerId;
  lines: readonly { label: string; text: string }[];
  children?: ReactNode;
}) {
  const palette = usePalette();
  return (
    <Card>
      <View style={styles.titleRow}>
        <Icon name={icon} color={palette.ink} size={16} strokeWidth={2} />
        <Text variant="footnote" tone="inkSecondary" style={styles.title}>
          {title}
        </Text>
        <ExplainButton id={explainer} />
      </View>
      <View style={styles.lines}>
        {lines.map((l) => (
          <View key={l.label} style={styles.line}>
            <Text variant="footnote">{l.label}</Text>
            <Text variant="footnoteRegular" tone="inkSecondary">
              {l.text}
            </Text>
          </View>
        ))}
      </View>
      {children}
      <Text variant="caption2" tone="inkMuted" style={styles.hint}>
        {explainers[explainer].hint}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] },
  title: { flex: 1 },
  lines: { marginTop: spacing[2], gap: spacing[2.5] },
  line: { gap: spacing[0.5] },
  hint: { marginTop: spacing[2.5] },
});
