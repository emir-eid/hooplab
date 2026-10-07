# 0030. Öğün kaydı: FDC'den sabit besin listesi ve etiketten gram; alım hedef aralığa yerleştirilir (tahmin, renksiz); REDs için yine uyarı yok

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-07
- **İlgili:** [0015](0015-veritabani-tek-sahip-rls.md), [0029](0029-beslenme-ve-hidrasyon.md), PRODUCT modül 5 ve §4 ("öğün başına 15 saniye, kalori sayacı değil"), `research/rules/beslenme.json`, `research/foods/foods.json`

## Bağlam
0029 gün tipine göre karbonhidrat ve protein hedefini getirdi ama alımı kaydetmedi; öğün kaydını ve REDs'e yeniden bakışı sonraki işe bıraktı. PRODUCT öğün başına 15 saniyelik, kalori saymayan, karbonhidrat ve proteini kabaca tahmin eden bir kayıt istiyor. Açık soru: porsiyon grama nasıl çevrilecek?

Önce kaynak taraması yapıldı. 9 yeni kaynak PubMed'de doğrulandı; `research:check:online` temiz (78 kaynak, 32 kural). Tam metin okunan: gibson-2016 (Europe PMC). Diğerlerinde yalnız özet.

Kanıtın özeti:
- **Kayıt hatası her yöntemde büyük:**
  - Sporcuların bildirdiği enerji alımı, çift işaretli suyla ölçülen harcamaya göre ortalama %19 eksik (capling-2017, sistematik derleme ve meta-analiz).
  - Eğitimli tip 1 diyabetli yetişkinler öğün karbonhidratını ortanca %28 eksik tahmin ediyor (buck-2022).
- **El ölçüsü:** Yumruk ortalama 1 bardak ediyor, ama şekilsiz besinde (pilav, püre) ağırlık belirgin fazla tahmin ediliyor ve kişiden kişiye değişiyor (gibson-2016; sporcu değil, tek çalışma).
- **Değişim listesi ("porsiyon birimi"):** Grup ortalaması tutuyor, besinden besine sapma büyük (wheeler-1996).
- **Veritabanı:**
  - Kullanıcı girişli kayıtların çok olduğu uygulamada karbonhidrat ve protein geçerliliği zayıf. Doğrulanmış veritabanına dayanan uygulamada iyi (morello-2025, dayanıklılık sporcuları).
  - Görsel ve gram desteği mutfak ölçüsünden isabetli (amoutzopoulos-2020, sistematik derleme).
- **Besin bileşimi:** USDA FoodData Central kamu malı (CC0) ve belgeli; SR Legacy ev ölçülerinin gram karşılığını da veriyor (fukagawa-2022). TürKomp'a otomatik erişilemedi, açık bir veri lisansı bulunamadı.
- **Yapay zeka:** Fotoğraftan karbonhidrat tahmininde ortalama hata 20-28 g, diyetisyenlerde 13 g (goncalves-2026). CLAUDE.md §3'e de aykırı.
- **REDs:** Enerji yeterliliği için alım, egzersiz harcaması ve yağsız kütle gerekiyor; ölçümleri araştırmada bile standart değil (ackerman-2023).

## Seçenekler
Porsiyon → gram:
- **A. Sabit besin listesi.** FDC'den, ev ölçüsü ve gramıyla; paketli ürün için etiketten gram.
- **B.** Porsiyon birimi (karbonhidrat birimi ≈ 15 g gibi).
- **C.** El ölçüsü (yumruk, avuç).

Alım ve hedef:
- **A. Hedef aralığa yerleştir.** Tahmin etiketli, renksiz.
- **B.** Yalnız toplam.

REDs:
- **A. Yine uyarı yok.**
- **B.** Haftalık nötr not (kayıtlı karbonhidrat sürekli alt ucun altındaysa).

Kullanıcı üçünde de önerileni seçti: A, A, A.

