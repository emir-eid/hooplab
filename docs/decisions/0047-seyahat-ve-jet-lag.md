# 0047. Seyahat ve jet lag: `trips` (gidiş, dönüş, saat farkı), yolculuk günü notları, kaba kuralla uyum tahmini

- **Durum:** Kabul edildi. Motor, uygulama ve fonksiyon testleri geçti; pgTAP yerelde geçti (politika gevşetilince kırıldı). Bulutta: migration, coach-daily v17, coach-ask v9. Web önizlemesinde (yerel Supabase, sentetik kullanıcı) form, takvim, seyahat kartı ve açıklama sayfası doğrulandı.
- **Tarih:** 2026-10-15
- **İlgili:** [0046](0046-mac-takvimi-ve-mac-cevresi.md) (maç takvimi), [0021](0021-toparlanma-kisisel-bant.md) (günün durumu), [0038](0038-takviye-ve-doping.md) (takviye ve doping), [0032](0032-ai-koc-tasarimi.md) (koç)

## Bağlam
ROADMAP Faz 4 "maç günü ve seyahat protokolleri"nin seyahat yarısı. Kullanıcının seyahatleri (2026-10-15): yurt içi (saat farkı yok) ve kıtalar arası (4 saat ve üstü). Kullanıcı kararı: "temel + uyum tahmini". Kişisel ışık penceresi (iç saatin en düşük noktasına göre ışığa çık / kaçın) yok: kaynaklar ışık penceresinde ayrışıyor (konsensüs 0-3 saat, derleme 3-6 saat) ve daha çok varsayım ister.

