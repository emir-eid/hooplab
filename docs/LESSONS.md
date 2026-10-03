# Dersler ve bilinen tuzaklar

Tekrar yaşanabilecek hatalar ve önceden bilinen tuzaklar. Her madde: **ders**, kanıt veya kaynak, bekçiye çevrildi mi. İlgili bir işe başlamadan önce o bölüm okunur. `/kapat` yeni dersleri buraya ekler.

İşaretler: **[ölçüldü]** bu projede veya önceki bir projede doğrulandı · **[kaynaklı]** resmi kaynakta yazıyor, henüz ölçülmedi · **[doğrulanacak]** ikincil kaynaktan, bu projede ölçülecek.

## Expo / React Native

- **[ölçüldü] `expo-secure-store` değer başına yaklaşık 2048 bayt sınırına sahiptir; Supabase oturumu (JWT + yenileme token'ı + kullanıcı) buna sığmaz.** Düz `setItemAsync` oturumu bazen sessizce yazmaz, kullanıcı "bazen çıkış yapmış oluyorum" der. Çözüm: bayta göre parçalayan bir depolama adaptörü (karaktere göre değil; Türkçe karakter 2, emoji 4 bayt), parçaları önce, manifesti en son yaz. Faz 1'de testli yazılacak. Kaynak: önceki bir Expo SDK 57 projesi. Bekçi: Faz 1'de test.
- **[ölçüldü] `oklch()` renkleri React Native'de çalışmaz.** RN yalnız hex, `rgb()`, `hsl()` ve adlandırılmış renkleri anlar. Tasarım token'ları tek kaynaktan üretilip hex'e çevrilir; sRGB dışı renkler kanal kırpılarak değil kroma azaltılarak dönüştürülür.
- **[ölçüldü] Metro ve watchman Google Drive dosya sisteminde çalışmaz (`EBADF`).** Repo `E:` diskinde, Drive dışında tutulur. Bunun sonucu: `push` tek yedektir, oturum push'suz kapanmaz.
- **[ölçüldü] Metro `.env` değerlerini paketleme anında gömer.** `.env` değişince Metro yeniden başlatılır.
- **[ölçüldü] `EXPO_PUBLIC_` değişkenleri uygulama paketinde herkese açıktır.** Bekçi: `herkese-acik-sir-adi` kuralı.
- **[ölçüldü] `@expo-google-fonts/*` paket kökünden import edilmez.** Kök, tüm ağırlıkları yeniden dışa aktarır ve paketi megabaytlarca büyütür. Alt yol importu kullanılır (`@expo-google-fonts/<font>/400Regular`).
- **[ölçüldü] Expo SDK sürümleri arasında import yolları değişebilir** (ör. SDK 57'de `Tabs` artık `expo-router/tabs` yolundan geliyor). API'ler eğitim verisinden varsayılmaz, `node_modules` veya güncel dokümandan doğrulanır.
- **[ölçüldü] Özel fontta italik, `fontStyle: 'italic'` ile değil ayrı font dosyasıyla yapılır.** Aksi halde Android italiği uydurur, iOS uydurmaz.
- **[ölçüldü] Tab bar ve güvenli alan ölçüleri sabit sayıyla yazılmaz**, `useSafeAreaInsets()` ile alınır.
- **[ölçüldü] Test tip denetimi ayrı `tsconfig` ile yapılır.** Node tipleri uygulama koduna sızarsa `fs`/`Buffer` RN'de yokken geçerli görünür.

## Git ve süreç

- **[ölçüldü] Git hook'ları klonla taşınmaz.** Yeni klonda bir kez `npm run hooks:install` (`git config core.hooksPath .githooks`).
- **[ölçüldü] Zaman damgaları `date` komutundan alınır, asla tahmin edilmez.**
- **[ölçüldü] Çöken bekçi, hiçbir şey bulamayan bekçiden kötüdür: kapıyı açık bırakır.** Bekçiler fail-closed yazılır ve negatif testle kanıtlanır. `git ls-files` silinmiş ama stage'lenmemiş dosyayı da listeler; diskte olmayan yol atlanır. Bekçi: `tools/guard/privacy-guard.test.mjs`.
- **[ölçüldü] Görsel iş gözle doğrulanmadan bitmiş sayılmaz.** Rasterleştirip bakmak, kod okurken görünmeyen hataları yakalar. Dosya biçimi iddiaları (ör. "arka plan şeffaf") ölçülür, göz kararına güvenilmez.
- **[ölçüldü] Atlanan doğrulama token tasarrufu değil gizli borçtur.** Tip denetimi ve testler commit/push öncesi yerelde koşar, CI'a devredilmez.

## Windows

- **[ölçüldü] Windows PowerShell 5.1 boruyla native programa veri gönderirken başa BOM ekleyebilir; `JSON.parse` kırılır.** Stdin okuyan script'ler BOM'u atar (`.replace(/^﻿/, '')`). Hata yutan bir hook'ta bu sessiz arızaya dönüşür. Kanıt: 2026-10-03 kurulum oturumu, `tools/hooks/archive-transcript.mjs`. Claude Code hook'ları `bash` ile çalıştırıldığı için asıl yol etkilenmiyordu.
- **[ölçüldü] Google Drive dosya sistemi zaman damgasının milisaniye altını atıyor** (kaynak ile kopya arasında ~0,76 ms fark). "Hedef daha yeni mi?" karşılaştırması bu yüzden her seferinde yanlış sonuç verip gereksiz kopya yapıyordu. Çözüm: aynı boyut ve 2 saniye tolerans. Bekçi: `tools/backup/backup-private.test.mjs`.
- **[ölçüldü] Çok uzun geçici yollarda `git clone` başarısız olabilir** (muhtemelen Windows yol uzunluğu sınırı). Klonlar kısa bir yola (ör. `%TEMP%\kisa-ad`) yapılır; hata çıktısı bastırılmaz.

## Google Health / veri

- **[kaynaklı] Fitbit Web API 30 Ekim 2026'da kapanıyor** ([Google Health API bülteni](https://developers.google.com/health/newsletters)). Kullanılmaz. Yerine Google Health API v4.
- **[ölçüldü] "Yeni proje kabul etmiyoruz" notuna rağmen kişisel Google Cloud projesi çalışıyor.** Doküman ([başlarken](https://developers.google.com/health/get-started)) böyle diyor, ama 2026-10-03'te yeni açılan bir projede API'yi etkinleştirmek, "Testing" modunda External OAuth (Desktop app) almak ve Türkiye hesabından veri çekmek sorunsuz oldu. Kanıt: Faz 0 oturumu, `ghealth` commit `9cf0274`.
- **[kaynaklı] Testing modundaki External OAuth uygulamalarında yenileme token'ı 7 günde düşer** (yalnız ad/e-posta/profil kapsamı isteyen uygulamalar hariç; [Google OAuth 2.0, "Refresh token expiration"](https://developers.google.com/identity/protocols/oauth2#expiration)). Erişim token'ı 1 saatlik. Uygulama haftada bir yeniden giriş akışına hazır olmalı. Pratik ölçüm 2026-10-10 civarı.
- **[ölçüldü] Bazı günlük rollup'lar en fazla 14 gün kabul eder:** `active-minutes`, `calories-in-heart-rate-zone`, `heart-rate`, `total-calories`. Aralık parçalanır.
- **[ölçüldü] Gün içi nabız (`heart-rate list`) yaklaşık 3 saniyede bir örnek verir, günde yaklaşık 35 bin kayıt.** 30 gün tek istekte kayıt sınırına takılır ve sessizce eksik döner; gün gün çekilir. Uygulama ham nabzı saklamaz, sunucuda özetler.
- **[ölçüldü] `food list` bir besin kataloğunu sayfalıyor ve bitmiyor.** Kişisel kayıt değil; kullanılmaz (kişisel kayıt `nutrition-log`).
- **[ölçüldü] Basketbol antrenmanı/maçı `exerciseType: SPORT` ("Sport") olarak geliyor; basketbola özgü tip yok.** Seans türünü (maç/antrenman/şut) kullanıcı etiketler.
- **[ölçüldü] Adım ve mesafe iki kaynaktan gelir:** cihaz (`FITBIT`) ve iPhone (`HEALTH_KIT`). Toplarken `dataSource` ile ayrılır, çift sayılmaz.
- **[ölçüldü] Fitbit Air'in ürettiği tipler (14 günlük ölçüm):** gece HRV (günlük özet: ortalama RMSSD, derin uyku RMSSD, entropi, NREM nabız; ayrıca uyku boyunca LF/HF güçlü örnekler), dinlenik nabız, evreli uyku (AWAKE/LIGHT/DEEP/REM, kısa uyanmalar), SpO2 (günlük + örnekler), solunum hızı, gece cilt sıcaklığı sapması, gün içi nabız, egzersiz (nabız bölgeleri, START/PAUSE/STOP olayları), aktif bölge dakikaları, aktivite seviyesi, sedanter dönemler, adım, mesafe, kalori. **Gelmeyenler:** VO2max (her üç tip boş), EKG, düzensiz ritim bildirimi, irtifa, vücut sıcaklığı, kan şekeri, vücut yağı. **`swim-lengths-data` yüzme olmadan da kayıt üretiyor** (13 günde yaklaşık 190 kayıt, sahibi o dönemde yüzmedi); bu tip yok sayılır.
- **[doğrulanacak] Google Health'ten Apple Health'e senkron HRV'yi aktarmıyor.** Bu yüzden Apple Health yalnız B planı.

## Supabase

- **[doğrulanacak] Ücretsiz planda 7 gün veritabanı isteği gelmezse proje duraklatılır** (veri silinmez). Günlük senkron bunu muhtemelen önler; Faz 1'de gözlenecek.
