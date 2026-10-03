# 0014. Uygulama iskeleti: apps/mobile, özel cam sekme çubuğu, cihazda saklanan görünüm tercihi

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** [0002](0002-platform-expo-react-native.md), [0010](0010-tasarim-yonu-hale.md), [0013](0013-tasarim-tokenlari.md), [apps/mobile/README.md](../../apps/mobile/README.md)

## Bağlam
Faz 1'in ilk işi: Expo uygulamasının iskeleti. Token'lar `@hooplab/theme` paketinde hazır (0013). İskelet sonradan değiştirmesi pahalı birkaç karar içeriyor: SDK sürümü, klasör düzeni, sekme çubuğunun native mi özel mi olacağı ve tema tercihinin nerede saklanacağı. Görsel doğrulama önce web önizlemesinde yapılıyor (Mac yok, 0002); bu yüzden iskeletin web'de de çalışması gerekiyor.

## Seçenekler
1. **SDK:** 57 (npm `latest`, 57.0.26) veya 58 (`next`, beta). 57 seçildi: App Store'daki Expo Go kararlı SDK'yı çalıştırır, beta bunu bozar.
2. **Sekme çubuğu:** (a) `expo-router/unstable-native-tabs` (iOS 26 native cam çubuk); (b) JS sekmeler (`expo-router/js-tabs`) ve maketteki çubuğu çizen özel `tabBar`. (b) seçildi: maket (0010) yüzen cam çubuk + artı düğmesi tasarlıyor; native sekmeler artı düğmesini ve maketteki ölçüleri vermiyor, web'de de çalışmıyor (şablon web için ayrı dosya istiyordu).
3. **Tercihin saklanması:** (a) `expo-secure-store`; (b) `@react-native-async-storage/async-storage`; (c) Supabase. (b) seçildi: tema sır değil, Expo Go'da hazır ve web'de localStorage'a düşüyor. Sunucu tarafı gereksiz; tercih cihaza özgü.
4. **Native parçaların teması:** Uygulama Açık/Koyu seçildiğinde `Appearance.setColorScheme` ile native parçalar (anahtar, klavye, menüler) de aynı temaya geçer; Sistem seçilince `'unspecified'` ile iPhone ayarına bırakılır.

## Karar
- `apps/mobile` (`@hooplab/mobile`), npm workspace; `create-expo-app` `default@sdk-57` şablonundan, demo dosyaları silindi. TypeScript strict + `noUncheckedIndexedAccess`; Node tipleri uygulamaya girmez, testler ayrı `tsconfig.test.json` ile.
- Düzen Expo'nun önerdiği gibi: `src/app` yalnız rotalar (`(tabs)`: Bugün, Trend, Koç, Ben; Ben içinde yığın: Görünüm), `src/components`, `src/theme`, `src/utils`; testler kaynağın yanında.
- Metro monorepo'yu kendisi yapılandırıyor (`@expo/metro-config`); `metro.config.js` yok. Tema paketinin `.ts` uzantılı importları Metro'da ve `tsc`'de (`allowImportingTsExtensions`) çözülüyor.
- Renkler yalnız `usePalette()` ile; metin tek `Text` bileşeninden (`variant` + `tone`). Fontlar açılış ekranı açıkken yüklenir; tercih okunmadan ekran açılmaz (tema yanıp sönmez).
- Uygulamanın tip denetimi ve testleri `npm run check`, pre-push ve CI'da.

## Sonuçlar
- Sekme çubuğunun erişilebilirliği, cam görünümü ve dokunma geri bildirimi bizim sorumluluğumuzda; native çubuğun bedava verdiği iOS 26 cam efektinden vazgeçildi.
- Artı düğmesi (kayıt ekle) kayıt formlarıyla birlikte gelecek; şimdilik çubuk tam genişlik.
- Uygulama simgesi ve açılış görseli şablondan (yer tutucu); Faz 1 sonunda (TestFlight öncesi) değişecek.
- **Yeniden değerlendirme tetikleyicisi:** özel çubuk cihazda native hissettirmezse (kaydırma, cam, erişilebilirlik) veya Expo native sekmeler özel düğme desteği kazanırsa (a)'ya dönülür.
