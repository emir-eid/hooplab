# 2026-11-15 15:41 — Altın test saat dilimi, CI yeniden yeşil; bildirim yoklaması

- **Faz:** tüm fazlar tamam (Faz 1 sonrası)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `1bbc7a9` (Blok 1), Blok 2 `10d9ed3`, Blok 3 `dd7f7f1`, Blok 4 `65e4ce8`, Blok 5 `rep` commit'i

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

## Blok 3 — 0061 sıra 3a: Apple kaynakları ve kural sürümleri, profile göre koç tabanı (22:46)

### Amaç
0061 sıra 3 dört parçaya bölündü (3a kaynaklar ve kurallar, 3b veritabanı ve `healthkit-ingest`, 3c motorun Apple seçimi, 3d istemci senkronu ve yeni build). 3a: Apple yolunun kaynaklarını ve kural sürümlerini eklemek; sahibinin uygulamasını, motorunu ve koç girdisini değiştirmeden.

### Yapılanlar
- **Kaynaklar (9, kullanıcı onayıyla):** `task-force-1996`, `munoz-2015`, `dobbs-2019`, `miller-2022`, `ogrady-2024`, `bonneval-2025`, `hirten-2021`, `lambe-2026b`, `choe-2025` (`research/sources/`). Her biri PubMed özetinden; `miller-2022`'nin HRV sayıları açık tam metnin tablosundan. hernando-2018 ve nelson-2019 reddedildi. Inbox'ın A bölümü işlendi; dosyanın kalan bölümleri `bekliyor`. Var olan 6 kaynağın "Bağlı kurallar" bölümü güncellendi.
- **Kurallar:** `hrv-olcu`, `nabiz-olcu`, `gunun-durumu` ([toparlanma.json](../../research/rules/toparlanma.json)) ve `enerji-harcamasi-tahmin` ([enerji.json](../../research/rules/enerji.json)) yalnız `profile: { source: ["google_health"] }` aldı, kimlik ve değer aynı. Yanlarına `-apple` sürümleri (`variant_of`): HRV gecelik SDNN (ln, "tahmin"), uyku nabzı, uyku nabzına dayanan günün durumu (HRV yalnız not), enerji tahmini (gün içi durum ve alımla kıyas kapalı).
- **Bekçi:** [validate-sources.mjs](../../tools/research/validate-sources.mjs) profil biçimini, `variant_of`'u ve her ailede her profil bileşimine tam bir kural düştüğünü denetler; profil değerleri `profiles` migration'ının CHECK listeleriyle aynı olmak zorunda (test).
- **Koç:** kural paketi profil alanını taşır; `forProfile` tabanı kullanıcının profiline göre süzer ve profil alanını modele göndermez; `readProfile` satır yoksa varsayılanı (sahibinin profili) döner, okuma hatasında varsayılana düşmez. Üç koç fonksiyonu profile göre süzülmüş tabanla çalışır ve bulutta dağıtıldı (girişsiz istek 401).
- **Testler:** sahibinin koç tabanı parmak iziyle kilitli (51 kural, 122 kaynak, değişiklik öncesi paketle aynı özet); Apple profilinin süzmesi; `readProfile` (3 test); uygulamanın kaynak alıntı listesi 9 kaynakla; toparlanma açıklama ekranının kaynak testi sahibinin profiliyle sınırlı (ekran değişmedi). Çevrimiçi kaynak doğrulaması 131/131 temiz. `npm run check` yeşil (altın test dahil).

### Kararlar
- Fitbit kurallarının kimlikleri değişmedi; Apple ayrı kimlikli varyant. Böylece motor ve uygulama 3c'ye kadar dokunulmadan kalır.
- Profil okunamazsa koç hata verir (yanlış profilin kurallarının modele gitmesindense).
- `gunun-durumu-apple`'da tek başına yüksek uyku nabzı "Kontrollü"ye götürür (0061); Fitbit kuralının kaynaklarıyla gerilim kural notlarında yazılı.

