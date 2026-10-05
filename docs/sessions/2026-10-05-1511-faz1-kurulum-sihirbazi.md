# 2026-10-05 15:11 — Faz 1: kurulum sihirbazı ve EAS hazırlığı

- **Faz:** 1
- **Durum:** kapandı (/kapat, 16:01)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `f624959` (Blok 1), `a1e2f24` (Blok 2), bu raporun kapanış commit'i

## Blok 1 — Kurulum sihirbazı ve Google istemci sırrının yenilenmesi (15:11)

### Amaç
STATE'teki 3. iş, ROADMAP Faz 1 maddesi. Repo public; başkası klonlayıp kendi Supabase ve Google Cloud hesabıyla kurabilmeli ([0009](../decisions/0009-herkes-kendi-hesabiyla.md)). 1. iş (bant ve token takibi) 2026-10-08'den önce yapılamadığı için bu iş seçildi.

Kapsamı kullanıcı seçti:
- Terminal sihirbazı ve uygulamada durum mesajı. Uygulama içi bağlantı ayarı yok.
- Deneme yerel Supabase'de uçtan uca, bulutta yalnız salt-okur `--check`. İkinci bulut projesi açılmadı.

### Yapılanlar
- **Sihirbaz** [tools/setup/setup.mjs](../../tools/setup/setup.mjs), kurallar [setup-lib.mjs](../../tools/setup/setup-lib.mjs) içinde ve testli (25 test). Komutlar `npm run setup` ve `npm run setup:check`.
  - Önce olguları toplar, sonra tek bir denetim listesi çıkarır. Her madde dört durumdan birindedir: tamam, kurulacak, senin adımın, bekliyor. 12 madde: CLI girişi, proje, `.env.local`, şema, Google sırları, geri dönüş adresi, zamanlayıcı sırrı, Vault adresi, zamanlayıcı, fonksiyonlar, yeni kayıt kapalı, giriş hesabı.
  - Kurulum turlarla ilerler; şema kurulunca ona bağlı adımlar açılır.
  - Sırlar okunmadan denetlenir: Supabase secrets listesindeki sha256 özetleri, Vault'ta SQL ile hesaplanan özet ve Google JSON'unun özeti karşılaştırılır.
  - Sunucuya giden sırlar geçici dosyadan geçer ve dosya hemen silinir. Supabase CLI kabuksuz, Node ile çalıştırılır; `--agent no` geçilir.
  - `--local` yerel Supabase'i hedefler: sırlar `supabase/functions/.env`'e yazılır, `.env.local`'a dokunulmaz.
- **Uygulama:**
  - [sign-in.tsx](../../apps/mobile/src/app/sign-in.tsx) bağlantı değerleri yoksa `npm run setup`'ı ve rehberi gösterir.
  - [google-health.ts](../../apps/mobile/src/data/google-health.ts) ve [google-health-status.ts](../../apps/mobile/src/data/google-health-status.ts) "sunucuda kurulum eksik" der: fonksiyon yoksa (404) veya fonksiyonun kendi yanıtı 503 + `not_configured` ise. Gövdesiz 503 genel mesajda kalır (testli).
- **Önizleme:** [web-local.mjs](../../tools/dev/web-local.mjs) `--unconfigured` seçeneği aldı; `.claude/launch.json`'a `mobil-web-kurulumsuz` eklendi.
- **Belgeler:**
  - yeni: [kurulum rehberi](../guides/kurulum.md), [0023](../decisions/0023-kurulum-sihirbazi-terminalde.md)
  - güncellenenler: [0009](../decisions/0009-herkes-kendi-hesabiyla.md) notu, [PRODUCT](../PRODUCT.md) §2, [SETUP](../SETUP.md) §9, [Google Health rehberi](../guides/google-health-baglantisi.md), README (Türkçe ve İngilizce özet), CLAUDE.md belge haritası, [ROADMAP](../ROADMAP.md) (madde kapandı), CHANGELOG, `.env.example`
- **Denetim raporu:** [docs/audits/2026-10-05.md](../audits/2026-10-05.md) dosyasının zamanlanmış görevin sonradan düzelttiği hali (sarı → yeşil) bu commit'e girdi.
- **Doğrulama:**
  - Bulut projesinde `setup:check` 12/12 tamam. Sahte Google JSON'uyla aynı denetim sır farkını ve eksik geri dönüş adresini yakaladı; Desktop istemcisi ve bozuk proje kimliği reddedildi.
  - Yerelde bir migration geri alındı (`db reset --version`) ve kurulum `--local --yes` ile baştan koştu: migration, sırlar, zamanlayıcı sırrı, Vault, sonuç 8/8.
  - Web önizlemesi 390×844:
    - bağlantı değerleri boşken giriş ekranının uyarısı
    - sırsız yerel fonksiyonlarla Google Health → bağlan: 503 + `not_configured`, kurulum mesajı
    - Edge Runtime durdurulunca gövdesiz 503: genel mesaj
  - `npm run check` yeşil.
