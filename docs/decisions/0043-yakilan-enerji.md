# 0043. Yakılan enerji: bilekliğin tahmini, tahmin etiketli ve alımla karşılaştırılmadan

- **Durum:** Kabul edildi. Motor ve uygulama testleri geçti. Web önizlemesinde demo ile doğrulandı (390×844, açık ve koyu tema). iPhone'da gerçek hesapla bakılacak.
- **Tarih:** 2026-10-14
- **İlgili:** [0019](0019-google-health-senkronu.md) (veri zaten senkronda), [0029](0029-beslenme-ve-hidrasyon.md) (düşük enerji yeterliliği hesaplanamaz), [0030](0030-ogun-kaydi.md) (öğün kaydı kalori saymaz), [0040](0040-haftalik-rapor.md), [0042](0042-okunabilirlik-kartlar-ve-kisaca.md) (kart düzeni)

## Bağlam
Kullanıcı (2026-10-14) yakılan kaloriyi görmek istedi: Bugün'de günlük toplam, seansta ve "Saatten gelenler"de seansın kalorisi, haftalık raporda haftalık toplam.

Veri senkronda zaten vardı: `health_daily.calories_kcal` (Google Health `total-calories` günlük toplamı, bileklik ailesi) ve `exercise_sessions.calories_kcal`. Yeni veri türü, sır ya da servis yok. Bulutta yalnız evet / hayır dönen sorgularla iki şey ölçüldü (değer okunmadı):
- **Günlük toplam dinlenirken yakılanı da içeriyor.** Cihazın ilk (yarım) günü dışında her tam günün değeri yalnız hareketle açıklanamayacak kadar yüksek.- **Bugünün değeri gün içinde birikiyor.** Akşamüstü senkronunda bugünün değeri önceki günlerin ortalamasının altındaydı ve günün geçen kısmıyla aynı büyüklükteydi.

PRODUCT "kalori sayacı değil" diyor; bu ilke alım tarafı için.

## Kaynaklar (7 yeni kaynak, PubMed ve Crossref'te doğrulandı, `research:check:online` temiz)
Tamamının tam metni Europe PMC'den okundu. Arayüze giren sayılar ham metinde doğrulandı.
- **lambe-2026** (Fitbit algoritmalı Pixel Watch 3, koşu bandı): ortalama mutlak yüzde hata %15,02. Kişiden kişiye yaklaşık %2 ile %49 arasında.
- **reddy-2018** (Fitbit Charge 2; aralıklı yüksek yoğunluk ve kuvvet dahil): ortalama mutlak yüzde hata %25,1.
- **shcherbina-2017** (7 bileklik): hiçbiri %20'nin altına inmedi. Fitbit Surge'de medyan hata %27,4.
- **chevance-2022** (Fitbit meta-analizi): dakikada ortalama 2,77 kcal az tahmin, tek ölçümde geniş yayılım.
- **feehan-2018** (Fitbit sistematik derlemesi): dur-kalklı, spor benzeri harekette çoğunlukla az tahmin (−%12 ile −%19).
- **doherty-2024** (şemsiye derleme): genelde az tahmin; çalışmalarda hata −%21 ile +%15 arasında.
- **argent-2022** (INTERLIVE uzman bildirgesi): 62 çalışmanın yalnız 5'i serbest yaşamda yapılmış. Günlük toplamın doğruluğu en az çalışılmış alan.

**Fitbit Air için yayımlanmış bir geçerlilik çalışması yok. Basketbolda bileklikle yapılmış bir çalışma da yok** (tek basketbol çalışması kol bandıyla, o da az tahmin buldu; kaynak olarak eklenmedi).

## Karar
- **Ne gösterilir:**
  - Bugün'de "Yakılan enerji" kartı. Büyük sayı bugünün son senkrona kadarki değeri ("Bugün şu ana kadar · 17:46 itibarıyla"). Satırlarda "Dün (tam gün)" ve "7 gün ort." (bugünden önceki 7 tam gün; eksik günde gün sayısı yazar). Kartta kısa cümle var, durum rengi yok. Kart Gece verisinin üstünde, beslenmeden ayrı durur.
  - Seans satırında ve "Saatten gelenler"de saatin oturum kalorisi ("~640 kcal").
  - Haftalık raporda "Yakılan enerji · tahmin": haftanın toplamı, gün ortalaması (süren haftada bugün hariç), önceki hafta.
- **Tahmin etiketi:** açıklama sayfası "Tahmin"dir. Değer en yakın 10 kcal'e yuvarlanır. Hata payı metinde kuraldan gelir: yaklaşık %15-30 (`rules/enerji.json` → `enerji-harcamasi-tahmin`, `enerji-gosterim`).
- **Eşik, hedef yok.** Günün durumuna girmez.
- **Alımla karşılaştırılmaz, enerji dengesi hesaplanmaz.** Bu kaynakların doğrudan önerisi değil, HoopLab'in çıkarımı. Harcamadaki %15-30 hata ve kayıtlı alımdaki eksiklik (capling-2017) birleşince günlük fark anlamlı olmaz. Öğün kaydı zaten kalori saymıyor (0030). Düşük enerji yeterliliği hesaplanamaz (0029).
- **Koça gitmez.** Koçun anlık değerlerine eklenmedi. Kaynaklar kanıt tabanında olduğu için soru-cevapta sorulursa doğruluğu anlatılabilir.

## Sonuçlar
- **Motor:** `packages/engine/src/energy.ts` (`readEnergy`, `readWeeklyEnergy`, `roundKcal`). Kural bağı `rules-sync.test.ts`'te.
- **Uygulama:**
  - Kart `components/energy-section.tsx`, görünüm `data/energy-view.ts`, metinler `copy/energy.ts`.
  - Seans kalorisi `training_sessions` sorgusunda bağlı saat oturumundan gömülü okunur (`exercise_sessions(calories_kcal)`). Şemasız istemci tipi dizi sandığı için nesne ve dizi ikisi de kabul edilir.
  - Demo sporcuda sentetik günlük toplam ve oturum kalorisi var.
- **Kanıt tabanı:** 105 kaynak, 43 kural. Koç paketi yeniden üretildi ve bulutta: `coach-daily` v14, `coach-ask` v6 (oturumsuz istek 401, `setup:check` 13/13).
- **Açık:**
  - Gerçek hesapta seans kalorisinin gömülü okuması iPhone'da görülecek. Web önizlemesi demoyla çalışır, sorguyu denemez.
  - Google'ın discovery belgesinde (revizyon 20261013) yeni `active-energy-burned` ve `basal-energy-burned` tipleri var. Fitbit Air'in bunları üretip üretmediği ölçülmedi. Üretiyorsa ileride hareketle yakılan ayrıca gösterilebilir.
