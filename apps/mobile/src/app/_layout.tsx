// Kök düzen: görünüm tercihi ve fontlar yüklenene kadar açılış ekranı açık kalır, sonra tema ve gezinme kurulur.

import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppearanceProvider, useAppearance } from '@/theme/appearance';
import { fontMap } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <RootNavigator />
    </AppearanceProvider>
  );
}

function RootNavigator() {
  const { palette, ready } = useAppearance();
  const [fontsLoaded, fontError] = useFonts(fontMap);
  // Font yüklenemezse uygulama sistem fontuyla açılır; hata geliştirmede görünsün.
  const loaded = ready && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (fontError) console.warn('Fontlar yüklenemedi:', fontError);
  }, [fontError]);

  useEffect(() => {
    if (loaded) SplashScreen.hide();
  }, [loaded]);

  if (!loaded) return null;

  const base = palette.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.ink,
      background: palette.bg,
      card: palette.card,
      text: palette.ink,
      border: palette.line,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={palette.statusBar} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
    </ThemeProvider>
  );
}