## Karar
- **Besin listesi** (`ogun-besin-listesi`):
  - 35 besin, 6 grup (tahıl ve nişasta, baklagil, meyve / şeker / içecek, et / balık / yumurta, süt ürünleri, kuruyemiş).
  - Her besinin ev ölçüsü (ör. "1 kase"), gramı ve 100 g'daki karbonhidrat ve proteini FDC SR Legacy'den (2018-04), FDC kimliğiyle `research/foods/foods.json`'da.
  - Değerleri elle yazılmaz. `tools/research/foods-fdc.mjs --from <CSV>` doldurur ve motorun okuduğu `packages/engine/src/foods-data.ts`'i üretir. `--online` 35 besini FDC API'siyle karşılaştırır; 2026-10-07'de hepsi aynı çıktı.
  - Porsiyon çarpanı 0,5 / 1 / 1,5 / 2 / 3. Gramı motor hesaplar (`packages/engine/src/meals.ts`).
  - Paketli ürün için etiketten karbonhidrat ve protein (0-300 g, ad isteğe bağlı).
  - Serbest besin araması, kalori, fotoğraf ve yapay zeka tahmini yok.
- **Kayıt:**
  - `meals` tablosunda bir öğün bir satır: tarih, öğün adı (kahvaltı / öğle / akşam / ara öğün), kalemler (`items` jsonb; biçimi CHECK ile denetlenir).
  - Gramlar saklanmaz; liste güncellenirse eski öğünler yeni değerle okunur.
  - Akış: öğün adı saate göre gelir. Besine dokunmak ekler, yeniden dokunmak porsiyonu artırır; − / + ile ayarlanır. Son üç farklı öğün tek dokunuşla tekrarlanır. Öğüne dokunmak düzeltme ve silme açar.
- **Alım ve hedef** (`alim-hedef-kiyasi`):
  - Bugün'de karbonhidrat ve protein satırı, öğün varsa "≈ X g" ve "hedef a–b g · aralığın altında / aralıkta / üstünde" gösterir. Karar yuvarlanmış gramla verilir (ekrandaki sayıyla aynı).
  - Öğünün proteini öğün dozuna (≈ 0,3 g/kg, `protein-gunluk`) ulaştıysa satırında yazar; protein satırı "n/m öğün dozda" der.
  - "Tahmin" etiketi ve kayıt eksikliği notu var; renk, eşik ve uyarı yok. Kilo yoksa yalnız gram.
- **REDs** (`enerji-yeterliligi`, güncellendi): hesaplanmaz, uyarı da alıma dayalı not da yok. Açıklama sayfası belirtilerde sağlık ekibine yönlendirmeye devam eder.

## Sonuçlar
- Öğün kaydı yeni bir kişisel veridir. Supabase'de tek sahip RLS ile saklanır (0015); demoda sentetik, repoda hiç. DATA-INVENTORY güncellendi.
- FDC ABD besinlerinden. Türk yemekleri yaklaşık eşlenir (ör. pilav = haşlanmış pirinç, kaşar = cheddar); tarif ve pişirme yağı hesaba girmez. "Kase" ve "bardak" ABD ölçüsü (≈ 240 mL), Türk su bardağından büyük; gramı yanında yazılı.
- Kayıt gerçek alımın altında kalabilir; "aralığın altında" kayıt eksikliğinden de olabilir. Açıklama bunu söyler.
- Liste değişikliği ve listeye besin eklemek için `foods.json` düzenlenip betik yeniden çalıştırılır. Testler, üretilen dosya ile JSON aynı değilse kırılır.
- **Yeniden değerlendirme tetikleyicisi:**
  - Türk besin veritabanına (TürKomp) açık lisansla erişim.
  - Sporcularda hızlı öğün kaydı yöntemlerini doğrulayan bir çalışma.
  - Listede olmayan besinlerin sık etiketten girilmesi (listeye eklenir).
  - Kayıtlı alım ile kilo trendinin sürekli çelişmesi.
