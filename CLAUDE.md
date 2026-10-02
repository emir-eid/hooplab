# HoopLab — Claude çalışma kuralları

HoopLab, sahibinin (profesyonel basketbolcu) yalnızca kendisi için kullanacağı bir iPhone uygulamasıdır. Fitbit Air / Google Health verisini ve kullanıcının girdilerini alır. Bunları kişisel baseline'a göre değerlendirir ve yük, toparlanma, kas/tendon yorgunluğu, uyku, beslenme ve hidrasyon için **bilimsel kaynaklara dayanan** yorumlar üretir.

Yığın: Expo (React Native, TypeScript, Expo Router) · Supabase (Frankfurt) · Google Health API v4 · Claude API (yalnız sunucu tarafında). Gerekçeler: [docs/decisions/](docs/decisions/).

## 0. Belge haritası

| Soru | Dosya |
|---|---|
| Şu an neredeyiz, sıradaki iş ne? | [docs/STATE.md](docs/STATE.md) (tek doğruluk kaynağı) |
| Uygulama ne yapacak, modüller, girdiler, kapsam dışı? | [docs/PRODUCT.md](docs/PRODUCT.md) |
| Fazlar ve bitiş kriterleri | [docs/ROADMAP.md](docs/ROADMAP.md) |
| Neden böyle karar verdik? | [docs/decisions/](docs/decisions/README.md) |
| Bilinen tuzaklar ve dersler | [docs/LESSONS.md](docs/LESSONS.md) |
| Önceki oturumlarda ne oldu? | [docs/sessions/](docs/sessions/README.md) |
| Bilimsel kaynaklar ve kurallar | [research/README.md](research/README.md) |
| Otomatik denetim sonuçları | [docs/audits/](docs/audits/README.md) |

Kapsamla ilgili bir işe (yeni ekran, modül, girdi) başlamadan önce PRODUCT.md'nin ilgili bölümü okunur.

## 1. Oturum protokolü

- Oturumlar **her zaman `E:\HoopLab\code` klasöründen** açılır. Başka klasörden açılırsa ayarlar, komutlar ve hook'lar yüklenmez.
- Başta `/ac`, sonda `/kapat`. Token uyarısı gelirse ya da compact yaklaşırsa: `/kapat`, yeni oturum, `/ac`. Sonsuz compact zinciri kurulmaz.
- Tek doğruluk kaynağı [docs/STATE.md](docs/STATE.md). Bir şey orada yazmıyorsa yapılmamış sayılır.
- İş seçilince, başlamadan önce o işe uygun model ve efor tek satır gerekçeyle önerilir. Ayarı kullanıcı yapar.
- Kullanıcının yapması gereken manuel adımlar (konsol tıklamaları, hesap açma, cihazda test) numaralı, net talimatla verilir.

## 2. Gizlilik — kırmızı çizgiler

Repo ileride **public** olacak. Bu yüzden:

