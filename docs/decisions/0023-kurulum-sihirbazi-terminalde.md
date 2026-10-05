# 0023. Kurulum sihirbazı terminalde: `npm run setup` kurar, `--check` denetler, uygulama eksikliği söyler

- **Durum:** Kabul edildi; birim testleri, yerel Supabase'de uçtan uca kurulum ve bulut projesinde salt-okur denetim (12/12) ile doğrulandı (2026-10-05)
- **Tarih:** 2026-10-05
- **İlgili:** [0009](0009-herkes-kendi-hesabiyla.md) (bu kararla kısmen değişti), [0015](0015-veritabani-tek-sahip-rls.md), [0016](0016-dis-servisleri-claude-yurutur.md), [0019](0019-google-health-senkronu.md), [rehber](../guides/kurulum.md), ROADMAP Faz 1

## Bağlam
0009 herkesin HoopLab'i kendi Google Cloud ve Supabase hesabıyla kurmasını, kurulum sihirbazının da "uygulamanın ilk açılışında" adımları anlatıp değerleri almasını öngörüyordu. Repo public olunca bu iş öne çıktı. Ancak sunucu tarafında kurulması gerekenler uygulamadan yapılamaz:

- Migration'lar
- Supabase secrets: Google istemci kimliği ve sırrı, zamanlayıcı sırrı
- Vault'taki proje adresi ve zamanlayıcı sırrı
- Edge Functions dağıtımı

Bunlar tam yetkili CLI girişi ister. Google istemci sırrı uygulama paketine giremez. Uygulamayı da herkes kendisi derliyor (App Store dağıtımı yok, PRODUCT §8). Elle kurulum SETUP §9'da dağınık duruyordu.

## Seçenekler
1. **Uygulama içi sihirbaz:** Supabase adresi ve anahtarı ilk açılışta girilip cihazda saklanır. Sunucu tarafını kuramaz. Herkes kendi derlediği için de kazancı az.
2. **Yalnız terminal:** `npm run setup` her şeyi kurar. Eksik kurulumda uygulama genel hata verir.
3. **Terminal + uygulamada durum:** `npm run setup` kurar ve `--check` denetler. Uygulama bağlantı değerleri veya sunucu kurulumu eksikse bunu söyler ve sihirbazı gösterir. Kullanıcı bunu seçti.

Deneme yöntemi: kurulum yerel Supabase'de (Docker) uçtan uca koşar. Bulutta yalnız salt-okur `--check` çalışır. İkinci bir bulut projesi açılmaz. Kullanıcı bunu seçti.

## Karar
- **`tools/setup/setup.mjs`** (`npm run setup`, `npm run setup:check`). Kurallar saf `setup-lib.mjs`'te ve testli. Akış:
  1. Olgular toplanır: proje, publishable anahtar, uygulanmış migration'lar, sırların özetleri, Vault, zamanlayıcı, fonksiyonlar, yeni kayıt ayarı, kullanıcı sayısı.
  2. `evaluate()` bunlardan tek bir denetim listesi çıkarır. Her madde dört durumdan birindedir: **tamam**, **kurulacak**, **senin adımın**, **bekliyor**.
  3. Denetim ve kurulum aynı listeyi kullanır. Kurulum, ilerleme durana kadar turlarla tekrarlanır: şema kurulunca Vault ve zamanlayıcı sırrı açılır.
- **Sihirbazın kurduğu (onayla, `--yes` ile sorusuz):**
  - proje bağlama (`supabase link`)
  - `apps/mobile/.env.local` (yalnız publishable anahtar)
  - migration'lar (önce `--dry-run`)
  - Google istemci sırları (Web istemcisinin JSON'undan)
  - zamanlayıcı sırrı (rastgele; Supabase secrets ve Vault'a aynı değer)
  - Vault'ta proje adresi
  - Edge Functions (`--use-api`, Docker gerekmez)
- **Kullanıcıya kalan (numaralı listelenir):**
  - CLI girişi
  - proje açma
  - yeni kaydı kapatmak
  - giriş hesabını açmak (şifreyi kullanıcı girer)
  - Google Cloud'daki geri dönüş adresi
  - duraklatılmış projeyi devam ettirmek
- **Sırlar okunmadan denetlenir.** Supabase secrets listesi her değerin sha256 özetini verir (ölçüldü). Vault değerinin özeti SQL'de hesaplanır. Google JSON'undaki değerler aynı özetle karşılaştırılır. Sunucuya giden sırlar komut satırına değil geçici bir dosyaya yazılır (`--env-file`, `--file`) ve dosya hemen silinir.
- **`--local`** yerel Supabase'i hedefler: sırlar `supabase/functions/.env`'e yazılır, Vault adresi Kong konteyneridir, `.env.local`'a dokunulmaz. Yerel mod gerçek Google JSON dosyasını kendiliğinden okumaz (aşağıda, Sonuçlar).
- **Uygulama:**
  - Giriş ekranı bağlantı değerleri eksikse `npm run setup`'ı ve rehberi gösterir.
  - Google Health'te fonksiyon yoksa (404) veya sunucu sırları yoksa (503 + `not_configured`) "sunucuda kurulum eksik" denir.
  - Gövdesiz 503 geçici ağ geçidi hatası sayılır, genel mesaj gösterilir.
- 0009'daki "uygulamanın ilk açılışındaki sihirbaz" bu kararla terminale taşındı. 0009'un geri kalanı (merkezi servis yok, her şey kullanıcının hesabında) aynen geçerli.

## Sonuçlar
- Yeni kurulum: [docs/guides/kurulum.md](../guides/kurulum.md). Google tarafı yine elle yapılır ([Google Health rehberi](../guides/google-health-baglantisi.md) §1-4a).
- Sahibinin projesi sihirbazın kendi denetimiyle doğrulanabilir: `npm run setup:check` (12 madde). Yeni migration veya fonksiyon eklendikten sonra kontrol listesine bakmak bu komutla yapılır.
- Sihirbaz yeni bir servis, veri türü veya sır eklemez. DATA-INVENTORY ve COSTS değişmedi.
- Yeni bir sır, fonksiyon veya Vault değeri eklenirse `setup-lib.mjs`'teki listeler ve `evaluate()` da güncellenir. Güncellenmezse `--check` yeşil gösterirken kurulum eksik kalır.
- Geliştirme sırasında hata: yerel deneme `--google-json` vermeden çalıştırılınca varsayılan **gerçek** istemci dosyası okundu ve yerel `.env`'e yazıldı. Kökten düzeltildi (`chooseGoogleJson`, testli); ders LESSONS "Git ve süreç"te. Sır yenilendi ve yeni sır sihirbazla buluta yazıldı. Bu, bulutta yazma yolunun ilk gerçek denemesiydi; ardından iki senkron başarılı oldu.
- **Yeniden değerlendirme tetikleyicisi:** uygulama başkalarına derlenmiş olarak dağıtılmak istenirse (o zaman uygulama içi bağlantı ayarı gerekir); Supabase CLI'ın JSON çıktısı veya secrets özeti biçimi değişirse; Management API ile yeni kaydı kapatmak CLI'dan mümkün olursa.
