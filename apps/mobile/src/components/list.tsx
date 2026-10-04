// Gruplu liste (maket: .glabel, .list, .row, .foot). Ayarlar ve Ben ekranlarında kullanılır.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

/** Grup başlığı (maket .glabel). Liste dışındaki kartların üstünde de kullanılır. */
export function GroupLabel({ children }: { children: string }) {
  return (
    <Text variant="footnote" tone="inkMuted" style={styles.label} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Grup altı açıklaması (maket .foot). */
export function GroupFooter({ children }: { children: string }) {
  return (
    <Text variant="footnoteRegular" tone="inkMuted" style={styles.footer}>
      {children}
    </Text>
  );
}

interface ListGroupProps {
  label?: string;
  footer?: string;
  children: ReactNode;
}

export function ListGroup({ label, footer, children }: ListGroupProps) {
  const palette = usePalette();
  const rows = Children.toArray(children);

  return (
    <View>
      {label ? <GroupLabel>{label}</GroupLabel> : null}
      {/* Gölge dış katmanda, kırpma iç katmanda: basılı satırın zemini köşelerden taşmasın. */}
      <View style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
        <View style={styles.clip}>
          {rows.map((row, i) => (
            <Fragment key={i}>
              {i > 0 ? <View style={[styles.separator, { backgroundColor: palette.line }]} /> : null}
              {row}
            </Fragment>
          ))}
        </View>
      </View>
      {footer ? <GroupFooter>{footer}</GroupFooter> : null}
    </View>
  );
}

interface ListRowProps {
  label: string;
  /** Etiketin altındaki soluk ikinci satır (ör. saat ve süre). */
  detail?: string;
  /** Sağdaki soluk değer (ör. seçili seçenek). */
  value?: string;
  /** Sağdaki kontrol (ör. Switch). Verilirse satır dokunulabilir olmaz. */
  accessory?: ReactNode;
  onPress?: () => void;
}

export function ListRow({ label, detail, value, accessory, onPress }: ListRowProps) {
  const palette = usePalette();
  const content = (
    <>
      {detail ? (
        <View style={styles.text}>
          <Text variant="rowLabel">{label}</Text>
          <Text variant="caption" tone="inkMuted">
            {detail}
          </Text>
        </View>
      ) : (
        <Text variant="rowLabel">{label}</Text>
      )}
      {/* Sarmalayıcı şart: RN iOS'ta Switch'e kendiliğinden alignSelf: 'flex-start' verir, satırın ortalamasını ezer. */}
      {accessory ? <View>{accessory}</View> : (
        <View style={styles.value}>
          {value ? <Text variant="subhead" tone="inkMuted">{value}</Text> : null}
          {onPress ? <Icon name="chevron" color={palette.inkMuted} size={16} strokeWidth={2.2} /> : null}
        </View>
      )}
    </>
  );

  if (!onPress || accessory) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : undefined}
      accessibilityHint={value && !detail ? `Şu an: ${value}` : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.cardMuted }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: spacing[7],
    marginBottom: spacing[2],
    marginHorizontal: layout.cardInset + spacing[4],
  },
  card: {
    marginHorizontal: layout.cardInset,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
  },
  clip: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  separator: {
    height: 1,
  },
  row: {
    minHeight: size.row,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  text: { flex: 1, gap: spacing[0.5], paddingVertical: spacing[2.5] },
  value: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  footer: {
    marginTop: spacing[2],
    marginHorizontal: layout.cardInset + spacing[4],
  },
});
