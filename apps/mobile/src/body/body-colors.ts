// Mankenin renkleri paletten türetilir (açık ve koyu tema). Ağrı 1-10 tek tonlu sıralı ölçek:
// soluk mercan → koyu kırmızı (Hale'nin kırmızı durumu). Renk tek başına anlam taşımaz; değer listede yazılı.

import { mix, type Hex, type Palette } from '@hooplab/theme';

export interface BodyColors {
  background: Hex;
  /** Bölgesiz parçalar. */
  skin: Hex;
  /** Ağrısız kas pedleri: gövdeden bir ton ayrışır, bölgeler seçilebilir görünür. */
  pad: Hex;
  painLow: Hex;
  painHigh: Hex;
  /** Çok günlü aralıkta "bu bölgede ağrı girildi" işareti (derece göstermez). */
  marked: Hex;
  /** Bölge yükü görünümü: "toparlanma penceresinde çalıştı" (tahmin). Nötr ton; kırmızı ve risk anlamı yok. */
  worked: Hex;
  /** Seçili bölgenin ton kaydığı renk (metin rengi). */
  selected: Hex;
  /** Zemin gölgesi ve opaklık çarpanı (koyu zeminde siyah gölge daha yoğun olmalı). */
  shadow: Hex;
  shadowStrength: number;
}

export function bodyColors(palette: Palette): BodyColors {
  const dark = palette.scheme === 'dark';
  const skin = mix(palette.ink, palette.cardMuted, dark ? 0.3 : 0.16);
  const pad = mix(palette.ink, palette.cardMuted, dark ? 0.38 : 0.24);
  const red = dark ? palette.status.red : palette.statusInk.red;
  return {
    background: palette.bg,
    skin,
    pad,
    painLow: mix(palette.status.red, skin, 0.4),
    painHigh: red,
    marked: mix(palette.status.red, skin, 0.75),
    worked: mix(palette.ink, skin, dark ? 0.62 : 0.55),
    selected: palette.ink,
    shadow: dark ? '#000000' : palette.ink,
    shadowStrength: dark ? 3 : 1,
  };
}

/** 1-10 ağrının rengi; 0 veya geçersiz değerde null (ped rengi kalır). */
export function painColor(colors: BodyColors, pain: number): Hex | null {
  if (!Number.isInteger(pain) || pain < 1 || pain > 10) return null;
  return mix(colors.painHigh, colors.painLow, (pain - 1) / 9);
}
