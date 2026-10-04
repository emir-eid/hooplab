# 0017. Sabah check-in: beş madde 1-5 (5 = en iyi), ağrı haritası sol / sağ ayrı, NRS 0-10

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-04
- **İlgili:** [0015](0015-veritabani-tek-sahip-rls.md), [PRODUCT §4 ve §10](../PRODUCT.md), `research/rules/iyi-olus.json`, `research/rules/agri.json`, `research/rules/yuk.json`

## Bağlam
PRODUCT §10'da açık soru: check-in ölçeği 1-5, 1-7 mi, 0-10 mu? Sabah check-in'in hedefi 30 saniye; ağrı haritası check-in içinde. İleride kas grubu yorgunluğunu gösterecek vücut görünümü de aynı bölge listesini kullanacak. Kurallar: her ölçek doğrulanmış bir kaynağa bağlı (CLAUDE.md §3), yorum popülasyon eşiğiyle değil kişisel baseline'la yapılır.

Doğrulanan kaynaklar (`research/sources`):
- **zhang-2026** (kolej basketbolcuları, açık erişimli tam metin): beş madde (yorgunluk, uyku kalitesi, kas ağrısı, stres, ruh hali), her biri 1-5, toplam beş maddenin toplamı. Anketi conte-2018'e dayandırıyor.
- **saw-2016** (sistematik derleme): öznel ölçümler yüke nesnel ölçümlerden daha duyarlı; anlamlı okunmaları için kişisel baseline gerekir; az madde sürdürülebilirlik için önemli.
- **burger-2024** (elit basketbol derlemesi): pratikte kısa, uyarlanmış anketler kullanılıyor ve çoğu doğrulanmamış; "Hooper indeksi" dört maddenin toplamı.
- **hooper-1995**, **mclean-2010**: günlük öznel iyi oluşun aşırı yüklenmeyi, toparlanmayı ve maç yükünü izlediğine dair kaynaklar. Yalnız özetleri okundu; ölçek aralıkları bunlardan doğrulanmadı.
- Ağrı için **todri-2025** (NRS-11'in tanımı, açık tam metin) ve **hawker-2011** (ağrı ölçümü derlemesi; yalnız künye doğrulandı).

## Seçenekler
1. **Ölçek:** (a) 1-5 tam sayı; (b) 1-5, 0,5 adımlı (zhang-2026'daki gibi); (c) 0-10. Kullanıcı (a)'yı seçti: basketbol çalışmasındaki ölçekle aynı, her madde tek dokunuş, 30 saniye hedefine en uygunu. (b) kaydırıcı ister ve yavaşlatır. (c)'nin her basamağına anlamlı etiket yazmak zor.
2. **Yön:** (a) Hooper indeksi gibi "yüksek = kötü"; (b) tüm maddelerde "5 = en iyi". (b) seçildi: beş madde aynı yönde okunur, toplam doğrudan iyi oluş olur ("20 / 25"), sabahları ters çevrilmiş madde karışıklığı olmaz.
3. **Ağrı haritası:** (a) PRODUCT'taki 10 bölge tek; (b) sol / sağ ayrı, bel orta hatta tek. Kullanıcı (b)'yi seçti: tek taraflı tendon sorunu kaybolmaz, vücut görünümünde doğru tarafta gösterilir.
4. **Kayıt:** (a) istemci check-in'i ve ağrı satırlarını ayrı ayrı yazar; (b) tek işlemde yazan bir veritabanı fonksiyonu (`save_morning_checkin`, SECURITY INVOKER). (b) seçildi: yarıda kalan kayıt olmaz, RLS yine geçerli.

## Karar
- `daily_checkins`: günde bir satır (`unique (user_id, local_date)`), beş madde `smallint` 1-5, 5 = en iyi. Aynı gün yeniden doldurulursa güncellenir.
- `pain_reports`: gün, bölge ve taraf başına bir satır, NRS 0-10. Bölgeler `calf, achilles, ankle, patellar_tendon, quadriceps, hamstring, adductor, hip, lower_back, shoulder`; taraf `left / right`, bel yalnız `center`. Formda yalnız 0'dan büyük değerler yazılır; o gün yazılmayan bölge "ağrı yok" sayılır.
- `save_morning_checkin(...)`: check-in'i upsert eder, o günün ağrı haritasını gönderilenle değiştirir; yalnız `authenticated` çalıştırabilir.
- Ölçekler ve bölge listesi `packages/engine`'de (`wellnessScale`, `painScale`, `rpeScale`, `bodyRegions`). `research/rules`, motor ve veritabanı CHECK'leri `packages/engine/test/rules-sync.test.ts` ile birbirine bağlı.
- Seans RPE'si değiştirilmiş CR-10 (foster-2001; çapalar haddad-2017'den); seans yükü RPE × dakika, motor hesaplar, saklanmaz.
- Check-in toplamı (5-25) yalnız özet. Yorum (kişisel bant) Faz 2'de, birkaç haftalık kayıttan sonra.

## Sonuçlar
- Ölçek doğrulanmış bir psikometrik araç değil (burger-2024); arayüz ve AI koç bunu tanı aracı gibi sunmaz.
- Literatürdeki Hooper indeksiyle (yüksek = kötü) doğrudan kıyas için yön çevrilmeli; motor bunu açıkça yapar.
- Ağrı haritası check-in'e bağlı ve günlük; gün içinde ikinci bir ağrı ölçümü (seans sonrası) gerekirse ayrı bir zaman damgalı tablo düşünülür.
- **Yeniden değerlendirme tetikleyicisi:** 4 haftalık kullanımda maddeler hep aynı değerde kalırsa (tavan / taban etkisi) daha geniş ölçek veya 0,5 adım; doğrulanmış kısa bir basketbol ölçeği yayımlanırsa (ör. SRSS) ona geçiş.
