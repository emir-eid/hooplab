# 0029. Beslenme hedefleri ve hidrasyon: gün tipine göre karbonhidrat, sabit protein aralığı, seansa bağlı ter testi; REDs için uyarı yok

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-07
- **İlgili:** [0015](0015-veritabani-tek-sahip-rls.md), [0025](0025-antrenman-yuku.md), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md), PRODUCT modül 5 ve 6, `research/rules/beslenme.json`, `research/rules/hidrasyon.json`

## Bağlam
PRODUCT modül 5 (beslenme) gün tipine göre karbonhidrat ve protein hedefi ile düşük enerji yeterliliği uyarısı istiyor. Modül 6 (hidrasyon) ön ve son tartıdan ter oranı, sıvı hedefi ve %2'den fazla kilo kaybında uyarı istiyor. Girdiler: sabah kilosu, ter testi, basit öğün kaydı ("kalori sayacı değil").

Önce kaynak taraması yapıldı. 10 yeni kaynak PubMed'de doğrulandı, `research:check:online` temiz (69 kaynak, 30 kural). Tam metin okunanlar: davis-2022, kerksick-2018, morton-2018, mcdermott-2017. thomas-2016 ve mountjoy-2023'ün yayıncı sayfaları otomatik erişime kapalı (ödeme duvarı / güvenlik doğrulaması); bu ikisinde yalnız özet kullanıldı.

Kanıtın özeti:
- **Karbonhidrat:**
  - Basketbolda antrenman günü 5-7 g/kg/gün; takım sporlarında orta-çok yüksek yükte 5-12 (davis-2022, sezon içi basketbol derlemesi; yazarların çoğu Gatorade / PepsiCo çalışanı).
  - ISSN derlemesinde genel fitness için 3-5, günde 2-3 saat yoğun antrenmanda 5-8, günde 3-6 saatte 8-10 (kerksick-2018).
- **Protein:**
  - 1,2-2,0 g/kg/gün; 4-5 saatte bir, öğün başına yaklaşık 0,3 g/kg (davis-2022, ortak bildirgeye dayanarak). ISSN bildirgesi 1,4-2,0 veriyor (jager-2017).
  - Meta-analizde 1,6 g/kg/gün üstü ek kas kazanımı getirmedi (morton-2018).
- **REDs:** düşük enerji yeterliliği egzersiz harcamasına göre yetersiz enerji alımı demek; tanı klinik bir araçla (CAT2) konuyor (mountjoy-2023). HoopLab enerji alımını ve yağsız kütleyi kaydetmiyor, bu yüzden hesaplayamaz.
- **Hidrasyon:**
  - Ter kaybı = ön kilo − son kilo + içilen sıvı − idrar (mcdermott-2017; tartıyla tahmin sawka-2007'de de var).
  - Seans sonunda kayıp %2'nin altında kalmalı (mcdermott-2017 öneri gücü A, sawka-2007). Basketbolda beceri %2 kayıpta anlamlı düşüyor (baker-2007, randomize çapraz).
  - Seansta kilo artmamalı; fazla içmek hiponatremiye yol açabilir (mcdermott-2017 A).
  - Sıvı hedefi: 4 saatten kısa toparlanmada kaybın %100-150'si (mcdermott-2017); kısa arada kg başına 1,0-1,5 L (davis-2022).
  - NBA'de maç başına ter kaybı 1-4,6 L (osterberg-2009).

## Seçenekler
Kapsam:
- **A. Hidrasyon ve hedefler.** Ter testi, sabah kilosu, gün tipine göre hedef; öğün kaydı sonraki iş.
- **B.** Yalnız hidrasyon.
- **C.** Hepsi, öğün kaydı dahil. Porsiyon → gram eşlemesi için ayrı kaynak gerekir.

Gün tipi:
- **A. Kayıtlardan, düzeltilebilir.**
- **B.** Her gün kullanıcı seçer.

REDs:
- **A. Uyarı yok.** Bilgilendirme ve yönlendirme.
- **B.** Kilo bandının altına inince not. Bant HRV'den ödünç, doğrulanmadı.

Ter testi:
- **A. Seans kaydına bağlı.**
- **B.** Ayrı form.

Kullanıcı dördünde de önerileni seçti: A, A, A, A.

## Karar
- **Gün tipi** (`karbonhidrat-gun-tipi`):
  - O günün seans kayıtlarından belirlenir: seans yoksa dinlenme; seans varsa antrenman; maç varsa ya da seansların toplamı 180 dakika veya üstüyse yoğun. Kullanıcı tek dokunuşla değiştirebilir; değişiklik o güne kaydedilir.
  - Karbonhidrat hedefi: dinlenme 3-5, antrenman 5-7, yoğun 8-10 g/kg/gün.
- **Protein** (`protein-gunluk`): her gün 1,2-2,0 g/kg/gün, öğün başına yaklaşık 0,3 g/kg, 4-5 saatte bir.
- **Kilo:** hedefler son 7 günün sabah kilosu ortalamasıyla hesaplanır; 7 günde ölçüm yoksa son ölçüm kullanılır, hiç yoksa hedef gram olarak değil yalnız g/kg olarak gösterilir. Sabah kilosu isteğe bağlı bir girdi (Bugün'de). Kilo trendi eşiksiz gösterilir.
- **REDs** (`enerji-yeterliligi`): hesaplanmaz, otomatik uyarı yok. Hedef sayfasında REDs anlatılır, belirtilerde sağlık ekibine yönlendirilir. Öğün kaydı gelince yeniden değerlendirilir.
- **Ter testi** (`ter-orani`, `kilo-kaybi-notu`, `kilo-artisi-notu`, `sivi-hedefi`):
  - Seans formunda isteğe bağlı bölüm: ön kilo, son kilo, içilen sıvı, isteğe bağlı idrar. Süre seanstan alınır.
  - Sonuçta ter kaybı, ter oranı (L/saat) ve net kilo değişimi (%) gösterilir.
  - Kayıp %2 veya üstündeyse not; kilo arttıysa fazla içme notu (tanı değil).
  - Sıvı hedefi için iki durum da yazılır: sonraki seansa 4 saatten az varsa kg başına 1,0-1,5 L, daha uzun ara varsa öğünlerle, susadıkça.
- **Her hedef bir rehber aralıktır, eşik değil.** Kişisel beslenme planı için spor diyetisyenine yönlendirilir (thomas-2016). Takviye bu kararın konusu değil (PRODUCT modül 7, Faz 3).

## Sonuçlar
- Kilo, ter testi ve gün tipi düzeltmesi yeni sağlık / kişisel verileridir. Supabase'de tek sahip RLS ile saklanır (0015), repoya ve demoya gerçek değer girmez; DATA-INVENTORY güncellenir.
- Hedef alımla karşılaştırılmaz; öğün kaydı gelene kadar "bugün ne kadar yemelisin" sorusunun cevabıdır, "ne kadar yedin" değil.
- Dinlenme ve yoğun gün aralıkları genel ve dayanıklılık bağlamından basketbola aktarıldı. Ortak bildirgenin ve REDs konsensüsünün tam metni okunamadı.
- Ter testi tek bir koşulun ölçümüdür; sıcaklık ve seans türü değişince tekrarlanması açıklamada önerilir.
- **Yeniden değerlendirme tetikleyicisi:**
  - Basketbola özgü gün tipi veya maç günü karbonhidrat çalışması.
  - Ortak bildirgenin ya da REDs konsensüsünün tam metnine erişim.
  - Öğün kaydının eklenmesi (REDs ve alım-hedef kıyası).
  - Ter testinde sürekli %2 üstü kayıp.
