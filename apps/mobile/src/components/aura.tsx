// Hale (karar 0011): durum renginde 3 radyal gradyan lekesi; hareket yalnız transform, Reanimated CSS animasyonuyla.
// "Haleyi canlandır" kapalıysa veya Hareketi Azalt açıksa durur (shouldAnimateAura). Etkileşime girmez.

import { aura, auraStops, shouldAnimateAura, type DayState } from '@hooplab/theme';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion, type CSSAnimationKeyframes } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useAppearance } from '@/theme/appearance';

// Anahtar kareler sabit nesne olmalı; her çizimde yenisi animasyonu yeniden başlatır.
const drifts: CSSAnimationKeyframes[] = aura.blobs.map((b) => ({
  to: { transform: [{ translateX: b.to.translateX }, { translateY: b.to.translateY }, { scale: b.to.scale }] },
}));

export function Aura({ state, opacityFactor = 1 }: { state: DayState; opacityFactor?: number }) {
  const { palette, preferences } = useAppearance();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const animate = shouldAnimateAura(preferences.animateAura, reduceMotion);
  const colors = palette.aura.colors[state];

  return (
    <View
      aria-hidden
      style={[
        styles.layer,
        { width: width + 2 * aura.overhangX, left: -aura.overhangX, opacity: palette.aura.opacity * opacityFactor },
      ]}>
      {aura.blobs.map((b, i) => (
        <Animated.View
          key={i}
          style={[
            { position: 'absolute', left: b.x, top: b.y, width: b.size, height: b.size },
            animate && {
              animationName: drifts[i],
              animationDuration: b.period,
              animationIterationCount: 'infinite',
              animationDirection: b.reverse ? 'alternate-reverse' : 'alternate',
              animationTimingFunction: 'ease-in-out',
            },
          ]}>
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id={`hale-${i}`} cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
                {auraStops.map(([offset, opacity]) => (
                  <Stop key={offset} offset={offset} stopColor={colors[i]} stopOpacity={opacity} />
                ))}
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill={`url(#hale-${i})`} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: aura.top, height: aura.height, pointerEvents: 'none' },
});
