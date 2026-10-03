# @hooplab/theme

C · Hale yönünün tasarım token'ları ([0010](../../docs/decisions/0010-tasarim-yonu-hale.md)): renk (açık + koyu), hale, tipografi, boşluk, köşe, kontrol boyutları, hareket ve görünüm tercihleri. Tek kaynak [design/maketler/c-hale.html](../../design/maketler/c-hale.html). Maket değişirse token da değişir; [test/maket-parity.test.ts](test/maket-parity.test.ts) ikisini birebir karşılaştırır.

| Dosya | İçerik |
|---|---|
| [src/colors.ts](src/colors.ts) | `palettes.light` / `palettes.dark`: yüzey, metin, durum, hale renkleri, gölgeler, türetilen renkler |
| [src/typography.ts](src/typography.ts) | `fontFamily`, `type` (28 yazı stili; her biri maketteki seçicisiyle) |
| [src/layout.ts](src/layout.ts) | `spacing`, `radius`, `size`, `layout` |
| [src/motion.ts](src/motion.ts) | `duration`, `easing`, `reveal`, `auraStops`, `aura` (lekelerin geometrisi ve döngüsü) |
| [src/scheme.ts](src/scheme.ts) | Sistem / Açık / Koyu tercihi, `resolveScheme`, `shouldAnimateAura` |
| [src/color.ts](src/color.ts) | `mix` (CSS color-mix ile aynı), `withAlpha`, `over`, `contrastRatio` |

## Uygulamada kullanım (Faz 1)

