// Görünüm tercihleri (Sistem / Açık / Koyu, haleyi canlandır) ve etkin palet.
// Tercih cihazda saklanır; okunana kadar `ready` false kalır ve açılış ekranı açık tutulur (tema yanıp sönmesin).

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultAppearance,
  palettes,
  resolveScheme,
  type AppearancePreferences,
  type ColorScheme,
  type Palette,
  type ThemePreference,
} from '@hooplab/theme';
import * as SystemUI from 'expo-system-ui';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { APPEARANCE_STORAGE_KEY, parseStoredAppearance } from '@/theme/stored-appearance';

interface AppearanceContextValue {
  preferences: AppearancePreferences;
  scheme: ColorScheme;
  palette: Palette;
  ready: boolean;
  setThemePreference: (theme: ThemePreference) => void;
  setAnimateAura: (animateAura: boolean) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppearancePreferences>(defaultAppearance);
  const [ready, setReady] = useState(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)
      .then(parseStoredAppearance, () => defaultAppearance)
      .then((stored) => {
        if (cancelled) return;
        setPreferences(stored);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Native parçalar (anahtar, klavye, sistem menüleri) uygulamanın seçtiği temayı izlesin.
  // 'unspecified' iPhone ayarına geri bırakır; bu durumda useColorScheme yine sistemi döndürür.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Appearance.setColorScheme(preferences.theme === 'system' ? 'unspecified' : preferences.theme);
  }, [preferences.theme]);

  const scheme = resolveScheme(preferences.theme, systemScheme);
  const palette = palettes[scheme];

  // Kök görünümün rengi: ekran geçişlerinde ve klavye açılırken arkada beyaz görünmesin.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.bg).catch(() => {});
  }, [palette.bg]);

  const update = (patch: Partial<AppearancePreferences>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const value: AppearanceContextValue = {
    preferences,
    scheme,
    palette,
    ready,
    setThemePreference: (theme) => update({ theme }),
    setAnimateAura: (animateAura) => update({ animateAura }),
  };

  return <AppearanceContext value={value}>{children}</AppearanceContext>;
}

export function useAppearance(): AppearanceContextValue {
  const value = use(AppearanceContext);
  if (!value) throw new Error('useAppearance, AppearanceProvider içinde kullanılmalı.');
  return value;
}

/** Etkin tema paleti. Renkler yalnız buradan alınır; statik stil dosyaları renk içermez. */
export function usePalette(): Palette {
  return useAppearance().palette;
}
