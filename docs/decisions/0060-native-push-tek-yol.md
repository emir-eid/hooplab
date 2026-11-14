# 0060. iPhone uygulamasında bildirimler: sunucudan Expo push, tek tercih, native varsa yalnız ona

- **Durum:** Kabul edildi (kullanıcı, 2026-11-14). Yerelde doğrulandı:
  - testler ve pgTAP geçti
  - yerel Edge Function'dan gerçek Expo API'sine sahte token'la istek atıldı; `DeviceNotRegistered` geldi, cihaz kaydı silindi

  Bulutta dağıtıldı (migration, `push-dispatch`, `push-test`). Build 0.1.0 (2) TestFlight'tan kuruldu ve deneme bildirimi iPhone'a geldi (2026-11-14, [oturum raporu](../sessions/2026-11-14-1343-testflight.md) Blok 3).
- **Tarih:** 2026-11-14
- **İlgili:**
  - [0045](0045-yerel-bildirimler.md): yerel plan; bu kararla kalktı
  - [0058](0058-pwa-web-push.md): PWA Web Push; plan, metinler ve tercih tablosu buradan geliyor
  - [0024](0024-eas-derleme-ve-guncelleme.md): APNs anahtarı ilk derlemede kuruldu
  - [0015](0015-veritabani-tek-sahip-rls.md)

## Bağlam
Uygulama 2026-11-14'ten beri TestFlight'tan kurulu. İki bildirim yolu vardı:
- iPhone uygulamasında telefonda zamanlanan yerel hatırlatmalar (0045). 7 gün ileriye kurulur, tercih cihazda durur.
- PWA'da sunucudan Web Push (0058). Tercih Supabase'te.

İkisi açıkken aynı hatırlatma iki kez geliyordu; Expo Go'da yerel hatırlatmalar kapalı tutuluyordu. İlk derlemede EAS Push Notifications yetkisini ve APNs anahtarını kurdu, anahtar Expo'da duruyor.

## Seçenekler ve kullanıcı kararları
1. **Taşıma:**
   - (a) **Expo push servisi (seçilen):** yeni Apple adımı yok, az kod. Başlık, metin ve cihaz token'ı Expo'dan geçer.
   - (b) Doğrudan APNs: yalnız Apple görür. Ama kullanıcının yeni bir `.p8` anahtarı üretmesi, Edge Function'da JWT ve HTTP/2 gerekir.
2. **Hem iPhone uygulaması hem PWA kayıtlıyken:**
   - (a) **Native varsa yalnız ona (seçilen):** native kayıt düşerse PWA devralır.
   - (b) Her cihaza: PWA silinene kadar çift bildirim.
3. **Yerel plan:**
   - (a) **Kaldır, tek yol sunucu (seçilen).**
   - (b) Yedek olarak kalsın: çift gelmesini önleyen ek mantık gerekirdi.

