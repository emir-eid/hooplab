// Ölçü token'ları: boşluk, köşe, kontrol boyutları ve sayfa düzeni. Değerler c-hale.html'den.
// Boşluk 2'lik adımlarla 4'lük ızgara üzerinde; maketteki tek seferlik değerler en yakın adıma oturtuldu
// (18 → 16, 22 → 24, 26 → 28, 54 → 56). Liste: README "Maketten sapmalar".

/** Boşluk ölçeği; anahtar 4'ün katı (1.5 = 6). gap ile kullanılır. */
export const spacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
} as const;

/** Köşe yarıçapları. Kapsül dışındaki her köşe borderCurve: 'continuous' ile kullanılır. */
export const radius = {
  /** Ölçer çubuğu. .meter */
  xs: 5,
  /** Grafikteki bant. */
  sm: 8,
  /** Segment içindeki öğe. .seg button */
  md: 11,
  /** İkon kutusu, segment zemini, tema önizlemesi. .ico, .seg, .mini */
  lg: 14,
  /** Küçük kart: metrik ızgarası, soru kartı, liste. .grid .card, .q, .list */
  xl: 22,
  /** Form bloğu, sonuç kartı, tema seçici. .blk, .result, .themes */
  xxl: 24,
  /** Ana kart. .card */
  xxxl: 26,
  /** Kapsül ve daire (yükseklik / 2). */
  full: 9999,
} as const;

/** Kontrol boyutları (yükseklik veya kare kenar). En küçük dokunma hedefi 44. */
export const size = {
  hitTarget: 44,
  icon: 24,
  iconSmall: 18,
  /** Hale üstündeki çip. .chips span */
  chip: 30,
  /** Seçilebilir çip. .chipset button */
  chipLarge: 38,
  /** Kapat düğmesi. .fhead button */
  iconButton: 36,
  /** Öneri ikonu kutusu. .advice .ico */
  iconTile: 40,
  /** Segment öğesi. .seg button */
  segment: 40,
  /** Süre sayacı düğmesi. .dur button */
  stepper: 52,
  /** Liste satırı (en az). .row */
  row: 54,
  /** Satır içi ana düğme. .cta */
  cta: 56,
  /** Alt yuvadaki ana düğme. .dock .btn */
  primaryButton: 58,
  /** Yüzen sekme çubuğu. .tabbar */
  tabBar: 62,
  /** Artı düğmesi. .fab */
  fab: 62,
  /** Kaynak rozeti. .cite */
  citeBadge: 18,
  /** Ölçer ve kaydırıcı izi kalınlığı. */
  meter: 10,
  /** Kaydırıcı topuzu. */
  knob: 22,
  /** İlerleme noktaları. .dots i */
  progress: 6,
  /** Sayfa tutamacı. .grab */
  grabber: { width: 38, height: 5 },
} as const;

/** Sayfa düzeni. */
export const layout = {
  /** Başlık ve metinlerin ekran kenarından içeriği. */
  screenInset: spacing[5],
  /** Kartların ekran kenarından içeriği. */
  cardInset: spacing[4],
  /** Kart iç boşluğu. */
  cardPadding: spacing[4],
  /** Ardışık kartlar arası. */
  cardGap: spacing[3],
  /** Form kartları arası. */
  formGap: spacing[2.5],
  /** İki sütunlu ızgara aralığı. */
  gridGap: spacing[2.5],
  /** Bölüm başlığından önce. */
  sectionGap: spacing[7],
  /** Bugün ekranında başlık ile durum arası (hale için yer). */
  stateTop: spacing[14],
  /** Sekme çubuğu ile artı düğmesi arası. */
  tabBarGap: spacing[2.5],
  /**
   * Sekme çubuğunun ekranın alt kenarına uzaklığı (maket, güvenli alan dahil). Uygulamada sabit yazılmaz:
   * useSafeAreaInsets().bottom ile birlikte ayarlanır (LESSONS), cihazda bakılır.
   */
  tabBarBottom: 30,
} as const;