- **Renkler yalnız hook ile:** palet temaya bağlı. Uygulama `resolveScheme(tercih, useColorScheme())` ile şemayı bulur, `palettes[şema]`'yı bir context'le dağıtır. Statik stil dosyaları renk içermez; `type` bu yüzden renksizdir, renk metin bileşeninde paletten verilir.
- **Fontlar:** `useFonts` anahtarları `fontFamily` adlarıyla aynı olmalı. Figtree 400/500/600/700 ve Bricolage 700 `@expo-google-fonts/*` paketlerinden **alt yol importuyla** gelir (`@expo-google-fonts/figtree/500Medium`; kökten import paketi şişirir, LESSONS). `display` bu paketteki `fonts/BricolageGrotesque96pt_800ExtraBold.ttf` dosyasıdır.
- **Köşeler:** kapsül dışındaki her `borderRadius` ile `borderCurve: 'continuous'`.
- **Gölgeler:** `boxShadow` dizesi (RN 0.76+ yeni mimari; negatif spread ve çoklu gölge destekli, [RN 0.86 dokümanı](https://reactnative.dev/docs/0.86/view-style-props#boxshadow)).
- **Hale:** `<Aura>` bileşeni `aura.blobs` geometrisini, `auraStops` duraklarını ve `palette.aura.colors[state]` renklerini kullanır ([0011](../../docs/decisions/0011-hale-efekti-svg.md)). Katman genişliği ekran + 2 × `aura.overhangX`. Hareket yalnız `transform`; `shouldAnimateAura(tercih, Hareketi Azalt)` false ise durur.
- **Anahtar (switch):** maketteki anahtar iOS anahtarının taklidi; uygulamada native `Switch` kullanılır (`trackColor` açıkken `status.green`). Ayrı token yok.
- **Dynamic Type:** yazı boyutları taban değer; `allowFontScaling` kapatılmaz.

## Maketten sapmalar

Maketle token arasındaki her fark burada; parity testi de bu listeye göre yazıldı.

1. **Erişilebilirlik düzeltmeleri (maketin kendisine de işlendi, 2026-10-03).** WCAG 2.x ölçümü:
   - `inkMuted` açık temada `#8B8F97` → `#686C74` (kartta 3,24 → 5,27; zeminde 2,77 → 4,50). Koyu temada `#7C7F87` → `#878A92` (ikincil yüzeyde 3,92 → 4,55).
   - `statusInk` eklendi: durum rengi **yazı veya ikon** olarak kullanıldığında. Açık temada yeşil `#077A52`, sarı `#9A6004`, kırmızı `#C82709` (önce sarı 2,44, yeşil 3,04, kırmızı 3,87). Yeni değerler kartta 5,19-5,60, ikincil yüzeyde 4,75-5,13. Koyu temada durum renkleri ikincil yüzeyde bile 5,59+ olduğu için aynı değer.
   - Ton korunarak yalnız OKLab açıklığı değiştirildi; sarı ve yeşilde gamut içinde kalmak için kroma biraz düşürüldü.
   - Durum **dolgusu** (`status`: hale, nokta, ölçer, grafik halkası) değişmedi. Kural: durum rengi tek başına anlam taşımaz, yanında her zaman metin vardır.
2. **Boşluk adımları:** maketteki tek seferlik değerler ölçeğe oturtuldu: 18 → 16, 22 → 24, 26 → 28, 54 → 56.
3. **Satır yüksekliği:** makette `normal` bırakılan yerlerde yaklaşık 1,2 × boyut yazıldı.
4. **Display fontu:** aşağıda.

## Fontlar

React Native değişken font eksenlerini ayarlayamıyor. `@expo-google-fonts/bricolage-grotesque` 0.4.1'deki sabit dosyalar **opsz 14**'te kesilmiş; maket ise büyük durum etiketini `opsz 96` ile çiziyor ve tarayıcı diğer başlıklarda optik boyutu yazı boyuna göre kendisi seçiyor. Ölçüm (wght 800, 64 px, "Toparlanma"): opsz 14 → 382 px, opsz 34 → 374 px, opsz 96 → 341 px genişlik. 14 ile 34 gözle neredeyse aynı; 96 belirgin şekilde sıkı ve maketteki karakteri veren bu.

Karar: 48 pt ve üstündeki dört stil (`display`, `numberXL`, `numberL`, `numberM`) opsz 96 kesimini, diğer Bricolage başlıklar stok 700 dosyasını kullanır. Test bunu zorunlu kılar.

- Dosya: [fonts/BricolageGrotesque96pt_800ExtraBold.ttf](fonts/BricolageGrotesque96pt_800ExtraBold.ttf) (sha256 `bdf7fe2696133e2dba5f1f41967a961f03d4a4a9631961fe2e4961e588009971`)
- Kaynak: [google/fonts](https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque) `BricolageGrotesque[opsz,wdth,wght].ttf`, commit `b9f6c712059d72742282ebdf06eadfc264c827f3` (sha256 `413e7357809ddd12fd80a96a8a396de0e401638d4acd3cb3e37532f0472ac682`)
- Kesim: opsz 96, wght 800, wdth 100. Ad: `Bricolage Grotesque 96pt` / `BricolageGrotesque96pt-ExtraBold` (stok dosyalarla çakışmasın diye). Türkçe karakterlerin hepsi var.
- Yeniden üretim: `python fonts/make-display-font.py <değişken font>` (fontTools 4.62)
- Lisans: SIL Open Font License 1.1, [fonts/OFL.txt](fonts/OFL.txt). Ayrılmış font adı yok; kesim OFL'e göre değiştirilmiş sürümdür ve aynı lisansla dağıtılır.

## Cihazda doğrulanacaklar (Faz 1)

- `display` (64 / 61) gibi satır yüksekliği boyutun altında kalan stillerde iOS'ta harf tepesi veya Türkçe üst işaretler (Ü, İ) kırpılıyor mu.
- Koyu temada kart halkası (`0 0 0 1px` beyaz %3,5) görünüyor mu; görünmüyorsa `line` ile kenarlık.
- Hale gradyanında kademelenme ([0011](../../docs/decisions/0011-hale-efekti-svg.md)).
- Sekme çubuğu camı: `glass` rengi `expo-blur` üstünde maketteki gibi mi.

## Testler

```bash
npm run typecheck
npm run test:packages
```
