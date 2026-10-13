# 0039. Gece işaretleri: dinlenik nabız, SpO2 ve cilt sıcaklığında kaynaklı, tanı koymayan "doktora danış" notu

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-13
- **İlgili:** [0028](0028-solunum-ve-checkin-kisisel.md) (solunumun tek gece notu, aynı desen), [0032](0032-ai-koc-tasarimi.md) (kırmızı bayrakta kodla yönlendirme), [0038](0038-takviye-ve-doping.md) (bu iş orada ertelenmişti), [0019](0019-google-health-senkronu.md) (veri), CLAUDE.md §3, oturum raporu (2026-10-13)

## Bağlam
0038'de takviye işine fizyolojik kırmızı bayrak eşikleri girmemiş, "kaynaklı eşik bulunursa ayrı iş" diye bırakılmıştı. Kullanıcı 2026-10-13'te bu işi istedi. Google Health senkronu gece SpO2 ortalamasını (ve alt / üst sınırını) ve gece cilt sıcaklığıyla cihazın taban sıcaklığını zaten yazıyordu, ama uygulama ikisini hiç göstermiyordu. Dinlenik nabız yalnız toparlanma bandında kullanılıyordu (7 günlük ortalama). Solunumun tek gece notu (0028) aynı türden bir not: kişisel olağandan belirgin sapma, tanı yok, belirtide doktora yönlendirme.

