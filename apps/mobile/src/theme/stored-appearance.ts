// Cihazda saklanan görünüm tercihinin okunması. Saf fonksiyon; testi yanında.

import { defaultAppearance, type AppearancePreferences, type ThemePreference } from '@hooplab/theme';

export const APPEARANCE_STORAGE_KEY = 'hooplab.appearance.v1';

const themes: readonly ThemePreference[] = ['system', 'light', 'dark'];

/** Saklanan değer yoksa, bozuksa veya eski bir biçimdeyse eksik alanlar varsayılana döner. */
export function parseStoredAppearance(raw: string | null): AppearancePreferences {
  if (!raw) return defaultAppearance;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return defaultAppearance;
  }
  if (typeof value !== 'object' || value === null) return defaultAppearance;
  const { theme, animateAura } = value as Record<string, unknown>;
  return {
    theme: themes.find((t) => t === theme) ?? defaultAppearance.theme,
    animateAura: typeof animateAura === 'boolean' ? animateAura : defaultAppearance.animateAura,
  };
}
