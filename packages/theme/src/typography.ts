// Yazı token'ları. Değerler c-hale.html'deki font tanımlarından; harf aralığı em → pt çevrilmiş.
// Renk burada yok: renk temaya bağlı olduğu için metin bileşeni paletten verir (statik/hook ayrımı).
// Özel fontta kalınlık fontWeight ile değil dosya adıyla verilir; aksi halde iOS sistem fontuna düşer.

/**
 * Font aileleri. Adlar useFonts anahtarlarıdır:
 * - Figtree ve Bricolage 700: @expo-google-fonts paketlerinin dışa aktardığı adlar (alt yol importu, LESSONS).
 * - display: bu paketteki fonts/BricolageGrotesque96pt_800ExtraBold.ttf (opsz 96 kesimi, README "Fontlar").
 */
export const fontFamily = {
  display: 'BricolageGrotesque96pt_800ExtraBold',
  heading: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];

export interface TextToken {
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

/** CSS em cinsinden harf aralığını RN'nin pt değerine çevirir (2 basamak). */
export const em = (value: number, fontSize: number): number =>
  Math.round(value * fontSize * 100) / 100 || 0;

const t = (family: FontFamily, size: number, lineHeight: number, tracking = 0): TextToken => ({
  fontFamily: family,
  fontSize: size,
  lineHeight,
  letterSpacing: em(tracking, size),
});

const f = fontFamily;

export const type = {
  // Bricolage opsz 96: büyük durum etiketi ve rakamlar. Satır yüksekliği font boyutunun altında:
  // iOS'ta harf tepesi kırpılıyor mu cihazda bakılacak (README "Cihazda doğrulanacaklar").
  /** Günün durumu ("Kontrollü"). .state h2 */
  display: t(f.display, 64, 61, -0.035),
  /** Süre sayacı. .dur div */
  numberXL: t(f.display, 60, 60, -0.04),
  /** Seans yükü sonucu. .result b */
  numberL: t(f.display, 54, 54, -0.04),
  /** RPE değeri. .rpe-h b */
  numberM: t(f.display, 52, 52, -0.04),

  // Bricolage opsz 14 (stok dosya): başlıklar ve kart değerleri.
  /** Ekran başlığı ("Bugün", "Görünüm"). .top h1, .ptitle */
  largeTitle: t(f.heading, 34, 37, -0.02),
  /** Kart ana değeri ("59 ms"). .m-v */
  metric: t(f.heading, 34, 34, -0.03),
  /** Form başlığı ("Sabah check-in"). .fhead h2 */
  title2: t(f.heading, 28, 34, -0.02),
  /** Bölüm başlığı ("Gece verisi"). .sec h3 */
  title3: t(f.heading, 21, 25, -0.015),
  /** RPE etiketi ("Zor"). .rpe-h span */
  headline: t(f.heading, 19, 23),
  /** Segment rakamları (1-5). .seg button */
  digit: t(f.heading, 17, 20),

  // Figtree: gövde ve etiketler.
  /** Durum açıklaması. .state p */
  body: t(f.body, 17, 24),
  /** Öneri kartı metni. .advice p */
  bodyCompact: t(f.body, 15.5, 22),
  /** Alt yuvadaki ana düğme ("Kaydet"). .dock .btn */
  buttonLarge: t(f.bodySemiBold, 17, 22),
  /** Soru etiketi, satır içi düğme ("Sabah check-in"). .q .l, .cta */
  callout: t(f.bodySemiBold, 16, 21),
  /** Liste satırı. .row */
  rowLabel: t(f.bodyMedium, 16, 21),
  /** Alt başlık, tarih, kas listesi. .top small, .fsub, .tendon li */
  subhead: t(f.bodyMedium, 15, 20),
  /** Çip ve tema seçici etiketi. .chipset button, .themes button */
  chip: t(f.bodySemiBold, 14, 18),
  /** Kart etiketi, grup başlığı. .m-l, .glabel, .blk > .t */
  footnote: t(f.bodySemiBold, 13, 17),
  /** "Bugünün durumu" üst etiketi. .state .eyebrow */
  eyebrow: t(f.bodySemiBold, 13, 17, 0.02),
  /** Bölüm sağındaki not ("kişisel bant · 60 gün"). .sec small */
  footnoteMedium: t(f.bodyMedium, 13, 19),
  /** Grup altı açıklama. .foot */
  footnoteRegular: t(f.body, 13, 19),
  /** Kart altı not ("bandında"). .m-n */
  caption: t(f.bodyMedium, 12.5, 19),
  /** Ekran altı ince yazı ("Ölçüm değil: ..."). .fine */
  captionRegular: t(f.body, 12.5, 19),
  /** Grafik açıklaması, kas listesindeki not. .lg, .tendon small */
  caption2: t(f.bodyMedium, 12, 16),
  /** "≈ Tahmin" etiketi. .est */
  caption2Strong: t(f.bodySemiBold, 12, 16),
  /** Ölçek uçları ("Çok kötü"). .ends, .track-l */
  micro: t(f.bodyMedium, 11.5, 15),
  /** Sekme etiketi. .tab */
  tabLabel: t(f.bodySemiBold, 10.5, 13),
  /** Kaynak rozeti içindeki numara. .cite */
  badge: t(f.bodyBold, 10.5, 13),
} as const satisfies Record<string, TextToken>;

export type TextVariant = keyof typeof type;
