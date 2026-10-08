# 2026-10-08 12:06 — Takip: kişisel bant ve token süreleri

- **Faz:** 2 tamam, 3 başladı (Blok 2) (Faz 1'in TestFlight maddesi Apple'ı bekliyor; 2026-10-08'de hâlâ yanıt yok)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1); Opus 5.5, yüksek (Blok 2); Opus 5.5, orta (Blok 3)
- **Commit'ler:** `3f24adf` (Blok 1), `1685a03` (Blok 2), Blok 3'ün `/rep` commit'i

## Blok 1 — Takip: kişisel bant cihazda, token süreleri (12:06)

### Amaç
STATE'teki 1. iş: gerçek hesapta kişisel bant oluştu mu, Bugün'de renk ve hale iPhone'da çıkıyor mu ([0021](../decisions/0021-toparlanma-kisisel-bant.md)); yenileme token'ı 7. günde düştü mü ([0019](../decisions/0019-google-health-senkronu.md)).

### Yapılanlar
- **Kurulum denetimi:** `npm run setup:check` 12/12 tamam.
- **Senkron durumu** (`db query --linked`, yalnız durum sütunları): `connected`, son başarılı senkron bugün, `last_error` boş.
- **Bant:** yalnız sayımla bakıldı, değer okunmadı. Derin uyku HRV'si ve dinlenik nabız için son 7 günde 7/7 değer, önceki 28 günde 12 değer var; motorun alt sınırı (`recoveryMinValues.baseline`) 12. Bant bugün alt sınırdan oluştu.
- **Cihaz** (kullanıcı, Expo Go; Metro Claude'da): Bugün'de hale renkli, günün durumu gösteriliyor; Ben → Google Health "bağlı". Durum ve hissiyat karşılaştırması `../private/journal/` içinde, repoda değer yok.
- **Token süreleri:** `ghealth` CLI çalıştı (çıktı atıldı, yalnız çıkış kodu; `credentials.json` yenilendi). İzin tarihleri: CLI 2026-10-03 01:17, uygulama `connected_at` 2026-10-04 17:18. 7 günlük sınırlar 10 Ekim 01:17 ve 11 Ekim 17:18; düşüş bugün ölçülemez. [LESSONS](../LESSONS.md) "Google Health / veri" maddesine tarihler eklendi.
- **Ürün sorusu:** günün durumu maç gününü bilmiyor; maç günü "Toparlan" uygulanamaz. [PRODUCT §10](../PRODUCT.md)'a açık soru olarak eklendi (Faz 3 koç bağlamı, Faz 4 maç günü protokolü).
- STATE: takip maddesi token tarihleriyle 2. sıraya, Faz 3 koç tasarımı 1. sıraya; 0021 riskine bandın oluştuğu not edildi.

### Kararlar
- yok (yeni karar kaydı yok; maç günü sorusu PRODUCT §10'da açık).

### Sorunlar ve hatalar
- `health_daily` sütun adları iki kez yanlış tahmin edildi (`hrv_deep_rmssd`, `date`); doğrusu `hrv_deep_rmssd_ms`, `local_date`. Migration dosyasından okunup düzeltildi.

### Öğrenilenler
- LESSONS: 7 günlük sürenin tam sınır saatleri ve ölçüm zamanı (yukarıda). Yeni ders yok.

## Blok 2 — Faz 3: AI koç tasarımı, sağlayıcı kıyası, Anthropic Console (2026-10-09 00:28)

### Amaç
STATE'teki Faz 3 başlangıcı: koçun mimarisi (hangi model, kanıtlar nasıl seçilir, kaynak nasıl zorunlu kılınır, ne gider, maliyet), karar kaydı ve API hesabı.

### Yapılanlar
- **Ölçüm:** kanıt tabanı `research/sources` 79 dosya + `research/rules` 7 dosya ≈ 150 KB (tahminen ~50 bin token; ilk çağrıda ölçülecek). ROADMAP'in pgvector planı bu boyutta gereksiz bulundu.
- **Sağlayıcı kıyası** (kullanıcı isteği: Claude Sonnet 5.5 ve Gemini, Kimi, ChatGPT karşılıkları): resmi fiyat sayfaları ve veri politikaları 2026-10-08'de okundu (Anthropic, ai.google.dev, developers.openai.com, platform.kimi.ai; gizlilik sayfaları). Aynı senaryoyla aylık tahmin: Sonnet 5.5 ~3,4 $, Gemini 3.1 Pro ~3,5 $, GPT-5.6 terra ~3,5 $, Kimi K3 ~4,9 $, Opus 5.5 ~6,8 $. Kimi veri politikası (Singapur, eğitimde kullanılabilir, kapatma yok) nedeniyle elendi. Tablo karar kaydında.
- **Karar:** [0032](../decisions/0032-ai-koc-tasarimi.md). Kullanıcı kararları: Claude Sonnet 5.5 (masraf artarsa yeniden tartışılır), özet uygulama açılınca, "Bugün maç var" işareti Faz 3'te.
- **Belgeler:** [ROADMAP](../ROADMAP.md) Faz 3 uygulama adımlarına bölündü; [PRODUCT](../PRODUCT.md) koç satırı, takvim girdisi, §10 maç günü sorusu kapandı; [COSTS](../COSTS.md) fiyatlar, tahmin, hesap ve sır; [DATA-INVENTORY](../DATA-INVENTORY.md) gidenler / gitmeyenler, `coach_*` tabloları, Anthropic saklama (30 gün, eğitimde yok); karar dizini.
- **Anthropic Console** (kullanıcı, adım adım): 10 $ ön ödemeli kredi, otomatik yükleme kapalı (ayrı aylık sınır gereksiz bulundu); çalışma alanı HoopLab; anahtar `hooplab-koc` (bağlı hesap kullanıcı, kapsam HoopLab, bitiş 2027-10-09; kimlik federasyonu Supabase'de yok). Anahtar kullanıcının PowerShell'inde gizli girişle `supabase secrets set --env-file` ile yazıldı; Claude yalnız adın listede olduğunu denetledi.

### Kararlar
- [0032 AI koç](../decisions/0032-ai-koc-tasarimi.md) — Sonnet 5.5 (sınıflandırma Haiku 5.5), vektör araması yok (kural grafiğiyle seçim + önbellekli tam taban), citations ve sunucuda alıntı / sayı denetçisi, kırmızı bayrak ve takviye kodla yönlendirilir, anlık değerler uygulamadan gelir, demo API çağırmaz.

### Sorunlar ve hatalar
- İlk model sorusuna kullanıcı "koça API ile mi bağlanacak?" diye yanıt verdi; API ile şablon (AI'sız) yol açıklandı, ardından kullanıcı çok sağlayıcılı fiyat kıyası istedi.
- OpenAI ve Kimi fiyat sayfaları yeni alan adlarına yönleniyordu (developers.openai.com, platform.kimi.ai); yönlendirme izlendi.

### Öğrenilenler
- LESSONS "Supabase": sırrı sohbete ve komut geçmişine sokmadan yazma yöntemi (gizli giriş → geçici dosya → `--env-file`).

## Blok 3 — Koç kanıt tabanı paketi, kural grafiğiyle seçim, sihirbazda Anthropic anahtarı (00:53)

### Amaç
ROADMAP Faz 3'ün API gerektirmeyen ilk iki maddesi: kanıt tabanının Edge Function'a paketlenmesi ve kaynak seçimi ([0032](../decisions/0032-ai-koc-tasarimi.md)); kurulum sihirbazının `ANTHROPIC_API_KEY`'i tanıması.

### Yapılanlar
- **Paketleyici** [coach-kb.mjs](../../tools/research/coach-kb.mjs) (`npm run research:kb`): önce kaynak doğrulayıcı, sonra 78 kaynak özeti ve 33 kural `supabase/functions/_shared/coach/kb-data.ts`'e (~150 KB, kimliğe göre sıralı, deterministik). Kaynak gövdesinden "Bağlı kurallar" bölümü atılır. `--check` eski veya eksik pakette çıkış 1.
- **Seçim** [kb.ts](../../supabase/functions/_shared/coach/kb.ts): `selectForRules` (kurallar verildiği sırada, kaynaklar ilk geçtiği sırada, tekrarsız; olmayan kural `UnknownRuleError`), `fullKb` (sabit sıra, önbellek öneki için).
- **Testler:** `tools/research/coach-kb.test.mjs` (5; fixture'larla, `--check` olumsuz durumları dahil), `supabase/functions/tests/coach/kb.test.ts` (7; paket `research/` ile eşit, kural → kaynak bağları, seçim). `tsconfig.test.json` `_shared/coach`'u kapsıyor.
- **Sihirbaz:** [setup-lib.mjs](../../tools/setup/setup-lib.mjs) yeni madde "Anthropic API anahtarı (koç)" (yalnız bulut; yok → kurulacak, sırlar okunamazsa bekliyor) ve `anthropicKeyProblem` (boş, boşluklu, yanlış önekli, Admin anahtarı reddedilir; mesaj değeri içermez). [setup.mjs](../../tools/setup/setup.mjs) eksikse ham kipte gizli giriş (yıldız, geri silme, Ctrl+C, boş = atla, 3 deneme), mevcut `writeSecrets` yolu (geçici dosya → `--env-file` → silme). 2 yeni test.
- **Doğrulama:** gerçek projede `setup:check` 13/13; `npm run check` yeşil (araç 70, paket 109, uygulama 107, fonksiyon 28; gizlilik ve kaynak taramaları temiz).
- **Belgeler:** [research/README](../../research/README.md) "Koç paketi" (kaynak değişince paket yeniden üretilir), [kurulum rehberi](../guides/kurulum.md), [SETUP](../SETUP.md) (13 madde), [ROADMAP](../ROADMAP.md) iki madde işaretli, STATE.

### Kararlar
- yok (0032'nin uygulaması). Yerelde Anthropic anahtarı denetlenmez: koç yerelde sahte sunucuyla denenecek.

### Sorunlar ve hatalar
- Gizlilik bekçisi testteki sentetik `sk-ant-…` örneğini gerçek anahtar kalıbı olarak yakaladı (kalıp öneki izleyen 20+ karakter); örnek kısaltıldı. Bekçi doğru çalıştı.
- Python heredoc içinden JS yazarken `
`, `
`, `` kaçışları gerçek kontrol karakterine dönüştü, `node --check` yakaladı; fonksiyon ayrı dosyadan satır aralığıyla yeniden yazıldı.
- Gizli giriş gerçek bir terminalde elle denenmedi (anahtar zaten var, bu oturumun terminali etkileşimsiz).

### Öğrenilenler
- LESSONS "Git ve süreç": kaçış karakteri içeren kod Python dize düzenlemesiyle yazılmaz.

## Açık kalanlar
- Token düşüşü: CLI 10 Ekim 01:17, uygulama 11 Ekim 17:18 sonrası ölçülecek (STATE 2. iş).
- Bandın hissiyatla uyumu tek günle değerlendirilmez; birkaç hafta gözlenir.
- Apple Developer yanıtı bekleniyor.
- Faz 3 uygulaması: günlük özet (girdi şeması ve ölçüm → kural eşlemesi, alıntı denetçisi, `coach_summaries`, Edge Function, Bugün kartı, demo), maç günü işareti, soru-cevap, güvenlik kuralları (ROADMAP Faz 3).
- Sihirbazın gizli girişi elle denenmedi.
- Anahtarın çalıştığı ilk koç fonksiyonu dağıtılınca görülecek.

## Sıradaki adım
Faz 3: günlük özet — girdi şeması, alıntı ve sayı denetçisi, `coach_summaries`, Edge Function (sahte Anthropic sunucusuyla testler, sonra ilk gerçek çağrı).
