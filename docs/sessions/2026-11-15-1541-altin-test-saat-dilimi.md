# 2026-11-15 15:41 — Altın test saat dilimi, CI yeniden yeşil; bildirim yoklaması

- **Faz:** tüm fazlar tamam (Faz 1 sonrası)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `1bbc7a9` (Blok 1), Blok 2 `rep` commit'i

Oturum 2026-11-15 14:36'da açıldı (`/ac`). Ağaç temiz, push bekleyen yok; yeni denetim yok; literatür kutusunda 0061'in 54 adayı `bekliyor`. **CI `Kontroller` / `kontrol` işi üç commit'tir kırmızıydı** (`b39c5da`, `dd75d4c`, `e358a89`); önceki oturum raporunda geçmiyordu. Kullanıcı altın testin düzeltilmesini seçti.

## Blok 1 — Altın testi saat diliminden bağımsız yapmak (15:41)

### Amaç
`apps/mobile/src/data/golden.test.ts` CI'da (UTC) düşüyor, yerelde geçiyordu. Sahibinin çıktısını kilitleyen bekçi her makinede aynı sonucu vermeli.

### Yapılanlar
- CI günlüğünden fark çıkarıldı: yalnız enerji görünümü; `partialHour` 8 yerine 5, bugünün toplamı 779 yerine 458. Üç saatlik kayma = UTC+3 ile UTC farkı.
- Kök neden: demo verisi saatlik enerjiyi cihazın yerel saatiyle kurar (`apps/mobile/src/demo/demo-data.ts` `syncedAt.getHours()`); uygulamada doğru davranış. Anlık görüntü UTC+3'te yazılmıştı, test saat dilimini sabitlemiyordu.
- [golden.test.ts](../../apps/mobile/src/data/golden.test.ts) başında `process.env.TZ = 'Etc/GMT-3'` (UTC+3, yaz saati yok) ve gerekçe yorumu. Uygulama kodu ve anlık görüntü dosyası değişmedi.
- Doğrulama: test makinenin kendi saat diliminde, `TZ=UTC` ve `TZ=America/Los_Angeles` ile 2/2; değişiklik geri alınınca `TZ=UTC`'de düştüğü görüldü (düzeltmenin işe yaradığının kanıtı); `TZ=UTC npm run check` yeşil.

### Kararlar
- yok (anlık görüntü yeniden yazılmadı; altın test değişmeden kalıyor, yalnız ortamı sabitlendi)

### Sorunlar ve hatalar
- CI üç commit boyunca kırmızı kaldı ve fark edilmedi: pre-push testleri yerel saat diliminde geçiyordu, `/rep` ve `/kapat` push'tan sonra CI sonucuna bakmıyordu. `/ac` yakaladı.

### Öğrenilenler
- LESSONS "Git ve süreç": yerel saat kullanan kodu kilitleyen test saat dilimini kendisi sabitler; yerelde geçmesi CI'da geçeceğini göstermez, push'tan sonra CI sonucuna bakılır.

## Blok 2 — Bildirim yoklaması: ilk zamanlayıcı hatırlatması iPhone'da (15:54)

### Amaç
0060'tan sonraki ilk gerçek zamanlayıcı hatırlatmasının (2026-11-15 sabahı check-in) iPhone uygulamasına sunucudan gelip gelmediğini ve Expo makbuzunun sonuçlandığını görmek.

### Yapılanlar
- Bulutta yalnız okuyan sorgular (`npx supabase db query --remote --read-only`; token gibi sır alanları seçilmedi):
  - `push_log`: 2026-11-15 `checkin` kaydı 07:31 UTC'de (önceki günlerle aynı dakika).
  - `push_devices`: 1 cihaz; `last_success_at` 2026-11-15 07:31 UTC, yani hatırlatma PWA'ya değil iPhone uygulamasına gitti.
  - `push_tickets`: boş; fiş makbuz sorulunca sonuçlandı ve silindi, cihaz kaydı duruyor (`DeviceNotRegistered` gelmedi).
  - `cron.job`: `pwa-bildirim-gonderimi` (15 dakikada bir) ve `google-health-senkron` açık.
- Kullanıcı teyidi: hatırlatma iPhone'a geldi. Native push zamanlanmış hatırlatmayla uçtan uca çalışıyor; PWA ana ekran simgesi silinebilir (kullanıcı işi).
- Kod değişmedi.

### Kararlar
- yok

### Sorunlar ve hatalar
- İlk sorgular `--read-only` verilmeden çalıştırıldı ve CLI `HostedMutationConsentRequiredError` ile hiçbir şey yapmadan reddetti; bayrakla yeniden çalıştırıldı. Ders LESSONS'ta zaten vardı (Supabase CLI 3 maddesi).

### Öğrenilenler
- yok (yeni ders yok)

## Açık kalanlar
- 0061 sıra 3-6 bekliyor (`healthkit-ingest`, Apple sütunları ve kuralları, istemcide profil denetimi, arka plan teslimatı; deneme ekranı kaldırılır).
- Aday kaynaklar `bekliyor` (inbox); bakım (Supabase CLI 3.1.0) bekliyor.
- PWA ana ekran simgesini silmek kullanıcıda.
- TestFlight 0.1.0 (4) ~2027-02-13'te düşer.

## Sıradaki adım
- 0061 sıra 3: Apple yolu (`healthkit-ingest`, `health_daily` Apple sütunları, istemcide profil denetimi, arka plan teslimatı, Apple kural sürümleri ve kaynakları; deneme ekranı kaldırılır).
