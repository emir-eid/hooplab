# 0034. Koç özetinde kısmi kabul: denetimden geçmeyen cümle atılır, gerisi gösterilir

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-09
- **İlgili:** [0032](0032-ai-koc-tasarimi.md) ("denetimden geçmezse model yanıtı gösterilmez" maddesini ayrıntılandırır), [0033](0033-koc-ozeti-check-in-sonrasi.md)

## Bağlam
Maliyet ölçümünde (2026-10-09; 4 gün × 3 kaynak ayarı × 2 deneme, Batch API) özetlerin yaklaşık dörtte biri denetimden geçmedi: üç yapılandırmada da 8 yanıttan 2-3'ü. Retlerin hepsi gerçek kural ihlaliydi, denetçi hatası değil:
- alıntısız sayı cümlesi;
- aynı cümlenin önce alıntısız, sonra alıntılı yazılması;
- dayanağın önerinin kendisine değil sonraki cümleye konması.

0032'ye göre tek bir kötü cümle bütün özeti düşürüyordu. Bunun bedeli boşa giden bir çağrı (~0,15 $) ve o gün özetin görünmemesiydi. Sonuçlar ve yan yana metinler repo dışında (`private/data/coach-eval/`).

## Seçenekler
1. **Değişiklik yok:** tek bir ihlal bütün özeti gösterilmez kılar.
2. **Kısmi kabul:** ihlal eden cümle atılır, kalanlar gösterilir.
3. **Retten sonra otomatik bir yeniden deneme:** yaklaşık bir çağrı daha tutar, yine reddedilebilir.

## Karar
**Kısmi kabul** (kullanıcı kararı, 2026-10-09). Kurallar `salvageAudit` içinde ([audit.ts](../../supabase/functions/_shared/coach/audit.ts)):
- Gösterilen her cümle denetimin bütün kurallarını sağlar; doğruluk güvencesi değişmez.
- Sorunlu cümle atılır.
- Alıntılı bir kopyası olan alıntısız cümle de atılır. Bu kural tam geçen yanıtta da uygulanır.
- "Tahmin" sözünü taşıyan komşu cümle atılınca, sözü kaybeden tahmin cümlesi de atılır.
- Yanıt düzeyinde bir sorun (geçersiz alıntı, boş yanıt) varsa özetin tamamı reddedilir. Durum bloğu varken ona alıntı yapan cümle kalmazsa, ya da üçten az cümle kalırsa da reddedilir.
- Atılan cümleler ve sorunları tanı için `coach_summaries.audit`'te kalır (`shown`). Uygulamaya yalnız gösterilenler ve atılan sayısı (`omitted`) gider; kart bunu açıkça yazar ("Kaynak denetiminden geçmeyen N cümle gösterilmedi.").

## Sonuçlar
- Ölçümün zamandan bağımsız iki gününde (12 yanıt) eski kuralla 4 ret vardı. Yeni kuralla bunların 3'ü birer cümle eksiğiyle gösteriliyor; 1'i durum cümlesi dayanaksız olduğu için yine reddediliyor.
- Atılan bir öneri cümlesi yüzünden özet bazen eksik kalabilir; kullanıcı bunu notta görür.
- **Yeniden değerlendirme:** atılan cümle oranı yüksek kalırsa (yönerge ya da denetçi ayarı); kısmi özetler kopuk okunursa.