## Karar
- **Tercih tek yerde:** Supabase `notification_prefs` (0058'deki tablo). iPhone uygulaması ve PWA aynı satırı okur ve yazar. Uygulama her öne gelişte saat dilimini cihazınkiyle eşitler (seyahat).
- **Plan ve metinler** sunucuda, değişmedi (`_shared/push/plan.ts`; 15 dakikalık zamanlayıcı, pencere, `push_log`). Uygulamadaki yerel plan modülü (`data/notification-plan.ts`) ve zamanlayıcısı (`notifications/scheduler.ts`) silindi. Tercih biçimi ve satır dönüşümü `data/notification-prefs.ts`'te (testli).
- **Cihaz kaydı** (migration `20261114144934_native_push`):
  - `push_devices`: Expo push token'ı, tek sahip RLS, biçim CHECK'i.
  - Uygulama izin verilmişse token'ı açılışta ve her öne gelişte yazar (`upsert`, satır çoğalmaz).
  - Çıkış yapılınca bu cihazın kaydı silinir.
  - Token'ı `getExpoPushTokenAsync({ projectId })` Expo'dan alır; proje kimliği `app.config.ts`'in ortamdan yazdığı `extra.eas.projectId`.
- **Gönderim** (`_shared/push/send.ts`, `expo.ts`):
  - Önce `push_devices`'a Expo push servisi: `POST https://exp.host/--/api/v2/push/send`, 100'lük gruplar, `sound: default`, `ttl` 3600, `collapseId` = tür etiketi.
  - Hiçbir native cihaza ulaşılamadıysa PWA aboneliklerine Web Push (0058).
  - Ulaşılamama durumları: kayıt yok, hepsi `DeviceNotRegistered`, ya da Expo hata verdi.
  - "Deneme bildirimi" (`push-test`) aynı yoldan gider.
- **Makbuzlar:**
  - Expo'nun fişleri `push_tickets`'a yazılır (yalnız `service_role`).
  - `push-dispatch` her çalışmada 15 dakikadan eski fişlerin makbuzunu sorar.
  - `DeviceNotRegistered` gelen cihazın kaydı silinir (uygulama silinmiş): sonraki hatırlatma PWA'ya gider.
  - Kesinleşen ve 24 saatten eski fişler silinir.
  - Bu davranışların kaynağı Expo belgesi (2026-11-14 okundu): makbuza ~15 dakika sonra bakılır, makbuzlar 24 saatte silinir.
- **Eski yerel plan temizliği:**
  - Uygulama açılışta telefonda kalmış `hooplab-` önekli zamanlanmış bildirimleri ve cihazdaki eski tercih anahtarını siler.
  - Eski yerel tercih sunucuya taşınmaz. Kullanıcı yerel hatırlatmaları kapalı tutuyordu; tercih Ben → Bildirimler'den yeniden açılır.
- **Erişim token'ı (Expo "enhanced push security") açılmadı.** Kod `EXPO_ACCESS_TOKEN` Supabase secret'ı verilirse onu `Authorization` başlığına koyar. Expo hesabı kişisel ve paylaşımlı olduğu için (0024) bir hesap token'ı sunucuya konmadı.
- **Ön planda ses:** uygulama açıkken gelen bildirim afiş olarak, sessiz gösterilir (0045'teki gibi). Kapalıyken iOS varsayılan sesi çalar.

## Sonuçlar
- **Yeni dış servis: Expo push** ([DATA-INVENTORY](../DATA-INVENTORY.md)).
  - Expo yükü (başlık, metin, açılacak ekran) ve cihaz token'ını görür; yük Web Push'taki gibi uçtan uca şifreli değil.
  - Metinlerde sağlık değeri yok (testli). Maç hatırlatmasında yalnız maç saati var.
  - Ücretsiz; tek sınır proje başına saniyede 600 bildirim ([COSTS](../COSTS.md)).
- **Token sızarsa:** erişim token'ı açık olmadığı için başkası bu telefona bildirim gönderebilir. Token yalnız Supabase'te, RLS arkasında.
- **Çevrimdışı:** telefon çevrimdışıyken hatırlatma gelmez (yerel yedek yok). Gelen bildirim TTL içinde (1 saat) teslim edilir.
- **Gecikme:** zamanlayıcı aralığı yüzünden bildirim saati en çok ~15 dakika gecikebilir (0058).
- **Expo Go'da:** iOS Expo Go da Expo token'ı alabilir; geliştirme sırasında bildirimler Expo Go'ya gidebilir. Asıl yol TestFlight.
- **Yeniden değerlendirme tetikleyicisi:**
  - Expo push ücretli olursa ya da kesintiler sıklaşırsa (doğrudan APNs).
  - Token sızma riski artarsa (erişim token'ı ve ayrı bir Expo hesabı).
  - Çevrimdışı hatırlatma ihtiyacı doğarsa.

## Kaynaklar (yalnız teknik olgular)
- Expo, gönderim ve makbuz: https://docs.expo.dev/push-notifications/sending-notifications/ (2026-11-14 okundu; sayfa tarihi 2026-11-02)
- Expo push SSS, ücret ve hız sınırı: https://docs.expo.dev/push-notifications/faq/ (2026-11-14 okundu)
- `expo-notifications` 58.1.9 `getExpoPushTokenAsync` tip dosyası; iOS Expo Go'da push kaldırılmadı (yalnız Android, `warnOfExpoGoPushUsage.js`)
