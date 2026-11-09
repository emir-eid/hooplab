# 2026-11-09 15:18 — SDK 58.0.23 iPhone denemesi ve PWA yeniden yayını

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1)
- **Commit'ler:** Blok 1 `rep` commit'i

Oturum 2026-11-09 13:42'de açıldı (`/ac`). Açılışta ağaç temiz, CI yeşil; 2026-11-09 denetiminin orta bulgusu (commit'lenmemiş SDK yükseltmesi) ve açık rapor bulgusu önceki oturumun Blok 7'si ve kapanışıyla zaten kapanmıştı.

## Blok 1 — SDK 58.0.23 iPhone'da ve PWA yeniden yayını (15:18)

### Amaç
STATE sıradaki iş 2: 2026-11-07'de alınan SDK 58 yamalarını (`expo` 58.0.23, `react-native` 0.88.1, `@expo/require-utils` 58.0.4 override'ı) iPhone'da denemek ve PWA'yı yeni sürümle yeniden yayınlamak.

### Yapılanlar
- **Metro tüneli** `npm run mobile:tunnel -- --clear` ile (native bağımlılık değiştiği için önbellek temiz); tünel adresinden manifest okundu (`sdkVersion` 58.0.0, `hostUri` dolu). Adres kalıcı, değişmedi.
- **iPhone (Expo Go, kullanıcı):** Bugün, Trend, Vücut ve sürükleme denendi; sorun yok.
- **PWA derlemesi:** `npm run pwa:build` geçti.
- **Yayın:** `npx vercel deploy apps/mobile/dist-pwa --project hooplab-app --prod --yes` → `Aliased https://app.hooplab.dev`.
- **Denetim (`curl`):** `/`, `/manifest.webmanifest`, `/untagged`, `/explain/hrv` 200; `/package.json`, `/app.config.ts`, `/.env.local`, `/.vercel/project.json` 404; `X-Robots-Tag: noindex`; canlı `index.html`'deki `entry-*.js` adı yerel derlemeyle aynı (yayın öncesi eski paketin adı farklıydı).
- **Tarayıcı 390×844 (canlı adres):** giriş sayfası ve sentetik demoda Bugün ekranı çizildi, konsolda hata yok.
- [tools/pwa/build-pwa.mjs](../../tools/pwa/build-pwa.mjs): derleme sonunda doğru yayın komutunu yazar.
- [0054](../decisions/0054-pwa-yedek-yolu.md) eki (yeniden yayın komutu ve denetimi), [LESSONS](../LESSONS.md) "Alan adı ve barındırma", [CHANGELOG](../CHANGELOG.md).

### Kararlar
- [0054 eki](../decisions/0054-pwa-yedek-yolu.md): PWA yeniden yayını repo kökünden, klasör ve proje açıkça verilerek; doğrudan `--prod` ve canlıda denetim (korumalı önizleme dışarıdan görülemiyor, `vercel promote` `--project` almıyor).

### Sorunlar ve hatalar
- **Yanlış Vercel projesi:** `dist-pwa` içinden `vercel deploy --prod --yes`, oradaki `hooplab-app` bağlantısını kullanmadı; Vercel CLI 62.2.0 üstteki `apps/mobile`'a çıkıp yeni bir `mobile` projesi açtı, iki kez oraya yükledi ve `apps/mobile/.gitignore`'a `.vercel` ekledi. `vercel ls hooplab-app`'te yeni yayın görünmeyince fark edildi. Proje Vercel girişi korumalıydı (dışarıdan açılmadı); yüklenen içerik büyük olasılıkla `apps/mobile` kaynağıydı (repo zaten public, `.env.local` yalnız `EXPO_PUBLIC_` değerleri). `.gitignore` geri alındı, `apps/mobile/.vercel` silindi; `mobile` projesi kullanıcının onayıyla `vercel project rm` ile silindi (eski adres 404). Ardından açık komutla önce önizleme (`Deploying hooplab-app`), sonra üretim yayını.
- `npm run pwa:build` `dist-pwa`'yı sildiği için oradaki `.vercel` bağlantısı her derlemede gidiyor (bu sefer elle yedeklenip geri konmuştu; açık komutla gerek kalmadı).

### Öğrenilenler
- LESSONS "Alan adı ve barındırma": Vercel CLI 62 derleme klasöründeki bağlantıyı görmüyor; yayın repo kökünden `--project hooplab-app` ile, çıktıda proje adına bakılır. Bekçi: `pwa:build` doğru komutu yazar.

## Açık kalanlar
- 2026-11-09 denetiminin küçük bulguları: `review-animations` ve `react-native-best-practices` skill'lerinin kaynakta yeni commit'i (bakılıp karar verilecek); LESSONS'taki Data API maddesinin [ölçüldü] yapılması; STATE'teki "uygulamayı 7 günde bir açmak" maddesinin PWA'ya göre sadeleştirilmesi.
- PWA'nın ana ekran kipinde yeni sürümle açıldığı cihazda ayrıca görülmedi (Expo Go denendi; PWA aynı kaynaktan, canlı paket doğrulandı).
- Metro tüneli açık (Claude kapatır).

## Sıradaki adım
- TestFlight (Apple onayı gelince); beklerken denetimin küçük bulguları.
