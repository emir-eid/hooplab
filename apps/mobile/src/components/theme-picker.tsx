// Tema seçici (maket: .themes, .mini, .radio). Her seçenek o temanın küçük bir önizlemesini çizer;
// önizleme renkleri ilgili temanın paletinden gelir, etkin temadan bağımsızdır.

import {
  layout,
  palettes,
  radius,
  spacing,
  type ColorScheme,
  type ThemePreference,
} from '@hooplab/theme';
import { useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

const options: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
];

const MINI = { width: 70, height: 116 } as const;

/** SVG kimlikleri web'de belge genelinde tekil olmalı; useId'nin özel karakterleri atılır. */
function useSvgId(prefix: string): string {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Bir temanın küçük ekranı: zemin, hale, başlık çizgisi, üç kart. */
function MiniScreen({ scheme, id }: { scheme: ColorScheme; id: string }) {
  const p = palettes[scheme];
  const orb = p.aura.colors.yellow[0];
  const gradientId = `${id}-${scheme}`;
  return (
    <G>
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={orb} stopOpacity={scheme === 'dark' ? 0.55 : 1} />
          <Stop offset="1" stopColor={orb} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={MINI.width} height={MINI.height} fill={p.bg} />
      <Circle cx={55} cy={9} r={45} fill={`url(#${gradientId})`} />
      <Rect x={8} y={34} width={34} height={7} rx={3} fill={p.ink} />
      <Rect x={6} y={50} width={58} height={26} rx={7} fill={p.card} />
      <Rect x={6} y={80} width={27} height={22} rx={7} fill={p.card} />
      <Rect x={37} y={80} width={27} height={22} rx={7} fill={p.card} />
    </G>
  );
}

function Preview({ value }: { value: ThemePreference }) {
  const id = useSvgId('mini');
  const clipId = `${id}-clip`;
  const halfId = `${id}-half`;
  return (
    <Svg width={MINI.width} height={MINI.height}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect width={MINI.width} height={MINI.height} rx={radius.lg} />
        </ClipPath>
        {/* Sistem: sağ alt üçgen koyu tema (maket .mini.sys .half). */}
        <ClipPath id={halfId}>
          <Polygon points={`${MINI.width},0 ${MINI.width},${MINI.height} 0,${MINI.height}`} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <MiniScreen scheme={value === 'dark' ? 'dark' : 'light'} id={id} />
        {value === 'system' ? (
          <G clipPath={`url(#${halfId})`}>
            <MiniScreen scheme="dark" id={`${id}-sys`} />
          </G>
        ) : null}
      </G>
    </Svg>
  );
}

function Radio({ checked }: { checked: boolean }) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.radio,
        { borderColor: checked ? palette.ink : palette.dot },
        checked && { backgroundColor: palette.ink },
      ]}>
      {checked ? (
        <Svg width={12} height={12} viewBox="0 0 12 12">
          <Path
            d="M2.5 6.2l2.4 2.3 4.6-5"
            stroke={palette.onInk}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}

interface ThemePickerProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const palette = usePalette();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Tema"
      style={[styles.card, { backgroundColor: palette.card, boxShadow: palette.shadow.card }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={styles.option}>
            <View
              style={[
                styles.mini,
                { boxShadow: selected ? `0 0 0 2.5px ${palette.ink}` : `0 0 0 1px ${palette.line}` },
              ]}>
              <Preview value={option.value} />
            </View>
            <Text variant="chip">{option.label}</Text>
            <Radio checked={selected} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: layout.cardInset,
    paddingTop: spacing[4],
    paddingBottom: spacing[3.5],
    paddingHorizontal: spacing[2.5],
    borderRadius: radius.xxl,
    borderCurve: 'continuous',
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2.5],
  },
  mini: {
    width: MINI.width,
    height: MINI.height,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
