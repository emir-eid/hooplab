# 0010. Tasarım yönü: C · Hale, açık ve koyu tema

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** [0011](0011-hale-efekti-svg.md), [oturum raporu](../sessions/2026-10-03-2236-faz05-tasarim-yonu.md), maketler: [design/maketler/](../../design/maketler/index.html)

## Bağlam
Faz 0.5'in amacı, Faz 1 ekranlarından önce görsel dili seçmek. Üç yön aynı üç ekranla (Bugün, sabah check-in, seans kaydı), 390×844 boyutunda ve sentetik veriyle HTML maket olarak hazırlandı. Her maket yeşil, sarı ve kırmızı gün için karşılaştırılabiliyor.

## Seçenekler
1. **A · Parke:** koyu zemin, skorbord tipografisi (Barlow Condensed, IBM Plex), renk yalnız günün durumundan geliyor. Artısı: durum en net okunuyor, sporcu kimliği güçlü. Eksisi: büyük harf ve sabit genişlikli etiketler uzun metinde yorucu, köşeli düzen dokunma hedeflerini küçültüyor.
2. **B · Defter:** krem kağıt, dergi düzeni, tablo, şekil altyazısı ve dipnotlar (Newsreader, Instrument Sans). Artısı: "her iddia kaynaklı" ilkesini en iyi anlatan yön. Eksisi: bir bakışta okunması yavaş; kağıt dokusu ve serif ince ayarları React Native'de ek iş.
3. **C · Hale:** sakin, iOS'a yakın; durum ekranın üstünde nefes alan bir renk halesi, beyaz kartlar, yüzen kapsül sekme çubuğu (Bricolage Grotesque, Figtree). Artısı: en hızlı okunan yön, tek elle kullanılan büyük kontroller, Expo'da en doğal karşılık. Eksisi: basketbol kimliği en zayıf olan yön.

## Karar
Kullanıcı C'yi "her şeyiyle" seçti. Ardından uygulamanın koyu teması olması istendi. Tema Ben → Ayarlar → Görünüm ekranından **Sistem / Açık / Koyu** olarak seçilir; varsayılan Sistem'dir (iPhone'un ayarını izler). Koyu tema C'nin maketinde tasarlandı: sıcak antrasit zemin, kartlar gölge yerine yüzey tonuyla ayrılır, ana düğmeler tersine döner, hale daha düşük opaklıkta parıltı olarak durur, durum renkleri koyu zeminde okunacak kadar parlatılır.

## Sonuçlar
- Token'lar (renk, tipografi, boşluk, köşe, hareket, hale renkleri) C'nin maketinden çıkarılır; her renk açık ve koyu değerle tanımlanır. React Native `oklch()` anlamadığı için değerler hex olur ([LESSONS](../LESSONS.md)).
- Görünüm ekranına iki öneri eklendi ve henüz kapsamda kesinleşmedi: "Haleyi canlandır" anahtarı (Hareketi Azalt açıksa hale her zaman durur) ve "Diğer" grubundaki yer tutucu satırlar.
- A ve B maketleri karşılaştırma kaydı olarak repoda kalır; B'nin dipnot dili ileride kaynak gösterimi için fikir kaynağı olabilir.
- **Yeniden değerlendirme tetikleyicisi:** cihazda 4 haftalık kullanımda durumun bir bakışta okunmadığı veya koyu temada okunabilirlik sorunu görüldüğü durum.