### Sorunlar ve hatalar
- Kaynak eklenince uygulama testleri düştü: alıntı listesi eksikti (eklendi; kurum yazarı için test uyarlandı), toparlanma ekranı testi bütün toparlanma kurallarıyla kıyaslıyordu (sahibinin profiliyle sınırlandı).
- Doğrulayıcı testinde düzenli ifade kabuk üzerinden yazılırken ters bölüleri kaybetti; `indexOf` ile ayrıştırmaya geçildi.

### Öğrenilenler
- yok (yeni ders yok)

## Blok 4 — 0061 sıra 3b: Apple sütunları ve `healthkit-ingest` (23:22)

### Amaç
Apple verisinin buluta gireceği yolu kurmak: `health_daily`'de ayrı Apple sütunları, yalnız `apple_health` profilini kabul eden yükleme fonksiyonu, iki kullanıcılı pgTAP. Sahibinin satırları ve senkronu değişmeden.

### Yapılanlar
- **Migration** [`20261115195326_apple_sutunlari.sql`](../../supabase/migrations/20261115195326_apple_sutunlari.sql): `hrv_sleep_sdnn_ms` ve `sleep_hr_bpm` (pozitif); `health_daily_columns_by_source` kısıtı: Apple satırında Fitbit HRV / NREM nabzı, Google satırında Apple sütunları boş olmak zorunda. Kullanıcı yetkileri değişmedi (okur, yazamaz).
- **Fonksiyon** `healthkit-ingest` ([ingest.ts](../../supabase/functions/_shared/healthkit/ingest.ts), [service.ts](../../supabase/functions/_shared/healthkit/service.ts), [index.ts](../../supabase/functions/healthkit-ingest/index.ts)): telefonun hesapladığı günlük / gecelik değerleri, uyku oturumlarını (Apple "core" → hafif uyku), antrenmanları ve saatlik enerjiyi alır; ham örnek gelmez. Yalnız `auth: 'user'` ve `apple_health` profili (değilse 403, hiçbir şey yazılmaz). Biçim denetimi: bilinmeyen alan, imkansız değer, saat dilimsiz zaman, 24 saati aşan oturum, yinelenen anahtar, 90 günden eski / bir günden ileri tarih ve sayı sınırları reddedilir; yanıtta yalnız alan yolu. Günler tam yazılır (upsert sütun birleşimi, LESSONS). Gövde sınırı 1 MB.
- **Testler:** birim 11/11 ([ingest.test.ts](../../supabase/functions/tests/healthkit/ingest.test.ts)); pgTAP [apple_sutunlari.test.sql](../../supabase/tests/database/apple_sutunlari.test.sql) 17 madde, toplam 273/273. Yerelde sentetik iki kullanıcıyla uçtan uca: girişsiz 401, GET 405, Google profili 403, hatalı değer 400 (yalnız yol), Apple profili dört tabloya yazdı, tekrar yükleme çoğaltmadı; kullanıcılar silindi.
- **Kurulum ve tip denetimi:** fonksiyon `setup-lib.mjs` listesinde ve `config.toml`'da (`verify_jwt = false`, kimlik kodda); `supabase/functions/tsconfig.json`'a `healthkit-ingest` ile birlikte dışarıda kalmış `coach-ask` ve `coach-weekly` eklendi (hatasız).
- **Bulut:** `db push --remote --yes` (dry-run'da yalnız bu migration), `functions deploy healthkit-ingest`. Girişsiz ve sahte jetonlu istek 401; `db advisors` yalnız bilinen sızan şifre uyarısı; sahibinin satırları Google kaynaklı, Apple sütunları boş, kısıt yerinde (salt okuma sorgusu). Migration'dan sonraki ilk saatlik Google senkronu (20:17 UTC) başarılı, hata yok.

### Kararlar
- Gecelik değerleri telefon hesaplar, sunucu yalnız biçimi denetler: ham HealthKit örneği buluta çıkmaz (veri en aza indirme; 0061'in döngü ilkesiyle aynı).
- Biçim sınırları sağlık eşiği değil (imkansız değer ve bozuk istemci için); yorum ve eşik motorda, kaynaklı kurallarla.
- Hatalı istek bütünüyle reddedilir (sessiz düşürme yok); telefon tarafının buna nasıl davranacağı 3d'de.

### Sorunlar ve hatalar
- Fonksiyon kodunda TypeScript parametre özelliği (`constructor(readonly ...)`) Node'un tip silme kipinde çalışmadı; açık alan atamasına çevrildi.

### Öğrenilenler
- yok (yeni ders yok)

## Blok 5 — 0061 sıra 3c: motorun profile göre Apple kuralları (23:39)

### Amaç
Motor ve görünüm katmanı kullanıcının veri kaynağına göre Apple kural sürümlerini seçsin; sahibinin çıktısı bayt bayt aynı kalsın (altın test).

### Yapılanlar
- **Motor** ([recovery.ts](../../packages/engine/src/recovery.ts)): `DataSource` tipi; `dayStatusRuleApple` (`gunun-durumu-apple`: dayanak uyku nabzı, HRV tek başına not, "toparlan" iki işaretle); `recoveryBySource` kaynağa göre HRV / nabız ölçüsünü, "tahmin" bayrağını ve durum kuralını taşır; `dayStatus(..., source = 'google_health')` kuralın `requires` alanına göre (HRV ya da uyku nabzı bandı) `insufficient` verir. `dayStatusRule`'a `requires: 'hrv'` eklendi (değer aynı). [energy.ts](../../packages/engine/src/energy.ts): `energyRuleApple` (`mapeAbovePct: 10`, açıklama metni için).
- **Görünüm** ([recovery-view.ts](../../apps/mobile/src/data/recovery-view.ts), [weekly-report-view.ts](../../apps/mobile/src/data/weekly-report-view.ts)): `autonomicSeries(daily, source)` Apple'da `hrv_sleep_sdnn_ms` / `sleep_hr_bpm`, varsayılanda Fitbit sütunları; `buildRecoveryView` ve `buildWeeklyReportView` isteğe bağlı `source` alır (varsayılan sahibinin profili). Sorgular değişmedi (3d).
- **Testler:** `rules-sync` iki profilin ölçü, dönüşüm, "tahmin", nabız ölçüsü, durum birleşimi ve profil alanını kural dosyalarıyla karşılaştırır, Apple enerji kuralı dahil; motorda 5 Apple durum testi ve kaynak verilmezse bütün birleşimlerde Google kuralıyla eşitlik; görünümde Apple sütun seçimi, profiller arası okumama ve varsayılan eşitliği; haftalık raporda Apple satırlarıyla aynı bant. Altın testin anlık görüntüsü değişmedi; `npm run check` yeşil.

### Kararlar
- Kaynak parametresi her yerde isteğe bağlı ve varsayılanı `google_health`: sahibinin bütün çağrıları dokunulmadan aynı sonucu verir; Apple yolu yalnız açıkça istenince.
- Ekran ve sorgu değişikliği 3d'ye bırakıldı (profilin okunması, Apple sütunlarının sorguya eklenmesi, "tahmin" etiketi ve Apple metinleri); bu blokta uygulamanın görünür davranışı değişmedi, web önizlemesine bakılmadı.

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- yok (yeni ders yok)

## Açık kalanlar
- 0061 sıra 3d (uygulamada profilin okunması, Apple sütunlarının sorguya eklenmesi, "tahmin" etiketi ve Apple metinleri, istemci senkronu, silinen kayıtların buluttan da silinmesi, reddedilen yüklemede telefonun davranışı, yeni build, deneme ekranının kaldırılması) bekliyor; sonra sıra 4-6.
- Koçun profil okuması gerçek bir kullanıcıyla henüz çalışmadı (ilk koç çağrısında).
- Inbox'ın A dışındaki bölümleri `bekliyor`; bakım (Supabase CLI 3.1.0) bekliyor.
- PWA ana ekran simgesini silmek kullanıcıda.
- TestFlight 0.1.0 (4) ~2027-02-13'te düşer.

## Sıradaki adım
- 0061 sıra 3d: uygulama profili okur ve görünümlere `source` geçer; Apple'da HealthKit senkronu (observer + saatlik arka plan, açılışta yakalama) `healthkit-ingest`'e; silinen kayıtlar ve reddedilen yükleme; "tahmin" etiketi ve Apple metinleri; yeni build, deneme ekranı kaldırılır. Sahibinde HealthKit hiç okunmaz.
