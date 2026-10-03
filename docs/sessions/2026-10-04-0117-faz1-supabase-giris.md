# 2026-10-04 01:17 — Faz 1: Supabase, RLS ve tek kullanıcı girişi

- **Faz:** 1
- **Durum:** kapandı (/kapat, 01:20)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `622f6d5` (Blok 1; CI yeşil), bu raporun kapanış commit'i

## Blok 1 — Supabase projesi, şema, RLS, giriş ve SecureStore parçalama adaptörü (01:17)

### Amaç
STATE'teki ilk iş: Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi ve oturumun Keychain'de güvenle saklanması için testli parçalama adaptörü. Çalışırken çıkan kullanıcı isteği: dış servis işlemlerini (Supabase, Expo/EAS, Vercel...) Claude yürütsün, katı kural olarak yazılsın.

### Yapılanlar
- **Supabase projesi:** Ana hesabın ücretsiz kotası (hesap başına 2 aktif proje) dolu olduğu için kullanıcı HoopLab'e ayrılmış ikinci bir Supabase hesabı açtı: organizasyon `HoopLab`, proje `hooplab`, `eu-central-1` (CLI ile doğrulandı). Panoda kullanıcı oluşturuldu (Auto Confirm), yeni kayıt kapatıldı. Giriş yöntemi kullanıcıyla seçildi: e-posta + şifre.
- **Paketler:** `@supabase/supabase-js` 2.117.2 (sürüm sabit), `expo-secure-store` (`npx expo install`), kökte Supabase CLI 2.119.0 (sabit devDependency). `supabase init`; [config.toml](../../supabase/config.toml) bulutla eşitlendi: `auto_expose_new_tables = false`, kayıt kapalı.
- **Parçalama adaptörü** [chunked-storage.ts](../../apps/mobile/src/lib/chunked-storage.ts): UTF-8 bayta göre ~1800 baytlık parçalar (çok baytlı karakter bölünmez), parçalar önce manifest en son, iki kuşak (a/b) arasında dönüş, eksik parçada `null`, aynı anahtarda işlemler sırayla. 9 test ([chunked-storage.test.ts](../../apps/mobile/src/lib/chunked-storage.test.ts)); yazma sırası bilerek bozulunca "yarıda kalan yazma" testi kırıldı.
- **İstemci ve giriş:** [supabase-config.ts](../../apps/mobile/src/lib/supabase-config.ts) yalnız `sb_publishable_` kabul eder, `sb_secret_` görürse istemciyi kurmaz (testli). [supabase.ts](../../apps/mobile/src/lib/supabase.ts) native'de Keychain'e parçalı yazar, web'de localStorage; `AppState` ile yenileme durdur/başlat. [session.tsx](../../apps/mobile/src/auth/session.tsx) oturum okunana kadar açılış ekranını tutar; Türkçe hata metinleri [auth-errors.ts](../../apps/mobile/src/auth/auth-errors.ts) (testli). Kök düzende `Stack.Protected`: oturum yoksa yalnız [giriş ekranı](../../apps/mobile/src/app/sign-in.tsx). Yeni bileşenler: [TextFieldRow](../../apps/mobile/src/components/text-field.tsx), [PrimaryButton](../../apps/mobile/src/components/primary-button.tsx). Ben sekmesinde Hesap → Çıkış yap. [.env.example](../../apps/mobile/.env.example).
- **Şema:** [ilk migration](../../supabase/migrations/20261003214426_tek_sahip_ve_seanslar.sql): `private` şeması ve `set_updated_at`, `training_sessions` (tür, süre, RPE 0-10, maçta oynanan dakika, yerel tarih), dört sahip politikası, yalnız `authenticated`'a GRANT. [İkinci migration](../../supabase/migrations/20261003220725_rls_auto_enable_yetkisi.sql): projenin "otomatik RLS" fonksiyonundan anon/authenticated EXECUTE yetkisi geri alındı.
- **Testler:** [pgTAP](../../supabase/tests/database/training_sessions.test.sql) 17 madde (her tabloda RLS, anon'da yetki yok, başkasının satırı görülmez/değiştirilmez/silinmez, başkası adına yazılamaz, CHECK'ler, updated_at). Yerelde politika gevşetilip anon'a SELECT verilince 9 madde kırıldı, sıfırlayınca 17/17. Yeni npm komutları: `db:start`, `db:stop`, `db:reset`, `test:db`.
- **Bulut doğrulaması:** `db push` (ilkini kullanıcı, ikincisini Claude), `migration list --linked` eşit; `curl` ile anon REST → `permission denied`; kayıt denemesi → `signup_disabled`; `db advisors --linked` → yalnız sızan şifre koruması (Pro'ya özgü, kabul edildi).
- **Görsel ve cihaz:** web önizlemesinde (390×844) oturumsuz kök adres giriş ekranına yönleniyor, değer yokken "Bağlantı ayarlanmadı" kartı, konsol temiz. iPhone'da (Expo Go) kullanıcı doğruladı: giriş, çıkış, yeniden giriş ve uygulama kapatılıp açılınca oturumun korunması.
- **Kural:** [CLAUDE.md §7](../../CLAUDE.md) "Dış servis işlemleri: Claude yürütür"; [SETUP §9](../SETUP.md), [COSTS](../COSTS.md), [DATA-INVENTORY](../DATA-INVENTORY.md) güncellendi. Proje adresi ve anahtar yalnız gitignore'lu `apps/mobile/.env.local` dosyasında; repoda olmadığı `git grep` ile doğrulandı.

### Kararlar
- [0015 Veritabanı: tek sahip RLS, açık GRANT, migration'lar repoda, oturum Keychain'de parçalı](../decisions/0015-veritabani-tek-sahip-rls.md)
- [0016 Dış servis işlemlerini Claude yürütür](../decisions/0016-dis-servisleri-claude-yurutur.md)
- Kapsam: sabah check-in tablosu ölçek kararıyla (PRODUCT §10, kaynaklı) form işine, seans içerik etiketleri Faz 2'ye bırakıldı.

### Sorunlar ve hatalar
- PowerShell `npx`'i engelledi (`.ps1`); `npx.cmd` ile çözüldü.
- `db push` veritabanı şifresi sormadı: CLI giriş token'ıyla geçici rol açıyor. Bu, Claude'un da uzak işlemleri yürütebileceğini gösterdi (0016).
- Denetçi, projeyle gelen `public.rls_auto_enable()` için SECURITY DEFINER uyarısı verdi; ikinci migration ile kapatıldı.
- `supabase db query` birden çok komutu tek çağrıda çalıştırmıyor; ayrı çağrılara bölündü.
- Web önizlemesindeki eski bir `accessible` konsol uyarısının önceki sayfadan kaldığı temiz sekmede doğrulandı; giriş ekranında hata yok.

### Öğrenilenler
- LESSONS'a eklendi: ücretsiz proje kotası, tabloların Data API'ye kendiliğinden açılmaması, şifresiz `db push`, otomatik RLS fonksiyonu, `db query` tek komut, RLS testinin bozularak kanıtlanması (Supabase); `npx.cmd` (Windows); supabase-js kilitsiz yenileme (Expo / React Native). SecureStore maddesinin bekçisi artık test.

## Açık kalanlar
- pgTAP testleri yerelde (Docker) koşuyor; CI'da henüz yok.
- Giriş ekranı cihazda kullanıcı tarafından denendi; ekran görüntüsüyle tasarım incelemesi yapılmadı (ekranlar maket düzeyine ekran işleri sırasında getirilecek).

## Sıradaki adım
- Faz 1: sabah check-in ve seans kaydı formları (check-in ölçeği kaynakla kararlaştırılarak).
