// Tam sayı kaydırıcısı (maket: .track, .fill, .knob, .track-l): dokunarak veya sürükleyerek seçilir.
// RPE (0-10) ve ağrı (0-10) için. Sürükleme RN responder sistemiyle; dikey hareket kaydırmaya bırakılır.

import { radius, size, spacing } from '@hooplab/theme';
import { useId, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

interface ScaleSliderProps {
  /** null: henüz seçilmedi; topuz görünmez, ilk dokunuş seçer (çapa etkisi olmasın). */
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  /** Ekran okuyucunun değerle birlikte okuyacağı açıklama (ör. "Zor"). */
  valueText?: string;
  low: string;
  high: string;
}

const TRACK_HEIGHT = 44;

export function ScaleSlider({ value, onChange, min, max, label, valueText, low, high }: ScaleSliderProps) {
  const palette = usePalette();
  const [width, setWidth] = useState(0);
  const gradientId = `slider-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ratio = ((value ?? min) - min) / (max - min);
  // Topuz izin içinde kalır: merkezi yarıçap kadar içeride başlar ve biter.
  const knobLeft = ratio * (width - size.knob);

  const pick = (e: GestureResponderEvent) => {
    if (width <= 0) return;
    const x = e.nativeEvent.locationX - size.knob / 2;
    const raw = min + (x / (width - size.knob)) * (max - min);
    const next = Math.min(max, Math.max(min, Math.round(raw)));
    if (next !== value) onChange(next);
  };

  return (
    <View>
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={pick}
        onResponderMove={pick}
        onResponderTerminationRequest={() => true}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={
          value === null
            ? { text: 'Seçilmedi' }
            : { min, max, now: value, ...(valueText ? { text: `${value}, ${valueText}` } : {}) }
        }
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const delta = e.nativeEvent.actionName === 'increment' ? 1 : -1;
          if (value === null) onChange(delta > 0 ? min : max);
          else onChange(Math.min(max, Math.max(min, value + delta)));
        }}
        style={styles.track}>
        <View style={[styles.rail, { backgroundColor: palette.cardMuted }]} />
        {width > 0 && value !== null ? (
          <Svg style={[styles.fill, { width: knobLeft + size.knob }]}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={palette.dot} />
                <Stop offset="1" stopColor={palette.ink} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={size.meter / 2} fill={`url(#${gradientId})`} />
          </Svg>
        ) : null}
        {value !== null ? (
          <View
            style={[styles.knob, { left: knobLeft, backgroundColor: palette.knob, boxShadow: palette.shadow.knob }]}
          />
        ) : null}
      </View>
      <View style={styles.ends} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text variant="micro" tone="inkMuted">
          {low}
        </Text>
        <Text variant="micro" tone="inkMuted">
          {high}
        </Text>
      </View>
    </View>
  );
}

const railTop = (TRACK_HEIGHT - size.meter) / 2;

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    marginTop: spacing[3.5],
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: railTop,
    height: size.meter,
    borderRadius: radius.full,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: railTop,
    height: size.meter,
    pointerEvents: 'none',
  },
  knob: {
    position: 'absolute',
    top: (TRACK_HEIGHT - size.knob) / 2,
    width: size.knob,
    height: size.knob,
    borderRadius: radius.full,
    pointerEvents: 'none',
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
