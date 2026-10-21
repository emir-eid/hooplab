# 0056. Günlük özette durum cümlesi yedeği: model cümlesi geçmezse motorun durum metni gösterilir

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-21
- **İlgili:** [0034](0034-koc-kismi-kabul.md) ("durum cümlesi kalmazsa özet reddedilir" maddesini değiştirir), [0032](0032-ai-koc-tasarimi.md), [0041](0041-gunun-durumunda-nabiz.md)

## Bağlam
Gerçek kayıtlarla yapılan ölçümde ([rapor](../sessions/2026-10-20-2302-koc-olcumu-ve-pwa.md), 10 deneme) bir özet yalnız durum cümlesindeki tek bir `advice_without_source` sorunu yüzünden tamamen reddedildi. Temiz olan 9 cümle de gösterilmedi. İnceleme (2026-10-21, sentetik cümlelerle) üç neden buldu:
- **Denetçi hatası:** cümle sonundaki "için" emir sayılıyordu ("iç" fiili + "-in" eki). "... kısa olduğu için." diye biten durum cümlesi kaynaksız öneri gibi görünüyordu.
- **Yönerge ile denetçi çatışması:** yönerge "ilk cümle günün durumu ve nedeni" diyor. Model nedeni "çünkü", "nedeniyle", "yüzünden" ile yazınca bu bağlaçlar yorum sayılıyor ve kaynak isteniyor. Oysa neden, motorun durum bloğunda zaten yazılı.
- **Kısmi kabulün kuralı:** 0034'e göre durum cümlesi kalmazsa özetin tamamı reddedilir.

## Seçenekler
1. Yalnız denetçi hatasını düzeltmek ve yönergeyi sıkılaştırmak. Sorun seyrekleşir ama tam ret sürer.
2. Yalnız motor metni yedeği. Sonuç yumuşar ama sıklık azalmaz.
3. **Üçü birlikte:** hata düzeltmesi, yönerge kalıbı ve motor metni yedeği.
4. Retten sonra yeniden deneme. Ek çağrı gerektirir ve yine reddedilebilir (0034'te elenmişti).

## Karar
**Seçenek 3** (kullanıcı kararı, 2026-10-21):
- **Denetçi** ([audit.ts](../../supabase/functions/_shared/coach/audit.ts) `isAdviceOrInterpretation`): cümle sonundaki "için", önündeki sözcük ortaç (-dığı, -dıkları), mastar (-mak) ya da tamlayan (-nın) ise emir sayılmaz. "Su için." hala öneridir. Bağlaçlar ("çünkü", "nedeniyle") yorum sayılmaya devam eder; denetçi gevşemez.
- **Yönerge** ([daily.ts](../../supabase/functions/_shared/coach/daily.ts) `systemPrompt`): ilk cümle "Günün durumu <durum>; nedeni: <neden>." kalıbında olur ve durum bloğuna alıntı yapar. Bu cümlede öneri, yorum ve neden bağlacı olmaz; öneri sonraki cümlede kaynaklı yazılır.
- **Yedek** (`salvageAudit` `statusFallback`, `statusSentence`): yalnız günlük özette açık. Model durum cümlesi kalmazsa özet reddedilmez. Yerine günün sayıları belgesindeki durum bloğunun metni, yani motorun deterministik metni öne konur. Yedek cümle en az 3 cümle şartına sayılır. Kayıtta `coach_summaries.audit.engineStatus` olarak ayrı tutulur. Yanıtta `engineStatus: true` döner ve kart bunu açıkça yazar: "İlk cümle uygulamanın kendi durum metni."
- Haftalık yorum ve soru-cevap değişmez. Haftalık yorumda durum yedeği kapalıdır; denetçi düzeltmesi üçünde de geçerlidir.

## Sonuçlar
- Gösterilen her cümle ya denetimin bütün kurallarını sağlar ya da motorun kendi metnidir. Doğruluk güvencesi değişmez; ek API çağrısı yoktur.
- Durum cümlesi yüzünden tam ret artık olmaz. Ret yalnız yanıt düzeyindeki sorunda ya da model cümlelerinden 2'den azı kaldığında olur.
- Yedek metin modelinkinden daha kuru okunur ("Günün durumu: Kontrollü. Nedeni: ..."). Kabul edildi, çünkü Bugün ekranındaki durumla aynı dili kullanır.
- **İzlenir:** `engineStatus` dolu özetlerin oranı (`coach_summaries.audit`). Sık görülürse yönerge yeniden ele alınır.
