// Renk token'ları: açık ve koyu tema. Tek kaynak design/maketler/c-hale.html (:root ve [data-tema="koyu"]).
// test/maket-parity.test.ts bu değerleri maketle karşılaştırır; biri değişirse diğeri de değişmeli.
// Token adları maketteki CSS değişkenlerinin karşılığıdır: --bg → bg, --ink2 → inkSecondary ...

import { mix, withAlpha, type Hex } from './color.ts';

export type ColorScheme = 'light' | 'dark';
/** Günün durumu (hesap motorunun çıktısı). Renkler trafik ışığı mantığında; etiketler arayüz metninde. */
export type DayState = 'green' | 'yellow' | 'red';
export const dayStates = ['green', 'yellow', 'red'] as const satisfies readonly DayState[];

type ByState<T> = Record<DayState, T>;

/**
 * Yük grafiğinde seans türü grupları, yığında alttan üste (karar 0026). Kategorik renk: risk anlamı taşımaz,
 * durum renklerinden ayrı tonlar. Sıra renk körlüğü denetiminin parçasıdır (komşu çiftler); değiştirilmez.
 */
export type LoadGroup = 'game' | 'court' | 'gym' | 'light';
export const loadGroups = ['game', 'court', 'gym', 'light'] as const satisfies readonly LoadGroup[];

/**
 * Bugün'deki beslenme göstergeleri (karar 0031): karbonhidrat, protein, su. Kategorik renk, risk anlamı taşımaz;
 * durum renkleri (yeşil / sarı / kırmızı) ve turuncu bu yüzden kullanılmaz (turuncu, durum kırmızısıyla karışıyor).
 */
export type Nutrient = 'carbs' | 'protein' | 'water';
export const nutrients = ['carbs', 'protein', 'water'] as const satisfies readonly Nutrient[];
type AuraColors = readonly [Hex, Hex, Hex];

export interface BasePalette {
  /** Ekran zemini. */
  bg: Hex;
  /** Kart yüzeyi. */
  card: Hex;
  /** Kart içindeki ikincil yüzey (segment zemini, sayaç düğmeleri, ölçer izi). */
  cardMuted: Hex;
  /** Ana metin. */
  ink: Hex;
  /** İkincil metin. */
  inkSecondary: Hex;
  /** Soluk metin: birim, açıklama, dipnot. Her zeminde en az 4,5:1. */
  inkMuted: Hex;
  /** Ayırıcı çizgi. */
  line: Hex;
  /** `ink` dolgulu küçük rozetlerin üstündeki metin (kaynak rozeti, seçili radyo). */
  onInk: Hex;
  /** Ana düğme ve seçili kontrol zemini (açıkta koyu, koyuda açık). */
  strong: Hex;
  onStrong: Hex;
  /** Seans yükü sonucu kartı. */
  result: Hex;
  onResult: Hex;
  /** Sekme çubuğu camı (BlurView üstüne). */
  glass: Hex;
  glassEdge: Hex;
  /** Hale üstündeki yarı saydam etiketler. */
  chip: Hex;
  /** Sekme çubuğunda seçili sekmenin zemini. */
  tabActive: Hex;
  /** Nötr nokta, kılavuz ve pasif kenarlık. */
  dot: Hex;
  /** Grafikteki kişisel bant. */
  band: Hex;
  /** İlerleme ve anahtar izi, rozet zemini. */
  track: Hex;
  /** Kaydırıcı topuzu. */
  knob: Hex;
  /** Durum dolgusu: hale, nokta, ölçer, grafik halkası. Tek başına anlam taşımaz, yanında metin olur. */
  status: ByState<Hex>;
  /** Durum rengi yazı ve ikon olarak: kart ve renkli zemin üstünde en az 4,5:1. */
  statusInk: ByState<Hex>;
  /**
   * Yük grafiğindeki seans türü grupları (maç, saha, kuvvet / kondisyon, hafif). Makette yok; dataviz doğrulayıcısıyla
   * kart zemininde denetlendi (karar 0026). Yanında her zaman açıklama satırı olur; renk tek başına anlam taşımaz.
   */
  loadGroup: Record<LoadGroup, Hex>;
  /**
   * Beslenme göstergeleri (karbonhidrat, protein, su). Makette yok; dataviz doğrulayıcısıyla kart zemininde, üçü
   * birlikte (tüm çiftler) denetlendi (karar 0031). Değerler yük grubunun doğrulanmış tonları; yanında her zaman ad ve sayı.
   */
  nutrient: Record<Nutrient, Hex>;
  /** Kaydırarak silmedeki eylem zemini ve üstündeki yazı (iOS yıkıcı eylem). Makette yok; en az 4,5:1 (karar 0031). */
  destructive: Hex;
  onDestructive: Hex;
  /** Hale lekelerinin renkleri (3 leke) ve katman opaklığı. */
  aura: { opacity: number; colors: ByState<AuraColors> };
  /** boxShadow dizeleri (RN 0.76+ web sözdizimi). */
  shadow: {
    /** Kart. Koyu temada gölge yerine ince bir halka. */
    card: string;
    /** Yüzen öğeler: sekme çubuğu, artı düğmesi. */
    float: string;
    /** Segmentte seçili öğe. */
    selected: string;
    /** Kaydırıcı topuzu. */
    knob: string;
  };
  /** expo-status-bar stili. */
  statusBar: 'dark' | 'light';
}

