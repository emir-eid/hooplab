# 2026-10-04 17:30 — Faz 1: Google Health senkronu

- **Faz:** 1
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5 · yüksek
- **Commit'ler:** bu bloğun `/rep` commit'i

## Blok 1 — Google Health senkronu: şema, Edge Functions, zamanlayıcı, bağlantı ekranı (17:30)

### Amaç
STATE'teki ilk iş: Fitbit Air verisini Google Health API v4'ten sunucu tarafında çekmek (Edge Function + zamanlayıcı). Gün içi nabız ham saklanmaz; adım / mesafe tekilleştirilir; `swim-lengths-data` alınmaz. Testing modundaki 7 günlük izin için uygulamadan yeniden bağlanma.

### Yapılanlar
- **API haritası:** alt ajan `ghealth` kaynağından uç noktaları, süzgeç sözdizimini ve sınırları çıkardı; alan adları resmi discovery belgesinden (revizyon 20261001) doğrulandı. `dailyRollUp` günlük nabız özeti ve `dataSourceFamily` (bileklik ailesi) bulundu: ham nabız hiç çekilmiyor.
- **Şema:** [migration](../../supabase/migrations/20261004112747_google_health_senkron.sql). `health_daily` (gün başına satır, tip başına sütun), `sleep_sessions`, `exercise_sessions`, `health_sync_status` sahibine yalnız SELECT; `google_health_tokens` ve `google_health_oauth_states` hiç politikasız, yalnız `service_role`. Zamanlayıcı `pg_cron` (saatin 17. dakikası) → `private.trigger_google_health_sync()` → `pg_net`, adres ve sır Vault'ta.
- **RLS testleri:** [google_health.test.sql](../../supabase/tests/database/google_health.test.sql), toplam 63/63. Yetkiler bilerek gevşetildi (authenticated'a INSERT / token SELECT, gevşek politika): 4 test kırıldı, `db reset` ile geri.
- **Edge Functions:** [ghealth-connect](../../supabase/functions/ghealth-connect/index.ts) (izin adresi, tek kullanımlık durum, PKCE S256, bağlantıyı kesme), [ghealth-callback](../../supabase/functions/ghealth-callback/index.ts) (kod değişimi, kapsam denetimi, 302 ile uygulamaya dönüş, ilk senkron `EdgeRuntime.waitUntil`), [ghealth-sync](../../supabase/functions/ghealth-sync/index.ts) (kullanıcı JWT'si veya `x-hooplab-cron` sırrı). Ortak kod [_shared/google-health](../../supabase/functions/_shared/google-health/): saf parse / tarih / OAuth / senkron modülleri + veritabanı katmanı. Kimlik `@supabase/server` 1.9.0 ile kodda (`verify_jwt = false`).
- **Testler ve tip denetimi:** sahte Google ([fake-google.ts](../../supabase/functions/tests/google-health/fake-google.ts), sentetik) ile 21 birim testi; PKCE için RFC 7636 test vektörü. Deno yok: [tsconfig](../../supabase/functions/tsconfig.json) `npm:` adreslerini repodaki aynı sürüm paketlere eşler. `npm run check` ve CI'a `test:functions` eklendi.
- **Yerel uçtan uca:** [fake-google-health.ts](../../tools/dev/fake-google-health.ts) + `supabase functions serve`; 26 adımlık betik geçti (reddedilen dönüş adresi, oturumsuz istek, tek kullanımlık durum, 90 gün ilk senkron, tekrar senkronda çoğalmama, kullanıcının token'a ve yazmaya erişememesi, zamanlayıcı sırrı, düşen token → `reconnect_required`, bağlantı kesme). Yerel pg_cron → pg_net → fonksiyon zinciri 200.
- **Uygulama:** [Ben → Google Health](../../apps/mobile/src/app/(tabs)/me/google-health.tsx) ekranı; durum metni [google-health-status.ts](../../apps/mobile/src/data/google-health-status.ts) (7 test), veri erişimi [google-health.ts](../../apps/mobile/src/data/google-health.ts); `expo-web-browser` eklendi. Web önizlemesinde 390 × 844, açık ve koyu temada bağlı değil / bağlı / yeniden bağlan halleri görüldü.
- **Bulut:** migration push (denetçide yalnız kabul edilmiş sızan şifre uyarısı), üç fonksiyon dağıtıldı, `GHEALTH_CRON_SECRET` + Vault `project_url` / `ghealth_cron_secret` (değerler basılmadan), kullanıcının açtığı Web istemcisinin kimliği ve sırrı JSON'dan doğrudan Supabase secrets'a. **iPhone (kullanıcı, Expo Go):** bağlanma hatasız; bulutta satır sayıları ve sütun dolulukları (değer okunmadan) cihaz verisi olan günlerin tamamında tüm tipleri gösterdi; zamanlayıcı bulutta 200, `outcomes: ["ok"]`.
- Belgeler: [0019](../decisions/0019-google-health-senkronu.md), [rehber](../guides/google-health-baglantisi.md) §4a (Web istemcisi), [SETUP](../SETUP.md) §9, [DATA-INVENTORY](../DATA-INVENTORY.md), [COSTS](../COSTS.md), [ROADMAP](../ROADMAP.md), [CHANGELOG](../CHANGELOG.md).

### Kararlar
- [0019 Google Health senkronu](../decisions/0019-google-health-senkronu.md) — Web OAuth istemcisi + Edge Functions; günlük özetler (ham nabız yok); bileklik kaynak ailesi; ayrı zamanlayıcı sırrı (Supabase gizli anahtarı veritabanına girmez); 90 gün ilk pencere, 7 gün yeniden çekme.
- Haftalık "yeniden bağlan" akışı bu işte geldi; ROADMAP'teki kurulum sihirbazı maddesinde yalnız sihirbaz kaldı.

### Sorunlar ve hatalar
- **İlk bulut senkronunda beş özet tipi boş:** `last_error` beş tipte `INVALID_ARGUMENT`. Deneme betiği (yalnız durum, hata mesajı, nokta sayısı) gösterdi: `dailyRollUp` gövdesindeki `pageSize: 10000` reddediliyor (discovery belgesi izin veriyor diyor). Kaldırıldı; sahte Google artık reddediyor, `pageSize` geri konunca 2 test kırılıyor.
- **Kısmi hatada senkron tarihi ilerliyordu:** düzeltmeden sonra özet tipleri yalnız son 8 gün geldi. Tarih artık yalnız tüm tipler başarılıysa ilerliyor (`statusAfterSync`, testli); buluttaki durum satırının tarihi sıfırlanıp eksik günler tamamlandı.
- `erasableSyntaxOnly` / Node tip silme yapıcı parametre özelliklerini kabul etmez; `client.ts` açık alanlara çevrildi.
- Windows'ta Node `execFileSync('npx.cmd')` kabuksuz çalışmadı (çıkış kodu null); sır yazan betik CLI'ın `supabase.exe` dosyasını doğrudan çağırdı.
- Web önizlemesinde izin akışı aynı sekmede döndüğü için sonuç mesajı kayboluyordu; ekran sonucu dönüş adresinin sorgusundan da okuyor.
- Tarayıcı panelinin ekran görüntüsü birkaç kez zaman aşımına uğradı (bilinen, LESSONS "Önizleme"); metin `get_page_text` ile doğrulanıp yeniden çekildi.

### Öğrenilenler
- LESSONS "Google Health / veri": discovery belgesi yetkili kaynak; `dailyRollUp` + kaynak ailesi; süzgeçler tipe göre; `pageSize` reddi [ölçüldü]; adımda bileklik ile tüm kaynaklar 15 günün 9'unda farklı [ölçüldü].
- LESSONS "Supabase": Edge Functions HTML sunamaz; `@supabase/server` ile kodda JWT; yerel ağ adresleri (host.docker.internal, kong); `upsert` anahtar birleşimi; `functions serve` imaj indirmesi.

## Açık kalanlar
- Yenileme token'ının 7. günde düşmesi gerçek hesapta ölçülmedi: `ghealth` takibi (2026-10-10) ve uygulamadaki "Yeniden bağlan" akışının cihazda ilk gerçek denemesi aynı hafta.
- Metro (8081) ve yerel web önizlemesi (8082) açık; Claude kapatır.
- `supabase/functions/.env` yalnız yerel sahte değerler (gitignore'lu).

## Sıradaki adım
- Seans etiketleme: Google'dan gelen egzersiz oturumlarını (basketbol `SPORT`) maç / antrenman / şut olarak eşleştirmek ya da elle girilen seans kaydına bağlamak (ROADMAP Faz 1).
