# 2026-10-07 15:52 — Öğün kaydı; su kaydı ve renkli Bugün

- **Faz:** 2 (Faz 1'in TestFlight maddesi Apple'ı bekliyor)
- **Durum:** kapandı (/kapat, 23:35)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `90f413a` (Blok 1-2), bu raporun kapanış commit'i

## Blok 1 — Öğün kaydı: kaynaklar, yöntem, veritabanı, motor ve arayüz (açılış 15:52)

### Amaç
STATE'teki 2. iş (takibin tarihi gelmediği için öne alındı): porsiyon → gram için kaynak taraması ve yöntem kararı, ardından uygulama. Kullanıcı: "1 ile başlayalım, o bitince 2 ile 1'in testlerini Expo Go'da beraber yaparız."

### Yapılanlar
- **Kaynaklar:** 9 yeni kaynak PubMed'de doğrulandı, `research:check:online` temiz (78 kaynak). Tam metin okunan: gibson-2016 (Europe PMC); diğerlerinde yalnız özet.
  - Kayıt hatası: `capling-2017` (sporcularda enerji %19 eksik bildiriliyor), `buck-2022` (karbonhidrat ortanca %28 eksik tahmin).
  - Yöntem karşılaştırması: `gibson-2016` (el ölçüsü), `wheeler-1996` (değişim listesi), `amoutzopoulos-2020` (porsiyon araçları), `morello-2025` (doğrulanmış veritabanı ile kullanıcı girişli veritabanı).
  - Veritabanı ve yapay zeka: `fukagawa-2022` (FDC), `goncalves-2026` (fotoğraftan yapay zeka tahmini).
  - REDs: `ackerman-2023` (IOC alt grubu, ölçüm yöntemi).
- **Yöntem:** Kullanıcı üç soruda da önerileni seçti; [0030](../decisions/0030-ogun-kaydi.md).
  - Porsiyon → gram: sabit besin listesi.
  - Alım ile hedef: hedef aralığa yerleştirme.
  - REDs: yine uyarı yok.
- **Besin listesi:**
  - `research/foods/foods.json`: 35 besin, 6 grup.
  - Değerleri `tools/research/foods-fdc.mjs` doldurdu. SR Legacy CSV'si (6,1 MB, CC0) kullanıcı onayıyla geçici klasöre indirildi.
  - Betik motorun okuduğu `packages/engine/src/foods-data.ts`'i üretiyor.
  - `--online` ile 35 besin FDC API'siyle karşılaştırıldı, hepsi aynı.
  - Araç testleri: `tools/research/foods-fdc.test.mjs`.
- **Kurallar:** `rules/beslenme.json`'a `ogun-besin-listesi` ve `alim-hedef-kiyasi` eklendi. `enerji-yeterliligi` güncellendi: alıma dayalı not da yok.
- **Veritabanı:** migration `ogun_kaydi`, `meals` tablosu. `items` jsonb, biçimi `private.valid_meal_items` CHECK'iyle denetleniyor.
  - pgTAP `ogun_kaydi.test.sql` (14 madde); yerelde 118/118.
  - Bulut: dry-run ve push yapıldı. `migration list` eşit. RLS açık, 4 politika. anon REST 401. `db advisors` yalnız bilinen uyarı.
- **Motor:** `packages/engine/src/meals.ts`: `itemMacros`, `mealMacros`, `dayIntake`, `rangePosition` (yuvarlanmış gramla), `reachesProteinDose`.
  - Testler: `meals.test.ts` (üretilen veri ile JSON aynı mı dahil). `rules-sync`'e öğün testi eklendi (çarpanlar, öğün adları, CHECK sınırları).
- **Veri ve demo:** `data/nutrition-view.ts` (`toMeals`, `toStoredItems`, `distinctRecent`), `data/nutrition.ts` (öğün sorgu ve kayıt işlemleri). Demoda bugün 2, dün 3 sentetik öğün.
- **Arayüz:**
  - `app/meal-new.tsx`: öğün adı, son öğünler, seçilenler (− / +), 6 grup, etiketten gram.
  - Bugün'de alım ve hedefe göre yer.
  - Açıklama sayfası güncellendi, 9 künye `copy/sources.ts`'e eklendi.