export interface Palette extends BasePalette {
  scheme: ColorScheme;
  /** Hesaplanan renkler; maketteki color-mix() karşılıkları. */
  derived: {
    /** Öneri ikonunun zemini: durum %16 + kart. */
    statusTint: ByState<Hex>;
    /** Ana düğme içindeki kapsül (ör. "30 sn"): onStrong %14. */
    onStrongSubtle: Hex;
    /** Seçili çipteki sayı rozeti: onStrong %20. */
    onStrongBadge: Hex;
    /** Sekme çubuğunun arkasındaki geçiş (yukarıdan aşağı): bg %0 → bg %90. */
    bgFade: readonly [Hex, Hex];
    /** Alt düğme yuvasının geçişi: bg %0 → bg. */
    bgDock: readonly [Hex, Hex];
  };
}

const sharedShadow = {
  selected: '0 4px 10px -4px rgba(0, 0, 0, 0.4)',
  knob: '0 0 0 0.5px rgba(0, 0, 0, 0.1), 0 3px 8px rgba(0, 0, 0, 0.3)',
} as const;

const light: BasePalette = {
  bg: '#EFEDE8',
  card: '#FFFFFF',
  cardMuted: '#F6F5F1',
  ink: '#15171A',
  inkSecondary: '#4A4E56',
  inkMuted: '#686C74',
  line: '#E5E2DB',
  onInk: '#FFFFFF',
  strong: '#15171A',
  onStrong: '#FFFFFF',
  result: '#15171A',
  onResult: '#FFFFFF',
  glass: '#FFFFFFB8',
  glassEdge: '#0000000F',
  chip: '#FFFFFFB3',
  tabActive: '#15171A12',
  dot: '#CFCBC2',
  band: '#F1EFE9',
  track: '#15171A1A',
  knob: '#FFFFFF',
  status: { green: '#1FA874', yellow: '#E8930C', red: '#E8492F' },
  statusInk: { green: '#077A52', yellow: '#9A6004', red: '#C82709' },
  loadGroup: { game: '#D6528F', court: '#2A78D6', gym: '#4A3AA7', light: '#8B8E95' },
  nutrient: { carbs: '#D6528F', protein: '#4A3AA7', water: '#2A78D6' },
  destructive: '#C82709',
  onDestructive: '#FFFFFF',
  aura: {
    opacity: 0.95,
    colors: {
      green: ['#6EDDB0', '#CBF3E1', '#9BE7C6'],
      yellow: ['#FFC24D', '#FFE3A3', '#FF9F6B'],
      red: ['#FF7A5E', '#FFD3C7', '#FF9C85'],
    },
  },
  shadow: {
    card: '0 1px 2px rgba(20, 20, 20, 0.04), 0 8px 24px -12px rgba(20, 20, 20, 0.12)',
    float: '0 0 0 0.5px rgba(0, 0, 0, 0.06), 0 10px 30px -10px rgba(0, 0, 0, 0.25)',
    ...sharedShadow,
  },
  statusBar: 'dark',
};

const dark: BasePalette = {
  bg: '#0E0F11',
  card: '#18191C',
  cardMuted: '#222327',
  ink: '#F1F0EC',
  inkSecondary: '#B3B5BB',
  inkMuted: '#878A92',
  line: '#2A2B30',
  onInk: '#0E0F11',
  strong: '#F1F0EC',
  onStrong: '#0E0F11',
  result: '#222429',
  onResult: '#F1F0EC',
  glass: '#242529B8',
  glassEdge: '#FFFFFF14',
  chip: '#FFFFFF17',
  tabActive: '#FFFFFF1A',
  dot: '#4A4C52',
  band: '#1F2024',
  track: '#FFFFFF1F',
  knob: '#F1F0EC',
  status: { green: '#3CCB92', yellow: '#FFAE33', red: '#FF6B52' },
  statusInk: { green: '#3CCB92', yellow: '#FFAE33', red: '#FF6B52' },
  loadGroup: { game: '#D9539A', court: '#3B9AE6', gym: '#7D55D9', light: '#7D8088' },
  nutrient: { carbs: '#D9539A', protein: '#7D55D9', water: '#3B9AE6' },
  destructive: '#C9311A',
  onDestructive: '#FFFFFF',
  aura: {
    opacity: 0.5,
    colors: {
      green: ['#2EE6A0', '#0B8A5E', '#3FD9C0'],
      yellow: ['#FFA21F', '#C25E00', '#FF6A2B'],
      red: ['#FF5A3C', '#B0200F', '#FF4D6D'],
    },
  },
  shadow: {
    card: '0 0 0 1px rgba(255, 255, 255, 0.035)',
    float: '0 0 0 0.5px rgba(255, 255, 255, 0.08), 0 10px 30px -10px rgba(0, 0, 0, 0.7)',
    ...sharedShadow,
  },
  statusBar: 'light',
};

function build(scheme: ColorScheme, base: BasePalette): Palette {
  const statusTint = Object.fromEntries(
    dayStates.map((s) => [s, mix(base.status[s], base.card, 0.16)]),
  ) as ByState<Hex>;
  return {
    ...base,
    scheme,
    derived: {
      statusTint,
      onStrongSubtle: withAlpha(base.onStrong, 0.14),
      onStrongBadge: withAlpha(base.onStrong, 0.2),
      bgFade: [withAlpha(base.bg, 0), withAlpha(base.bg, 0.9)],
      bgDock: [withAlpha(base.bg, 0), base.bg],
    },
  };
}

export const palettes: Record<ColorScheme, Palette> = {
  light: build('light', light),
  dark: build('dark', dark),
};
