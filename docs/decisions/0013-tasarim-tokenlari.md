# 0013. Tasarım token'ları: @hooplab/theme, maketle birebir test, erişilebilir renkler, opsz 96 kesimi

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** [0010](0010-tasarim-yonu-hale.md), [0011](0011-hale-efekti-svg.md), [oturum raporu](../sessions/2026-10-03-2252-faz05-plugin-ve-rep.md), [packages/theme/README.md](../../packages/theme/README.md)

## Bağlam
Faz 0.5'in bitiş kriteri, seçilen C · Hale yönünün TypeScript tema dosyasına çevrilmesi. Uygulama (`apps/mobile`) henüz yok. Token'ların tek kaynağı maket ([c-hale.html](../../design/maketler/c-hale.html)). Çıkarım sırasında iki sorun ölçüldü:
- Açık temada soluk metin (`--mute`) ve yazı olarak kullanılan durum renkleri, küçük metin için WCAG 4,5:1 eşiğinin altında (sarı 2,44).
- `@expo-google-fonts/bricolage-grotesque` sabit dosyaları opsz 14'te; maket büyük durum etiketini opsz 96 ile çiziyor ve fark görünür (aynı kelime %11 daha dar). React Native değişken font eksenlerini ayarlayamıyor.

## Seçenekler
1. **Konum:** (a) `apps/mobile/src/theme` Faz 1'de; (b) şimdi `packages/theme` workspace paketi. (b) seçildi: Faz 0.5 kendi içinde bitiyor ve test edilebiliyor, `packages/engine` ile aynı düzen.
2. **Maketle tutarlılık:** (a) elle kopyalayıp güvenmek; (b) maketi okuyup her token'ı karşılaştıran test. (b) seçildi.
3. **Kontrast:** (a) maketi aynen almak; (b) yalnız token'da düzeltmek; (c) maketi de düzeltmek. (c) seçildi: maket kaynak olarak kalır ve test birebirliği koruyabilir.
4. **Display fontu:** (a) stok opsz 14 ile yetinmek; (b) Skia ile değişken font; (c) değişken fonttan opsz 96 sabit kesimi üretip pakete koymak. (c) seçildi: tek dosya (~90 KB), ek bağımlılık yok, OFL buna izin veriyor.

## Karar
- Token'lar `packages/theme` içinde (`@hooplab/theme`, npm workspaces). Renk paleti açık/koyu çiftler halinde statik nesneler; renk uygulamada hook ile verilir, yazı stilleri renksizdir (Expo `expo-design-system` skill'inin statik/hook ayrımı).
- `test/maket-parity.test.ts` renkleri, gölgeleri, 37 seçicinin yazı tanımını, köşe ve boyutları, hale geometrisini, süreleri ve eğrileri maketten okuyup karşılaştırır. `test/tokens.test.ts` WCAG eşiklerini (metin 4,5, ikon 3) her iki temada zorunlu kılar.
- Kontrast düzeltmesi: ton korunup OKLab açıklığı değiştirildi. `inkMuted` açıkta `#686C74`, koyuda `#878A92`; yazı/ikon için ayrı `statusInk` (açıkta `#077A52`, `#9A6004`, `#C82709`). Durum dolgusu değişmedi; durum rengi tek başına anlam taşımaz. Kullanıcı onayladı.
- Display fontu: `BricolageGrotesque96pt_800ExtraBold.ttf` yalnız 48 pt ve üstündeki 4 stilde; diğer başlıklar stok 700. Kaynak commit, sha256 ve üretim script'i README'de. Kullanıcı onayladı.
- TypeScript Expo SDK 57 şablonuyla aynı (`~6.0.3`); testler Node'un yerleşik tip ayıklamasıyla koşar. Tip denetimi ve paket testleri push kapısında ve CI'da.

## Sonuçlar
- Maketteki her değişiklik token'da da yapılmak zorunda (test kırılır); bu bilinçli bir sürtünme.
- Bir binary font dosyası repoda; yeniden üretim adımları belgelendi.
- `apps/mobile` Faz 1'de workspace'e eklenecek; Metro'nun `.ts` uzantılı importları ve workspace paketini çözmesi orada doğrulanacak.
- **Yeniden değerlendirme tetikleyicisi:** cihazda satır yüksekliği kırpması, koyu kart halkasının görünmemesi veya opsz 96 kesiminin cihazda farklı görünmesi ([README "Cihazda doğrulanacaklar"](../../packages/theme/README.md)).