- **Belgeler:** DATA-INVENTORY (`meals`, FDC satırı), COSTS (FDC: hesapsız, ücretsiz), ROADMAP (öğün kaydı tamam), `research/README` (`foods/`).
- **Doğrulama:**
  - `npm run check` temiz.
  - Web önizlemesi 390×844, açık ve koyu tema, demo. Ekleme, porsiyon artırma, etiketten giriş, düzeltme ve kaldırma denendi. Örnek: 1½ kase pilav ve ½ tavuk göğsü ≈ 67 g karbonhidrat, 33 g protein; elle hesapla aynı.
  - iPhone'da kullanıcı denedi (Blok 2'nin isteklerine yol açtı).
- **Önceki oturumun iPhone kontrolü:** solunum notu, check-in kartı, beslenme bölümü, kilo girişi ve ter testi. Kullanıcı "belirttiğin her şey düzgün" dedi.

### Kararlar
- [0030 Öğün kaydı](../decisions/0030-ogun-kaydi.md):
  - FDC'den sabit besin listesi ve etiketten gram.
  - Alım hedef aralığına yerleştirilir (tahmin).
  - REDs için uyarı yok.

### Sorunlar ve hatalar
- **CHECK'te NULL mantığı:** İlk pgTAP koşusunda fazladan alanlı bir kalem (`kcal`) geçti: `not (false or null)` NULL döndüğü için satır süzgeçten kaçtı. `coalesce(..., false)` ile düzeltildi.
- **FDC erişimi:** Ortak `DEMO_KEY` saatte 10 istekle sınırlı; liste CSV'den dolduruldu.
- **Aynı adlı ölçü:** Beyaz ekmekte iki ayrı "slice" var (29 ve 25 g). `fdc_seq` alanı eklendi.
- **TürKomp:** Sitesine otomatik erişilemedi, açık bir veri lisansı bulunamadı.
- **Kabuk:** Uzun heredoc'lar yine çalışmadı; dosyalar Write aracı ve scratchpad betikleriyle yazıldı. Windows'ta Python CRLF yazdı, `newline='\n'` ile düzeltildi. İkisi de LESSONS'ta zaten var.

### Öğrenilenler
- LESSONS "Supabase": CHECK içindeki `not (A or B)` eksik alanda NULL döner; `coalesce`.
- LESSONS "Literatür ve kaynaklar": FDC `DEMO_KEY` saatte 10 istek; liste CSV'den, API yalnız karşılaştırma için; aynı adlı ölçü için `fdc_seq`.

## Blok 2 — Su kaydı, renkli Bugün, kaydırarak silme ve iki düzeltme (23:21)

### Amaç
iPhone denemesinden sonra kullanıcının istekleri:
- "×1½" yerine "1,5 porsiyon".
- Alttaki sil düğmesi yerine iOS gibi kaydırarak silme, ve porsiyonları sıfıra indirip kaydedince silme.
- Su ve öğünün + düğmesinden eklenmesi.
- Bugün'e renk girmesi ("siyah beyaz, uzun bir kitap sayfası").

### Yapılanlar
- **Yöntem:** Kullanıcı iki soruda da önerileni seçti; [0031](../decisions/0031-su-kaydi-ve-renkli-bugun.md).
  - Su: hedefsiz kayıt.
  - Renk: halkalar ve kategori rengi.
- **Su:**
  - Kural `rules/hidrasyon.json` → `sivi-alim-kaydi` (hedef yok; sawka-2007, mcdermott-2017).
  - Migration `su_kaydi`, tablo `fluid_intakes`. pgTAP `su_kaydi.test.sql` (8 madde; güncelleme yetkisi yok); yerelde 126/126. Bulutta push yapıldı, liste eşit, advisors yalnız bilinen uyarı, anon 401.
  - Motor `hydration.ts` → `dayFluidL`, `fluidQuickAddMl`; `rules-sync` testi.
  - `app/water.tsx`: 250 / 500 / 750 mL ya da elle; bugünün içişleri kaydırarak siliniyor; ter testi yapılan gün sıvı hedefi yazıyor.
- **+ düğmesi:** `app/add.tsx` listesine "Öğün" ve "Su" satırları.
- **Bugün'deki beslenme kartı** (`components/nutrition-section.tsx`):
  - `components/nutrient-ring.tsx`: üç halka. İçte kayıtlı miktar, dışta ince bir yayla hedef aralığı. Su halkasında yay yok.
  - Öğün / Su hızlı ekleme düğmeleri. Gün tipi kartın içinde. Öğün listesi katlanır.
