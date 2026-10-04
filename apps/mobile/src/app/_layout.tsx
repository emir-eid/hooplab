// Kök düzen: görünüm tercihi, fontlar ve saklanan oturum okunana kadar açılış ekranı açık kalır;
// sonra tema ve gezinme kurulur. Oturum yoksa yalnız giriş ekranına gidilebilir.

import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessionProvider, useSession } from '@/auth/session';
import { AppearanceProvider, useAppearance } from '@/theme/appearance';
import { fontMap } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </AppearanceProvider>
  );
}

function RootNavigator() {
  const { palette, ready } = useAppearance();
  const { session, ready: sessionReady } = useSession();
  const [fontsLoaded, fontError] = useFonts(fontMap);
  // Font yüklenemezse uygulama sistem fontuyla açılır; hata geliştirmede görünsün.
  const loaded = ready && sessionReady && (fontsLoaded || fontError !== null);

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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
        <Stack.Protected guard={session !== null}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: 'fitToContents',
              sheetGrabberVisible: true,
              contentStyle: { backgroundColor: palette.bg },
            }}
          />
          <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
          <Stack.Screen name="session-new" options={{ presentation: 'modal' }} />
        </Stack.Protected>
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
