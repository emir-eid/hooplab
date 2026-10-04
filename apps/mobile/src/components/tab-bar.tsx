// Yüzen cam sekme çubuğu (maket: .tabwrap, .tabbar, .tab, .fab). Expo Router Tabs'ın tabBar prop'una verilir.
// Sağdaki artı düğmesi kayıt seçicisini (app/add.tsx) açar.

import { layout, radius, size, spacing } from '@hooplab/theme';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { usePalette } from '@/theme/appearance';

/** Sekme rotalarının ikonları. Yeni sekme eklenirse burada da tanımlanır. */
const tabIcons: Record<string, IconName> = {
  index: 'today',
  trend: 'trend',
  coach: 'coach',
  me: 'me',
};

/**
 * Çubuğun ekranın alt kenarına uzaklığı. Maket 30 pt; iPhone'un ana ekran çizgisi alanı 34 pt.
 * Güvenli alanı olmayan ekranlarda (web, eski iPhone) en az 16 pt. Cihazda bakılacak (LESSONS: sabit sayı yazılmaz).
 */
function useTabBarBottom(): number {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom - 4, spacing[4]);
}

/** Kaydırılan içeriğin altında bırakılacak boşluk: son kart çubuğun arkasında kalmasın. */
export function useTabBarSpace(): number {
  return useTabBarBottom() + size.tabBar + spacing[6];
}

/** Çubuğun arkasındaki geçiş yüksekliği (maket .tabwrap: 110 pt, alt boşluk 30 iken). */
const FADE_ABOVE_BAR = 18;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const palette = usePalette();
  const bottom = useTabBarBottom();
  const fadeHeight = bottom + size.tabBar + FADE_ABOVE_BAR;

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]}>
      <Svg style={[StyleSheet.absoluteFill, styles.fade, { top: undefined, height: fadeHeight }]}>
        <Defs>
          <LinearGradient id="tab-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.bg} stopOpacity={0} />
            <Stop offset="0.55" stopColor={palette.bg} stopOpacity={0.9} />
            <Stop offset="1" stopColor={palette.bg} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#tab-fade)" />
      </Svg>

      <View style={[styles.bar, { boxShadow: palette.shadow.float }]} accessibilityRole="tablist">
        <BlurView
          intensity={40}
          tint={palette.scheme === 'dark' ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, styles.glass, { backgroundColor: palette.glass }]}
        />
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          if (!descriptor) return null;
          const label = descriptor.options.title ?? route.name;
          const focused = state.index === index;
          const color = focused ? palette.ink : palette.inkSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={[styles.tab, focused && { backgroundColor: palette.tabActive }]}>
              <Icon name={tabIcons[route.name] ?? 'today'} color={color} size={23} strokeWidth={1.9} />
              <Text variant="tabLabel" tone={focused ? 'ink' : 'inkSecondary'} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push('/add')}
        accessibilityRole="button"
        accessibilityLabel="Kayıt ekle"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.strong, boxShadow: palette.shadow.float },
          pressed && styles.fabPressed,
        ]}>
        <Icon name="plus" color={palette.onStrong} size={size.icon} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    pointerEvents: 'box-none',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: layout.tabBarGap,
    paddingHorizontal: spacing[4],
  },
  fade: {
    pointerEvents: 'none',
  },
  bar: {
    flex: 1,
    height: size.tabBar,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[1.5],
  },
  glass: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fab: {
    width: size.fab,
    height: size.fab,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  tab: {
    flex: 1,
    height: size.tabBar - spacing[2.5],
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[0.5],
  },
});
