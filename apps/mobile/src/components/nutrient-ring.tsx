// Beslenme halkası (karar 0031): günün kayıtlı değeri halkada bir yay, hedef aralığı halkanın dışında ince bir yay.
// Ölçek hedefin üst ucunun 1,25 katı, böylece aralık ve üstü görünür. Hedef yoksa (su; kilo girilmemişse) yay yok,
// halka kategori renginin soluk tonunda ve yalnız sayı. Renk kategoriyi söyler (palette.nutrient), risk anlamı
// taşımaz; yanında her zaman ad ve sayı var.

import { withAlpha, type Nutrient } from '@hooplab/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

const ringSize = 92;
const stroke = 8;
/** Hedef yayı: halkanın dışında, arada 2 pt boşluk. */
const bandStroke = 3;
const r = (ringSize - stroke) / 2 - bandStroke - 2;
const rBand = ringSize / 2 - bandStroke / 2;
const cBand = 2 * Math.PI * rBand;
const c = 2 * Math.PI * r;
/** Ölçeğin hedef üst ucuna oranı; görsel seçim, eşik değil. */
const headroom = 1.25;

interface NutrientRingProps {
  nutrient: Nutrient;
  /** Halkanın ortasındaki sayı ve birimi (metin olarak, biçimli). */
  value: string;
  unit: string;
  /** Yay için ham değer ve hedef aralığı (aynı birimde); hedef yoksa null. */
  amount: number;
  range: readonly [number, number] | null;
  /** Ortadaki sayının üstündeki küçük ikon (ör. damla). */
  icon?: ReactNode;
}

export function NutrientRing({ nutrient, value, unit, amount, range, icon }: NutrientRingProps) {
  const palette = usePalette();
  const color = palette.nutrient[nutrient];
  const max = range ? range[1] * headroom : 0;
  const frac = (v: number) => (max > 0 ? Math.min(1, Math.max(0, v / max)) : 0);
  const bandStart = range ? frac(range[0]) : 0;
  const bandLen = range ? frac(range[1]) - bandStart : 0;
  const fill = range ? frac(amount) : 0;
  const center = ringSize / 2;
  return (
    <View style={styles.wrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={ringSize} height={ringSize}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          <Circle cx={center} cy={center} r={r} stroke={range ? palette.track : withAlpha(color, 0.22)} strokeWidth={stroke} fill="none" />
          {range ? (
            <Circle
              cx={center}
              cy={center}
              r={rBand}
              stroke={withAlpha(color, 0.55)}
              strokeWidth={bandStroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${bandLen * cBand} ${cBand}`}
              strokeDashoffset={-bandStart * cBand}
            />
          ) : null}
          {fill > 0 ? (
            <Circle
              cx={center}
              cy={center}
              r={r}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${fill * c} ${c}`}
            />
          ) : null}
        </G>
      </Svg>
      <View style={styles.center}>
        {icon}
        <Text variant="headline">{value}</Text>
        <Text variant="caption2" tone="inkMuted">
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
