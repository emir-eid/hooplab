// Kök düzen: görünüm tercihi, fontlar ve saklanan oturum okunana kadar açılış ekranı açık kalır;
// sonra tema ve gezinme kurulur. Oturum yoksa yalnız giriş ekranına gidilebilir; demo modu (karar 0022)
// oturum gibi sayılır ama sunucuya dokunmaz.

import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SessionProvider, useSession } from '@/auth/session';
import { fetchProfile, useProfile } from '@/data/profile';
import { useDemoScenario } from '@/demo/demo-mode';
import { useAppleHealthSync } from '@/health/use-apple-sync';
import { useNotifications } from '@/notifications/use-notifications';
import { AppearanceProvider, useAppearance } from '@/theme/appearance';
import { fontMap } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Gesture Handler'ın kökü: GestureDetector'lar (ScaleSlider) bunun altında olmalı.
  return (
    <GestureHandlerRootView>
      <AppearanceProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { palette, ready } = useAppearance();
  const { session, ready: sessionReady } = useSession();
  const demo = useDemoScenario();
  const signedIn = session !== null || demo !== null;
  // İlk giriş profil soruları (karar 0061 sıra 4c): yalnız açıkça yanıtlanmamış profilde; demo ve sahibinde hiç çıkmaz.
  const profile = useProfile();
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (userId && demo === null) void fetchProfile();
  }, [userId, demo]);
  const needsProfile = session !== null && demo === null && !profile.answered;
  const [fontsLoaded, fontError] = useFonts(fontMap);
  // Font yüklenemezse uygulama sistem fontuyla açılır; hata geliştirmede görünsün.
  const loaded = ready && sessionReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (fontError) console.warn('Fontlar yüklenemedi:', fontError);
  }, [fontError]);

  useEffect(() => {
    if (loaded) SplashScreen.hide();
  }, [loaded]);

  // Yerel bildirimler (karar 0045): plan yenileme ve bildirime dokununca açılan ekran.
  useNotifications(session !== null && demo === null, loaded);
  // Apple Health senkronu (karar 0061): yalnız apple_health profilinde ve iPhone'da; sahibinde hiçbir şey yapmaz.
  useAppleHealthSync(session !== null && demo === null && loaded);

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
        <Stack.Protected guard={signedIn && !needsProfile}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
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
          <Stack.Screen name="weight" options={{ presentation: 'modal' }} />
          <Stack.Screen name="meal-new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="grams" options={{ presentation: 'modal' }} />
          <Stack.Screen name="water" options={{ presentation: 'modal' }} />
          <Stack.Screen name="match-edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="trip-edit" options={{ presentation: 'modal' }} />
          <Stack.Screen name="matches" />
          <Stack.Screen name="untagged" />
          <Stack.Screen name="recovery-method" />
          <Stack.Screen name="weekly" />
          <Stack.Screen name="weekly-share" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="explain/[id]"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.6, 1],
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              contentStyle: { backgroundColor: palette.bg },
            }}
          />
          <Stack.Screen
            name="coach-basis"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.6, 1],
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              contentStyle: { backgroundColor: palette.bg },
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={needsProfile}>
          <Stack.Screen name="profile-setup" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
