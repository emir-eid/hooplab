// Görünüm tercihleri (Ben → Ayarlar → Görünüm) ve bunların temaya çevrilmesi.

import type { ColorScheme } from './colors.ts';

/** Kullanıcının seçimi. Sistem: iPhone'un Ekran ve Parlaklık ayarını izler. */
export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppearancePreferences {
  theme: ThemePreference;
  /** "Haleyi canlandır" anahtarı. */
  animateAura: boolean;
}

export const defaultAppearance: AppearancePreferences = {
  theme: 'system',
  animateAura: true,
};

/**
 * Tercihi ve sistem şemasını etkin temaya çevirir.
 * Sistem şeması bilinmiyorsa (null, 'unspecified') açık tema kullanılır.
 */
export function resolveScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/** Hale yalnız kullanıcı istiyorsa ve iPhone'da Hareketi Azalt kapalıysa hareket eder. */
export function shouldAnimateAura(animateAura: boolean, reduceMotion: boolean): boolean {
  return animateAura && !reduceMotion;
}
