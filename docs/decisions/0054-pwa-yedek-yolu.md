# 0054. Apple kaydı uzarsa PWA yedek yolu

- **Durum:** Kabul edildi (kullanıcı, 2026-10-20; karar tarihi 2026-11-03)
- **Tarih:** 2026-10-20
- **İlgili:** [0002](0002-platform-expo-react-native.md), [0024](0024-eas-derleme-ve-guncelleme.md), [0045](0045-yerel-bildirimler.md), [0050](0050-portfolyo-sayfasi.md), [0053](0053-alan-adi-ve-google-yayin.md), [denetim 2026-10-20](../audits/2026-10-20.md), [oturum raporu](../sessions/2026-10-20-2302-koc-olcumu-ve-pwa.md)

## Bağlam
Apple Developer kaydı 2026-10-05'ten beri sonuçsuz. EAS derlemesi ve TestFlight buna bağlı (0024). Haftalık denetim, PWA yedek yolu için bir karar tarihi istedi.

Bugünkü kullanım zaten üyeliksiz yürüyor: uygulama Expo Go'da, Metro tüneliyle açılıyor (2026-10-20'de laptop'tan iPhone'da denendi). Bu yolun eksikleri:
- Bilgisayar açık ve Metro çalışır durumda olmalı.
- `expo-notifications` Expo Go'da sınırlı (logdaki uyarı).

Bir PWA bilgisayar bağımlılığını kaldırır ama başka şeylerden vazgeçirir. 0002, PWA'yı ana platform olarak reddetmişti. Bu kayıt yalnız yedek yol içindir.

## Seçenekler
1. **Beklemek (Expo Go + tünel sürer):**
   - Artısı: iş yok, uygulama olduğu gibi çalışır.
   - Eksisi: bilgisayar bağımlılığı sürer, bildirimler sınırlı kalır, uygulama sahada (seyahat, maç) bilgisayarsız açılmaz.
2. **PWA'yı yedek olarak hazırlamak, Apple yolunu açık tutmak:** aynı Expo kodundan `expo export -p web` çıktısı, ana ekrana eklenir.
   - Artısı: üyelik gerekmez, bilgisayardan bağımsız çalışır.
   - Eksisi: aşağıdaki iş listesi kadar emek ister.
3. **Apple'dan vazgeçip yalnız PWA:**
   - Artısı: en hızlı yol.
   - Eksisi: 0002'nin gerekçeleri (titreşim, jest hassasiyeti, arka plan davranışı) hala geçerli; TestFlight için yapılan hazırlık boşa gider.

### Seçenek 2'nin iş listesi (bu repoda doğrulandı)
- **Google bağlantısı:** `isAllowedReturnUrl` ([oauth.ts](../../supabase/functions/_shared/google-health/oauth.ts)) yalnız uygulama şemalarını ve yerel adresleri kabul ediyor. Barındırılan PWA'nın `https` adresi izin listesine eklenmeli, dönüş akışı web'de denenmeli. Supabase Auth yönlendirme adresleri de güncellenmeli.
- **Bildirimler:** check-in ve maç sabahı hatırlatmaları cihazda zamanlanan yerel bildirimler (0045). Web'de karşılığı yok. Bunun yerine sunucudan Web Push gerekir: iOS 16.4'ten beri yalnız ana ekrana eklenmiş web uygulamalarında var ve izin isteği bir dokunuşla tetiklenmeli. Bu, yeni bir sır (VAPID), bir Edge Function ve bir pg_cron görevi demek. Alternatifi PWA'da bildirimsiz kalmak.
- **Titreşim:** WebKit Vibration API'yi 2017'de kaldırdı (W3C uygulama raporu, 2024). PWA'da titreşim yok. Uygulama şu an `expo-haptics` kullanmıyor; bu yüzden kayıp yalnız gelecekteki iş için.
- **Manifest ve önbellek:** Expo'nun PWA rehberine göre manifest bağlantısı `+html.tsx` içine eklenir. Service worker için Workbox önerilir. Rehber, agresif önbelleğin güncellemeleri kilitleyebileceği konusunda uyarıyor. Yalnız manifest (çevrimdışı önbelleksiz) en düşük riskli başlangıç.
- **Barındırma:** demo derlemesi `hooplab.dev` altında herkese açık (0050). Gerçek veriye bağlı ikinci bir derleme ayrı bir alt yola veya alt alana çıkar. Giriş zorunlu, ama herkese açık bir URL olduğu için yayından önce kullanıcı onayı gerekir (CLAUDE.md §7).
- **Cihazda denenecekler:** 3D Vücut (WebKit e2e ve demo çalışıyor, ana ekran kipinde denenmedi), haftalık PDF (`expo-print` web davranışı), paylaşma (`expo-sharing` web karşılığı).

