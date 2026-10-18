# 0052. Haftalık koç yorumu: biten hafta, istek üzerine, günlük özetle aynı denetçi

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-17
- **İlgili:** [0040](0040-haftalik-rapor.md) (koç yorumu bu karara bırakılmıştı), [0032](0032-ai-koc-tasarimi.md) (model, citations, denetçi, maliyet tetikleri), [0034](0034-koc-kismi-kabul.md), [0035](0035-koc-kaynak-secimi-dikkat.md), [0051](0051-haftalik-rapor-pdf.md) (PDF), DATA-INVENTORY, COSTS, oturum raporu (2026-10-17)

## Bağlam
Haftalık rapor yalnız sayıları gösteriyor (0040). Kullanıcı, raporu kondisyoner, fizyoterapist ya da diyetisyenle paylaşırken haftanın kaynaklı bir yorumunu da istiyor. Günlük özetin bütün güvenceleri (sayıyı kod hesaplar, citations, sayı ve kaynak denetçisi, kısmi kabul) hazır.

Kullanıcıya soruldu (2026-10-17):
1. **Tetik:** istek üzerine mi, otomatik mi? → İstek üzerine: raporda "Koç yorumu yaz"; hafta başına sınırlı, yalnız biten hafta.
2. **PDF'e girsin mi?** → İsteğe bağlı bölüm olarak (0051).

## Seçenekler
1. **Ayrı fonksiyon ve tablo, günlükle aynı akış** (`coach-weekly`, `coach_weekly_summaries`): haftanın sayıları ayrı bir belgede, denetçi ve kısmi kabul ortak.
2. Günlük özete pazartesi bir "haftalık" cümle eklemek: günlük cümle sınırını zorlar, PDF'e ayrı alınamaz.
3. Yedi günlük özeti birleştirmek: her gün özet yazılmıyor; birleşim yeni sayı üretir (yasak).

## Karar
Seçenek 1.

- **Anlık değerler** (`_shared/coach/weekly-snapshot.ts`, uygulama ve sunucu aynı dosya): haftanın pazartesisi (kayıt anahtarı, modele gitmez), günlerin durum sayıları (toplam 7: yalnız biten hafta), HRV ve uyku nabzının hafta ortalaması ve haftadan önceki 28 günün bandı, uyku ortalaması ve kısa mı, gece notu sayıları, check-in ortalaması ve düşük günler, yük (toplam, önceki hafta, değişim, 4 hafta ortalaması, pazar günkü oran, monotonluk, gerilim, seans / maç / oynanan dakika), ağrı noktaları (en yüksek, gün sayısı, izleme sınırı üstündeki gün), beslenmenin hedef aralığına göre gün sayıları, sıvı ortalaması. **Kilo ve yakılan enerji gitmez** (DATA-INVENTORY, 0043). Şema bilinmeyen alanı reddeder; aralıklar günlük şemanınkiler (`snapshotLimits`).
- **Uygulama:** `data/coach-weekly-snapshot.ts` görünüm nesnesinden (0040) kurar; süren haftada null. Sayı hesaplamaz, seçer.
- **Belge** (`_shared/coach/weekly.ts`): "Haftanın sayıları" (her ölçüm ayrı blok; blok kimlikleri günlük ölçüm anahtarları, uygulamadaki dayanak sayfaları ortak). Kural değerleri kanıt tabanından. Tahmin blokları: gece notları, oran, ağrı, beslenme.
- **Kaynaklar:** günlük ölçüm → kural eşlemesi (gece notlarına tek gece solunum da), yalnız dikkat isteyen ölçümlerin kuralları (0035'in haftalık karşılığı: durum ve öğünlü beslenme her zaman; HRV / nabız bandın dışındaysa; uyku kısaysa; gece notu, düşük check-in günü, yük artış notu, ağrı varsa).
- **İstek ve denetim:** günlük özetle aynı model, efor, düşünme ve yedek ayarı; haftalık yönerge (5-7 kısa cümle, ilk cümle günlerin durumu, gece notları yorumlanmaz, gelecek hafta için en fazla bir kaynaklı öneri). Denetçi ve kısmi kabul günlükle aynı (`auditResponse`, `salvageAudit`: durum cümlesi kalmalı, en az 3 cümle). **Cümle sınırı** (2026-10-18, ilk gerçek yorum 10 cümle geldiği için; kullanıcı kararı): denetimden geçen cümle 7'yi aşarsa durum cümlesi ve son cümle (öneri) korunur, aradakiler sondan atılır (`weeklySalvageOptions.maxSentences`); yeni çağrı yok. Kırpılanlar `audit.trimmed`'de, yanıtta `trimmed` sayısıyla denetim notundan ayrı; kartta "Yorum kısa kalsın diye N cümle daha gösterilmedi." Önceden yazılmış yorum değişmez.
- **Akış ve maliyet koruması** (`runWeekly`): `?peek=1` yalnız bakar (model çağrılmaz); hafta için kayıt varsa saklanan döner; yeniden yazma elle ve **hafta başına en fazla 2 deneme** (`weeklyAttemptLimit`, maliyet ayarı). Pazarı bitmemiş hafta reddedilir (bir gün saat dilimi payı).
- **Tablo** `coach_weekly_summaries` (`20261017143950`): `coach_summaries` deseni; `week_start` pazartesi olmalı (check), sahibi okur, yazan yalnız `service_role`, silme yok. pgTAP `koc_haftalik_yorum.test.sql`.
- **Arayüz:** haftalık raporun başında koç kartı: süren haftada "hafta bitince", biten haftada önce bakılır, yoksa "Koç yorumu yaz"; cümleler numaralı rozetle, "Dayanaklar" sayfası ("Haftanın sayıları" etiketiyle), "Yeniden yaz". Demo sentetik yorum yazar (API yok), denetçiden geçtiği testle kanıtlı.
- **PDF:** kabul edilmiş yorum varsa paylaşım ekranında "Koçun haftalık yorumu" bölümü; numaralı dayanaklar ve kaynak künyesiyle basılır.
- **Raporlama:** `npm run coach:usage` haftalık yorumları da sayar (yazıldığı UTC gününe).

## Sonuçlar
- Yeni veri akışı: biten haftanın sayıları Anthropic'e gider (DATA-INVENTORY). Kilo, enerji, tarih, ad gitmez.
- Maliyet: ilk gerçek yorumda ~0,109 $ (ölçüldü 2026-10-17); haftada en fazla 2, ayda tipik ~0,5 $ (COSTS). 0032'nin tetikleri aynı.
- Testler: sunucu `tests/coach/weekly.test.ts` (şema, biten hafta, belge, kaynak seçimi, akış), uygulama `demo/demo-coach-weekly.test.ts` (demo sayıları doğrulamadan, yorumu denetçiden geçer), uçtan uca 7. akış.
- **Sınırlar:** kaynaklar günlük okumalar için seçilmiş kurallar; haftalık yük ve toparlanmanın birlikte yorumu için ayrı bir kaynak yok. Gerçek yanıtın denetimden geçme oranı henüz görülmedi. Hafta ortası düzeltilen kayıt, yazılmış yorumu değiştirmez (yeniden yazma gerekir).
- **Yeniden değerlendirme:** reddedilme oranı yüksekse (yönerge ya da kaynak seçimi); kullanıcı otomatik yazım isterse; kayıt değişince "yeniden yaz" önerisi istenirse (günlük maç işaretindeki gibi).
