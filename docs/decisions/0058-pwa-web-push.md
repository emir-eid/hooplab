# 0058. PWA bildirimleri: sunucudan Web Push (VAPID, `web-push`), 15 dakikalık zamanlayıcı

- **Durum:** Kabul edildi (kullanıcı, 2026-11-05: "kurulsun")
- **Tarih:** 2026-11-05
- **İlgili:** [0045](0045-yerel-bildirimler.md) (iPhone uygulamasında yerel bildirimler; metinler ve tercihler), [0046](0046-mac-takvimi-ve-mac-cevresi.md), [0054](0054-pwa-yedek-yolu.md) (PWA; bildirim yolu kararı buraya bırakılmıştı), [oturum raporu](../sessions/2026-11-05-1237-pwa-yayini.md)

## Bağlam
2026-11-03'ten beri asıl kullanım PWA (`app.hooplab.dev`). Yerel bildirimlerin (0045) web'de karşılığı yok: check-in, maç sabahı ve "senkron durdu" hatırlatmaları PWA'da gelmiyordu. iOS 16.4'ten beri ana ekrana eklenmiş web uygulamaları Web Push alabiliyor (WebKit, 2023): manifest `display: standalone`, Push API + Notifications API + service worker; izin yalnız bir dokunuşa yanıt olarak istenebilir; Apple Developer üyeliği gerekmez.

## Seçenekler
1. **Bildirimsiz PWA:** iş yok; hatırlatma yok.
2. **Sunucudan Web Push (seçilen):** tercih ve abonelik Supabase'te, zamanlayıcı gönderir.
3. **Yalnız açılışta uygulama içi hatırlatma:** bildirim değil; asıl amaç (uygulamayı açmadan hatırlatma) karşılanmaz.

Kütüphane: `npm:web-push` 3.6.7 (Node için yazılmış, yaygın; `aes128gcm`) Supabase'in yerel Edge Runtime'ında (Deno 2.1 uyumlu) denendi: şifreleme ve VAPID imzası çalıştı (2026-11-05). Alternatif `@negrel/webpush` (Deno / WebCrypto) seçilmedi: sayfası şifreleme uzmanınca incelenmediğini söylüyor.

## Karar
- **Tablolar** (migration `20261105140528_web_push`): `push_subscriptions` (push servisinin adresi ve tarayıcının şifreleme anahtarları; tek sahip RLS), `notification_prefs` (hatırlatma açık / kapalı, saatler, saat dilimi; tek sahip RLS), `push_log` (gönderilen hatırlatmanın türü ve anahtarı; yalnız `service_role`; aynı hatırlatma bir kez). Gönderim fonksiyonu o günün check-in'i ve maçı için `daily_checkins` ve `match_days`'i yalnız okur.
- **Zamanlayıcı:** pg_cron `pwa-bildirim-gonderimi`, `1,16,31,46 * * * *` → `push-dispatch` (Vault'taki adres ve senkronla aynı paylaşılan sır; sır yalnız tetiklemeye yarar).
- **Plan** (`_shared/push/plan.ts`, saf ve testli): kullanıcının saat diliminde seçilen saatten sonraki 60 dakika içinde; check-in o gün yapıldıysa gitmez; maç sabahı yalnız maç günü (metinde yalnız maç saati); senkron `reconnect_required` ise 09:00'dan sonra, her kopma için bir kez. Geçersiz saat diliminde gönderim yok. Önce `push_log`'a yazılır (çakışırsa gönderilmez); hiçbir cihaza ulaşamazsa kayıt silinir, pencere içinde sonraki çalışma yeniden dener. 404 / 410 dönen abonelik silinir.
- **Metinler** iPhone'daki yerel planla aynı; eşitlik ve "sayı yok" testle denetlenir (kilit ekranında görünürler).
- **İstemci:** `public/sw.js` yalnız `push` ve `notificationclick` dinler; `fetch` dinleyicisi ve sayfa önbelleği yok (güncellemeler takılmaz, 0054). Ben → Bildirimler web'de aynı anahtarlar: açılınca izin istenir (dokunuşun içinde, ilk `await`'ten önce), abone olunur, tercih ve cihazın saat dilimi Supabase'e yazılır. "Deneme bildirimi gönder" `push-test` fonksiyonunu çağırır. Ana ekrana eklenmemiş Safari'de ekran ne yapılacağını söyler.
- **Sırlar:** VAPID özel anahtarı Supabase secrets `VAPID_PRIVATE_KEY` (yedeği `private/push/vapid.json`); açık anahtar `VAPID_PUBLIC_KEY` ve uygulamada `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (herkese açık değer; `pwa:build` yoksa derlemez). İletişim adresi `VAPID_SUBJECT` = `https://hooplab.dev` (kişisel e-posta gerekmez).
- **iPhone uygulaması (Expo Go / ileride TestFlight)** değişmedi: yerel bildirim (0045). İkisinde de hatırlatma açılırsa aynı hatırlatma iki kez gelebilir; push bildirimleri TestFlight'la gelince birleştirilir.

## Sonuçlar
- Yeni dış servis: tarayıcının push servisi (iPhone'da Apple, `web.push.apple.com`) şifreli yükü ve abonelik adresini görür; içerik uçtan uca şifreli (RFC 8291), yükte sağlık değeri yok.
- Bildirim saati en çok ~15 dakika gecikebilir (zamanlayıcı aralığı); pg_cron ayrıca gecikirse 60 dakikalık pencere içinde yakalanır.
- Edge Function çağrısı ayda ~2.900 artar (96 / gün).
- `web-push` kök devDependency (tip denetimi ve testler için); fonksiyonlar `npm:web-push@3.6.7` ile çeker.
- **Yeniden değerlendirme tetikleyicisi:** iOS ana ekran web uygulamalarında push davranışı değişirse; Apple onayı gelip TestFlight ve native push gelince (iki yol tek plana iner).
