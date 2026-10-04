// Döndürülebilir 3D manken (karar 0018). Yatay sürükleme döndürür, bırakınca süzülerek durur;
// dikey hareket sayfaya kalır. Dokunulan bölge seçilir. Sahne yalnız bir şey değişince çizilir.

import type { BodySpot } from '@hooplab/engine';
import { spacing, type Hex } from '@hooplab/theme';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import type { BodyColors } from '@/body/body-colors';
import { BodyScene } from '@/body/body-scene';
import { useGestureScrollRef } from '@/components/gesture-scroll';
import { Text } from '@/components/text';

interface BodyViewProps {
  colors: BodyColors;
  /** spotKey → renk. */
  paint: Readonly<Record<string, Hex>>;
  selected: BodySpot | null;
  onSelect: (spot: BodySpot | null) => void;
  /** Bu açıya dön (radyan); `token` her istekte değişir, aynı açı yeniden istenebilsin. */
  focus: { yaw: number; token: number } | null;
  height: number;
  accessibilityLabel: string;
}

/** Sürüklenen her nokta başına dönüş (radyan): ekran genişliği kadar sürükleme yaklaşık bir tur. */
const RADIANS_PER_POINT = 0.016;
/** Bırakınca süzülme: hız bu zaman sabitiyle (ms) üstel azalır (iOS kaydırma yavaşlamasına yakın). */
const DECAY_MS = 325;
const MIN_SPEED = 0.00002;
/** Bölgeye dönüş animasyonunun süresi (ms). */
const FOCUS_MS = 520;

export function BodyView({ colors, paint, selected, onSelect, focus, height, accessibilityLabel }: BodyViewProps) {
  const scrollRef = useGestureScrollRef();
  const reduceMotion = useReducedMotion();
  const scene = useRef<BodyScene | null>(null);
  const [failed, setFailed] = useState(false);
  const size = useRef({ width: 1, height });
  const motion = useRef({
    yaw: 0,
    /** radyan / ms */
    speed: 0,
    dragStart: 0,
    focusFrom: 0,
    focusTo: 0,
    focusStart: -1,
    lastTime: 0,
    frame: 0 as number,
  });

  // Hareket nesneleri bir kez kurulur; en güncel değerler bu ref'ten okunur.
  const latest = useRef({ colors, paint, selected, onSelect, reduceMotion });
  useLayoutEffect(() => {
    latest.current = { colors, paint, selected, onSelect, reduceMotion };
  });

  const tick = useRef((time: number) => {
    const m = motion.current;
    const s = scene.current;
    m.frame = 0;
    if (!s) return;
    const dt = m.lastTime ? Math.min(64, time - m.lastTime) : 16;
    m.lastTime = time;
    let moving = false;
    if (m.focusStart >= 0) {
      if (m.focusStart === 0) m.focusStart = time;
      const t = Math.min(1, (time - m.focusStart) / FOCUS_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      m.yaw = m.focusFrom + (m.focusTo - m.focusFrom) * eased;
      moving = t < 1;
      if (!moving) m.focusStart = -1;
    } else if (Math.abs(m.speed) > MIN_SPEED) {
      m.yaw += m.speed * dt;
      m.speed *= Math.exp(-dt / DECAY_MS);
      moving = true;
    } else {
      m.speed = 0;
    }
    s.setYaw(m.yaw);
    s.render();
    if (moving) m.frame = requestAnimationFrame(tick.current);
    else m.lastTime = 0;
  });

  const invalidate = useRef(() => {
    const m = motion.current;
    if (!m.frame) m.frame = requestAnimationFrame(tick.current);
  });

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    let s: BodyScene;
    try {
      s = new BodyScene(gl);
    } catch (error) {
      // 3D açılamazsa uygulama çökmez; liste ve kartlar çalışmaya devam eder.
      console.warn('Vücut modeli açılamadı:', error);
      setFailed(true);
      return;
    }
    scene.current = s;
    const { colors: c, paint: p, selected: sel } = latest.current;
    s.setColors(c);
    s.setPaint(c, p, sel);
    invalidate.current();
  };

  useEffect(() => {
    const s = scene.current;
    if (!s) return;
    s.setColors(colors);
    s.setPaint(colors, paint, selected);
    invalidate.current();
  }, [colors, paint, selected]);

  useEffect(() => {
    if (!focus) return;
    const m = motion.current;
    m.speed = 0;
    const target = nearestAngle(m.yaw, focus.yaw);
    if (latest.current.reduceMotion) {
      m.yaw = target;
      m.focusStart = -1;
    } else {
      m.focusFrom = m.yaw;
      m.focusTo = target;
      m.focusStart = 0;
    }
    invalidate.current();
  }, [focus]);

  useEffect(() => {
    const m = motion.current;
    return () => {
      if (m.frame) cancelAnimationFrame(m.frame);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-6, 6])
      .failOffsetY([-10, 10])
      .onStart(() => {
        const m = motion.current;
        m.speed = 0;
        m.focusStart = -1;
        m.dragStart = m.yaw;
      })
      .onUpdate((e) => {
        const m = motion.current;
        m.yaw = m.dragStart + e.translationX * RADIANS_PER_POINT;
        invalidate.current();
      })
      .onEnd((e, success) => {
        if (!success || latest.current.reduceMotion) return;
        // velocityX: nokta / sn → radyan / ms
        motion.current.speed = (e.velocityX * RADIANS_PER_POINT) / 1000;
        invalidate.current();
      });
    if (scrollRef) pan.blocksExternalGesture(scrollRef);
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(8)
      .onEnd((e, success) => {
        const s = scene.current;
        if (!success || !s) return;
        const { width, height: h } = size.current;
        latest.current.onSelect(s.pick(e.x / width, e.y / h));
      });
    return Gesture.Race(pan, tap);
  }, [scrollRef]);

  return (
    <GestureDetector gesture={gesture} touchAction="pan-y">
      <View
        style={[styles.root, { height }]}
        onLayout={(e) => {
          size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
        }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}>
        {failed ? (
          <View style={styles.failed}>
            <Text variant="subhead" tone="inkSecondary">
              3D model bu cihazda açılamadı. Bölgeler aşağıdaki listede.
            </Text>
          </View>
        ) : (
          <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} msaaSamples={4} />
        )}
      </View>
    </GestureDetector>
  );
}

/** `target` açısının `from`'a en yakın eşdeğeri (tam turlar atlanmasın). */
function nearestAngle(from: number, target: number): number {
  const turn = Math.PI * 2;
  return target + Math.round((from - target) / turn) * turn;
}

const styles = StyleSheet.create({
  root: { width: '100%', overflow: 'hidden' },
  failed: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8] },
});
