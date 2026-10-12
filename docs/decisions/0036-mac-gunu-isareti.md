# 0036. "Bugün maç var" işareti: ayrı tablo, beslenmede yoğun gün, koçta hazırlık dili ve ısınma kaynakları

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-11
- **İlgili:** [0032](0032-ai-koc-tasarimi.md) (maç günü işareti), [0029](0029-beslenme-ve-hidrasyon.md) (gün tipi), [0021](0021-toparlanma-kisisel-bant.md) (günün durumu), [0033](0033-koc-ozeti-check-in-sonrasi.md) (özet check-in'den sonra), [oturum raporu](../sessions/2026-10-11-1549-gram-girisi.md)

## Bağlam
0032, Bugün'e tek dokunuşluk "Bugün maç var" işareti getirdi; koç maç günü toparlanma dili yerine hazırlık dilini (ısınma, karbonhidrat ve sıvı, maç sonrası toparlanma) her biri kaynaklı kullanacaktı. Anlık değerlerde `matchDay` vardı ama hep false gidiyordu. Açık sorular:
- İşaret nerede saklanır?
- Beslenme gün tipine etkisi ne olur? Maç sabahı maç seansı henüz kaydedilmemiştir; gün tipi "dinlenme" çıkıyordu.
- Kanıt tabanında karbonhidrat, sıvı ve maç sonrası toparlanma kaynakları vardı, ısınma için hiç kaynak yoktu. Kaynaksız konuda koç ya cümle kuramaz ya da denetçi cümleyi atar.
- Özet günde bir yazılıp saklanır; işaret özetten sonra değişirse kart eski özeti gösterir.

## Seçenekler
Saklama:
1. **Ayrı `match_days` tablosu** (günde bir satır; işaret satır ekler, kaldırmak siler). Gün tipi düzeltmesinden bağımsız.
2. **`day_types`'a sütun.** Satırın anlamı "kullanıcının gün tipi düzeltmesi"; maç işareti başka bir şey, karışırdı.

Beslenmeye etkisi:
1. **Mevcut kural:** `karbonhidrat-gun-tipi` zaten "maç varsa yoğun" diyor; işaret maç seansıyla aynı sayılır. Yeni sayı yok.
2. **Maç gününe özgü hedef:** basketbola özgü maç günü karbonhidrat çalışması bulunmadı (0029 açık kalanı); kaynaksız sayı olurdu.

Isınma:
1. **Kaynak eklemek:** PubMed'de doğrulanmış meta-analiz ve derleme.
2. **Isınmayı koçtan çıkarmak:** 0032'nin istediği hazırlık dilinin bir parçası eksik kalırdı.

## Karar
- **Saklama:** ayrı `match_days` tablosu, tek sahip RLS (0015); güncelleme yetkisi yok.
- **Beslenme:** işaretli gün yoğun sayılır (`inferDayType(sessions, matchDay)`); kullanıcı gün tipini yine elle değiştirebilir. **Günün durumu değişmez** (0032).
- **Kural:** yeni `research/rules/mac.json` → `mac-gunu`. Maç günüyse koçun kaynak seçimine her zaman girer, dikkat seçiminde de (0035).
- **Kaynaklar** (yeni ikisi PubMed'de doğrulandı):
  - ısınma: fradkin-2010 (meta-analiz) ve mcgowan-2015 (derleme)
  - karbonhidrat: davis-2022, kerksick-2018
  - sıvı: sawka-2007, osterberg-2009
  - maç sonrası toparlanma: doeven-2018
- **Koç sözleşmesi:** süre, miktar ve zamanlama önerilmez. Kartta maç günü cümleleri ayrı bir "Maç günü" konusunda, en başta.
- **Eskiyen özet:** sunucu, saklanan özetin yazıldığı andaki işareti döner (`matchDay`). Bugünkü işaret farklıysa kart "Yeniden yaz"ı önerir; kendiliğinden yeniden yazmaz, çünkü deneme hakkı günde 3.
- **Bugün için:** maç gününde öneri hazırlık dilinde (aşağıda, Sonuçlar).
- **Demo:** işaret bellekte. Maç günü için sentetik özet var; test her senaryoda denetçiden geçirir.

## Sonuçlar
- Isınma kaynakları basketbola özgü değil; Fradkin'in RCT'si az, McGowan anlatı derlemesi. Koç yalnız genel yararı ve beklemede sıcak kalmayı söyleyebilir; protokol veremez.
- **"Bugün için" önerisi maç gününde** (kullanıcı kararı, 2026-10-12): günün durumu (etiket, gerekçe, çipler, hale) aynı kalır; altındaki tek öneri yoğunluk ("yüksek yoğunluğu azalt", "dinlenme") yerine hazırlık dilini söyler: ısınma, karbonhidrat ve sıvı, maç sonrası toparlanma (`mac-gunu`). Toparlan gününde "belirti varsa sağlık ekibine danış", kısa uykuda "bu gece uykuyu öne çek" kalır. Gerekçe: maç oynanacak; o gün yoğunluğu azaltmak önerisi uygulanamaz ve 0032'nin "maç günü toparlanma dili yok" ilkesiyle çelişir.
- Maç saati, deplasman ve seyahat bilinmiyor; ayrıntılı maç günü ve seyahat protokolü Faz 4'te (ROADMAP).
- Yeniden değerlendirme: maç günü koç cümleleri sık atılırsa (kaynakta dayanak yok); basketbola özgü bir maç günü beslenme ya da ısınma çalışması bulunursa; işaret unutulduğu için gün tipi sık elle düzeltilirse.