- **Sağlık verisi, kişisel bilgi** (boy, kilo, yaş/doğum tarihi, sakatlık geçmişi, e-posta, telefon) ve **sırlar** repoya hiçbir dosyada girmez: kod, belge, test, oturum raporu, commit mesajı dahil.
- Ham veri dışa aktarımları `../private/data/` klasörüne, kişisel gözlemler `../private/journal/` klasörüne yazılır. Bu klasör repo dışındadır.
- Sırlar `.env.local` (gitignore'lu) veya Supabase secrets içinde durur. **`EXPO_PUBLIC_` ile başlayan her değer herkese açıktır** (uygulama paketine gömülür); sır asla `EXPO_PUBLIC_` olmaz. Claude API anahtarı ve Google OAuth sırrı uygulamaya girmez, yalnız Edge Functions kullanır.
- Ekran görüntüsü, demo, test ve örnek veri her zaman **sentetik** veriyle yapılır.
- Commit'ler GitHub noreply e-postasıyla atılır (repo yerel git ayarı).
- Bekçiler: `.githooks/pre-commit` (gizlilik taraması), `.githooks/pre-push` (testler). `--no-verify` **yasaktır**. Bekçi durdurursa sebep düzeltilir.

## 3. Bilim kuralları

- **Sayıları kod hesaplar, AI hesaplamaz.** Baseline, yük, yorgunluk ve hedef hesapları `packages/engine` içinde deterministik ve testli olur. AI yalnız hesaplanmış sayıları yorumlar.
- **Her eşik bir kaynağa bağlıdır.** Uygulamadaki her sayısal eşik veya hedef `research/rules/` içinde tanımlanır ve `research/sources/` içinde doğrulanmış bir kaynağa işaret eder. Ayrıntılar: [research/README.md](research/README.md).
- **Uydurma kaynak yasaktır.** DOI veya PMID'si doğrulanamayan kaynak eklenmez. "Bildiğim kadarıyla şu çalışma..." ile kural yazılmaz.
- **Kanıt hiyerarşisi:** konsensüs / position stand → sistematik derleme / meta-analiz → RCT ve basketbola özgü çalışmalar → uzman görüşü (yalnız bir çalışmaya dayanıyorsa). Podcast ve influencer iddiaları kaynak değildir.
- **Önce kişisel baseline:** Değerler kullanıcının kendi geçmişiyle kıyaslanır. Popülasyon referansı yalnız sporculara özgü bir kaynak varsa kullanılır.
- **Tahmin, tahmin olarak etiketlenir.** Örneğin kas yorgunluğu modeli doğrulanmış bir ölçüm değildir ve arayüzde öyle sunulur.
- **Tıbbi sınır:** teşhis yok. Göğüs ağrısı, A-fib uyarısı veya olağandışı nabız gibi kırmızı bayraklarda yorum yapılmaz, doktora yönlendirilir. Takviye önerilerinde her zaman doping riski uyarısı (WADA listesi, batch-tested ürün) yer alır.
- Telifli tam metin repoya girmez. Kaynak özetleri kendi cümlelerimizle yazılır.

## 4. Teknik kurallar

- TypeScript `strict`. Commit'ten önce tip denetimi ve testler (proje kuruldukça `package.json` script'leri).
- **Kütüphane API'si eğitim verisinden varsayılmaz.** Expo/Supabase sürümleri hızlı değişir. Kullanmadan önce `node_modules` içinden veya resmi dokümandan doğrulanır.
- **Görsel iş gözle doğrulanmadan bitmiş sayılmaz.** Önce web önizlemesinde iPhone boyutunda (390×844) bakılır, sonra cihaz ekran görüntüsüyle kontrol edilir.
- Zaman damgaları her zaman `date` komutundan alınır, asla tahmin edilmez.
- Bilinen tuzaklar ve dersler: [docs/LESSONS.md](docs/LESSONS.md). İlgili bir işe başlamadan önce ilgili bölümü oku.
- Git: `main` dalı. Commit mesajı faz önekiyle başlar (`[F0] ...`). Push yedektir; oturum push'suz kapanmaz. Faz sonlarında etiket atılır (`faz-0-tamam`).

## 5. Skill kullanımı

| İş | Skill |
|---|---|
| Estetik yön, maket | `frontend-design` (yalnız yön; koda CSS alışkanlığı taşınmaz) |
| Native ekran, navigasyon, Expo API'leri | `expo` plugin skill'leri |
| Animasyon, jest, haptics | `animate-expo` + `apple-design`; ilkeler için `emil-design-eng` |
| Reanimated / Gesture Handler / SVG / Skia ayrıntısı | `react-native-best-practices` |
| Animasyon kodu incelemesi | `/review-animations` |
| Renk, tipografi, boşluk token'ları | `design:design-system` |
| Grafikler (HRV, yük, uyku) | `dataviz` (yöntem) + `react-native-best-practices` (çizim) |
| Ekran görüntüsü incelemesi | `design:design-critique`, `design:accessibility-review` |
| Arayüz metinleri | `design:ux-copy` |
| Supabase, RLS, migration, Edge Functions | `supabase` + `postgres-best-practices` |

## 6. Yazım

- Arayüz ve belgeler Türkçe. Türkçe metinlerde **"â" kullanılmaz** (zeka, hala, kar).
- Kod tanımlayıcıları İngilizce, yorumlar ve kullanıcıya görünen metinler Türkçe.
