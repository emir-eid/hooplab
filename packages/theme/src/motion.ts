// Hareket token'ları ve hale geometrisi. Değerler c-hale.html ve cerceve.css'ten.
// Reanimated: süreler withTiming'e, eğriler Easing.bezier(...curve) ile verilir.
// Hareketi Azalt açıksa hale ve açılış animasyonu durur (shouldAnimateAura, scheme.ts).

/** cubic-bezier kontrol noktaları: [x1, y1, x2, y2]. */
export type Curve = readonly [number, number, number, number];

export const easing = {
  /** Hızlı başlayıp yumuşak duran; kaydırıcı, anahtar, açılış. cubic-bezier(.2, .8, .2, 1) */
  emphasized: [0.2, 0.8, 0.2, 1],
  /** CSS ease-in-out; hale lekelerinin gidip gelmesi. */
  inOut: [0.42, 0, 0.58, 1],
} as const satisfies Record<string, Curve>;

export const duration = {
  /** Seçim geri bildirimi: segment, çip, anahtar zemini. */
  fast: 200,
  /** Kaydırıcı topuzu, anahtar topuzu. */
  base: 250,
  /** Tema geçişinde zemin ve metin rengi. */
  slow: 400,
  /** Hale katmanının opaklığı. */
  auraFade: 600,
  /** Durum değişince hale renkleri. */
  auraColor: 800,
} as const;

/** Ekran açılışında bölümlerin sırayla belirmesi. .rv */
export const reveal = {
  duration: 700,
  easing: easing.emphasized,
  /** Her bölüm bir öncekinden bu kadar sonra başlar. */
  stagger: 60,
  /** Bu sıradan sonraki bölümler aynı anda gelir (7 × 60 = 420 ms). */
  maxStaggerSteps: 7,
  /** Aşağıdan yukarı kayma. */
  offsetY: 14,
} as const;

/**
 * Hale lekesinin radyal gradyan durakları: [offset, opaklık]. Gauss benzeri düşüş.
 * react-native-svg RadialGradient'ta her durak bir <Stop offset stopOpacity />.
 */
export const auraStops = [
  [0, 1],
  [0.2, 0.86],
  [0.4, 0.58],
  [0.6, 0.3],
  [0.8, 0.1],
  [1, 0],
] as const satisfies readonly (readonly [number, number])[];

export interface AuraBlob {
  /** Lekenin çapı. */
  size: number;
  /** Hale katmanının sol üst köşesine göre konum. */
  x: number;
  y: number;
  /** Döngünün ucundaki dönüşüm; başlangıç (0, 0, 1). */
  to: { translateX: number; translateY: number; scale: number };
  /** Bir yönün süresi; ileri-geri döner (alternate). */
  period: number;
  /** Ters fazda başlar (alternate-reverse). */
  reverse: boolean;
}

const drift1 = { translateX: -26, translateY: 20, scale: 1.06 } as const;
const drift2 = { translateX: 20, translateY: 26, scale: 0.95 } as const;

/** Hale katmanı: ekranın üstünden taşar; genişlik = ekran genişliği + 2 × overhangX. */
export const aura = {
  top: -150,
  overhangX: 90,
  height: 600,
  /** Form sayfalarında (check-in) hale bu oranla sönükleşir. */
  sheetOpacityFactor: 0.45,
  /** Lekeler sırayla palette.aura.colors[state] renklerini alır. */
  blobs: [
    { size: 470, x: 170, y: 0, to: drift1, period: 14_000, reverse: false },
    { size: 430, x: 0, y: -40, to: drift2, period: 17_000, reverse: false },
    { size: 320, x: 300, y: 210, to: drift1, period: 19_000, reverse: true },
  ],
} as const satisfies { blobs: readonly AuraBlob[] } & Record<string, unknown>;
