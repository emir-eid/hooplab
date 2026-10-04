// Kayıt formlarının yapı taşları (maket: .grab, .fhead, .fsub, .blk, .dock). Formlar modal olarak açılır.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

/** Form başlığı: tutamaç, başlık, kapat düğmesi, altında kısa açıklama. */
export function FormHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const palette = usePalette();
  return (
    <View>
      <View style={[styles.grabber, { backgroundColor: palette.dot }]} />
      <View style={styles.head}>
        <Text variant="title2" accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          hitSlop={spacing[2]}
          style={({ pressed }) => [styles.close, { backgroundColor: palette.cardMuted }, pressed && styles.pressed]}>
          <Icon name="close" color={palette.inkSecondary} size={size.iconSmall} strokeWidth={2.2} />
        </Pressable>
      </View>
      {subtitle ? (
        <Text variant="subhead" tone="inkSecondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Başlıklı form kartı (maket .blk). Sağdaki soluk not ölçeği veya birimi söyler. */
export function FormBlock({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const palette = usePalette();
  return (
    <View style={[styles.block, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
      <View style={styles.blockTitle}>
        <Text variant="footnote" tone="inkMuted" accessibilityRole="header">
          {title}
        </Text>
        {note ? (
          <Text variant="footnote" tone="inkMuted">
            {note}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Ekranın altına sabit ana düğme yuvası; içerik arkasından geçerken zemine karışır. */
export function FormDock({
  label,
  onPress,
  disabled,
  loading,
  error,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  error: string | null;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, spacing[4]) }]}>
      <Svg width="100%" height="100%" style={[StyleSheet.absoluteFill, styles.noTouch]}>
        <Defs>
          <LinearGradient id="dock-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.bg} stopOpacity={0} />
            <Stop offset="0.4" stopColor={palette.bg} stopOpacity={1} />
            <Stop offset="1" stopColor={palette.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dock-fade)" />
      </Svg>
      {error ? (
        <Text
          variant="footnoteMedium"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: palette.statusInk.red }]}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton label={label} onPress={onPress} disabled={disabled} loading={loading} />
    </View>
  );
}

/** Kaydırılan form içeriğinin altında yuvaya bırakılan boşluk. */
export function useDockSpace(): number {
  const insets = useSafeAreaInsets();
  return size.primaryButton + Math.max(insets.bottom, spacing[4]) + spacing[10];
}

const styles = StyleSheet.create({
  grabber: {
    width: size.grabber.width,
    height: size.grabber.height,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing[2],
  },
  head: {
    paddingTop: spacing[4],
    paddingHorizontal: layout.screenInset,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  close: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  subtitle: {
    marginTop: spacing[1],
    paddingHorizontal: layout.screenInset,
  },
  block: {
    marginTop: layout.formGap,
    marginHorizontal: layout.cardInset,
    padding: layout.cardPadding,
    borderRadius: radius.xxl,
    borderCurve: 'continuous',
  },
  blockTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing[4],
  },
  noTouch: { pointerEvents: 'none' },
  error: {
    marginBottom: spacing[2],
    marginHorizontal: layout.cardInset + spacing[4],
  },
});
