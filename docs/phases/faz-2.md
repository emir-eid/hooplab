# Faz 2 özeti: hesap motoru

- **Başlangıç / bitiş:** 2026-10-05 / 2026-10-08
- **Etiket:** `faz-2-tamam`
- **Not:** Faz 1 açık. TestFlight maddesi Apple üyeliğini bekliyor ([0024](../decisions/0024-eas-derleme-ve-guncelleme.md)). Faz 2 bundan bağımsız kapandı.

## Hedef
Baseline, yük, kas / tendon yükü, beslenme ve hidrasyon hesaplarını `packages/engine` içinde deterministik ve testli yazmak. Her eşik `research/rules` içinde doğrulanmış bir kaynağa bağlanacak.

## Sonuç
Bütün ROADMAP maddeleri tamam. Hesaplar motorda, arayüz yalnız gösteriyor. 78 kaynak ve 33 kural var, `research:check:online` temiz. Faz 2'de 60 kaynak yeni eklendi.

| Madde | Karar | Not |
|---|---|---|
| Solunum ve check-in kişisel kıyası (HRV, nabız ve uyku Faz 1'den) | [0028](../decisions/0028-solunum-ve-checkin-kisisel.md) | +3 nefes/dk notu ve z ≤ −1 notu tanı koymaz; ikisi de günün durumuna girmez |
| Antrenman yükü | [0025](../decisions/0025-antrenman-yuku.md), [0026](../decisions/0026-aciklama-sayfalari-ve-tur-rengi.md) | EWMA 7 / 28 yalnız bağlam için. 1,5 notu "Tahmin" etiketli. Monotonluk ve gerilim eşiksiz |
| Kas ve tendon bölge yükü | [0027](../decisions/0027-kas-tendon-bolge-yuku.md) | Katsayısız eşleme. Tendon 48 / kas 72 saat. Ağrı izleme notu var; kalibrasyon yok |
| Beslenme hedefleri ve hidrasyon | [0029](../decisions/0029-beslenme-ve-hidrasyon.md) | Karbonhidrat gün tipine göre, protein 1,2-2,0 g/kg. Ter testi var. REDs için uyarı yok |
| Öğün ve su kaydı | [0030](../decisions/0030-ogun-kaydi.md), [0031](../decisions/0031-su-kaydi-ve-renkli-bugun.md) | Sabit besin listesi (FDC), kalori yok. Su için hedef yok |
| Her eşik bir kurala ve kaynağa bağlı | bu özet | Tarama aşağıda |

## Eşik-kural bağı taraması (2026-10-08)
- **Motor:** `rules-sync.test.ts` her kuralın `value` alanını motor sabitiyle, giriş aralıklarını da veritabanı CHECK'leriyle karşılaştırıyor. Kapsam dışı kalanlar bağlandı:
  - hedef kilo penceresi (7 gün, `weight_days`),
  - protein açıklamasındaki 1,6 g/kg (`no_added_gain_above`),
  - `seans-yuku` formülü, check-in toplam aralığı ve seans süresi CHECK'i.
- **Arayüz metinleri:** Yaklaşık 40 yerde motor sabiti elle kopyalanmıştı ("son 7 gün", "4 hafta", "1 SD", "%2", "250 / 500 / 750 mL", "5'in üstünde", "48-72 saat"). Hepsi artık sabitten üretiliyor. Bir metin motorla çelişiyordu: ter testi notu "%2'nin üstünde" diyordu, motor ise ≥ %2 kullanıyor. Metin "%2 veya üstünde" olarak düzeltildi.
- **Bekçi:** `apps/mobile/src/copy/hardcoded-numbers.test.ts` arayüz kaynaklarında birimli sayı (gün, gece, hafta, saat, SD, nefes, g/kg, mL, %) arar. Bulduğu her sayı ya bir sabitten gelmeli ya da gerekçesiyle izin listesinde olmalı. Listede artık geçmeyen bir parça kalırsa test de kırılır.
- **Eşik sayılmayanlar:**
  - giriş doğrulama sınırları (kilo 30-250, süre 1-600, ter testi, öğün, su 50-2000 mL): veritabanıyla senkron, bilimsel iddia taşımıyor;
  - Vücut sekmesindeki 1 gün / 3 gün / 1 hafta filtresi ([0018](../decisions/0018-vucut-gorunumu.md));
  - Google'ın 7 günlük izin süresi ve 90 günlük ilk senkron ([0019](../decisions/0019-google-health-senkronu.md));
  - kaynak bulgusu olarak anılan sayılar (24 saatte kollajen zirvesi, 1 SD etki büyüklüğü, NBA'de 1-4,6 L ter kaybı).

## Kararlar
[0025](../decisions/0025-antrenman-yuku.md)–[0031](../decisions/0031-su-kaydi-ve-renkli-bugun.md).

## Dersler
LESSONS.md "Literatür ve kaynaklar" bölümü: tam metin Europe PMC'den, WebFetch alıntısı ham metinde doğrulanır, FDC'nin `DEMO_KEY` sınırı, arayüz sayıları motor sabitinden.

## Faz 3'e devredilenler
- Gerçek hesapta bantlar, oran ve "olağan" zamanla oluşacak: toparlanma bandı 12 gece, check-in kıyası 12 check-in, yük oranı 28 gün, bölge "olağan" yaklaşık 30 gün sürer. Notlar gerçek hissiyatla çelişirse yeniden değerlendirilir. Açık riskler [STATE](../STATE.md)'te.
- Ayak bileği ve bel bölge yükü modelinde yok (kaynaklı eşleme bulunamadı).
- REDs ve enerji yeterliliği bilinçli olarak hesaplanmıyor.
- AI koç yalnız bu hesaplanmış sayıları yorumlayacak; kurallar ve kaynaklar pgvector'e yüklenecek ([ROADMAP](../ROADMAP.md) Faz 3).

## Sonraki faz
Faz 3: AI koç. TestFlight (Faz 1) Apple'dan yanıt gelince öne alınır.
