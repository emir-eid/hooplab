# 2026-11-15 15:41 — Altın test saat dilimi, CI yeniden yeşil

- **Faz:** tüm fazlar tamam (Faz 1 sonrası)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** Blok 1 `rep` commit'i

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

## Açık kalanlar
- 0061 sıra 3-6 bekliyor (`healthkit-ingest`, Apple sütunları ve kuralları, istemcide profil denetimi, arka plan teslimatı; deneme ekranı kaldırılır).
- Aday kaynaklar `bekliyor` (inbox); bildirim yoklaması ve bakım (Supabase CLI 3.1.0) bekliyor.
- TestFlight 0.1.0 (4) ~2027-02-13'te düşer.

## Sıradaki adım
- Bildirim yoklaması: 2026-11-15 sabahının zamanlayıcı hatırlatması iPhone'a geldi mi, Expo makbuzu sonuçlandı mı.
