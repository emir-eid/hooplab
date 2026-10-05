# 0024. EAS derleme ve güncelleme: mevcut Expo hesabı, kimlik ortamdan, fingerprint, tek üretim profili

- **Durum:** Kabul edildi. Yapılandırma yerelde doğrulandı (Expo config, `expo-doctor` 21/21, yerel iOS dışa aktarımı, fingerprint). İlk derleme ve TestFlight, Apple Developer üyeliği onaylanınca yapılacak (2026-10-05).
- **Tarih:** 2026-10-05
- **İlgili:** [0002](0002-platform-expo-react-native.md), [0009](0009-herkes-kendi-hesabiyla.md), [0016](0016-dis-servisleri-claude-yurutur.md), [0023](0023-kurulum-sihirbazi-terminalde.md), [COSTS](../COSTS.md), ROADMAP Faz 1

## Bağlam
Faz 1'in bitiş kriteri: uygulama iPhone'da TestFlight'tan kurulu ve her gün kullanılıyor. Mac yok; iOS derlemesi EAS Build bulutunda yapılır. Dört kısıt var:
- Expo hesabı EAS işinde kararlaştırılacaktı (COSTS).
- 0009 gereği proje kimlikleri ve adresler repoya sabit yazılmaz.
- `.env.local` gitignore'lu olduğu için EAS bulutuna gitmez.
- Apple Developer Programı kaydı sürüyor: kimlik doğrulaması reddedildi, Apple'da destek vakası açık. Derleme bu yüzden bekliyor.

## Seçenekler ve kullanıcı kararları
1. **Expo hesabı:**
   - (a) HoopLab'e ayrı yeni hesap; erişim token'ıyla çalışılır, öbür projenin girişi bozulmaz.
   - (b) Bu bilgisayarın girişli olduğu mevcut hesap.

   Kullanıcı (b)'yi seçti. Proje kişisel hesapta (`rotavi`) açıldı, öbür projenin organizasyonuna (`rotaviapp`) değil.
2. **Paket kimliği:**
   - (a) `io.github.emireid.hooplab`, GitHub kullanıcı adına bağlı.
   - (b) `app.hooplab.ios`.

   Kullanıcı (a)'yı seçti.
3. **EAS Update:**
   - (a) ilk derlemeyle birlikte gelir; sonradan eklemek bir derleme daha ister.
   - (b) sonra.

   Kullanıcı (a)'yı seçti.
4. **runtimeVersion politikası:**
   - (a) `fingerprint`: native tarafı etkileyen her değişiklik sınırı kendiliğinden değiştirir.
   - (b) `appVersion`: `update:configure`'un varsayılanı; native değişiklikte sürümü elle artırmak gerekir, unutulursa uyumsuz JS eski derlemeye gidip açılışta çökebilir.

   Kullanıcı (a)'yı seçti.

## Karar
- **Kimlik ortamdan.** [app.config.ts](../../apps/mobile/app.config.ts), `app.json`'un üzerine şu değerleri ekler:
  - `HOOPLAB_IOS_BUNDLE_ID` → `ios.bundleIdentifier`
  - `HOOPLAB_EAS_PROJECT_ID` → `extra.eas.projectId` ve EAS Update adresi (`https://u.expo.dev/<id>`)
  - `HOOPLAB_EAS_OWNER` → `owner`

  Değerler yerelde `apps/mobile/.env.local`'da, bulutta EAS "production" ortam değişkenlerinde durur. Değer yoksa alan yazılmaz; Expo Go ve web önizlemesi aynen çalışır. Bozuk değer derlemeyi durdurur ([build-identity.ts](../../apps/mobile/src/lib/build-identity.ts), testli).
- **Değerleri resmi komutlar üretti, elle uydurulmadı.** Kullanılan komutlar: `eas init`, `eas build:configure`, `npx expo install expo-updates`, `eas update:configure`. Ardından proje kimliği, sahip ve güncelleme adresi `app.json`'dan ortama taşındı. `app.json`'da yalnız `ios.runtimeVersion.policy: fingerprint` kaldı.
- **EAS ortam değişkenleri (production, plaintext):** üç `HOOPLAB_*` değeri ve iki `EXPO_PUBLIC_SUPABASE_*` değeri. Hepsi tasarım gereği herkese açık değerler; EAS'a sır girmez. Apple imza sertifikalarını EAS yönetir (COSTS).
- **`eas.json`:** tek `production` profili.
  - `environment: production`, `channel: production`, `autoIncrement`, `appVersionSource: remote`.
  - Geliştirme profili çıkarıldı: `expo-dev-client` istiyor, proje Expo Go'yla geliştiriliyor.
  - Önizleme profili çıkarıldı: cihaz kaydı (ad hoc) istiyor, gereği yok.
- **`ios.config.usesNonExemptEncryption: false`.** Uygulama yalnız HTTPS kullanır; her TestFlight yüklemesinde şifreleme sorusu çıkmaz.
- **`npm run eas -- <komut>`** ([tools/dev/eas.mjs](../../tools/dev/eas.mjs)). EAS CLI `.env.local`'ı yüklemiyor (ölçüldü). Sarmalayıcı değerleri yalnız alt sürecin ortamına verir ve EAS CLI'ı sabit sürümle (`eas-cli@24.10.0`) kabuksuz çalıştırır.
- **Akış:**
  1. Native değişiklik (paket, izin, eklenti, SDK) olursa: `npm run eas -- build --platform ios --profile production`.
  2. TestFlight'a gönderim için `submit`; her gönderimden önce kullanıcıya tek satır onay sorulur (CLAUDE.md §7).
  3. Yalnız JS, stil veya görsel değişiyorsa: `npm run eas -- update --channel production --environment production --message "..."`. Üretim kanalına yayın da kullanıcı onayıyla yapılır.

## Sonuçlar
- **CLAUDE.md §7 istisnası.** §7, CLI girişlerinin HoopLab'e ayrılmış hesaplarla yapılmasını ister; Expo bu kurala uymuyor. Gerekçe kullanıcının tercihi. Etkileri:
  - aylık 15 iOS derlemesi öbür projeyle paylaşılır
  - o hesaba erişen herkes HoopLab'in EAS ortam değişkenlerini görür (hepsi herkese açık değerler)
  - Expo kotası dolarsa veya hesap paylaşılırsa (a)'ya geçilir. Proje başka bir hesaba taşınabilir; proje kimliği değişirse yalnız ortam değerleri güncellenir.
- TestFlight derlemesi 90 günde kullanılamaz olur: en az üç ayda bir yeni derleme gerekir.
- `fingerprint` ile her native değişiklik yeni derleme ister. Ücretsiz plandaki ayda 15 iOS derlemesi bunu karşılar.
- Klonlayan kişi kendi değerlerini `.env.local`'a ve kendi EAS projesine yazar ([kurulum rehberi](../guides/kurulum.md)). Repoda kimseye ait kimlik yok.
- Expo'ya giden veri [DATA-INVENTORY](../DATA-INVENTORY.md)'de: uygulama kodu, herkese açık ortam değerleri, derleme ve güncelleme paketleri. Sağlık verisi gitmez.
- **Yeniden değerlendirme tetikleyicisi:** Expo kotası yetmezse veya hesap paylaşılırsa (ayrı hesap); Apple kaydı sonuçsuz kalırsa (TestFlight yerine başka kurulum yolu); EAS CLI `.env` dosyalarını kendisi yüklemeye başlarsa (sarmalayıcı sadeleşir).
