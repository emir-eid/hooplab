// Antrenman yükü grafiği: son 28 günün günlük yükü, seans türü gruplarına göre yığılmış çubuk (karar 0026).
// Renk kategoriktir, risk anlamı taşımaz; kimlik yalnız renkte kalmasın diye altında açıklama satırı var.
// Son 7 gün (akut pencere) arkasında soluk bir zemin şeridiyle ayrılır. Kesikli çizgi alıştığın günlük ortalama
// (kronik EWMA); etiketi çubuklarla çakışmasın diye grafikte değil, açıklama satırında.
// Dokunma ve yatay sürükleme bir gün seçer (HrvChart ile aynı jest); değeri kart başlığı gösterir.

import { useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { loadGroups } from '@hooplab/theme';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { useGestureScrollRef } from '@/components/gesture-scroll';
import { chartIndexAt } from '@/data/recovery-view';
import type { LoadChartDay } from '@/data/training-load-view';
import { usePalette } from '@/theme/appearance';

const height = 120;
const padTop = 8;
/** Çubuklar arası boşluk ve uç yarıçapı (dataviz: 2 px aralık, 4 px yuvarlak uç). */
const GAP = 2;
const RADIUS = 4;
/** Yığındaki parçalar arası zemin boşluğu (dataviz: 2 px). */
const STACK_GAP = 2;
/** Görünür kalsın diye bir parçanın en az yüksekliği. */
const MIN_SEGMENT = 2;
const ACTIVE_OFFSET_X = 8;
const FAIL_OFFSET_Y = 10;

interface LoadChartProps {
  days: readonly LoadChartDay[];
  /** Alıştığın günlük yük (AU / gün); oran yoksa çizilmez. */
  reference: number | null;
  accessibilityLabel: string;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

/** Alt kenarı `bottom`'da duran, üst uçları `r` ile yuvarlak dikdörtgen (r = 0: köşeli). */
function barPath(x: number, w: number, top: number, bottom: number, rounded: boolean): string {
  const r = rounded ? Math.min(RADIUS, w / 2, bottom - top) : 0;
  return `M${x} ${bottom} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + w - r} Q${x + w} ${top} ${x + w} ${top + r} V${bottom} Z`;
}

export function LoadChart({ days, reference, accessibilityLabel, selected, onSelect }: LoadChartProps) {
  const palette = usePalette();
  const scrollRef = useGestureScrollRef();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const slot = days.length > 0 ? width / days.length : 0;
  const latest = useRef({ width, slot, count: days.length, selected, onSelect });
  latest.current = { width, slot, count: days.length, selected, onSelect };

  const gesture = useMemo(() => {
    const indexAt = (x: number) => {
      const { width: w, slot: s, count } = latest.current;
      return chartIndexAt(x, w, count, s / 2);
    };
    const pick = (x: number) => {
      const i = indexAt(x);
      if (i !== latest.current.selected) latest.current.onSelect(i);
    };
    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
      .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
      .onStart((e) => pick(e.x))
      .onUpdate((e) => pick(e.x))
      .onEnd(() => latest.current.onSelect(null));
    if (scrollRef) pan.blocksExternalGesture(scrollRef);
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(ACTIVE_OFFSET_X)
      .onEnd((e, success) => {
        if (!success) return;
        const i = indexAt(e.x);
        latest.current.onSelect(i === latest.current.selected ? null : i);
      });
    return Gesture.Race(pan, tap);
  }, [scrollRef]);

  let body = null;
  if (width > 0 && days.length > 0) {
    const values = days.map((d) => d.load ?? 0);
    if (reference !== null) values.push(reference);
    const max = Math.max(...values, 1) * 1.08;
    const base = height - 1;
    const y = (v: number) => base - (v * (base - padTop)) / max;
    const barW = Math.max(slot - GAP, 1);
    const acuteFrom = days.findIndex((d) => d.acute);
    const acuteCount = days.filter((d) => d.acute).length;

    body = (
      <Svg width={width} height={height}>
        {acuteFrom >= 0 ? (
          <Rect x={slot * acuteFrom} y={0} width={slot * acuteCount} height={base} rx={RADIUS} fill={palette.band} />
        ) : null}
        <Line x1={0} x2={width} y1={base + 0.5} y2={base + 0.5} stroke={palette.line} strokeWidth={1} />
        {selected !== null ? (
          <Line
            x1={slot * (selected + 0.5)}
            x2={slot * (selected + 0.5)}
            y1={0}
            y2={base}
            stroke={palette.inkMuted}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}
        {days.map((d, i) => {
          if (d.load === null || d.load <= 0) return null;
          const x = slot * i + GAP / 2;
          const present = loadGroups.filter((g) => d.parts[g] > 0);
          // Boşluk alttaki parçanın üstünden kesilir; çubuğun toplam boyu değişmez.
          let cum = 0;
          return present.map((g, k) => {
            const bottom = y(cum) - (k > 0 ? STACK_GAP : 0);
            cum += d.parts[g];
            const top = Math.min(y(cum), bottom - MIN_SEGMENT);
            return (
              <Path
                key={`${d.date}-${g}`}
                d={barPath(x, barW, top, bottom, k === present.length - 1)}
                fill={palette.loadGroup[g]}
              />
            );
          });
        })}
        {reference !== null ? (
          <Line
            x1={0}
            x2={width}
            y1={y(reference)}
            y2={y(reference)}
            stroke={palette.inkSecondary}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        ) : null}
      </Svg>
    );
  }

  return (
    <GestureDetector gesture={gesture} touchAction="pan-y">
      <View
        onLayout={onLayout}
        style={{ height, marginTop: 8 }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Bir güne dokun ya da parmağını yana kaydır; o günün yükü başlıkta görünür."
      >
        {body}
      </View>
    </GestureDetector>
  );
}
