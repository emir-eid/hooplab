# 0040. Haftalık rapor: takvim haftası, yalnız motorun sayıları, yeni eşik yok

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-14
- **İlgili:** [0025](0025-antrenman-yuku.md) (yük pencereleri), [0021](0021-toparlanma-kisisel-bant.md) (bant), [0028](0028-solunum-ve-checkin-kisisel.md) (check-in kıyası), [0018](0018-vucut-gorunumu.md) (ağrı gün gün), [0029](0029-beslenme-ve-hidrasyon.md) / [0030](0030-ogun-kaydi.md) (beslenme), [0039](0039-gece-isaretleri.md) (gece işaretleri), ROADMAP Faz 4, oturum raporu (2026-10-14)

## Bağlam
ROADMAP Faz 4'te "Haftalık rapor" maddesi vardı, ama PRODUCT'ta tanımı yoktu. Trend sekmesi "son 7 gün"ü gösteriyor; kayan pencere maç ve antrenman takvimine oturmuyor, geçmiş haftalara da dönülemiyor. Monotonluk ve gerilim açıklamalarında "kendi geçmişinle kıyas haftalar biriktikçe gelecek" sözü verilmişti. PRODUCT §9 çıktıların kondisyoner, fizyoterapist ya da diyetisyenle paylaşılabilir olmasını istiyor.

Kullanıcıya üç soru soruldu (2026-10-14):
1. **Hafta:** takvim haftası (pazartesi-pazar, biten hafta, geçmişe dönülebilir) mi, son 7 gün mü? → Takvim haftası.
2. **Koç yorumu:** şimdi mi, sonra mı? → Şimdilik yalnız sayılar.
3. **Paylaşım:** → Şimdilik yok; uzun vadede PDF isteniyor.

## Seçenekler
1. **Mevcut okumaların haftalık derlemesi.** Her gün Bugün ve Trend'deki aynı hesapla okunur. Rapor toplar, sayar, ortalar; yeni eşik yok.
2. Haftaya özgü yeni göstergeler (ör. haftalık uyku borcu, haftalık kalori dengesi). Yeni kaynak ve kural ister. Kalori öğün kaydında yok (0030); uyku ihtiyacı ölçülmüyor.
3. Raporu koça yazdırmak. Maliyet getirir ve doğrulanacak sayı tabanı önce oturmalı; kullanıcı ertelemeyi seçti.

## Karar
Seçenek 1.

- **Hafta:** ISO haftası, pazartesi başlar.
  - Varsayılan biten son hafta.
  - Süren hafta "Sürüyor · n. gün" etiketiyle açılır; yalnız bugüne kadarki günler sayılır.
  - Kaydın başladığı haftadan (seans, cihaz verisi ya da check-in'in en eskisi) öncesine gidilmez; gelecek haftaya gidilmez.
- **Motor:** `packages/engine/src/weekly.ts` (testli).
  - Hafta sınırları.
  - `readCompletedWeekLoad`: haftanın son günü (pazar) "bugün" sayılarak `readTrainingLoad`. Pazar seansı girilmemiş olsa da hesap pazarda biter (Trend'in "bugün seans yoksa dün" kuralı burada uygulanmaz).
  - Önceki 4 haftanın toplamı, monotonluğu ve gerilimi. 4, `yuk-haftalik`'in `average_weeks`'i.
  - Haftalık check-in: ortalama toplam ve madde ortalamaları, haftadan önceki 28 günle. Düşük günler her gün kendi `checkin-kisisel` okumasıyla.
  - Haftalık kilo: ortalama ve önceki haftaya göre fark (eşiksiz).
- **Görünüm:** `apps/mobile/src/data/weekly-report-view.ts` (saf, testli). Ekrandan bağımsız bir veri nesnesi; ileride PDF de aynı nesneden üretilir.
  - **Toparlanma:** her günün durumu `dayStatus` ile. Biten haftada HRV ve dinlenik nabzın 7 günlük ortalaması tam olarak haftadır; bant haftadan önceki 28 gündür (`toparlanma-bant`). Uyku haftanın gece ortalaması; "kısa" yalnız biten haftada ve `uyku-kisa`'nın kendi tanımıyla (7 gecelik ortalama).
  - **Gece notları:** her gün `readRespiration` (yalnız o günün gecesi) ve `readIllnessSigns`. Yönlendirme metni 0039'daki gibi; tanı yok.
  - **Ağrı:** her gün ayrı gösterilir, birleştirilmez (0018). `bolge-agri-izleme`'nin 5 sınırının üstündeki günler sayılır.
  - **Beslenme:** her gün `buildNutritionView` ile. Yalnız öğünlü günler sayılır: aralığın altında, içinde ya da üstünde (`alim-hedef-kiyasi`, tahmin, uyarı yok). Kilo yoksa gram hedefi yok ve bu ayrıca yazılır. Gün tipleri ve işaretli maç günleri, su (yalnız kayıtlı günlerin ortalaması, hedefsiz), ter testi sayısı.
- **Arayüz:**
  - Trend'in başında "Haftalık rapor" satırı: biten haftanın tarih aralığı, sayı yok. Satır raporu açar.
  - `app/weekly.tsx`: hafta değiştirici; yük (türe göre yığılmış 7 çubuk ve 4 kutucuk); toparlanma (7 günlük durum noktaları, HRV / nabız / uyku); gece notları (yalnız varsa); check-in; ağrı şeridi; beslenme ve sıvı; sabah kilosu.
  - Risk rengi yok. Durum noktaları Bugün'deki günün durumu renginde, çubuklar seans türü renginde (0026).
  - Açıklama sayfası "Haftalık rapor" (`weeklyReport`). Kuralları ilgili ölçümlerinkiler; rapor koça gitmez.
- **Paylaşım ve koç yorumu:** bu kararın dışında. Paylaşım uygulamanın dışına sağlık verisi çıkarır: DATA-INVENTORY'de yeni bir akış olur ve ayrı bir karar ister.

## Sonuçlar
- Yeni kaynak, kural ya da tablo yok. Veri akışı değişmedi: rapor yalnız sahibinin satırlarını okur (RLS), hiçbir servise gitmez.
- Raporu açmak 13 sorgu (paralel); Trend satırı veri çekmez.
- Demo sporcuya 2-13 gün önce için öğün ve içiş eklendi; bugün ve dün aynı kaldı (ayrı tohum, diğer demo değerleri kaymaz).
- Sınırlar:
  - Kaydedilmemiş seans dinlenme günü, girilmemiş öğün düşük alım gibi görünür (0025, 0030).
  - Süren haftada değişim, oran, monotonluk, gerilim ve bant kıyası hafta bitince gelir.
  - Ortalama uyku dakikası ekranda yuvarlanır; ortalama 7 saatin hemen altındayken "7:00 · ortalama kısa" yazabilir (Bugün'deki biçimle aynı).
- **Yeniden değerlendirme:**
  - Kullanıcı haftayı başka bir günde başlatmak isterse (ör. maç gününe göre).
  - PDF paylaşımı istendiğinde (aynı görünüm nesnesinden; ayrı karar).
  - Koç yorumu eklenmek istendiğinde (0032'deki maliyet ve denetim ilkeleriyle).
