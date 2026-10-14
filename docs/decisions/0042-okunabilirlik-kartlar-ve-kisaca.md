# 0042. Okunabilirlik: kartta büyük sayı ortalama, etiketli satırlar, "Kısaca" ve "Neyi hedefliyoruz"

- **Durum:** Kabul edildi. Web önizlemesinde demo ile (390×844), kullanıcı iPhone'da gerçek hesapla baktı.
- **Tarih:** 2026-10-14
- **İlgili:** [0026](0026-aciklama-sayfalari-ve-tur-rengi.md) (açıklama sayfaları), [0021](0021-toparlanma-kisisel-bant.md) ve [0041](0041-gunun-durumunda-nabiz.md) (bant ve günün durumu), [0040](0040-haftalik-rapor.md), [0030](0030-ogun-kaydi.md)

## Bağlam
Kullanıcı Bugün'deki HRV ve nabız kartlarında hangi sayının bugünkü değer, hangisinin ortalama olduğunu ayırt edemedi. Kartlar tutarsızdı:
- HRV ve nabızda büyük sayı 7 günlük ortalamaydı.
- Uyku, solunum ve "Son gece HRV"de büyük sayı son geceydi.
- Kişisel bant çoğu yerde yalnız "bandında" diye söyleniyordu, sayısı görünmüyordu.

Kullanıcı ayrıca uzman olmayan biri için her ölçümde sade açıklama istedi ("mutlaka"). Bir de durumu belirleyen ölçümlerde neyin hedeflendiğini (yüksek mi, düşük mü) ve kendi aralığının kaç olduğunu görmek istedi.

## Karar
- **Büyük sayı:** kartta büyük sayı, günün durumunun baktığı değerdir: 7 günlük ortalama (uykuda 7 gecelik). Altında "7 gün ort. · aralığında" yazar.
- **Etiketli satırlar:** "Son gece", "Aralığın" (kişisel bant, sayıyla) ve uykuda "Hedef: en az 7:00 sa".
- **Kart düzeni:** "Son gece HRV" kartı kalktı; son gece HRV grafiğinin başlığında. Solunum, günün durumuna girmediğini söyleyen tam genişlik bir kart.
- **Terim:** ekranda "bant" yerine "aralığın" denir; açıklama sayfası ikisinin aynı olduğunu söyler. Beslenme halkalarında hedef aralığı "hedefin altında / hedefte" olur, kişisel aralıkla karışmasın.
- **Kısaca (`hint`):** her açıklamada zorunlu, en çok 72 karakter. Kartta ve açıklama sayfasının başında görünür.
- **Neyi hedefliyoruz (`goal`):** günün durumunu belirleyen ya da not çıkaran ölçümlerde zorunlu. Bunlar HRV, uyku nabzı, uyku, solunum, check-in, gece işaretleri, oran, ter testi ve ağrı izleme. İçindeki sayılar yalnız mevcut kurallardan gelir; eşiği olmayan ölçümde "doğrulanmış hedef sayı yok" denir. Yeni eşik yok.
- **Senin değerlerin:** açıklama sayfasında kartın satırları görünür: 7 gün ort., son gece, aralık ve şu anki yeri. Check-in'de bugün, ortalama ve fark puan ve SD olarak ayrı yazılır. Değerler adres satırına konmaz, bellekte tutulur (0026 ile aynı).
- **Sınırda yuvarlama:**
  - Ortalama aralığın dışındayken yuvarlanınca sınırla aynı görünüyorsa bir ondalık fazla gösterilir (`bandDigits`).
  - Uyku süresi aşağı kesilir: 7 saatin altı "7:00" görünüp "kısa" denmez.
  - Koçun "Günün sayıları" belgesi ve demo koç da aynı kuralı izler.

## Sonuçlar
- **Testler:** her açıklamada kısa ve kısa tutulmuş `hint` (`explainers.test.ts`), belirlenen ölçümlerde `goal`. Satır ve yuvarlama yardımcıları `copy/recovery-rows.test.ts` ile denetlenir.
- **Koç:** cümleleri hala "bant" diyor (kaynaklarla uyumlu terim); ekrandaki "aralık" ile birlikte okunur. Koç bulutta: `coach-daily` v13, `coach-ask` v5.
- **Vücut:** sekmesinde kart yok. Bölge yükü ve ağrının kısa cümlesi yalnız açıklama sayfasında.
- **Yeni ekranlarda kural:** her kartta büyük sayının ne olduğu yazılır, kartta sade bir cümle bulunur. Durumu etkileyen ölçümde hedef ve kişisel aralık gösterilir.
