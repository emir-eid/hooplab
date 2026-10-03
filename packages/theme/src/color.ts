// Renk yardımcıları. Token'lar #RRGGBB ya da #RRGGBBAA biçimindedir (React Native oklch() anlamaz).
// Karışımlar CSS color-mix(in srgb, ...) ile aynı hesaplanır: kanal başına doğrusal, gama uzayında.

export type Hex = `#${string}`;

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#([0-9A-F]{6})([0-9A-F]{2})?$/;

export function isHex(value: string): value is Hex {
  return HEX.test(value);
}

export function parseHex(value: string): Rgba {
  const m = HEX.exec(value);
  if (!m) throw new Error(`Geçersiz renk: ${value} (beklenen #RRGGBB veya #RRGGBBAA, büyük harf)`);
  const rgb = m[1]!;
  return {
    r: parseInt(rgb.slice(0, 2), 16),
    g: parseInt(rgb.slice(2, 4), 16),
    b: parseInt(rgb.slice(4, 6), 16),
    a: m[2] === undefined ? 1 : parseInt(m[2], 16) / 255,
  };
}

const byte = (v: number) =>
  Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();

export function toHex({ r, g, b, a }: Rgba): Hex {
  return `#${byte(r)}${byte(g)}${byte(b)}${a >= 1 ? '' : byte(a * 255)}`;
}

/** color-mix(in srgb, a <weight>, b). Yalnız opak renkler için. */
export function mix(a: Hex, b: Hex, weight: number): Hex {
  const x = parseHex(a);
  const y = parseHex(b);
  if (x.a < 1 || y.a < 1) throw new Error('mix yalnız opak renklerle kullanılır');
  const ch = (p: number, q: number) => p * weight + q * (1 - weight);
  return toHex({ r: ch(x.r, y.r), g: ch(x.g, y.g), b: ch(x.b, y.b), a: 1 });
}

/** Rengin opaklığını değiştirir. color-mix(in srgb, c <alpha>, transparent) ile aynı sonuç. */
export function withAlpha(color: Hex, alpha: number): Hex {
  return toHex({ ...parseHex(color), a: alpha });
}

/** Yarı saydam bir rengi opak bir zeminin üstünde birleştirir (kontrast hesabı için). */
export function over(top: Hex, base: Hex): Hex {
  const t = parseHex(top);
  const b = parseHex(base);
  const ch = (p: number, q: number) => p * t.a + q * (1 - t.a);
  return toHex({ r: ch(t.r, b.r), g: ch(t.g, b.g), b: ch(t.b, b.b), a: 1 });
}

function luminance(color: Hex): number {
  const { r, g, b } = parseHex(color);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.x kontrast oranı (1-21). */
export function contrastRatio(a: Hex, b: Hex): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
