# 0041. Günün durumunda nabız: NREM uyku nabzı ve yalnız HRV ile birlikte

- **Durum:** Kabul edildi. Motor, uygulama ve koç testleri geçti. Web önizlemesinde demo ile doğrulandı (390×844). Koç bulutta güncellendi.
- **Tarih:** 2026-10-14
- **İlgili:** [0021](0021-toparlanma-kisisel-bant.md) (günün durumu; bu karar onun nabız kısmını değiştirir), [0039](0039-gece-isaretleri.md) (gece nabzı notu; ölçüsü değişir), [0032](0032-ai-koc-tasarimi.md) (koçun anlık değerleri), LESSONS "Google Health / veri", [oturum raporu](../sessions/2026-10-14-1337-haftalik-rapor.md) (tespit)

## Bağlam
Gerçek hesapta bant oluştuktan sonra günün durumunun dinlenik nabız işaretinden orantısız etkilendiği ve kullanıcının hissiyatıyla örtüşmediği görüldü (ayrıntı repo dışında, `private/journal`). Kod kurala uygundu; sorun tasarımdaydı:

1. **Ölçü.** Google'ın günlük dinlenik nabzı (`daily-resting-heart-rate`) discovery belgesine göre "bütün gün nabız ölçümlerinden" hesaplanıyor; yöntemi ve yumuşatması belgelenmemiş. HoopLab verisinde yumuşatılmış bir seri gibi davranıyor: günden güne oynaması aynı gecenin NREM nabzının yaklaşık yarısı. Cihaz takıldıktan sonraki haftalarda da düzenli tırmanıyor. Bandın temeli bu tırmanışı içerdiği için bant dar ve düşük kalıyordu.
2. **Rol.** 0021'de nabız tek başına durumu "Kontrollü"ye çekiyordu. Bu seçim orada "doğrulanmamış" diye yazılıydı: test edilmiş karar kuralı yalnız HRV'ye dayanıyor (vesterinen-2016).

## Kaynaklar (yeni 4 kaynak, Crossref ve PubMed'de doğrulandı)
- **bosquet-2008** (meta-analiz): Kısa yüklenmede dinlenik nabız orta düzeyde arttı, uzun yüklenmede değişmedi. Değişimler günlük oynama içinde kalabildiği için nabız tek başına pratik bir gösterge değil; başka işaretlerle birlikte okunmalı.
- **roete-2021** (sistematik derleme): İşlevsel aşırı yüklenmeyi egzersiz sırasındaki nabız ve performans ölçümleri gösterdi. Dinlenik ölçümler göstermedi.
- **altini-2021** (büyük kohort): Antrenmandan sonra HRV yaklaşık %4,6, nabız yalnız yaklaşık %1,3 değişti. Nabız yoğun alkol ve hastalıkta belirgin (~%6) yükseldi.
- **nuuttila-2022** (kohort): Gece nabzı geceden geceye çok tutarlı (ICC 0,97-0,98). Maksimal bir koşudan sonraki gece, uykunun ilk saatlerinde ve bütün gecede yükseldi.

## Seçenekler
- **(a)** NREM nabzına geçmek, rolü aynı bırakmak (nabız tek başına "Kontrollü").
- **(b)** Google nabzında kalmak, nabzın yalnız HRV ile birlikte saymasını sağlamak.
- **(c)** İkisi birden.

Kişisel veride son 7 günün önce / sonra tablosu `private/journal`'da (değerler repoya girmez). Özet:
- Şimdiki kuralla 6 gün "Kontrollü".
- (a) 2 gün, (b) ve (c) 6 gün "Hazır".
- HRV'nin gerçekten bandın altında, iki nabız ölçüsünün de bandın üstünde olduğu tek gün her seçenekte "Toparlan" kaldı.
- Gece nabzı notu (0039) Google nabzıyla NREM'e göre daha sık çıkıyor; fark tırmanışın ürünü olabilir.

