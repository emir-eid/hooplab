# 2026-10-22 16:02 — Koç kartı: yedek durum notunun görsel kontrolü

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** rep commit'i

## Blok 1 — Yedek durum notu web önizlemesinde (16:02)

### Amaç
Önceki oturumdan açık kalan iş: [0056](../decisions/0056-durum-cumlesi-yedegi.md) ile gelen kart notu ("İlk cümle uygulamanın kendi durum metni.") hiç gözle görülmemişti; yalnız yedek devreye girince çıkıyor, demoda yok.

### Yapılanlar
- Demo özetine geçici olarak `engineStatus: true` ve `omitted: 1` verildi ([demo-store.ts](../../apps/mobile/src/demo/demo-store.ts), günlük özet yanıtı); iş bitince geri alındı, repoda değişiklik yok.
- Web önizlemesi (`mobil-web`, 8081) başlatıldı. Tarayıcı paneli arkada olduğu için tıklama sayfaya ulaşmadı (LESSONS "Önizleme ve maketler", bilinen durum). Görüntüler [demo-screenshots.mjs](../../tools/dev/demo-screenshots.mjs)'in scratchpad'deki bir kopyasıyla başsız Chrome'da alındı: demo → "Hazır" senaryosu → koç kartının alt satırı, 390×844, 2x, açık ve koyu tema.
- Görülen: alt satır "Demo: …; yapay zeka çağrılmadı. Kaynak denetiminden geçmeyen 1 cümle gösterilmedi. İlk cümle uygulamanın kendi durum metni." Üç not birlikte üç satıra sığıyor, taşma yok; iki temada da öteki dipnotlarla aynı okunurlukta ([coach-card.tsx](../../apps/mobile/src/components/coach-card.tsx) dipnot satırı). Görüntüler sentetik demo verisiyle, repoya eklenmedi.

### Kararlar
- yok

### Sorunlar ve hatalar
- Sınır: kartın ilk cümlesi demonun kendi cümlesi, motorun durum metni değil. Doğrulanan notun görünüşü; gerçek bir yedek yanıtının bütün görünümü ilk gerçek yedek özetinde telefonda görülür.

### Öğrenilenler
- yok (panel arkadayken başsız Chrome'a geçiş zaten LESSONS'ta)

## Açık kalanlar
- Yeni yönergenin ve yedeğin gerçek yanıttaki etkisi yeni check-in'lerle görülür; `engineStatus` dolu özet oranı izlenir. Yedek ilk kez gerçek özette devreye girince kart telefonda bir kez görülür.
- Haftalık yorumda 7 cümle kırpmasının oranı ilk yeni yorumla ölçülür.
- Apple Developer kaydı; 2026-11-03'te sonuç yoksa PWA yedek yolu (0054).

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
