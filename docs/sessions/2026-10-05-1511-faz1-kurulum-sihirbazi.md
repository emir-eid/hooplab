# 2026-10-05 15:11 — Faz 1: kurulum sihirbazı

- **Faz:** 1
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** bu bloğun `/rep` commit'i

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

## Açık kalanlar
- Sihirbaz sıfırdan yeni bir bulut projesinde hiç koşmadı (kullanıcı kararı: ikinci proje açılmadı). Proje bağlama, `db push` ve fonksiyon dağıtımı adımları bulutta yalnız mevcut projede ve "zaten kurulu" durumunda görüldü.
- Takip (2026-10-08 / 10 civarı): kişisel bant ve OAuth yenileme token'ının 7. gün düşüşü (STATE sıradaki işler 1).

## Sıradaki adım
- STATE sıradaki işler 1: takip (2026-10-08 / 10 civarı). O tarihe kadar: 2. iş, Apple Developer / EAS Build / TestFlight (ücretli üyelik, kullanıcı onayıyla).
