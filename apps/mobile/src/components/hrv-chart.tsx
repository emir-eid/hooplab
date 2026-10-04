// HRV grafiği (maket: .chartcard svg): son 21 gecenin değeri (nokta), 7 günlük ortalama (çizgi), kişisel bant (şerit).
// Tek seri; renk kimlik değil, son noktanın halkası günün durumu. Yazılar paletteki metin renginde.
// Dokunma ve yatay sürükleme bir gün seçer (dikey kılavuz); değerleri kart başlığı gösterir. Dikey hareket sayfaya kalır.

import { fontFamily } from "@hooplab/theme";
import { useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { useGestureScrollRef } from "@/components/gesture-scroll";
import { chartIndexAt, type ChartDay } from "@/data/recovery-view";
import { usePalette } from "@/theme/appearance";

const height = 130;
const padX = 6;
const padY = 12;
/** Kaydırıcıyla aynı eşikler (scale-slider): yatay 8 pt sürükleme seçer, dikey 10 pt sayfayı kaydırır. */
const ACTIVE_OFFSET_X = 8;
const FAIL_OFFSET_Y = 10;

interface HrvChartProps {
  days: readonly ChartDay[];
  band: { low: number; high: number } | null;
  /** Son noktanın halkası ve alan dolgusu; durum yoksa nötr. */
  accent: string | null;
  accessibilityLabel: string;
  selected: number | null;
  onSelect: (index: number | null) => void;
}

export function HrvChart({
  days,
  band,
  accent,
  accessibilityLabel,
  selected,
  onSelect,
}: HrvChartProps) {
  const palette = usePalette();
  const scrollRef = useGestureScrollRef();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));

  // Jest bir kez kurulur; güncel genişlik, gün sayısı ve seçim ref'ten okunur.
  const latest = useRef({ width, count: days.length, selected, onSelect });
  latest.current = { width, count: days.length, selected, onSelect };

  const gesture = useMemo(() => {
    const pick = (x: number) => {
      const {
        width: w,
        count,
        selected: current,
        onSelect: select,
      } = latest.current;
      const i = chartIndexAt(x, w, count, padX);
      if (i !== current) select(i);
    };
    // Geri çağrılar JS iş parçacığında: seçim React durumunda, gün başına bir güncelleme.
    // Parmak kalkınca bugüne dönülür. onEnd yalnız etkinleşmiş sürüklemede gelir; dokunmanın seçimi silinmez.
    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
      .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
      .onStart((e) => pick(e.x))
      .onUpdate((e) => pick(e.x))
      .onEnd(() => latest.current.onSelect(null));
    if (scrollRef) pan.blocksExternalGesture(scrollRef);
    // Dokunma seçer; aynı güne yeniden dokunma seçimi kaldırır.
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(ACTIVE_OFFSET_X)
      .onEnd((e, success) => {
        if (!success) return;
        const {
          width: w,
          count,
          selected: current,
          onSelect: select,
        } = latest.current;
        const i = chartIndexAt(e.x, w, count, padX);
        select(i === current ? null : i);
      });
    return Gesture.Race(pan, tap);
  }, [scrollRef]);

  const values = days
    .flatMap((d) => [d.value, d.rolling])
    .filter((v): v is number => v !== null);
  if (band) values.push(band.low, band.high);

  let body = null;
  if (width > 0 && values.length > 0) {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = Math.max(hi - lo, 1);
    const min = lo - span * 0.12;
    const max = hi + span * 0.12;
    const x = (i: number) =>
      padX + (i * (width - padX * 2)) / Math.max(days.length - 1, 1);
    const y = (v: number) =>
      padY + ((max - v) * (height - padY * 2)) / (max - min);

    // Ortalama çizgisi eksik günlerde kesilir; boşluk birleştirilmez.
    let line = "";
    let area = "";
    let segStart: number | null = null;
    let prev: number | null = null;
    days.forEach((d, i) => {
      if (d.rolling === null) {
        if (segStart !== null && prev !== null)
          area += ` L${x(prev).toFixed(1)} ${height} L${x(segStart).toFixed(1)} ${height} Z`;
        segStart = null;
        prev = null;
        return;
      }
      const p = `${x(i).toFixed(1)} ${y(d.rolling).toFixed(1)}`;
      line += segStart === null ? ` M${p}` : ` L${p}`;
      area += segStart === null ? ` M${p}` : ` L${p}`;
      if (segStart === null) segStart = i;
      prev = i;
    });
    if (segStart !== null && prev !== null)
      area += ` L${x(prev).toFixed(1)} ${height} L${x(segStart).toFixed(1)} ${height} Z`;

    const lastIndex = days.findLastIndex((d) => d.rolling !== null);
    const last = lastIndex >= 0 ? days[lastIndex] : undefined;
    const ring = accent ?? palette.inkMuted;
    const label = {
      fill: palette.inkMuted,
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 10,
    };
    const sel = selected !== null ? days[selected] : undefined;

    body = (
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="hrv-area" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ring} stopOpacity={0.28} />
            <Stop offset="1" stopColor={ring} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {band ? (
          <>
            <Rect
              x={0}
              y={y(band.high)}
              width={width}
              height={Math.max(y(band.low) - y(band.high), 2)}
              rx={8}
              fill={palette.band}
            />
            <SvgText
              x={width - 4}
              y={y(band.high) - 5}
              textAnchor="end"
              {...label}
            >
              {Math.round(band.high)}
            </SvgText>
            <SvgText
              x={width - 4}
              y={y(band.low) + 13}
              textAnchor="end"
              {...label}
            >
              {Math.round(band.low)}
            </SvgText>
          </>
        ) : null}
        {area ? <Path d={area} fill="url(#hrv-area)" /> : null}
        {sel && selected !== null ? (
          <Line
            x1={x(selected)}
            x2={x(selected)}
            y1={0}
            y2={height}
            stroke={palette.inkMuted}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}
        {days.map((d, i) =>
          d.value === null ? null : (
            <Circle
              key={d.date}
              cx={x(i)}
              cy={y(d.value)}
              r={2.3}
              fill={palette.dot}
            />
          ),
        )}
        {line ? (
          <Path
            d={line}
            fill="none"
            stroke={palette.ink}
            strokeWidth={2.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {last && last.rolling !== null ? (
          <Circle
            cx={x(lastIndex)}
            cy={y(last.rolling)}
            r={7}
            fill={palette.card}
            stroke={ring}
            strokeWidth={3.5}
          />
        ) : null}
        {sel && selected !== null ? (
          <>
            {sel.value !== null ? (
              <Circle
                cx={x(selected)}
                cy={y(sel.value)}
                r={4.5}
                fill={palette.card}
                stroke={palette.inkSecondary}
                strokeWidth={2}
              />
            ) : null}
            {sel.rolling !== null ? (
              <Circle
                cx={x(selected)}
                cy={y(sel.rolling)}
                r={5}
                fill={palette.ink}
                stroke={palette.card}
                strokeWidth={2}
              />
            ) : null}
          </>
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
        accessibilityHint="Bir güne dokun ya da parmağını yana kaydır; o günün değeri başlıkta görünür."
      >
        {body}
      </View>
    </GestureDetector>
  );
}
