# 0026. Açıklama sayfaları ve yük grafiğinde seans türü rengi

- **Durum:** Kabul edildi; tip denetimi ve testler temiz, web önizlemesinde (390×844, açık ve koyu, demo) ve iPhone'da (Expo Go, demo) doğrulandı
- **Tarih:** 2026-10-06
- **İlgili:** [0010](0010-tasarim-yonu-hale.md), [0021](0021-toparlanma-kisisel-bant.md), [0025](0025-antrenman-yuku.md), `research/rules/`, `apps/mobile/src/copy/explainers.ts`

## Bağlam
Demo üzerinden bakan kullanıcı iki şey istedi (2026-10-06):
1. **Bugün** ve **Trend**'deki her ölçüm ve hesap dokunulabilir olsun; ne anlama geldiği ve neye göre değerlendirildiği anlatılsın. Herkes HRV, AU veya monotonluğun ne olduğunu bilmeyebilir.
2. **Trend** renksiz. Daha renkli olmalı, ama 0025 "renk ve risk dili yok" diyor: yeşil / kırmızı bölgeler basketbolda doğrulanmamış bir sakatlık eşiği ima ederdi.

## Seçenekler
Açıklama için:
- **A. Alt sayfa (formSheet):** her kart ve grafik açıklamaya bağlanır; Bu ne? · Nasıl okunur? · Neye göre? · Sınırlar · Kaynaklar. Güncel değer başlıkta.
- **B.** Tek bir sözlük ekranı. Daha az iş, ama dokunulan karta özgü değil.
- **C.** Kart içinde açılan metin. Izgara kayar, uzun metne uygun değil.

Renk için:
- **A. Seans türüne göre yığılmış çubuk:** renk bilgi taşır (maç, saha, kuvvet / kondisyon, hafif), risk anlamı taşımaz.
- **B.** Yük bölümüne özel tek vurgu rengi. Renk yeni bilgi eklemez.
- **C.** Risk bölgeleri. 0025'i bozar.

Kullanıcı ikisinde de **A**'yı seçti.

## Karar
- **Açıklamalar** `copy/explainers.ts`'te: HRV, son gece HRV, dinlenik nabız, uyku, solunum, check-in, seans yükü (AU, RPE), günlük / haftalık yük, alıştığına göre, 4 hafta ortalaması, monotonluk, gerilim. Her biri `research/rules`'taki kurallara bağlıdır; gösterilen kaynaklar o kuralların kaynaklarından seçilir; sayılar motor sabitlerinden gelir. Kaynağı olmayan açıklama (solunum) yalnız "yorumlanmıyor" der. `explainers.test.ts` kural ve kaynak bağını ve yazım kuralını (CLAUDE.md §6) denetler.
- **Değerin türü** her sayfada etiketli: "Saatin ölçümü", "Kayıtlarından hesap" veya "Tahmin". HRV, nabız ve solunumda "tanı değil" notu.
- **Künyeler** `copy/sources.ts`'te, `research/sources` dosyalarının başlık bilgisinden üretildi; `sources.test.ts` her kaynak dosyasıyla yazar, yıl ve türü karşılaştırır. Toparlanma yöntem ekranı da aynı künyeleri kullanır.
- **Giriş noktaları:** Bugün'de dört ölçüm kartının tamamı ("i" işaretli), HRV grafiği, check-in kartı ve "Bugünün seansları" başlığındaki "i"; Trend'de grafik başlığındaki "i" ve dört kart. Günün durumundaki "i" önceki gibi "Nasıl hesaplanıyor?" ekranına gider.
- **Güncel değer adres parametresiyle taşınmaz** (web'de adres satırında sağlık verisi görünmesin); bellekte, son açılan değer olarak.
- **Tür grupları:** yedi seans türü dörde katlanır: maç; saha (takım antrenmanı, şut); kuvvet / kondisyon; hafif (mobilite / yoga, rehabilitasyon). Yalnız gösterim; hesap değişmez.
- **Renkler** `packages/theme` `loadGroup` token'ı. Durum renklerinden (yeşil / sarı / kırmızı) ayrı tonlar seçildi: maç pembe, saha mavi, kuvvet / kondisyon mor, hafif gri. dataviz doğrulayıcısıyla kart zemininde denetlendi: üç renkli ton açık ve koyu temada bütün çiftlerde renk körlüğü ayrımı ≥ 8 (OKLab ΔE × 100) ve normal görüşte ≥ 15; yığın sırası (alttan üste maç, saha, kuvvet, hafif) komşu çiftlerde de geçer. Gri bilerek renksiz ("diğer" gibi hafif seanslar); yalnız mora komşu ve o çift geçer. Tümü kartta en az 3:1 (`tokens.test.ts`). Değerler ve etiketler metin renginde; renk yalnız karede.
- **Grafik:** yığılmış çubuk, parçalar arası 2 px zemin boşluğu (çubuğun toplam boyu değişmez), yalnız en üst parça yuvarlak. Son 7 gün soluk zemin şeridiyle ayrılır (eski "belirgin / soluk" ayrımının yerine). Altta dört türün son 7 günlük toplamı; güne dokununca o günün türlere göre dağılımı başlıkta.
- **0025 ile ilişkisi:** "renk ve risk dili yok" kuralı "risk rengi ve risk dili yok" olarak daralır. Renk yalnız türü gösterir; oran, değişim ve monotonlukta renk yok.

## Sonuçlar
- Kullanıcı her sayının ne olduğunu ve neye göre okunduğunu uygulamadan öğrenir; kaynaklar ekranda görünür.
- Yeni bir kart veya hesap eklendiğinde açıklaması da yazılır; kural ve kaynak bağı testle zorlanır.
- Yeni kaynak eklenince `copy/sources.ts`'e de eklenir (test kırılır).
- Demo sporcunun geçmişine maç ertesi mobilite ve haftada bir şut seansı eklendi; dört renk de görünür.
- **Yeniden değerlendirme tetikleyicisi:** kullanıcı tür renklerini risk gibi okursa ya da dört grup yetersiz kalırsa (ör. maç ve antrenman ayrımı yetmezse).
