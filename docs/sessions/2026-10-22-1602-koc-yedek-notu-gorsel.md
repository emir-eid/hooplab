# 2026-10-22 16:02 — Koç kartı: yedek durum notunun görsel kontrolü

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1), orta (Blok 2)
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

## Blok 2 — Koç oranları denemesi ve PWA yayın hazırlığı (19:21)

### Amaç
Önce koç oranlarını gerçek kayıtlarla ölçmek; veri çıkmayınca kullanıcının seçtiği iş: PWA yedek yolunu (0054) yayına kadar önden hazırlamak, yayın yapmadan.

### Yapılanlar
- Koç oranları (Opus, orta efor): bulutta yalnız tarih ve sayı sorgulandı (`supabase db query --linked`, özet metni okunmadı). Son günlük özet, son haftalık yorum ve son check-in 2026-10-17; 0056'dan sonra kayıt yok, oranlar ölçülemedi.
- Barındırma seçenekleri resmi belgelerle karşılaştırıldı; kullanıcı `app.hooplab.dev` / Vercel'i seçti ([0054](../decisions/0054-pwa-yedek-yolu.md) "Adres ve derleme hazırlığı").
- [explain/[id].tsx](../../apps/mobile/src/app/explain/[id].tsx): `generateStaticParams`; static çıktıda her açıklama ayrı HTML.
- [tools/pwa/](../../tools/pwa/): `build-pwa.mjs` (`npm run pwa:build`), `pwa-lib.mjs` (ortam denetimi, Vercel yapılandırması, Google dönüş adresi), `pwa-lib.test.mjs` (5 test). Çıktı `apps/mobile/dist-pwa` (gitignore'lu).
- Doğrulama: derleme başarılı; pakette sır ve derleme kimliği taraması temiz; `cleanUrls` taklidi yapan yerel sunucuda giriş ekranı 390×844, manifest, `lang="tr"`, `/explain/hrv` 200, bilinmeyen yol 404, konsolda hata yok. Vercel CLI bu makinede girişli (hesap adı yazılmadı). `npm run check` yeşil (araç testleri 92).
- Belgeler: 0054, CHANGELOG, LESSONS, STATE.

### Kararlar
- [0054](../decisions/0054-pwa-yedek-yolu.md) güncellendi: adres `app.hooplab.dev` (Vercel, kullanıcı seçimi); karar tarihi ve "yayın yok" değişmedi.

### Sorunlar ve hatalar
- `--clear`'lı derleme 10 dakikayı aştı, araç zaman aşımıyla arka plana aldı; sonra başarıyla bitti.
- Gerçek Vercel davranışı (başlıklar, `cleanUrls`, 404) yerel taklitle denendi, Vercel'de değil; yayın günü `curl` ile denetlenir.

### Öğrenilenler
- LESSONS "Expo / React Native": static çıktıda dinamik rota tek `[id].html` olur, `generateStaticParams` gerekir.

## Açık kalanlar
- Yeni yönergenin ve yedeğin gerçek yanıttaki etkisi yeni check-in'lerle görülür; `engineStatus` dolu özet oranı izlenir. Yedek ilk kez gerçek özette devreye girince kart telefonda bir kez görülür.
- Haftalık yorumda 7 cümle kırpmasının oranı ilk yeni yorumla ölçülür.
- Koç oranları: check-in yapılınca aynı sayım sorgusu (yalnız tarih ve sayı) yeniden çalıştırılır.
- Apple Developer kaydı; 2026-11-03'te sonuç yoksa PWA yayını (0054'teki sırayla, onaylı).

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