## Karar
**2026-11-03'e kadar seçenek 1.** O güne kadar Apple'dan sonuç gelmezse **seçenek 2'ye geçilir**:
- Önce manifest, Google dönüş adresi ve ayrı web derlemesi.
- Bildirim yolu (Web Push ya da bildirimsiz) o zaman ayrıca kararlaştırılır.

Seçenek 3 önerilmez. Seçenek 2'de PWA yalnız yedek olur. Apple onayı gelirse TestFlight yine birinci yoldur, PWA bakımsız bırakılabilir.

2026-11-03, kaydın başlamasından 4 hafta sonrasıdır; tarihi kullanıcı onayladı (2026-10-20).

## Sonuçlar
- Kabul edilen: 2026-11-03'e kadar bilgisayar bağımlılığı ve sınırlı bildirimler sürer.
- Seçenek 2 seçilirse açılan iş: Google dönüş adresinin genişlemesi bir güvenlik yüzeyidir. Yalnız tek, sabit bir `https` adresi eklenir, testle birlikte. Yeni sır ve servis eklenirse DATA-INVENTORY ve COSTS aynı commit'te güncellenir.
- **Yeniden değerlendirme tetikleyicisi:**
  - Apple onayı gelirse bu kayıt "Geri çekildi" olur.
  - Apple kaydı reddedilirse karar tarihi beklenmeden seçenek 2'ye geçilir.
  - Expo Go'nun SDK desteği değişip tünel yolu bozulursa da karar tarihi beklenmez.

