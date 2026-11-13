# 0059. Tanıtım sayfası: A · Şut yayı (açık / koyu bantlar, kaydırmaya bağlı tek çizgi)

- **Durum:** Kabul edildi (kullanıcı, 2026-11-13: üç maketten "A · Şut yayı")
- **Tarih:** 2026-11-13
- **İlgili:** [0050](0050-portfolyo-sayfasi.md) (portfolyo sayfası), [0053](0053-alan-adi-ve-google-yayin.md) (alan adı), [0010](0010-tasarim-yonu-hale.md) (uygulamanın Hale yönü), maket: [design/maketler/landing/](../../design/maketler/landing/index.html)

## Bağlam
`hooplab.dev` ve `hooplab.dev/tr/` 2026-10-17'den beri tek görünümlü, düz bir sayfaydı (karar 0050): solda başlık, sağda canlı demo, altında akış, kaynak izi, ekranlar. Kullanıcı iki kısa videodaki yaklaşımı beğendi: sayfayı dolaşan, kaydırdıkça çizilen kalın bir fırça çizgisi ve editoryal başlıklar; düz arayüzü kırpım, üst üste binme ve yazıyla "sahneye" çevirmek. Videodaki tasarım başkasına ait; teknikleri alınır, görünümü ve metni kopyalanmaz.

## Seçenekler
Üç yön aynı içerikle, sentetik veriyle ve kaydırmaya bağlı hareketle maket olarak hazırlandı (özel Artifact; telefonda denendi):
1. **A · Şut yayı (seçilen):** açık ve koyu bantlar sırayla; bantların üstünden kalın tek bir çizgi geçer, `mix-blend-mode: difference` ile açık zeminde koyu, koyu zeminde açık görünür ve finaldeki "HoopLab" kelimesinde biter. Başlıklar iki parçalı: kalın grotesk satır, altında italik serif. Hero'da canlı demonun çevresinde yüzen gece ölçüm kartları. Artısı: videodaki etkiye en yakın, mevcut içeriği bölümlere doğal ayırıyor. Eksisi: çizgi telefon genişliğinde metnin üstünden geçiyor.
2. **B · Gece → sabah:** sayfa geceden sabaha renk değiştirir, çizgi gecenin HRV izi ve kişisel bandı, köşedeki saat 23:40'tan 07:05'e ilerler. Artısı: en özgün, ürünün kendi verisinden. Eksisi: tek tema, uzun gradyan; dipnotlu dergi bölümü ek iş.
3. **C · Afiş:** durum renklerinde tam genişlik bantlar, kırpılmış dev kelimeler, eğik ekranlar, kaydırdıkça çizilen saha çizgileri (6,75 m yayı). Artısı: basketbol kimliği en güçlü. Eksisi: her durum için ayrı ekran görüntüsü gerekiyor (Kontrollü yok), metin yoğunluğu düşük.

## Karar
A. Uygulama:
- Statik yapı aynı kalır (`tools/site/build-site.mjs`, `site/index.html`, `site/strings/<dil>.json`, Pages); ek kütüphane yok. Çizgi tek bir SVG `path`; noktaları her bandın `data-pts` özniteliğinde (bant genişliği ve yüksekliğine oran), Catmull-Rom ile yumuşatılır, `stroke-dashoffset` kaydırmayla ilerler. Bant yükseklikleri değişince (`ResizeObserver`, font yüklenmesi) yol yeniden kurulur.
- Hareketi Azalt açıksa çizgi baştan tam çizili, kartların parallax'ı yok; JS yoksa çizgi hiç yok, sayfa eksiksiz.
- Sayfa temadan bağımsız: bantlar sırayla açık / koyu, her bant aynı token adlarını kendi değeriyle tanımlar (bileşenler değişmedi). Ekran görüntüleri bandın rengine göre sabit (açık bantta açık, koyu bantta koyu). Gizlilik sayfası sistem temasını izlemeye devam eder.
- İçerik aynı (neden, akış, kaynak izi ve repodan okunan sayılar, ekranlar, gizlilik, süreç, tıbbi uyarı); bölüm başlıkları iki parçaya ayrıldı, finale demo çağrısı eklendi. Yüzen kartlardaki değerler sentetik ve öyle etiketli.
- Fontlar: Bricolage Grotesque ve Figtree (uygulamayla aynı) + italik için Instrument Serif (Google Fonts).

