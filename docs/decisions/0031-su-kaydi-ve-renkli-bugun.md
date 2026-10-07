# 0031. Su kaydı hedefsiz; Bugün'de beslenme halkaları ve kategori rengi; öğün ve içiş kaydırarak silinir

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-07
- **İlgili:** [0010](0010-tasarim-yonu-hale.md), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md), [0029](0029-beslenme-ve-hidrasyon.md), [0030](0030-ogun-kaydi.md), PRODUCT §4 ("Beslenme ve su: gün içinde, basit"), `research/rules/hidrasyon.json`, `research/rules/beslenme.json`

## Bağlam
iPhone'daki ilk öğün kaydı denemesinden sonra kullanıcı dört şey istedi:
1. "×1½" yazısı yerine "1,5 porsiyon".
2. Silme altta ayrı bir düğme olmasın: iOS'taki gibi sağdan sola kaydırarak silinsin, düzeltmede porsiyonlar sıfıra indirilip kaydedilince öğün silinsin.
3. Su da kaydedilsin; öğün ve su sağ alttaki + düğmesinden de eklenebilsin.
4. Bugün ekranı "siyah beyaz, renksiz, uzun bir kitap sayfasına" dönüşmeye başladı; renk girsin.

## Seçenekler
Su hedefi:
- **A. Hedefsiz kayıt.** Günün toplamı; ter testi yapılan gün seans sonrası sıvı hedefi yanında.
- **B.** Hedef yok, ama son 2 haftanın kişisel ortalaması referans çizgisi.
- (Elenen) Genel nüfus değerleri (ör. günde 2,5 L): sporcuya özgü değil, CLAUDE.md §3'e göre kurala giremez.

Renk yönü:
- **A. Halkalar ve kategori rengi.** Karbonhidrat, protein ve su için tek kartta üç halka; öğün listesi katlanır.
- **B.** Düzen aynı, satırlara renkli ilerleme çubukları.
- **C.** Önce HTML maket.

Kullanıcı ikisinde de önerileni seçti: A, A.

## Karar
- **Porsiyon yazısı:** "1,5 porsiyon" (virgüllü). Öğün özetinde "Pirinç pilavı 1,5 porsiyon"; düzeltmede sayaçta "1,5 / porsiyon".
- **Silme:**
  - Bugün'deki öğün satırları ve su ekranındaki içişler sağdan sola kaydırılınca "Sil" açılır, dokunmak siler.
  - Ayrı onay yok: kaydırma ve dokunma zaten iki adım. Uygulama gesture-handler'ın `ReanimatedSwipeable`'ı; hareket UI iş parçacığında.
  - Düzeltmede bütün kalemler kaldırılınca düğme "Kaydet ve sil" olur ve öğünü siler. Alttaki "Öğünü sil" düğmesi kalktı.
- **Su** (`sivi-alim-kaydi`):
  - `fluid_intakes` tablosunda bir içiş bir satır (mL, 50-2000).
  - Hızlı ekleme 250 / 500 / 750 mL ya da elle; ekran açık kalır, toplam anında güncellenir.
  - Hedef, renk ve uyarı yok. O gün ter testi yapıldıysa seans sonrası sıvı hedefi (`sivi-hedefi`) su halkasının altında ve su ekranında yazar.
  - Gerekçe: bildirgeler ter oranı kişiden kişiye çok değiştiği için kişisel plan öneriyor (sawka-2007). Ter oranını bilmeyen için susadıkça içmek güvenli yol (mcdermott-2017).
- **+ düğmesi:** Kayıt ekle sayfasına "Öğün" ve "Su" satırları eklendi (check-in ve seansın altına).
- **Bugün'de beslenme kartı:**
  - Üç halka: karbonhidrat, protein, su. İçteki yay kayıtlı miktar, dıştaki ince yay hedef aralığı. Ölçek hedef üst ucunun 1,25 katı.
  - Su halkasında yay yok (hedef yok), halka suyun soluk tonunda.
  - Halkaların altında "Öğün" ve "Su" hızlı ekleme düğmeleri, kategori renginin soluk tonunda. Gün tipi çipleri kartın içinde.
  - Öğün listesi "Öğünler · n öğün · k/n protein dozunda" satırında katlı; dokununca açılır.
- **Renk:**
  - Kategori rengi `palette.nutrient`: karbonhidrat pembe, protein mor, su mavi.
  - Değerler yük grubunun doğrulanmış tonları (0026). Dataviz doğrulayıcısıyla kart zemininde üçü birlikte, tüm çiftler denetlendi; açık ve koyu temada geçti.
  - Turuncu denendi, durum kırmızısıyla normal görüşte bile ayrışmadı (ΔE 5,7), bırakıldı. Durum renkleri yalnız günün durumu için kalır.
  - `alim-hedef-kiyasi` güncellendi: risk rengi yok, kategori rengi var.
- **Yıkıcı eylem rengi:** `palette.destructive` / `onDestructive` (en az 4,5:1, testli). Bileşenlerde ham renk yok.

## Sonuçlar
- İçişler yeni bir kişisel veridir: Supabase'de tek sahip RLS (0015), demoda sentetik. DATA-INVENTORY güncellendi.
- Aynı üç ton Trend'deki yük grafiğinde seans türlerini, Bugün'de besinleri anlatır. İkisi ayrı ekranlarda ve her zaman adla birlikte. Karışıklık görülürse beslenme için ayrı tonlar seçilir.
- Kaydırma hissi ve eşikleri web önizlemesinde ölçülemez (fareyle sürükleme güvenilir değil); iPhone'da denenecek.
- **Yeniden değerlendirme tetikleyicisi:**
  - Sporcuya özgü, günlük sıvı alımı için doğrulanmış bir referans.
  - Halkaların "doldurulması gereken hedef" gibi okunup baskı yaratması.
  - Renklerin risk gibi algılanması.
