# 2026-10-04 00:23 — Faz 1: uygulama iskeleti

- **Faz:** 1
- **Durum:** kapandı (/kapat, 00:28)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `b10fbc0` (Blok 1; CI yeşil), bu raporun kapanış commit'i

## Blok 1 — apps/mobile iskeleti (00:23)

### Amaç
Faz 1'in ilk işi: Expo uygulamasının iskeleti. `@hooplab/theme` bağlansın, Metro workspace paketini ve `.ts` importlarını çözsün, fontlar alt yol importuyla yüklensin, Sistem / Açık / Koyu tema seçimi çalışsın. Web önizlemesinde ve iPhone'da (Expo Go) doğrulansın.

### Yapılanlar
- `apps/mobile` (`@hooplab/mobile`): `create-expo-app` `default@sdk-57` şablonundan; şablonun demo ekranları, `AGENTS.md`, `LICENSE`, `.claude/`, `.vscode/` ve kullanılmayan görselleri silindi. Kökte npm workspace'e eklendi (`apps/*`). SDK 57: npm `latest` (57.0.26); 58 hala beta, Expo Go kararlı SDK'yı çalıştırır.
- Bağımlılıklar `npx expo install` ile (SDK uyumlu): `expo-blur`, `react-native-svg`, `@react-native-async-storage/async-storage`, `@expo-google-fonts/figtree`, `@expo-google-fonts/bricolage-grotesque`. Kullanılmayan şablon paketleri (`@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`) çıkarıldı.
- Rotalar ([src/app](../../apps/mobile/src/app/)): kök yığın → `(tabs)`: Bugün, Trend, Koç, Ben; Ben içinde yığın ve Görünüm alt sayfası. İçerik ekranları "yakında" kartı.
- Tema: [appearance.tsx](../../apps/mobile/src/theme/appearance.tsx) tercihi AsyncStorage'da saklar, okunana kadar açılış ekranı açık kalır; `Appearance.setColorScheme` ile native parçalar seçilen temaya uyar; `expo-system-ui` kök rengi. Saklanan değerin okunması saf fonksiyon ve testli ([stored-appearance.ts](../../apps/mobile/src/theme/stored-appearance.ts)).
- Bileşenler ([src/components](../../apps/mobile/src/components/)): `Text` (`variant` + `tone`), `Card`, `Screen`, `PageHeader`, gruplu liste, maketteki yüzen cam sekme çubuğu (`expo-blur`, SVG geçiş), çizgi ikonları (maketin ikon seti), tema seçici (SVG önizlemeler).
- Fontlar [fonts.ts](../../apps/mobile/src/theme/fonts.ts): Figtree ve Bricolage alt yoldan, opsz 96 kesimi `@hooplab/theme/fonts/...` ile; anahtarlar `FontFamily` tipine bağlı.
- Tip denetimi: `apps/mobile/tsconfig.json` (strict, `noUncheckedIndexedAccess`, `types: []`) ve `tsconfig.test.json`. Kök `typecheck`, yeni `test:apps`, `check`, pre-push ve CI bunları koşar. Kökte `npm run mobile`; `.claude/launch.json` içinde `mobil-web` önizleme yapılandırması.
- Doğrulama: web önizlemesinde 390×844'te dört sekme, Ben → Görünüm → geri, koyu tema, yenilemeden sonra tercihin korunması, Sistem seçiliyken tarayıcının koyu moduna uyum; konsolda hata yok. `expo-doctor` 21/21. iPhone'da (Expo Go) açık ve koyu tema, fontlar, sekme çubuğu, kaydırarak geri dönme ve uygulama kapatılıp açılınca tercihin korunması kullanıcıyla doğrulandı. `npm run check` yeşil (uygulamanın 6 testi dahil).
- Belgeler: [apps/mobile/README.md](../../apps/mobile/README.md), [SETUP.md](../SETUP.md) §8 (iPhone'da açma), [DATA-INVENTORY](../DATA-INVENTORY.md) (görünüm tercihi cihazda; uygulama Google Fonts'a istek atmaz), [COSTS](../COSTS.md) (Expo hesabı durumu).

### Kararlar
- [0014 Uygulama iskeleti](../decisions/0014-uygulama-iskeleti.md): SDK 57; JS sekmeler + maketteki özel cam çubuk (native sekmeler yerine); görünüm tercihi AsyncStorage'da; `Appearance.setColorScheme`.
- Expo Go şimdilik bu bilgisayarda Expo CLI'nin giriş yaptığı mevcut hesapla açılıyor (başka bir projenin hesabı). Yerel geliştirme sunucusu expo.dev'de proje oluşturmaz. HoopLab için ayrı Expo hesabı EAS işinde kararlaştırılacak.

### Sorunlar ve hatalar
- **iOS'ta anahtar satırın üstüne yapışıyordu:** RN `Switch` iOS'ta kendi stiline `alignSelf: 'flex-start'` ekliyor; web önizlemesi bunu göstermedi, cihaz ekran görüntüsünde fark edildi. `ListRow` aksesuarı bir `View` ile sarıldı; cihazda doğrulandı.
- **PNG'ler bozuldu:** Python ile düzenlenen dosyalardaki CRLF'yi temizlerken `sed 's/\r$//'` yanlışlıkla şablon PNG'lerine de uygulandı. Şablon geçici klasöre yeniden indirildi, görseller oradan geri yüklendi ve `cmp` ile birebir aynı olduğu doğrulandı.
- **Web'de konsol hatası ve uyarısı:** `<Svg accessible={false}>` DOM'a sızdı; `pointerEvents` prop'u deprecated. İkisi de düzeltildi.
- **PowerShell `npm` betiğini engelledi** (çalıştırma ilkesi). Çalıştırma ilkesi değiştirilmeden `npm.cmd run mobile` ile çözüldü; SETUP'a yazıldı.
- **Expo Go "signed in to Expo CLI as ... but not to Expo Go"** dedi: CLI bu makinede başka projenin hesabıyla girişli. Kullanıcı Expo Go'da aynı hesapla giriş yaptı.

### Öğrenilenler
- LESSONS "Expo / React Native": SDK 57 import yolları (`expo-router/stack`, `expo-router/js-tabs`, tipler expo-router içinde, `FontSource` dışa aktarılmıyor); uygulama tsconfig'inde `types: []`; `create-expo-app` şablonunun getirdiği dosyalar; iOS `Switch` hizalaması (web önizlemesi native yerleşim için yetmez); react-native-web'de `pointerEvents` ve `accessible`.
- LESSONS "Windows": Python metin modunda CRLF yazar; CRLF temizliği asla toplu ve ikili dosyalara uygulanmaz.

## Açık kalanlar
- Uygulama simgesi ve açılış görseli şablondan (yer tutucu); TestFlight öncesi değişecek.
- Sekme çubuğundaki artı düğmesi kayıt formlarıyla gelecek.
- Tema token'larının cihazda bakılacak kalan noktaları: büyük display yazısında satır kırpması (ekranlarda henüz kullanılmıyor) ve hale kademelenmesi (hale henüz yok).
- HoopLab için Expo hesabı kararı (EAS işinde).

## Sıradaki adım
- Faz 1: Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi.