- **Google istemci sırrının yenilenmesi** (aşağıdaki hata yüzünden):
  - Kullanıcı Google Cloud'da yeni sır ekledi ve JSON'u yeniledi.
  - `setup:check` farkı gördü, `npm run setup -- --yes` yeni sırrı Supabase secrets'a yazdı. Bu, sihirbazın bulutta yazma adımının ilk gerçek denemesiydi.
  - İki elle tetiklenen senkron (15:05 ve eski sır silindikten sonra 15:06) başarılı oldu: 200, hata yok. Kullanıcı eski sırrı sildi.

### Kararlar
- [0023 Kurulum sihirbazı terminalde](../decisions/0023-kurulum-sihirbazi-terminalde.md): `npm run setup` kurar, `--check` denetler, uygulama eksikliği söyler. 0009'daki "uygulama içi sihirbaz" terminale taşındı.
- Yeni kaydı kapatmak ve giriş hesabını açmak kullanıcıya kalır. CLI ile yapılamıyor veya kullanıcının şifresini ister.

### Sorunlar ve hatalar
- **Gerçek sır yerel dosyaya ve oturum çıktısına düştü.**
  - Ne oldu: yerel deneme `--google-json` verilmeden çalıştırıldı ve bulut için konan varsayılan gerçek istemci dosyası okundu. Gerçek istemci kimliği ve sırrı yerel `supabase/functions/.env`'e yazıldı. Ardından düz `diff` bu değerleri oturum çıktısına bastı.
  - Fark edilişi: diff çıktısında.
  - Çözüm: dosya yedekten geri yüklendi; repoya hiçbir şey girmedi, bekçi temiz. Yerel mod artık gerçek dosyayı kendiliğinden okumuyor (`chooseGoogleJson`, testli). Sır yenilendi, eski sır silindi.
  - Değer bu oturumun `private/transcripts` arşivinde kalır; artık geçersiz.
- `db query --project-ref` tek başına reddedildi; `--linked` ile birlikte verildi.
- Windows'ta `process.exit` libuv iddia hatasıyla çöktü; `process.exitCode`'a geçildi.
- İlk sürümde iki eksik vardı, ikisi de deneme sırasında görüldü ve düzeltildi:
  - Yerel modda migration adımı buluta `db push` yapacaktı.
  - Kurulum tek turdu.
- Uygulamanın ilk sürümü her 503'e "kurulum eksik" diyordu. Yerelde ağ geçidinin gövdesiz 503'ü görülünce yalnız `not_configured`'a daraltıldı.

### Öğrenilenler
- [LESSONS](../LESSONS.md) "Git ve süreç": deneme modu gerçek sır dosyasına düşmez, sır dosyaları `diff` ile karşılaştırılmaz.
- [LESSONS](../LESSONS.md) "Supabase":
  - CLI ajan sezince çıktı biçimini değiştiriyor (`--agent no`).
  - `secrets list` değeri sha256 özeti.
  - `projects api-keys` eski `service_role` anahtarını maskesiz veriyor.
  - `db query --project-ref` için `--linked` gerekiyor.
  - Edge Runtime yokken Kong gövdesiz 503 döndürüyor.
- [LESSONS](../LESSONS.md) "Windows": `fetch` sonrası `process.exit` çökmesi.

## Blok 2 — Apple Developer kaydı ve EAS hazırlığı (15:50)

### Amaç
STATE'teki 2. iş, Faz 1'in son açık maddesi: Apple Developer Programı, EAS Build ve TestFlight. 1. iş (takip) 2026-10-08'den önce yapılamıyor.

### Yapılanlar
- **Maliyet ve sınırlar resmi sayfalardan doğrulandı.** [COSTS](../COSTS.md) güncellendi:
  - Apple: yıllık 99 USD, kayıtta yerel para birimiyle gösterilir.
  - Expo ücretsiz planı: ayda 15 iOS derlemesi, derleme başına 45 dk, EAS Update 1.000 aylık aktif kullanıcıya kadar.
  - TestFlight: iç testte Apple incelemesi yok, derleme 90 gün geçerli.
- **Apple Developer kaydı:** kullanıcı uygulamadan kaydolmaya çalıştı, kimlik doğrulaması reddedildi.
  - Resmi şartlar ve Apple forumundaki benzer vakalar araştırıldı. Bir Türkiye vakasında ödeme çekilmiş ama üyelik açılmamış; destek kaydı iptal edip iade edince yeniden kayıt çalışmış.
  - Kullanıcı Apple Developer desteğinde vaka açtı (Membership and Account → Program Enrolment). Yanıt bekleniyor.