Kaynaklar (doğrulandı; kullanılan sayılar tam metinde birebir bulundu):
- **janse-van-rensburg-2021** (uluslararası uzman konsensüsü, tam metin): jet lag 3 ve daha fazla saat dilimi hızlı geçişte; kaba kural batıda günde ~2 saat, doğuda günde ~1 saat uyum; doğuya 8 saatten fazla farkta geri alarak uyum; seyahat yorgunluğu tablosu (kafein yatmadan en az 6 saat önce, alkol yok, sıvı ve yemek planı, kısa uyku); varışta düşük-orta yoğunlukta antrenman, kafein yerel sabah; saat farkı olmayan uçuşta performans değil algısal ölçütler kötüleşiyor. Tablo 4 ve Şekil 4-5 yalnız görselde (ör. 1-3 günlük kısa ziyaret kuralı); metin aramasıyla doğrulanamadığı için kullanılmadı.
- **janse-van-rensburg-2020** (sistematik derleme, özet): seyahat yorgunluğu için müdahale çalışması yok; sporcularda jet lag kanıtı düşük kaliteli.
- **fowler-2017** (izleme, 8 saat dilimi, n=10, özet): doğu daha kötü; sürat ve aralıklı koşu ilk 72 saatte en çok düşüyor.
- **leota-2022** (NBA, 10 sezon, tam metin): doğu jet lag'iyle ev sahibi performansı düşüyor, yeterli dinlenmeyle fark kalmıyor; lig içi en fazla 3 saat.
- **roach-2019** (uzman derlemesi, tam metin): uçuş öncesi 3-4 günde yatış ve kalkışı günde 30-60 dk kaydırma; ışığın yönü; melatonin dozları (uygulamada verilmez).
- roberts-2019 (0046'da eklendi): doğuya uçuş ve gece geç / sabah erken yola çıkış uykuyu bozuyor.

## Seçenekler
Varış yeri bilgisi:
1. **Yalnız saat farkı** (saat, + doğu / − batı). Yer bilgisi saklanmaz; saat dilimi veritabanına ve cihaz Intl desteğine bağımlılık yok. Yaz saati değişimi hesaba girmez.
2. Şehir listesi + IANA saat dilimi: kullanıcıya kolay, ama yer bilgisi (kişisel) saklanır ve saat dilimi hesabı cihaza bağlı.

Uyum tahmini:
1. **Konsensüsün kaba kuralı** (doğu 1, batı 2 saat/gün), gün gün kalan; dönüşte varılan yerde sağlanan kadar, ters yönün hızıyla.
2. Roach'un ışık + melatonin takvimli uyum günleri: müdahale uygulanırsa geçerli, doğal hız değil.

## Karar
- **Saklama:** `trips` (gidiş günü, isteğe bağlı dönüş günü, `offset_hours` −12…+14; dönüş gidişten önce olamaz). Tek sahip RLS (okuma, ekleme, güncelleme, silme). Şehir, ülke, uçuş yok.
- **Motor** (`packages/engine/src/travel.ts`, kurallar `rules/seyahat.json`: `seyahat-yorgunlugu`, `jet-lag-uyum`, `jet-lag-varis`): evreler yaklaşıyor (yalnız jet lag'de, gidişten en fazla 4 gün önce), gidiş günü, varış yerinde, dönüş günü, dönüşten sonra (uyum sürdükçe). 3 saatten az farkta yalnız gidiş ve dönüş günü. Dönüş günü bilinmiyorsa uyum bitince not kalkar. Birden çok seyahat eşleşirse yolculuk günü önce.
- **Bugün'de seyahat kartı** (nötr, "Tahmin" etiketli açıklama sayfası "Seyahat ve jet lag"): yaklaşırken toplam uyum tahmini ve isteğe bağlı uçuş öncesi kaydırma; yolculuk günü sıvı / yemek / kısa uyku, kafein ve alkol, saat farkı yoksa "performans belirgin düşmüyor, his kötüleşebilir"; varış yerinde ve dönüşten sonra kalan uyum, ilk 72 saatte antrenman yoğunluğu, kafein yerel sabah, günün durumunun değişmediği. Doğuya 8 saatten fazla farkta not.
- **Melatonin** yalnız açıklama sayfasında, doz yok; hekim, güncel WADA listesi ve bağımsız partide test edilmiş ürün uyarısıyla (CLAUDE.md §3). Kartta ve koçta önerilmez.
- **Günün durumu değişmez**; jet lag için ayrı eşik yok. Not, HRV ve uykunun etkilenebileceğini söyler.
- **Takvim:** "Maç takvimi" ekranı "Takvim" oldu (Maçlar ve Seyahatler); + menüsünde "Seyahat"; form `/trip-edit`.
- **Koç:** anlık değerlere isteğe bağlı `travel` (evre, saat farkı, yön, motorun gün tahminleri; tarih ve yer yok). "Günün sayıları"nda ayrı "travel" bloğu (jet lag varsa tahmin işaretli; uyum hızı kural değerinden). Kurallar `travelRuleIds`: yolculuk günü `seyahat-yorgunlugu`; jet lag'de `jet-lag-uyum`, öncesinde ya da ilk 72 saatte `jet-lag-varis`. Yönergeye seyahat satırı ("tahmin de, melatonin önerme"). Kartta maç ve seyahat cümleleri tek konuda ("Maç ve seyahat").

## Sonuçlar
- Uyum günleri kişiden kişiye çok değişen bir ortalama; kronotip ölçülmez. Basketbola özgü jet lag verisi lig içi küçük farklarla sınırlı; kıtalar arası yolculuğa aktarım varsayım.
- Yaz saati değişimi ve yolculuk süresi hesaba girmez; uçuş saatleri bilinmediği için varış günü gidiş günü sayılır.
- Seyahat günlerinde telefonun saati değişir; Bugün'ün günü telefonun yerel günüdür. Maç saatleri maçın oynandığı yerin saatiyle girilir (0046), bu yüzden varış yerindeki maçta zamanlama doğru kalır.
- Yeniden değerlendirme: uyum tahmini hissiyatla sürekli çelişirse; kısa kalışlar (1-3 gün) sık olursa konsensüsün kısa ziyaret önerisi metinde doğrulanabilecek bir kaynakla eklenir; kişisel ışık penceresi istenirse ayrı karar.
