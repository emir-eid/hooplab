# 2026-11-05 18:13 — Bildirim gözlemi ve kurulum denetimi

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1-2)
- **Commit'ler:** bu bloğun `/rep` commit'i

Oturum 2026-11-05 16:56'da açıldı (`/ac`).

## Blok 1 — Bildirim gözlemi ve setup:check'te Web Push (18:13)

### Amaç
STATE'teki ilk iş: zamanlayıcının gönderdiği ilk gerçek PWA hatırlatmasını görmek ([0058](../decisions/0058-pwa-web-push.md)) ve `setup:check`'in Web Push sırlarını ve `GHEALTH_WEB_RETURN_URL`'i denetlemesi.

### Yapılanlar
- **Açılışta bulunan:** GitHub hesabı fatura sorunu yüzünden kilitli. 2026-11-05 09:43 UTC'den beri `Kontroller` ve `Portfolyo sayfası` çalışmaları iş başlamadan 2-4 sn'de düşüyor (ek açıklama: "account is locked due to a billing issue"). Kod sorunu değil; bugünkü commit'ler CI'da denetlenmedi (yerelde pre-push testleri geçti), portfolyo yeniden yayınlanmıyor. Düzeltme kullanıcıda (ödeme bilgisi).
- **Bildirim gözlemi (bulut, salt okuma sorguları):** `pwa-bildirim-gonderimi` 11:31 UTC'den 15:01'e 15 çalışma, hepsi `succeeded`; son 6 saatte `net._http_response` 21 yanıt, hepsi 200. `push_log` boş: hatırlatma tercihleri bugünün check-in penceresi geçtikten sonra kaydedildi, maç günü yok, senkron bağlı. Tek abonelik var, son başarılı gönderim deneme bildirimi. Bu yüzden henüz gerçek hatırlatma beklenmiyordu; ilk fırsat 2026-11-06 sabahki check-in penceresi (o saate kadar check-in yapılmamışsa).
- **`setup:check` genişledi** ([setup-lib.mjs](../../tools/setup/setup-lib.mjs), [setup.mjs](../../tools/setup/setup.mjs)):
  - *Web Push anahtarları:* üç VAPID sırrı sunucuda mı, `apps/mobile/.env.local` içindeki `EXPO_PUBLIC_VAPID_PUBLIC_KEY` sunucudaki açık anahtarla aynı mı (sha256 özetiyle; değer okunmaz, yazdırılmaz). Hiçbiri yoksa `npm run setup` bulutta önce `../private/push/vapid.json` yedeğindeki çifti, yoksa `web-push` ile yeni çift yazar (yedeğe de; okunamayan eski yedeğin üstüne yazmaz). Yerelde her zaman yeni, sentetik çift. Sunucuda bir kısmı varsa ya da uygulamadaki anahtar uymuyor ve yedek de uymuyorsa kullanıcıya bırakılır: yeni çift telefondaki aboneliği bozar.
  - *PWA için Google dönüş adresi:* `GHEALTH_WEB_RETURN_URL` = `pwaReturnUrl()` (tek kaynak `tools/pwa/pwa-lib.mjs`); yoksa ya da farklıysa yazılır. Yalnız bulutta.
  - *Bildirim zamanlayıcısı (15 dk):* `cron.job`'da `pwa-bildirim-gonderimi` var ve açık mı.
  - *Edge Functions:* listeye `push-dispatch` ve `push-test` eklendi (sihirbaz önceden bunları dağıtmıyordu).
- Testler: [setup-lib.test.mjs](../../tools/setup/setup-lib.test.mjs) 33/33 (6 yeni: yedekten / yeni çift, kısmi eksik, uyuşmayan açık anahtar, yerel hedef, dönüş adresi, zamanlayıcı, yedek biçimi; detayların anahtar değeri içermediği denetlenir).
- **Gerçek denetim:** `npm run setup:check` bulutta 16/16 tamam (önce 13 madde). `npm run check` yeşil. Yerel hedef (`--local`, Docker) denenmedi; yalnız birim testleriyle.
- [Kurulum rehberi](../guides/kurulum.md) §4: sihirbazın adımlarına VAPID çifti ve dönüş adresi, denetimde iki zamanlayıcı.

### Kararlar
- yok (0058'in uygulaması; var olan VAPID çifti kendiliğinden yeniden üretilmez ilkesi koda yazıldı).

### Sorunlar ve hatalar
- GitHub fatura kilidi (yukarıda). `gh run view --log-failed` "log not found" döndü; neden yalnız `gh run view <id>` çıktısındaki ANNOTATIONS'ta görünüyordu.

### Öğrenilenler
- LESSONS "Git ve süreç": fatura kilidinde iş hiç başlamaz, log yoktur; neden ek açıklamalarda.

## Blok 2 — WATCHLIST: takviye sorgusu daraltıldı (2026-11-06 15:30)

### Amaç
STATE'teki ikinci iş: 2026-11-01 taramasında "Takviyeler" sorgusu çok geniş çıktı (20 sonucun çoğu konu dışı); aylık tarama konu dışı sonuçla dolmasın.

### Yapılanlar
- [WATCHLIST.md](../../research/WATCHLIST.md): Takviyeler sorgusu IOC uzlaşısında (maughan-2018) iyi kanıtı olan maddeleri adıyla arıyor (kafein, kreatin, nitrat, beta-alanin, bikarbonat, "dietary / sports supplement", "ergogenic aid"); ikinci yarı sporcu, takım sporu, basketbol ve spor / egzersiz / fiziksel performans ifadeleriyle sınırlı. Eski sorgudaki tek başına `supplement*` ve `performance` çıkarıldı. Dosyaya tarihli "Sorgu değişiklikleri" notu eklendi.
- **Ölçüm** (PubMed E-utilities, WATCHLIST'teki yayın türü filtresiyle, betik scratchpad'de): son 45 günde 44 → 10 sonuç, yenilerin 10'u da konuyla ilgili; 2026-11-01'deki takviye adaylarının hepsi yeni sorguda da çıkıyor; son 365 günde 338 → 76. Düşen tek ilgili tür: sporcu olmayan gruplarda protein takviyesi (sporcularda protein beslenme sorgusunda).
- Aylık literatür görevi sorguları bu dosyadan okuyor (görev talimatında doğrulandı); 2026-12-01 taraması yeni sorguyla çalışır.
- Kas krampı adayı (costa-2026 adayı, inbox 2026-11-01 #9) 2026-11-05'te zaten "bekletildi"; değişiklik gerekmedi.
- **Ek gözlem (Blok 1'in devamı):** `push_log`'da ilk gerçek hatırlatma: check-in, 2026-11-06, seçilen saatin penceresindeki ilk zamanlayıcı çalışmasında gönderildi. iPhone'da görülüp görülmediği kullanıcıya soruldu.
- `npm run check` yeşil.

### Kararlar
- yok (sorgu değişikliği WATCHLIST'in "kullanıcıyla kararlaştırılır" kuralına göre kullanıcının seçtiği işle yapıldı).

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- yok

## Açık kalanlar
- GitHub fatura kilidi kalkınca başarısız çalışmalar yeniden çalıştırılacak (`gh run rerun`), portfolyonun yayınlandığı doğrulanacak.
- İlk gerçek PWA hatırlatması sunucudan gitti (2026-11-06, `push_log`); iPhone'da görüldü mü kullanıcı teyidi bekleniyor.
- `setup:check --local` Docker'la denenmedi.

## Sıradaki adım
- Bildirimin iPhone'da görüldüğünün teyidi ve fatura kilidi kalkınca CI'ın yeniden çalıştırılması.