- **EAS projesi:** `@rotavi/hooplab`, mevcut kişisel Expo hesabında açıldı.
- **Yapılandırmayı resmi komutlar üretti:** `eas init`, `eas build:configure`, `npx expo install expo-updates` (~57.0.24), `eas update:configure`.
- **Kimlik ortamdan okunuyor:**
  - [app.config.ts](../../apps/mobile/app.config.ts) ve [build-identity.ts](../../apps/mobile/src/lib/build-identity.ts) (3 test) şu değerleri `apps/mobile/.env.local`'dan alır: paket kimliği (`io.github.emireid.hooplab`), EAS proje kimliği, sahip, güncelleme adresi.
  - Komutların `app.json`'a yazdığı kimlik oradan çıkarıldı.
  - Şifreleme beyanı (`usesNonExemptEncryption: false`) eklendi.
- **[eas.json](../../apps/mobile/eas.json):** tek `production` profili (ortam ve kanal `production`, `autoIncrement`). Geliştirme ve önizleme profilleri çıkarıldı.
- **runtimeVersion politikası:** `fingerprint`; iOS parmak izi üretildi.
- **EAS "production" ortam değişkenleri:** beş değer yazıldı (üç `HOOPLAB_*`, iki `EXPO_PUBLIC_SUPABASE_*`), değerler ekrana basılmadı.
- **Sarmalayıcı:** [tools/dev/eas.mjs](../../tools/dev/eas.mjs) (`npm run eas -- <komut>`).
- **Doğrulama:**
  - `npx expo config` değerleri doğru çözüyor; `npm run eas -- config` üretim profilini doğru gösteriyor.
  - `expo-doctor` 21/21.
  - Yerel `expo export --platform ios` başarılı; hiçbir şey yayımlanmadı.
  - `npm run check` yeşil.
- **Belgeler:**
  - yeni: [0024](../decisions/0024-eas-derleme-ve-guncelleme.md)
  - güncellenenler: [COSTS](../COSTS.md), [DATA-INVENTORY](../DATA-INVENTORY.md) (Expo'ya ne gidiyor), [SETUP](../SETUP.md) §10, [kurulum rehberi](../guides/kurulum.md) (TestFlight bölümü, henüz doğrulanmadı), `.env.example` (örnek değerler yorumda), [ROADMAP](../ROADMAP.md) (madde kısmen), CHANGELOG

### Kararlar
- [0024 EAS derleme ve güncelleme](../decisions/0024-eas-derleme-ve-guncelleme.md). Kullanıcı kararları:
  - Mevcut Expo hesabı. CLAUDE.md §7'deki "HoopLab'e ayrılmış hesap" kuralının istisnası, gerekçesiyle kayıtlı.
  - Paket kimliği `io.github.emireid.hooplab`.
  - EAS Update ilk derlemeyle birlikte.
  - `fingerprint` politikası.
- Kullanıcı Blok 1'den sonra `/kapat` önerisini reddetti ve aynı oturumda devam etti.

### Sorunlar ve hatalar
- `app.config.ts`'ten uzantısız TypeScript importu çözülmedi (`Cannot find module`). `.ts` uzantısıyla çözüldü.
- EAS CLI `.env.local`'ı yüklemediği için projeyi bulamadı; sarmalayıcıyla çözüldü.
- `build:configure` `--non-interactive` kabul etmedi; stdin kapalıyken çalıştı.
- `.env.example`'daki örnek değerler olduğu gibi açılırsa yapılandırmayı durdururdu; yorum satırına alındı.

### Öğrenilenler
- [LESSONS](../LESSONS.md) "Expo / React Native":
  - Expo CLI `.env.local`'ı yükler, EAS CLI yüklemez.
  - `app.config.ts`'ten TypeScript importu `.ts` uzantısı ister.
  - `eas init` ve `update:configure` kimliği `app.json`'a yazar.

## Açık kalanlar
- Apple Developer kaydı: kimlik doğrulaması reddedildi, Apple desteğinde vaka açık. Yanıt gelince: üyelik, App Store Connect API anahtarı (`.p8`, `private/`), ilk derleme, kullanıcı onayıyla TestFlight gönderimi, iPhone'da kontrol.
- Kurulum sihirbazı sıfırdan yeni bir bulut projesinde hiç koşmadı (Blok 1). Sihirbaz EAS'ı denetlemiyor; ilk derlemeden sonra eklenebilir.
- Takip (2026-10-08 / 10 civarı): kişisel bant ve OAuth yenileme token'ının 7. gün düşüşü (STATE sıradaki işler 1).

## Sıradaki adım
- STATE sıradaki işler 1: takip (2026-10-08 / 10 civarı). Apple yanıtı daha önce gelirse 2. iş (ilk derleme ve TestFlight).
