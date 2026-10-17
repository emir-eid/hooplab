# 2026-10-17 21:44 — Expo SDK 57 yama yükseltmesi

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** bu bloğun `rep` commit'i

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

## Açık kalanlar
- TestFlight: Apple üyelik onayı bekleniyor.
- Su kaydında anında güncelleme (STATE sıradaki iş 2).
- Google Health yeniden bağlanma sınırı 2026-10-19.

## Sıradaki adım
- TestFlight (Apple onayı gelince); beklerken su kaydında anında güncelleme.
