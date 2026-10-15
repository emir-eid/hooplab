// Saatlik yakılan enerji grafiği (karar 0044): bir günün saatleri, tek seri çubuk. Renk nötr: tahmin, eşik ve durum
// yok. Ölçek gösterilebilen bütün günlerin en yükseği; günler arasında geçince çubuklar kıyaslanabilir kalır.
// Bugünün son çubuğu süren saattir (son senkrona kadar), soluk çizilir. Dokunma ve yatay sürükleme bir saat seçer
// (LoadChart ile aynı jest); değeri kart başlığı gösterir. Dikey hareket sayfaya kalır.

import { fontFamily } from '@hooplab/theme';
import { useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { useGestureScrollRef } from '@/components/gesture-scroll';
import { hoursPerDay } from '@/data/energy-view';
import { chartIndexAt } from '@/data/recovery-view';
import { usePalette } from '@/theme/appearance';

const plotHeight = 104;
const axisHeight = 16;
const padTop = 6;
/** Çubuklar arası boşluk ve uç yarıçapı (dataviz: 2 px aralık, 4 px yuvarlak uç; dar çubukta daralır). */
const GAP = 2;
const RADIUS = 4;
const ACTIVE_OFFSET_X = 8;
const FAIL_OFFSET_Y = 10;
/** Eksende yazılan saatler. */
const ticks = [0, 6, 12, 18];

interface EnergyHourChartProps {
  hours: readonly (number | null)[];
  /** Ölçeğin üstü (kcal); bütün günlerin en yüksek saati. */
  max: number;
  /** Süren saat (bugün); soluk çizilir. */
  partialHour: number | null;
  accessibilityLabel: string;
  selected: number | null;
  onSelect: (hour: number | null) => void;
}

/** Alt kenarı `bottom`'da duran, üst uçları yuvarlak çubuk. */
function barPath(x: number, w: number, top: number, bottom: number): string {
  const r = Math.min(RADIUS, w / 2, bottom - top);
  return `M${x} ${bottom} V${top + r} Q${x} ${top} ${x + r} ${top} H${x + w - r} Q${x + w} ${top} ${x + w} ${top + r} V${bottom} Z`;
}

export function EnergyHourChart({ hours, max, partialHour, accessibilityLabel, selected, onSelect }: EnergyHourChartProps) {
  const palette = usePalette();
  const scrollRef = useGestureScrollRef();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const slot = width / hoursPerDay;
  // Jest bir kez kurulur; güncel genişlik, saatler ve seçim ref'ten okunur. Verisi olmayan saat seçilmez.
  const latest = useRef({ width, slot, hours, selected, onSelect });
  latest.current = { width, slot, hours, selected, onSelect };

  const gesture = useMemo(() => {
    const hourAt = (x: number) => {
      const { width: w, slot: s, hours: hs } = latest.current;
      const i = chartIndexAt(x, w, hoursPerDay, s / 2);
      return i !== null && hs[i] !== null ? i : null;
    };
    const pick = (x: number) => {
      const i = hourAt(x);
      if (i !== null && i !== latest.current.selected) latest.current.onSelect(i);
    };
    // Parmak kalkınca seçim kalkar; dokunmanın seçimi kalır, aynı saate yeniden dokunma kaldırır.
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
        const i = hourAt(e.x);
        latest.current.onSelect(i === latest.current.selected ? null : i);
      });
    return Gesture.Race(pan, tap);
  }, [scrollRef]);

  let body = null;
  if (width > 0) {
    const top = Math.max(max, 1) * 1.08;
    const base = plotHeight - 1;
    const y = (v: number) => base - (v * (base - padTop)) / top;
    const barW = Math.max(slot - GAP, 1);
    const label = { fill: palette.inkMuted, fontFamily: fontFamily.bodySemiBold, fontSize: 10 };

    body = (
      <Svg width={width} height={plotHeight + axisHeight}>
        <Line x1={0} x2={width} y1={base + 0.5} y2={base + 0.5} stroke={palette.line} strokeWidth={1} />
        {hours.map((v, h) => {
          if (v === null || v <= 0) return null;
          const fill = selected === null ? palette.inkSecondary : h === selected ? palette.ink : palette.dot;
          return (
            <Path
              key={h}
              d={barPath(slot * h + GAP / 2, barW, Math.min(y(v), base - 2), base)}
              fill={fill}
              opacity={h === partialHour && h !== selected ? 0.4 : 1}
            />
          );
        })}
        {ticks.map((h) => (
          <SvgText key={h} x={slot * h + GAP / 2} y={plotHeight + 12} textAnchor="start" {...label}>
            {String(h).padStart(2, '0')}
          </SvgText>
        ))}
      </Svg>
    );
  }

  return (
    <GestureDetector gesture={gesture} touchAction="pan-y">
      <View
        onLayout={onLayout}
        style={{ height: plotHeight + axisHeight, marginTop: 8 }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Bir saate dokun ya da parmağını yana kaydır; o saatin değeri başlıkta görünür."
      >
        {body}
      </View>
    </GestureDetector>
  );
}