**Kullanıcı (c)'yi seçti.**

## Karar
- **Ölçü:** nabız `health_daily.nrem_hr_bpm`. Bu, Google'ın HRV özetindeki REM dışı uyku nabzı ve HRV ile aynı geceden geliyor. Ekranda "Uyku nabzı". Google'ın günlük dinlenik nabzı (`resting_hr_bpm`) saklanmaya devam eder ama okunmaz. Kural `toparlanma.json → nabiz-olcu`, motor sabiti `heartRateMetric`.
- **Bant:** yöntem değişmedi. Uyku nabzına 0021'deki bant (7 gün / önceki 28 gün ± 0,5 SD) ve veri yeterliliği uygulanır.
- **Günün durumu** (`gunun-durumu`):
  - Toparlan: HRV bandın altında ve uyku nabzı bandın üstünde (değişmedi).
  - Kontrollü: HRV bandın dışında (iki yönde) ya da uyku kısa. Nabız artık bu listede yok.
  - Uyku nabzı tek başına bandın üstündeyse durum değişmez. Kural değeri `note_only: ["rhr_high"]`. Bugün'de gerekçe cümlesine not eklenir ("tek başına durumu değiştirmez", olası nedenler) ve "Uyku nabzı yüksek" çipi çıkar.
  - İşaretin kod adı `rhr_high` korunur (koçun şeması ve geçmiş kayıtlar değişmesin).
- **Gece işaretleri** (`gece-nabzi-yuksek`, 0039): aynı ölçüye (uyku nabzı) geçer. Eşikler değişmedi. alavi-2022'nin gece nabız ortalamasına Google'ın bütün gün değerinden daha yakın bir ölçü.
- **Koç:**
  - `rhr` ölçümü artık `nabiz-olcu` kuralını da taşıyor.
  - "Günün sayıları"nda ad "Uyku nabzı (REM dışı uyku ortalaması)".
  - Durum bloğunda not işareti "neden" olarak değil, "Not: …; tek başına durumu değiştirmez" diye yazılır. "Toparlan"da nabız yine neden olarak yazılır.
  - Kanıt tabanı 98 kaynak, 41 kural.
  - `coach-daily` ve `coach-ask` yeniden dağıtıldı.
- **Metinler:** "Uyku nabzı" açıklama sayfası (Bu ne, nasıl okunur, Google'ın dinlenik nabzından farkı, 8 kaynak), "Nasıl hesaplanıyor?" ekranı, gece işaretleri ve haftalık rapor.

## Sonuçlar
- Durum artık yalnız test edilmiş işarete (HRV) ve uykuya göre değişiyor. Nabız ağırlaştıran bir doğrulama işareti oldu. Böylece yumuşatılmış ve tırmanan bir seri günlerce rengi belirleyemiyor.
- Bedeli: nabız tek başına yükseldiğinde renk uyarmıyor. Bu durum hastalık başlangıcında da olabilir. Hastalık yönü gece işaretlerinde ayrıca izleniyor (iki gece kuralı) ve Bugün'deki not olası nedenleri sayıyor.
- NREM nabzı da cihaz takıldıktan sonra bir miktar yükseldi. Temeldeki ilk haftalar sorunu tamamen yok olmadı, yalnız küçüldü. Pencere kaydıkça (28 gün) etkisi kendiliğinden kalkar.
- Kaynakların hepsi dayanıklılık ya da genel nüfustan. NREM ortalaması çalışmalardaki gece kesitleriyle aynı ölçü değil; aktarım varsayım (kural notlarında yazılı).
- **Yeniden değerlendirme tetikleyicisi:**
  - Uyku nabzı notu sık çıkıp hissiyatla hiç örtüşmezse ya da bir hastalık nabız notuyla yakalanıp renkle kaçırılırsa.
  - Google dinlenik nabız yöntemini belgelerse.
  - Basketbola özgü bir gece nabzı çalışması çıkarsa.