- **Renk:**
  - `palette.nutrient` (karbonhidrat pembe, protein mor, su mavi). Dataviz doğrulayıcısıyla tüm çiftler, açık ve koyu kart zemininde denetlendi; geçti.
  - Turuncu, durum kırmızısıyla ayrışmadığı için (ΔE 5,7) elendi.
  - `palette.destructive` / `onDestructive` eklendi (en az 4,5:1). Token testleri yazıldı.
- **Silme:**
  - `components/swipe-delete.tsx` (`ReanimatedSwipeable`, gesture-handler 2.32): Bugün'deki öğün satırları ve su içişleri.
  - `meal-new.tsx`: kalemler bitince "Kaydet ve sil" öğünü siliyor; alttaki sil düğmesi kalktı.
  - Porsiyon yazısı "1,5 porsiyon" (`copy/nutrition.ts` → `formatPortions`, `portionsText`).
  - `alim-hedef-kiyasi`: `risk_color: false`, `category_color: true`.
- **iPhone geri bildiriminden sonra iki düzeltme:**
  - `ListRow`'a `expanded` eklendi: ok kapalıyken sağa, açıkken aşağı bakıyor (yeni ikon `chevronDown`).
  - Bugün'de "Nasıl hesaplanıyor?" satırına üst boşluk verildi (`recovery-section.tsx`); kutucuk ızgarasına yapışıyordu.
- **Belgeler:** DATA-INVENTORY (`fluid_intakes`), ROADMAP, CHANGELOG, karar dizini.
- **Doğrulama:**
  - `npm run check` temiz.
  - Web önizlemesi 390×844, açık ve koyu tema. Halkalar, katlanır liste, boşaltıp kaydedince silme, "Sil" eylemi (JS ile), su ekleme (1,5 → 2,0 L), ok yönü (yol değişimi ölçüldü) ve kutu boşluğu denendi.
  - iPhone'da kullanıcı denedi: kaydırarak silme, boşaltıp silme, su ve halkalar çalıştı. Kullanıcının yorumu: "çok güzel olmuş".
  - Kişisel ölçüm değerleri görünen ekran görüntüsü yalnız `private/journal`'a not edildi.

### Kararlar
- [0031 Su kaydı ve renkli Bugün](../decisions/0031-su-kaydi-ve-renkli-bugun.md):
  - Su hedefsiz kaydediliyor.
  - Bugün'de halkalar ve kategori rengi.
  - Öğün ve içiş kaydırarak siliniyor; boşaltıp kaydetmek öğünü siliyor.

### Sorunlar ve hatalar
- **Halkadaki hedef bandı:** İlk sürümde band halkanın izinin içindeydi ve izle karışıyordu. Halkanın dışına ince bir yay olarak alındı.
- **Kart ve liste arası:** Etiketsiz `ListGroup`'un üst boşluğu yok; beslenme kartı ve gece verisi ızgarasında yapışma oldu. İki yerde ayrı bir boşluk verildi.
- **Web'de kaydırma:** Fareyle sürükleme `ReanimatedSwipeable`'ı güvenilir tetiklemedi. Kaydırma iPhone'da doğrulandı; web'de yalnız eylem denendi.
- **Tema arayüzü:** İki kez Python ile arayüze alan ekleme sessizce tutmadı (Node testleri tip denetimi yapmadığı için geçti). `tsc` yakaladı, Edit aracıyla düzeltildi.

### Öğrenilenler
- yok (heredoc ve CRLF dersleri LESSONS'ta mevcut; etiketsiz liste grubunun boşluğu tek seferlik düzen hatası).

## Açık kalanlar
- Takip (2026-10-08 / 10): kişisel bant hâlâ oluşuyor (gerçek hesapta 2026-10-07 akşamı); token düşüşü ve yeniden bağlanma.
- Halkaların ve kategori renklerinin birkaç günlük kullanımda baskı ya da risk gibi okunup okunmadığı (0031 tetikleyicisi).
- Listede olmayan besinler etiketten sık girilirse listeye eklenecek (0030).

## Sıradaki adım
- STATE'teki 1. iş: takip (2026-10-08 / 10): kişisel bant, Bugün rengi ve hale, token düşüşü ve yeniden bağlanma, `paired-devices`.
