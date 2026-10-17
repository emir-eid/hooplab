# 2026-10-17 21:44 — Expo SDK 57 yama yükseltmesi

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-18 02:14)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** `a4ef415` … `9ec0a1a` ve kapanış commit'i

## Blok 1 — Expo SDK 57 yama yükseltmesi (21:44)

### Amaç
`npx expo install --check`'in bildirdiği eski paketleri SDK 57'nin beklediği yama sürümlerine çıkarmak ve iPhone'da denemek (STATE sıradaki iş 2).

### Yapılanlar
- `npx expo install --fix` (`apps/mobile`): `expo` 57.0.26 → 57.0.30, `expo-router` 57.0.24 → 57.0.28, `expo-linking` 57.0.11 → 57.0.13, `expo-splash-screen` 57.0.9 → 57.0.10, `expo-updates` 57.0.24 → 57.0.26 (`apps/mobile/package.json`, `package-lock.json`). `three` 0.186.1 ve `expo-gl` 57.0.2 değişmedi.
- Kilitte `@expo/cli` (57.0.31) artık `expo`'nun altında iç içe duruyor ve `vaul`'un `@radix-ui` bağımlılıkları iç içe kopyalandı; npm'in yerleştirme farkı, `npm ls` tek sürüm gösteriyor.
- Doğrulama: `npm run check` yeşil; `npm run e2e` 7/7; `npx expo-doctor` 21/21; `expo install --check` "Dependencies are up to date".
- Metro tünelle `--clear` ile yeniden başlatıldı (önceki oturumdan kalan Metro durduruldu); manifest tünel adresini verdi.
- iPhone (kullanıcı): Vücut 3D sorunsuz açıldı ve döndü; sekmeler ve modallar sorunsuz.
- Dependabot: `braces`, `node-forge`, `uuid`, `decode-uri-component` kilitte değişmedi; 4 uyarı kapalı kalıyor (STATE riski güncellendi).
- `docs/CHANGELOG.md` (Değişti), `docs/STATE.md`.

### Kararlar
- yok (yama yükseltmesi; karar kaydı gerekmedi).

### Sorunlar ve hatalar
- Su eklerken hafif gecikme hissedildi (iPhone). Yükseltmeyle ilgisiz: `apps/mobile/src/app/water.tsx` her dokunuşta `addFluid` yazmasını ve ardından `fetchNutrition` ile tüm günü yeniden çekmeyi bekliyor (iki ağ turu, tünel ve geliştirme modu üstüne). Sıradaki işlere eklendi: iyimser güncelleme.

### Öğrenilenler
- yok.

## Blok 2 — Su kaydında anında güncelleme (02:09)

### Amaç
Blok 1'deki iPhone denemesinde su eklerken hissedilen gecikmeyi gidermek: ekran yazmayı ve tüm günün yeniden çekilmesini beklemesin.

### Yapılanlar
- `apps/mobile/src/app/water.tsx`: iyimser güncelleme. Ekleme listeye ve toplama hemen yansır (geçici `yerel-` kimlikle), silme satırı hemen kaldırır; yazma başarısızsa ekran geri alınır ve hata görünür. Toplam artık listeden (`dayFluidL`) hesaplanıyor. Süren yazma varken gelen liste uygulanmıyor (art arda dokunuşta geçici içişler kaybolmasın), son yazma bitince liste bir kez tazeleniyor. Geçici içiş kaydırılarak silinemiyor. "Başka" alanı hemen boşalıyor, kayıt başarısızsa yazılan geri geliyor.
- "Bitti": süren yazma varsa düğme yükleniyor gösterir ve yazma bitince kapanır; yazma başarısızsa ekran açık kalır.
- Doğrulama: web önizlemesinde (iPhone boyutu, demo) art arda 250 + 250 + 500 (1,5 → 2,5 L), silme (→ 2,0 L), "Başka" 300 mL (→ 2,3 L, alan boşaldı), konsolda hata yok; `npm run check` yeşil, `npm run e2e` 7/7. Demo bellekte olduğu için gecikme farkı ve başarısızlıkta geri alma web'de görülemedi; gerçek hesapla iPhone denemesi yapılmadı.

### Kararlar
- yok (tek ekranda davranış iyileştirmesi; karar kaydı gerekmedi).

### Sorunlar ve hatalar
- İlk sürümde "Bitti" hemen kapanıyordu: veri sürümü yazma bitince arttığı için (`data/revision.ts`) Bugün kapanıştan sonra tazelemeyebilirdi. Kod incelemesinde fark edildi, "Bitti" süren yazmayı bekleyecek şekilde düzeltildi.

### Öğrenilenler
- LESSONS (Expo / React Native): iyimser güncellenen modal, süren yazma bitmeden kapanırsa alttaki sekme eski kalır.

## Açık kalanlar
- TestFlight: Apple üyelik onayı bekleniyor.
- (Tamam) Su kaydı iPhone'da gerçek hesapla denendi (kullanıcı, 2026-10-18): art arda ekleme, silme, ekleyip hemen "Bitti"; sorun yok.
- Google Health yeniden bağlanma sınırı 2026-10-19.

## Sıradaki adım
- TestFlight (Apple onayı gelince).
