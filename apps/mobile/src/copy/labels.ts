// Kayıt formlarının Türkçe etiketleri. Ölçekler @hooplab/engine'de, burada yalnız metin.

import type { BodyRegion, BodySide, RpeAnchor, WellnessItem } from '@hooplab/engine';

export const wellnessLabels: Record<WellnessItem, { title: string; low: string; high: string }> = {
  sleep_quality: { title: 'Uyku kalitesi', low: 'Çok kötü', high: 'Çok iyi' },
  fatigue: { title: 'Yorgunluk', low: 'Çok yorgun', high: 'Çok dinç' },
  soreness: { title: 'Kas ağrısı', low: 'Çok ağrılı', high: 'Ağrı yok' },
  stress: { title: 'Stres', low: 'Çok stresli', high: 'Çok rahat' },
  mood: { title: 'Ruh hali', low: 'Çok kötü', high: 'Çok iyi' },
};

export const regionLabels: Record<BodyRegion, string> = {
  calf: 'Baldır',
  achilles: 'Aşil',
  ankle: 'Ayak bileği',
  patellar_tendon: 'Patellar tendon',
  quadriceps: 'Quadriceps',
  hamstring: 'Hamstring',
  adductor: 'Adduktor',
  hip: 'Kalça',
  lower_back: 'Bel',
  shoulder: 'Omuz',
};

export const sideLabels: Record<BodySide, string> = {
  left: 'Sol',
  right: 'Sağ',
  center: 'Orta',
};

export const sessionKinds = ['team_practice', 'game', 'shooting', 'strength', 'conditioning', 'mobility', 'rehab'] as const;
export type SessionKind = (typeof sessionKinds)[number];

export const sessionKindLabels: Record<SessionKind, string> = {
  team_practice: 'Takım antrenmanı',
  game: 'Maç',
  strength: 'Kuvvet',
  conditioning: 'Kondisyon',
  shooting: 'Şut',
  mobility: 'Mobilite / yoga',
  rehab: 'Rehabilitasyon',
};

/** Değiştirilmiş CR-10'un sözel çapaları (Foster 2001; haddad-2017 tablo 1). 6, 8 ve 9'un karşılığı yok. */
export const rpeAnchorLabels: Record<RpeAnchor, string> = {
  0: 'Dinlenme',
  1: 'Çok çok kolay',
  2: 'Kolay',
  3: 'Orta',
  4: 'Biraz zor',
  5: 'Zor',
  7: 'Çok zor',
  10: 'Maksimal',
};

export function rpeLabel(rpe: number): string | null {
  return rpe in rpeAnchorLabels ? rpeAnchorLabels[rpe as RpeAnchor] : null;
}
