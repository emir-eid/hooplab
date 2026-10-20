# 0054. Apple kaydı uzarsa PWA yedek yolu

- **Durum:** Önerildi (karar tarihi kullanıcıda; öneri 2026-11-03)
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
Öneri: **2026-11-03'e kadar seçenek 1.** O güne kadar Apple'dan sonuç gelmezse **seçenek 2'ye geçilir**:
- Önce manifest, Google dönüş adresi ve ayrı web derlemesi.
- Bildirim yolu (Web Push ya da bildirimsiz) o zaman ayrıca kararlaştırılır.

Seçenek 3 önerilmez. Seçenek 2'de PWA yalnız yedek olur. Apple onayı gelirse TestFlight yine birinci yoldur, PWA bakımsız bırakılabilir.

2026-11-03, kaydın başlamasından 4 hafta sonrasıdır. Bu bir öneridir; tarihi kullanıcı belirler.

## Sonuçlar
- Kabul edilen: 2026-11-03'e kadar bilgisayar bağımlılığı ve sınırlı bildirimler sürer.
- Seçenek 2 seçilirse açılan iş: Google dönüş adresinin genişlemesi bir güvenlik yüzeyidir. Yalnız tek, sabit bir `https` adresi eklenir, testle birlikte. Yeni sır ve servis eklenirse DATA-INVENTORY ve COSTS aynı commit'te güncellenir.
- **Yeniden değerlendirme tetikleyicisi:**
  - Apple onayı gelirse bu kayıt "Geri çekildi" olur.
  - Apple kaydı reddedilirse karar tarihi beklenmeden seçenek 2'ye geçilir.
  - Expo Go'nun SDK desteği değişip tünel yolu bozulursa da karar tarihi beklenmez.

## Kaynaklar (yalnız teknik olgular)
- Expo, Progressive web apps rehberi: https://docs.expo.dev/guides/progressive-web-apps/
- iOS 16.4 ana ekran web uygulamalarında Web Push: https://9to5mac.com/2023/02/16/iphone-web-app-new-features-ios-16-4/ , https://pushpad.xyz/blog/does-safari-on-ios-support-web-push-notifications/
- Vibration API uygulama raporu (Safari iOS uygulamıyor): https://lists.w3.org/Archives/Public/public-device-apis-log/2024Jun/0061.html
