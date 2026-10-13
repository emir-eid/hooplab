# Faz 3 özeti: AI koç

- **Başlangıç / bitiş:** 2026-10-08 / 2026-10-13
- **Etiket:** `faz-3-tamam`
- **Not:** Faz 1 açık. TestFlight maddesi Apple üyeliğini bekliyor ([0024](../decisions/0024-eas-derleme-ve-guncelleme.md)). Faz 3 bundan bağımsız kapandı; koç iPhone'da Expo Go ile, gerçek hesapla çalışıyor.

## Hedef
Motorun hesapladığı sayıları kaynaklara dayanarak yorumlayan bir koç. Sayıları AI hesaplamaz, kaynaksız cümle gösterilmez. Kırmızı bayrak ve takviye kodla yönlendirilir. Maliyet ölçülür ve tahminle kıyaslanır.

## Sonuç
Bütün ROADMAP maddeleri tamam. Günlük özet ve soru-cevap bulutta ve iPhone'da gerçek çağrıyla çalışıyor. Kanıt tabanında 84 kaynak ve 36 kural var. Her kural, motor ve arayüz testle bağlı.

| Madde | Karar | Not |
|---|---|---|
| Model ve mimari | [0032](../decisions/0032-ai-koc-tasarimi.md) | Claude Sonnet 5.5; vektör araması yok (kural grafiğiyle seçim, soru-cevapta önbellekli tam taban); citations ve sunucuda alıntı / sayı denetçisi; sunucu taraflı yedek açık |
| Günlük özet | [0033](../decisions/0033-koc-ozeti-check-in-sonrasi.md), [0034](../decisions/0034-koc-kismi-kabul.md), [0035](../decisions/0035-koc-kaynak-secimi-dikkat.md) | Check-in'den sonra yazılır, konu başlıklarıyla gruplanır. Denetimden geçmeyen cümle atılır, gerisi gösterilir. Yalnız dikkat isteyen ölçümlerin kaynakları gönderilir |
| Maç günü | [0036](../decisions/0036-mac-gunu-isareti.md) | Tek dokunuşla işaret. Beslenmede yoğun gün, koçta hazırlık dili, ısınma kaynakları basketbola özgü değil |
| Soru-cevap | [0037](../decisions/0037-koc-soru-cevap.md) | Haiku sınıflandırır. Tıbbi ve kapsam dışı soruda model çağrılmaz. Tek soru tek yanıt, günde 10 soru |
| Takviye ve doping | [0038](../decisions/0038-takviye-ve-doping.md) | Koç dozu yalnız kaynaktan aktarır. Doping uyarısı bir kurala ve IOC kaynağına bağlı |
| Maliyet ölçümü ve aylık rapor | [0034](../decisions/0034-koc-kismi-kabul.md), [0035](../decisions/0035-koc-kaynak-secimi-dikkat.md), bu özet | `tools/coach-eval` (Batch API) ve `npm run coach:usage` |

## Maliyet (ilk aylık rapor, 2026-10-13)
2026-10-09 ile 2026-10-13 arasındaki 5 günde koç ~1,01 $ harcadı (geliştirme denemeleri dahil). Bunun ~0,64 $'ı 6 özet denemesinden, ~0,38 $'ı 3 sorudan geldi; Haiku sınıflandırması yok denecek kadar az. 30 günlük karşılığı ~6,1 $. Bu, 0032'deki ~3,5 $ tahmininin 1,74 katı ama iki kat tetiğinin altında. Fark, günlük özet çağrısının tahminden büyük çıkmasından geliyor. Kalite: kabul edilen özetlerde cümlelerin %16'sı atıldı; yanıtlanan sorularda hiç atılmadı. Ayrıntı [COSTS](../COSTS.md)'ta.

## Kararlar
[0032](../decisions/0032-ai-koc-tasarimi.md)–[0038](../decisions/0038-takviye-ve-doping.md).

## Dersler
LESSONS.md "Claude API (koç)" bölümü:
- citations parçalama ve alıntının boş ayrı blokta gelmesi,
- dolu bir günde özetin boyutu,
- özetlerin dörtte birinin kural ihlali içermesi,
- Batch API ölçümü,
- Edge Runtime'da SDK,
- skill fiyat tablosunun resmi sayfadan sapması,
- önbellek öneki.

## Faz 4'e devredilenler
- Koçun kalitesi gerçek kullanımla izlenecek: atılan cümle oranı, sınıflandırıcının yanlış sınıflama oranı, `no_source` / `rejected` oranı, maç günü cümlelerinin denetimden geçme oranı. Aylık rapor bunları maliyetle birlikte gösteriyor.
- Aylık rapor elle çalışıyor (`npm run coach:usage`). Otomatik çalıştırma (ör. haftalık denetime eklemek) kullanıcı kararı.
- Fizyolojik kırmızı bayrak eşikleri (dinlenik nabız, SpO2, cilt sıcaklığı) koç kapsamı dışında bırakıldı (0038). Ayrı bir iş olarak ele alınıyor.
- Google Health izni Testing modunda 7 günde düşüyor (haftalık yeniden bağlanma). Apple üyeliği ve TestFlight bekliyor.

## Sonraki faz
Faz 4: son rötuşlar. TestFlight (Faz 1) Apple'dan yanıt gelince öne alınır.