## Erken hazırlık (2026-10-21)
Kullanıcı, Apple'dan bağımsız işlere odaklanmak için kod tarafındaki hazırlığı karar tarihinden önce başlattı. Karar değişmedi: yayın ve barındırma yok, 2026-11-03'e kadar seçenek 1 sürer.
- **Manifest:** `apps/mobile/src/app/+html.tsx` (Expo'nun varsayılan şablonu, `lang="tr"`, `viewport-fit=cover`) manifesti, ana ekran simgesini ve iOS ana ekran meta etiketlerini ekler. `apps/mobile/public/manifest.webmanifest` göreli `start_url` / `scope` ile yazıldı, simgeler `public/icons/` (180, 192, 512; uygulama simgesinden). Service worker yok. Portfolyonun demo derlemesi manifesti almaz (`demoOnlyBuild`).
- **Ölçülen sınır:** alt yolda derlenen tek sayfalık çıktı (`output: single`, `HOOPLAB_WEB_BASE_URL`) `+html.tsx`'i kullanmıyor, manifest o derlemeye girmiyor (LESSONS). PWA derlemesi ya kök adreste static çıktıyla yapılır (ör. ayrı alt alan; portfolyodan ayrı köken, oturum depolaması da ayrılır) ya da tek sayfa için `public/index.html` şablonu yazılır. Seçim yayın adımında yapılır.
- **Google dönüş adresi:** `isAllowedReturnUrl` ikinci parametre olarak ortamdaki `GHEALTH_WEB_RETURN_URL`'i alır. Bu tek bir `https` adresidir; köken ve yol birebir eşleşmeli, sorgu ve parça kabul edilmez. Ayar `https` değilse ya da bozuksa hiçbir web adresi açılmaz. Değişken bugün hiçbir yerde ayarlı değil, davranış değişmedi. Bekçi: `supabase/functions/tests/google-health/dates-oauth.test.ts`.
- **Kalan (yayın adımında):** barındırma ve adres seçimi (kullanıcı onayı), `GHEALTH_WEB_RETURN_URL` Supabase secret'ı ve kurulum sihirbazı, Supabase Auth yönlendirme adresleri, `ghealth-connect` dağıtımı, bildirim yolu kararı. Uygulama simgesi 2026-10-21'de geldi ([0055](0055-uygulama-simgesi.md)). Cihazda: ana ekran kipinde Google bağlantısı (web'de izin ekranı açılır pencerede açılıyor; ana ekran kipinde davranışı denenmedi), 3D Vücut, PDF ve paylaşma.

## Adres ve derleme hazırlığı (2026-10-22)
Kullanıcı yayına hazırlığın önden yapılmasını istedi; yayın yine 2026-11-03'te ve kullanıcı onayıyla.
- **Adres:** `https://app.hooplab.dev`, Vercel (Hobby, ücretsiz; kullanıcı seçimi). Alan adı ve DNS zaten aynı Vercel hesabında; Vercel CLI bu makinede girişli. Portfolyo ve demo (GitHub Pages) ayrı kökende kalır, tarayıcı depolaması paylaşılmaz. Elenenler: EAS Hosting (ücretsiz planda özel alan adı yok, adres `*.expo.app` olurdu, Expo hesabı paylaşılan kişisel hesap), `hooplab.dev/app` (demoyla aynı köken, tek sayfa için ayrı şablon gerekir).
- **Derleme:** `npm run pwa:build` ([build-pwa.mjs](../../tools/pwa/build-pwa.mjs)) kök adreste static çıktı üretir (`apps/mobile/dist-pwa`, gitignore'lu): `+html.tsx` ve manifest girer, Supabase adresi ve publishable anahtar `.env.local`'dan (herkese açık değerler), derleme kimliği boş. Bulut adresi ve publishable anahtar yoksa, demo bayrağı ya da alt yol ayarlıysa derlemez ([pwa-lib.mjs](../../tools/pwa/pwa-lib.mjs), testli).
- **Rotalar:** açıklama sayfası `generateStaticParams` ile her kimlik için ayrı HTML üretir; Vercel'de yönlendirme kuralı gerekmez (`cleanUrls`). Bilinmeyen adres `404.html` (uygulamanın bulunamadı sayfası).
- **Vercel yapılandırması** çıktıya yazılır: HTML her açılışta yeniden doğrulanır (ana ekran kipinde eski sürüm takılı kalmasın), `_expo/static` uzun süre önbelleklenir, `noindex`, çerçeveleme kapalı. Service worker yine yok.
- **Yerelde doğrulandı:** çıktı `cleanUrls` taklidi yapan bir sunucuyla açıldı: giriş ekranı 390×844'te düzgün, `lang="tr"`, manifest ve iOS etiketleri var, konsolda hata yok; `/explain/hrv` 200, bilinmeyen yol 404; girişsiz derin bağlantı girişe yönlendi. Pakette sır ya da derleme kimliği yok (tarandı).
- **Google dönüş adresi:** `https://app.hooplab.dev/me/google-health` (uygulamanın Google ekranı; `pwaReturnUrl`).
- **Yayın günü kalan (sırayla, onaylı):** `pwa:build`; `vercel deploy apps/mobile/dist-pwa --prod` ve projeye `app.hooplab.dev` bağlanması (herkese açık URL: tek satır onay); `GHEALTH_WEB_RETURN_URL` secret'ı ve `ghealth-connect` dağıtımı; COSTS ve DATA-INVENTORY (Vercel barındırma, aynı commit'te); `curl` ile başlık ve yönlendirme denetimi; cihazda ana ekrana ekleme, giriş, Google bağlantısı, 3D Vücut, PDF ve paylaşma. Bildirim yolu kararı ayrı. Supabase Auth yönlendirme adresleri: giriş e-posta ve şifreyle, e-posta bağlantısı kullanılmıyor; yayın günü yine bakılır.

## Hazırlık denetimi (2026-10-27)
Yayın yok; yayın günü yalnız onaylı adımlar kalsın diye önden bakıldı.
- **Derleme SDK 58'le:** `npm run pwa:build` geçti (56 static rota). `cleanUrls` taklidi yapan yerel sunucuda `/`, `/sign-in`, `/explain/hrv`, `/me/google-health` 200, bilinmeyen yol 404, manifest `application/manifest+json`, simgeler 200; giriş ekranı 390×844, konsolda hata yok, yatay taşma yok. `vercel.json` çıktıda.
- **Giriş metni düzeltildi:** web'de oturum `localStorage`'da, şifresiz (`lib/supabase.ts`); giriş ekranı web'de "Oturum bu tarayıcıda saklanır; ortak bir cihazda işin bitince çıkış yap." der, iPhone'da eski metin.
- **DNS:** `hooplab.dev` ad sunucuları Vercel'de; Vercel'in varsayılan joker kaydı (`*` ALIAS) yüzünden `app.hooplab.dev` zaten Vercel'e çözülüyor. Yayın günü DNS kaydı eklenmez, yalnız alan adı projeye bağlanır. `domains inspect`'in "not configured properly" uyarısı kök adresin GitHub Pages'e gitmesinden, beklenen.
- **Vercel hesabı:** CLI girişli hesap, alan adının kayıtlı olduğu hesap; hesapta başka projeler de var (paylaşılan kişisel hesap). HoopLab için proje yok; yayın günü `vercel deploy` ilk çağrıda oluşturur.
- **`ghealth-connect`:** buluttaki Google fonksiyonları 2026-10-15 dağıtımı; o günden sonra yalnız 2026-10-21'deki `GHEALTH_WEB_RETURN_URL` desteği (`2c6dc6c`) dağıtılmadı. Değişken ayarlı değilken davranış aynı (testli). **2026-10-27 21:17 dağıtıldı:** `ghealth-connect`, `ghealth-callback`, `ghealth-sync` v10, sonraki saatlik senkron başarılı ([rapor](../sessions/2026-10-27-2117-ghealth-dagitimi.md)).
- **Yayın günü sırası** (her uzak adım tek satır onayla):
  1. `npm run pwa:build`.
  2. `npx vercel deploy apps/mobile/dist-pwa --prod` (yeni proje; herkese açık URL), ardından `npx vercel domains add app.hooplab.dev <proje>`.
  3. `curl -sI https://app.hooplab.dev/` ve `/explain/hrv`, `/yok`: durum kodları, `X-Robots-Tag: noindex`, `X-Frame-Options: DENY`, `Cache-Control`.
  4. `npx supabase secrets set GHEALTH_WEB_RETURN_URL=https://app.hooplab.dev/me/google-health` (fonksiyonlar 2026-10-27'de dağıtıldı).
  5. COSTS ve DATA-INVENTORY'ye Vercel barındırma (aynı commit).
  6. Cihazda: Safari → ana ekrana ekle, giriş, Google bağlantısı (ana ekran kipinde izin ekranı), 3D Vücut, PDF, paylaşma.
  7. Bildirim yolu kararı (Web Push ya da bildirimsiz) ayrı.

## Prova (2026-10-29)
Apple 2026-10-28'de bir belge daha istedi (gönderildi, sonuç yok); yayın günü sırası yayınsız ve uzak değişikliksiz yürütüldü.
- **Derleme ve yerel sunucu:** `npm run pwa:build` geçti (6,1 MB; pakette sır yok, tek eşleşme kütüphanenin anahtar türü denetimi). Prova tekrarlanabilsin diye `cleanUrls` taklitli yerel sunucu: [serve-pwa.mjs](../../tools/pwa/serve-pwa.mjs) (önizleme adı `pwa-yerel`, yalnız 127.0.0.1). Adresler, manifest, simge, 404 ve 390×844 önceki denetimdeki gibi; demo modunda 3D Vücut çiziliyor.
- **Uzak (salt okuma):** Vercel'de HoopLab projesi yok; `app.hooplab.dev` Vercel'e çözülüyor; `GHEALTH_WEB_RETURN_URL` ayarlı değil; `ghealth-*` v10.
- **Google bağlantısı web'de aynı pencerede:** önceki yol izin ekranını `openAuthSessionAsync` açılır penceresinde, sunucu isteği bittikten sonra açıyordu. Safari kullanıcı dokunuşundan sonra geçen istekle açılan pencereyi engelleyebilir; ana ekran kipinde açılan pencere uygulamaya geri bağlanamayabilir (ölçülmedi, koddan). Web'de artık `window.location.assign` ile aynı pencerede gidilir; dönüş `/me/google-health?ghealth=…` sayfayı yeniden açar, ekran sonucu sorgudan okur. Yerelde sahte Google ile uçtan uca denendi (SETUP §9): aynı sekmede dönüldü, "Bağlandı", durum bağlı, senkron yapıldı. iPhone'da ana ekran kipinde yayın günü denenir.
- **PDF web'de:** ayrı web yolu zaten var ([share-pdf.web.ts](../../apps/mobile/src/lib/share-pdf.web.ts): rapor gizli çerçevede, tarayıcının yazdırma penceresi). Provada sayfanın "kilitlenmesi" bu gerçek yazdırma penceresiydi, hata değil. Düzeltilen yalnız web'deki açıklama: "paylaşım menüsü" yerine yazdırma penceresinden PDF olarak kaydetme. Ana ekran kipinde yazdırma penceresinin açılması cihazda denenir.

## Kaynaklar (yalnız teknik olgular)
- Expo, EAS Hosting özel alan adı (ücretsiz planda yok): https://docs.expo.dev/eas/hosting/custom-domain/
- Vercel, `vercel.json` (`cleanUrls`, `headers`): https://vercel.com/docs/project-configuration/vercel-json
- Expo, Progressive web apps rehberi: https://docs.expo.dev/guides/progressive-web-apps/
- iOS 16.4 ana ekran web uygulamalarında Web Push: https://9to5mac.com/2023/02/16/iphone-web-app-new-features-ios-16-4/ , https://pushpad.xyz/blog/does-safari-on-ios-support-web-push-notifications/
- Vibration API uygulama raporu (Safari iOS uygulamıyor): https://lists.w3.org/Archives/Public/public-device-apis-log/2024Jun/0061.html