## Sonuçlar
- Teknoloji satırındaki "Expo SDK 57" bilgisi 58'e güncellendi.
- Çizgi telefon genişliğinde incelir; ilk yayındaki difference karışımı iPhone Safari yüzünden ekte değişti.
- **Yeniden değerlendirme tetikleyicisi:** telefonda okunabilirlik şikayeti ya da kaydırmada takılma (çizgi her karede yalnız `stroke-dashoffset` değiştirir; yol yalnız boyut değişince yeniden kurulur).

## Ek (2026-11-13 akşam): iPhone Safari düzeltmesi
Yayından sonra kullanıcının iPhone ekran kaydında çizgi sayfanın üst kısmında (hero, "Neden") içi siyah, yalnız kenarları açık göründü; alt bantlarda doğruydu. iOS Safari uzun SVG'de `mix-blend-mode: difference`'ı bozuyor (LESSONS). Değişiklik:
- Karışım kaldırıldı. Çizginin iki kopyası bant dikdörtgenleriyle kırpılır: açık bantta koyu (`#15171A`), koyu bantta açık (`#F1F0EC`).
- Çizgi bant zemininin üstünde, metin ve görsellerin arkasında (bantlar konumlandırılmaz, içerikleri konumlanır). Arkada kalan çizgi aynı renkteki metni okunmaz yaptığı için bant içinde metin sütunlarından uzak durur: `data-pts` artık `L` / `R` (kenar boşluğunun ortası) ve `t` / `b` (bandın üst / alt iç boşluğu) da alır; kenar boyunca iniş boşluğun içinde hafifçe dalgalanır, karşı kenara geçiş bantlar arasındaki boşlukta olur. Hero'daki metin–telefon arası geçiş korunur.
- Çizgi kalınlığı kenar boşluğuna sığar (telefonda ~12 px, masaüstünde 52 px). Final: çizgi aynı renkteki "HoopLab" harflerinin arkasına girmez, "H"nin hemen solunda biter.

## Ek (2026-11-13 gece): akıcılık
Kullanıcı iPhone'da hafif takılma gördü ve kare hızının artırılıp artırılamayacağını sordu. iPhone Safari kaydırmaya bağlı güncellemeleri 60 Hz'de yapar; sayfa bunu yükseltemez. Takılma iki yerden geliyordu: her karede sayfa boyu çizginin tamamı yeniden kesikleniyor, kırpılıyor ve boyanıyordu; bantlar arası neredeyse yatay geçişte uç 2-3 karede ekranın bir yanından öbürüne atlıyordu (kullanıcının ekran kaydı). Değişiklik:
- Her bandın kendi SVG'si var ve yalnız kendine değen eğri parçalarını taşır; renk bandın sınıfından gelir, kırpma SVG'nin kendi kutusudur. Karede yalnız ucun bulunduğu bandın kesiği değişir; tam ve boş bantlar yeniden boyanmaz.
- Uç ekran yüksekliğinin %62'sini izler (çizginin o y'ye ulaştığı uzunluk, örnek tablosundan). Son bant kalan kaydırmaya yayılır; çizgi en altta kelimede biter.
- Uç hızı en fazla 2400 px/sn; fark büyürse 0,2 sn'de kapanacak kadar esner. Geçişler iç boşluğun tamamını kullanır, daha diyagonaldir. Kenardaki inişte eğri kontrol noktaları kenar boşluğuna sıkıştırılır (telefonda hero'da çizgi ekran dışına taşıyordu).
- Ölçüm: headless WebKit'te kare süresi ~9 kat kısaldı; 60 Hz sanal saatle ucun karedeki en büyük ilerlemesi 126-197 px'ten 40 px'e indi. Kullanıcı iPhone'da yerel ağdan baktı: akıcı.
