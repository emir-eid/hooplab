# 2026-11-17 14:18 — Supabase CLI ve bakım

- **Faz:** 4
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `3ec39d8` (Blok 1), Blok 2 commit'i

## Blok 1 — Supabase CLI 3.1.0 (14:18)

### Amaç
STATE "Sıradaki işler" 2: Supabase CLI'ı 3.0.0'dan 3.1.0'a yükseltmek ve `setup:check` ile doğrulamak.

### Yapılanlar
- Sürüm seçimi: npm'de `latest` 3.2.0 (2026-11-16, bir günlük); 3.1.0 2026-11-09'dan beri yayında. Plan gereği 3.1.0 seçildi.
- Sürüm notu (`gh release view v3.1.0 -R supabase/cli`) okundu. Tek tuzak: yerel ağ geçidi `/functions/v1`'e artık CORS başlığı eklemiyor (#7472). Fonksiyonlar `withSupabase` ile CORS'u varsayılan olarak kendisi yanıtlıyor (`node_modules/@supabase/server` tiplerinden doğrulandı); `ghealth-callback` bilerek `cors: false` (302 yönlendirme). Etki yok.
- `npm install -D supabase@3.1.0 --save-exact`: [package.json](../../package.json) ve kilitte yalnız `supabase` ve `@supabase/cli-*` platform paketleri değişti.
- Doğrulama: `setup:check` bulut 16/16; yerel `setup:check -- --local` ilk koşuda 8/10 (Vault'ta zamanlayıcı sırrı ve proje adresi boş), `setup -- --local --yes` sonrası 10/10; `npm run test:db` 297/297; `npm run check` yeşil; `db advisors --remote` yalnız bilinen sızan şifre uyarısı; `migration list --remote` eşit (son `20261116225532`). 3.1.0'ın bağlı bağlantılardaki CA sabitlemesi bu komutlarla sorunsuz.
- Belgeler: [CHANGELOG](../CHANGELOG.md), [LESSONS](../LESSONS.md) (Supabase: CORS ve CA), [STATE](../STATE.md).

### Kararlar
- yok

### Sorunlar ve hatalar
- Yerel Vault iki değeri boştu (yeniden başlatılan yığın); kod sorunu değil, `setup -- --local` yazdı.

### Öğrenilenler
- LESSONS Supabase: 3.1.0'da yerel `/functions/v1` CORS'u fonksiyona bıraktı; `withSupabase` dışı fonksiyon tarayıcıdan düşer.

## Blok 2 — setup:check davetli metni ve kaçan denetim (14:34)

### Amaç
STATE "Sıradaki işler" 2: `setup:check` "Giriş hesabın" metnini davetliye göre düzeltmek; 2026-11-16 haftalık denetiminin neden rapor bırakmadığına bakmak.

### Yapılanlar
- [setup-lib.mjs](../../tools/setup/setup-lib.mjs): birden çok kullanıcıda "N kullanıcı (sen ve N-1 davetli; davet tools/admin/invite-user.mjs ile)"; eski "tek kullanıcılı uygulama; fazlası gerekmez" kalktı. Test [setup-lib.test.mjs](../../tools/setup/setup-lib.test.mjs) (1 ve 2 kullanıcı); kurulum testleri 34/34, `npm run check` yeşil.
- Zamanlanmış görev `hooplab-haftalik-denetim`: açık, `lastRunAt` 2026-11-16 09:12 (tetiklenmiş), ama görevin çalıştırma listesinde o güne oturum yok (son çalıştırma 2026-11-09). Tetikleme olmuş, oturum açılmamış; kesin sebep kayıtlardan çıkmıyor (uygulama kapalı / uyku olasılığı).
- Görev elle çalıştırıldı (Run now): [denetim 2026-11-17](../audits/2026-11-17.md), sarı, 5 düşük bulgu. CI, bekçiler, Dependabot temiz. Bulgulardan yeni olan: emilkowalski/skills'te `animate-expo`, `apple-design`, `review-animations` klasörlerine dokunan `0f2e23b3` (2026-11-13); kopyalama yapılmadı.

### Kararlar
- yok

### Sorunlar ve hatalar
- Denetim bu bloğun commit edilmemiş değişikliğini bulgu olarak yazdı (beklenen; bu commit'le kapanır).

### Öğrenilenler
- yok (bir kez görüldü; pazartesi tekrar ederse LESSONS'a)

## Açık kalanlar
- emilkowalski/skills `0f2e23b3` farkı: üç kopyalanmış skill güncellensin mi (denetim 2026-11-17).
- Haftalık denetim 2026-11-23 pazartesi kendiliğinden çalışıyor mu (çalışmazsa görev saati / makine durumu).
- Supabase CLI 3.2.0 çıktı (2026-11-16); bir sonraki bakımda bakılır.

## Sıradaki adım
- 0061 sıra 6, davetlinin ilk haftası (STATE "Sıradaki işler" 1).
