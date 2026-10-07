# 0028. Solunum ve sabah check-in için kişisel kıyas: solunum bandı ve tek gece notu, check-in z-skoru; ikisi de günün durumuna girmez

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-07
- **İlgili:** [0017](0017-sabah-check-in-olcegi.md), [0021](0021-toparlanma-kisisel-bant.md), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md), `research/rules/toparlanma.json`, `research/rules/iyi-olus.json`

## Bağlam
Solunum hızı Bugün'de yalnız gösteriliyordu, bandı ve kuralı yoktu (0021). Check-in toplamı yalnız özetti; yorumu "birkaç haftalık kayıttan sonra Faz 2'de" diye ertelenmişti (0017). Önce kaynak taraması yapıldı. 7 yeni kaynak PubMed'de bulundu, özetleri okundu, `research:check:online` temiz (59 kaynak, 23 kural).

Kanıtın özeti:
- **Solunum:**
  - Gece solunum hızı kişiler arasında çok, kişi içinde az değişiyor. Fitbit'in kendi çalışmasında 14 günlük değişim katsayısı 20-24 yaşta %2-9,5 (natarajan-2021; yazarlar Fitbit çalışanı).
  - Enfeksiyon başında gece solunumu yükseliyor:
    - Semptomlu kişilerin yaklaşık üçte birinde, belirtiler çevresindeki haftada en az bir gece olağanın 3 nefes/dk üstünde (natarajan-2021, tam metin).
    - WHOOP verisiyle kurulan bir model aynı sapmadan erken uyarı üretti (miller-2020).
    - Kadın sporcularda solunum, pozitif testten 3 gün önce kişisel başlangıç düzeyinin üstüne çıktı (renteria-2024, n=14).
  - Solunum hastalık dışında stres, sıcak, soğuk ve efora da duyarlı (nicolo-2020, anlatı derlemesi).
  - Solunuma özgü doğrulanmış bir bant genişliği bulunamadı.
- **Check-in:**
  - Sabah iyi oluşunun kişisel z-skoru −1 olunca o günkü antrenman çıktısı küçük ama anlamlı düşük bulundu (gallo-2016).
  - Kırmızı bayraklar sporcunun kendi profiline göre konmalı; maç ertesi düşüş olağan (gallo-2017).
  - Maddeler yüke aynı duyarlılıkta değil; sabah yorgunluğu en duyarlısı (thorpe-2015).
  - Öznel ölçümler yüke nesnel ölçümlerden duyarlı (saw-2016, kütüphanede).
  - Üçü de Avustralya futbolu veya futbol çalışması; basketbolda z-skoru kullanan bir çalışma bulunamadı.

## Seçenekler
Solunum:
- **A. Kişisel bant + tek gece notu.** HRV ve nabızla aynı bant; son gece kişisel ortalamanın 3 nefes/dk üstündeyse not; günün durumuna girmez.
- **B.** Yalnız bant.
- **C.** Bant ve günün durumu: bant dışı solunum "Kontrollü"ye çeker; sporcularda kaynağı yok.

Check-in:
- **A. Günlük z-skoru.** Bugünkü toplam, önceki 28 gündeki kendi check-in'lerine göre; z ≤ −1 ise not ve en çok düşen madde.
- **B.** HRV gibi 7 günlük ortalama bandı. Daha sakin, ama öznel ölçümün güçlü yanı olan günlük duyarlılığı kaybeder.

Günün durumu:
- **A.** Check-in girmez, yanında gösterilir.
- **B.** z ≤ −1 durumu "Kontrollü"ye çeker.

Kullanıcı üçünde de önerileni seçti: solunumda A, check-in'de A, günün durumunda A.

## Karar
- **Solunum bandı** (`solunum-bant`):
  - Son 7 günün ortalaması, önceki 28 günün ortalaması ± 0,5 SD'ye göre. Veri yeterliliği HRV ile aynı (`toparlanma-veri-yeterliligi`: 7 günde 3, bantta 12 gece). Ham değer kullanılır, logaritma alınmaz.
  - Bant dışı "her zamankinden farklı" diye gösterilir; iyi veya kötü denmez, renk yok.
  - Günün durumuna girmez.
- **Tek gece notu** (`solunum-tek-gece`):
  - Son gece, önceki 28 günün kişisel ortalamasının 3 nefes/dk veya daha fazla üstündeyse not düşer. Bandın kurulmuş olması gerekir.
  - Not tanı koymaz. Olası nedenleri sayar (hastalık başlangıcı, sıcak, alkol, stres, yükseklik) ve "kendini hasta hissediyorsan doktora başvur" der.
  - 3 nefes/dk, tam metindeki kişisel z ≥ 2,33 analizinden daha temkinli; daha az yanlış alarm için seçildi.
- **Check-in z-skoru** (`checkin-kisisel`):
  - z = (bugünkü toplam − önceki 28 gündeki check-in toplamlarının ortalaması) / örneklem SD'si.
  - Yalnız check-in yapılan günler başlangıca girer, bugün dahil değil. En az 12 check-in gerekir. SD 0 ise z hesaplanmaz.
  - z ≤ −1 ise "alıştığından belirgin düşük" notu çıkar ve kendi ortalamasına göre en çok düşen madde yazılır.
  - z-skoru kişinin kendi bildirimi; tahmin değil, ama tanı ya da doğrulanmış bir ölçek de değil (burger-2024, 0017).
- **Günün durumu değişmez:** HRV, dinlenik nabız ve uyku (0021). Check-in ve solunum ayrı satırda durur.

## Sonuçlar
- Gerçek hesapta check-in notu 12. check-in'den, solunum bandı 4 haftalık geceden sonra görünür.
- 3 nefes/dk tanımlayıcı bir sayı, doğrulanmış bir uyarı eşiği değil; yanlış alarm oranı bilinmiyor. Not sık çıkar ve hissiyatla çelişirse yeniden değerlendirilir.
- Check-in'de haftanın günü ve maçtan geçen süre ayrı profil olarak modellenmiyor. Maç ertesi düşüş açıklama metninde anlatılıyor (gallo-2017).
- Futbol ve Avustralya futbolu bulgularının basketbola aktarımı varsayım. Bant genişlikleri ve en az 12 değer, HRV kaynaklarından aktarıldı.
- **Yeniden değerlendirme tetikleyicisi:** basketbolda kişisel iyi oluş z-skoru veya gece solunumu üzerine doğrulanmış bir çalışma; not gerçek hissiyatla sürekli çelişirse; check-in'i günün durumuna katmak istenirse (0021'in tetikleyicisiyle birlikte).
