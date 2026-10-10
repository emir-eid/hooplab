# 0035. Günlük özette yalnız dikkat isteyen ölçümlerin kaynakları gönderilir

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-10
- **İlgili:** [0032](0032-ai-koc-tasarimi.md) ("kanıt seçimi: günlük özet" maddesini daraltır), [0034](0034-koc-kismi-kabul.md)

## Bağlam
İlk gerçek çağrılarda dolu bir gün ~60 bin girdi token'ı tuttu (çağrı başına ~0,15 $, 0032 tahmininin 4 katı). Girdinin ~%95'i kaynak özetleriydi: kural grafiğiyle seçim bulunan her ölçümün kaynaklarını gönderiyordu (gerçek günde 78'in 71'i). Kullanıcının koşulu: maliyet için koçun kaynaksız, yanlış ya da saçma beyan riski artırılmaz.

Fiyat ve önbellek kuralları resmi sayfalardan alındı (platform.claude.com, pricing ve prompt-caching, 2026-10-09). Günde tek çağrı olduğu için önbellek bir sonraki güne kalmıyor (en çok 1 saat); bu yüzden önbellek tasarruf getirmez. Batch API kullanıcı beklerken uygun değil. Efor düşürmenin en çok ~%10 tasarruf getireceği hesaplandı; kalite riskine değmedi. Daha küçük model kullanıcının koşulu gereği dışarıda kaldı.

## Seçenekler
Ölçüm 2026-10-09'da yapıldı: 4 gün (gerçek gün, sentetik tam gün, demo sarı, demo kırmızı) × 3 ayar × 2 deneme, Batch API ile, ~1,42 $. Betik `tools/coach-eval/run.ts`; sonuçlar ve yan yana metinler repo dışında (`private/data/coach-eval/`).

| Ayar | Denetimden geçen | Ort. girdi | Çağrı başına (normal fiyat) |
|---|---|---|---|
| Bütün ölçümlerin kaynakları | 6/8 | 59,6 bin | 0,143 $ |
| **Yalnız dikkat isteyen ölçümler** | 5/8 | 44,1 bin | 0,113 $ (−%21) |
| Ayrıca özetlerden "Uygulamada kullanılan sayılar" tablosu çıkarılmış | 6/8 | 37,4 bin | 0,098 $ (−%31) |

Ret oranları her hücrede iki denemeyle ölçüldü; aradaki fark gürültü sayılır.

## Karar
**Yalnız dikkat isteyen ölçümlerin kaynakları** (kullanıcı kararı, 2026-10-10; yan yana metinleri okuduktan sonra), kaynak özetleri tam.
- **Her zaman gönderilenler:** günün durumu ve beslenme hedefi.
- **Yalnız bandın dışındaysa ya da notu varsa:** HRV, dinlenik nabız, uyku, solunum, check-in ve yük.
- **Yalnız varsa:** bölge yükü, ağrı notu ve ter testi.

Olağan ölçümlerin sayıları "Günün sayıları" belgesine yine girer, yalnız kaynakları gönderilmez. Sayı cümlesi kaynak istemez; olağan bir değer yine yazılabilir, yalnız onun hakkında kaynaklı yorum yapılamaz (yönerge zaten olağan değerleri atlamasını ister).

Uygulama: `attentionMetrics` ([snapshot.ts](../../supabase/functions/_shared/coach/snapshot.ts)), `coachSourceOptions` ([daily.ts](../../supabase/functions/_shared/coach/daily.ts)). Tablo çıkarma (`appNumbers: false`) kodda kapalı ayar olarak kalır.

## Sonuçlar
- Olağan günde girdi belirgin düşer. Pek çok ölçümün dışarıda olduğu günde neredeyse değişmez (demo kırmızı: 65 → 63 kaynak).
- Demo özetleri yalnız üretimde gönderilen kaynaklara alıntı yapabilir; demo testi üretimdeki isteği kurar.
- **Yeniden değerlendirme:** özetler olağan ölçümler hakkında dayanaksız kalırsa ya da atılan cümle oranı artarsa; tablo çıkarma ayarı, kaynaktan sayı alma retleri sürerse yeniden ölçülür.