Dört literatür taraması yapıldı (DOI / PMID Europe PMC'de, sayılar ham metinde doğrulandı):
1. giyilebilir cihazla dinlenik nabız ve hastalık başlangıcı,
2. cilt sıcaklığı ve ateş,
3. gece SpO2'nin normal değerleri ve bileklik doğruluğu,
4. sporcuda hastalıkta antrenman uzlaşısı.

Ortak sonuç:
- Hiçbir uzlaşı giyilebilir cihaz sinyalini hastalık göstergesi olarak doğrulamıyor.
- Fitbit SpO2'si ve cilt sıcaklığı için sağlıklı kişide doğrulama yok.
- Sporcuya özgü eşik yok.

## Seçenekler
1. **Kaynaktaki en savunulabilir sayıyla, tahmin etiketli, günün durumuna girmeyen not** (solunum notu gibi). Her sayı bir kaynağa bağlanır; türetme ve aktarım kural notunda açıkça yazılır.
2. Kişisel SD'ye dayalı z-skoru (ör. +2 SD). Bireysel uyarı olarak doğruluğu bilinen bir kaynak yok; nüfus izleme çalışmalarının 0,5 / 1 SD'si birey için çok gevşek.
3. Hiç not koymamak. Kullanıcı istedi ve senkronlanan veri boşta duruyor; ama dürüst bir not, uyarı abartılmadan yazılabiliyor.

## Karar
Seçenek 1. Kurallar `research/rules/hastalik-isaretleri.json`'da, motor `packages/engine/src/illness-signs.ts` (testli, kural eşitliği `rules-sync.test.ts`).

- **Gece nabzı** (`gece-nabzi-yuksek`): son iki gece, o gecelerden önceki 28 günün medyanının en az 4 atım/dk üstündeyse not düşer. Medyan için en az 7 gece gerekir.
  - Kaynak `alavi-2022`: ileriye dönük denenmiş NightSignal kırmızı uyarısı. COVID-19'da duyarlılık ~%80, özgüllük %87,7; COVID olmayanlarda üç haftada ~1 uyarı günü.
  - Uyarlamalar:
    - Makalede ölçü gece ham nabız ortalaması; HoopLab Google Health'in günlük dinlenik nabzını kullanıyor.
    - Makalede taban bütün geçmişin medyanı; HoopLab önceki 28 günün medyanını kullanıyor.
- **Gece SpO2** (`gece-spo2-dusuk`): son üç gecenin en az ikisinde gece ortalaması %93,5'in altında ya da kişisel medyanın en az 3 puan altında.
  - %93,5 `gries-1996`'dan türetildi: sağlıklı uyku medyanı 96,5 ± 1,5, eksi 2 SD.
  - 3 puan BTS kılavuzundan (`odriscoll-2017`).
  - 3 gecenin 2'si şartı cihaz hatasından: Fitbit ~2 puan yüksek okuyor ve geceden geceye uyumu zayıf (`hermans-2024`).
  - Gecenin alt sınırı kullanılmaz: uykuda %90'a inen kısa düşüşler olağan.
  - Yükseklikte notun çıkması beklenir (`latshang-2013`).
- **Cilt sıcaklığı** (`cilt-sicakligi-yuksek`): son iki gece, cihaz tabanının en az 0,3 °C üstündeyse.
  - 0,3 °C `risch-2022`'den: bilekte, doğrulanmış COVID-19'un belirtili döneminde ortalama artış. Grup ortalaması, eşik değil.
  - Kişisel tabana göre okunur (`smarr-2020`).
  - Ateş ölçümü değildir: bilek, çekirdek sıcaklığının ~1 °C altında ve onunla uyumu zayıf (`chen-2020`).
  - İki gece şartı nabız kuralından aktarıldı.
- **Yönlendirme** (`hastalik-isareti-yonlendirme`): sabit metin, kaynağı `schwellnus-2022a` (IOC akut solunum yolu enfeksiyonu uzlaşısı).
  - Metindeki belirtiler: ateş ya da ateşli hissetme, titreme, olağandışı halsizlik, yaygın kas ağrısı, nefes darlığı, göğüs ağrısı, istirahatte çarpıntı ya da baş dönmesi, ya da antrenman yapacak kadar iyi hissetmemek.
  - Bu belirtilerden biri varsa antrenmana çıkmadan doktora başvurulur; belirti yoksa sonraki gecelere bakılır.
  - Notlar tek bir nedene bağlanmaz; erken işaretler aşırı yüklenmeyi de gösterebilir (`schwellnus-2016`). "Boyun kuralı" kullanılmaz (uzlaşıya göre verisiz).
- **Arayüz:**
  - Bugün'de bir işaret çıkınca "Son gecelerde alıştığından farklı" kartı açılır. Kartta her işaret için sayılı bir satır, olası nedenler ve yönlendirme var. Solunum notu da çıktıysa aynı karta satır olarak girer.
  - Açıklama sayfası "Gece işaretleri" ("Tahmin" etiketli).
  - SpO2 ve cilt sıcaklığı için ayrı kutucuk eklenmedi; değerleri yalnız not çıkınca görünür.
- **Koç:**
  - Anlık değerlerde yeni `signs` ölçümü (yalnız bayraklar). "Günün sayıları"nda "(tahmin, tanı değil)" bloğu var; işaret çıktıysa kaynakları da gider.
  - Yönlendirme notu `illness_signs`. Koç kartında bu not solunum notunu kapsar.
  - `coach-daily` v11 ve `coach-ask` v3 buluta dağıtıldı.
- **Hiçbiri günün durumuna girmez, yük önerisini değiştirmez.**

## Sonuçlar
- 10 yeni kaynak (94) ve 4 yeni kural (40); `research:check:online` temiz.
- Demo: kırmızı senaryoda gece nabzı ve cilt sıcaklığı işareti çıkar, solunum notuyla tek kartta görünür. Yeşil ve sarıda işaret yok. SpO2 ve cilt sıcaklığı demoda günün sırasından türetilir; rastgele üreteç ilerlemez, diğer demo değerleri kaymaz.
- Yanlış alarm beklenir: ağır yük, geç maç, seyahat, alkol ve aşı da aynı işaretleri verebilir. Not "hastalığı yakaladık" demez, "kendini yokla" der.
- Gerçek hesapta not, ilk geceden en az 9 gün sonra hesaplanabilir (7 gecelik taban artı 2 gece). SpO2'nin mutlak sınırı taban beklemez.
- **Yeniden değerlendirme:**
  - Not hissiyatla sürekli çelişirse ya da sık yanlış alarm verirse eşik ve gece sayısı gözden geçirilir.
  - Fitbit'e ya da sporcuya özgü bir doğrulama çalışması yayımlanırsa kaynak değiştirilir.
  - Google Health cilt sıcaklığı tabanını belgelerse kural notu güncellenir.
