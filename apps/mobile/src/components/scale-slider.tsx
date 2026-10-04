// Tam sayı kaydırıcısı (maket: .track, .fill, .knob, .track-l): dokunarak veya sürükleyerek seçilir.
// RPE (0-10) ve ağrı (0-10) için. Sürükleme Gesture Handler'la: yatay hareket kaydırıcıyı başlatır,
// dikey hareket kaydırıcıyı düşürür ve sayfaya bırakılır. Kaydırıcı sürüklenirken FormScroll kaymaz.

import { radius, size, spacing } from '@hooplab/theme';
import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useFormScrollRef } from '@/components/form';
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
/** Yatayda bu kadar (pt) gidince sürükleme başlar; dikeyde bundan önce bu kadar gidilirse sayfa kayar. */
const ACTIVE_OFFSET_X = 8;
const FAIL_OFFSET_Y = 8;

export function ScaleSlider({ value, onChange, min, max, label, valueText, low, high }: ScaleSliderProps) {
  const palette = usePalette();
  const scrollRef = useFormScrollRef();
  const [width, setWidth] = useState(0);
  const gradientId = `slider-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ratio = ((value ?? min) - min) / (max - min);
  // Topuz izin içinde kalır: merkezi yarıçap kadar içeride başlar ve biter.
  const knobLeft = ratio * (width - size.knob);

  // Hareket nesnesi bir kez kurulur; geri çağrılar en güncel değerleri bu ref'ten okur.
  const latest = useRef({ width, value, onChange, min, max });
  useLayoutEffect(() => {
    latest.current = { width, value, onChange, min, max };
  });

  const gesture = useMemo(() => {
    const pick = (x: number) => {
      const { width: w, value: current, onChange: emit, min: lo, max: hi } = latest.current;
      if (w <= 0) return;
      const raw = lo + ((x - size.knob / 2) / (w - size.knob)) * (hi - lo);
      const next = Math.min(hi, Math.max(lo, Math.round(raw)));
      if (next !== current) {
        latest.current.value = next;
        emit(next);
      }
    };
    // Geri çağrılar JS iş parçacığında: değer React durumunda, adım başına bir güncelleme yeter.
    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
      .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
      .onStart((e) => pick(e.x))
      .onUpdate((e) => pick(e.x))
      // Parmak kalktığı yerdeki değer kaçmasın (son hareket olayı bırakmayla birlikte gelebilir).
      .onEnd((e, success) => {
        if (success) pick(e.x);
      });
    if (scrollRef) pan.blocksExternalGesture(scrollRef);
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(ACTIVE_OFFSET_X)
      .onEnd((e, success) => {
        if (success) pick(e.x);
      });
    return Gesture.Race(pan, tap);
  }, [scrollRef]);

  return (
    <View>
      <GestureDetector gesture={gesture} touchAction="pan-y">
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
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
      </GestureDetector>
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
