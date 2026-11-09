# 2026-11-09 15:18 — SDK 58.0.23 iPhone denemesi ve PWA yeniden yayını

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (2026-11-09 16:41)
- **Model / efor:** Opus 5.5, düşük (Blok 1-2)
- **Commit'ler:** `595ff2d` (Blok 1), `985e499` (Blok 2), kapanış `oturum` commit'i

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

## Blok 2 — Denetimin küçük bulguları: skill güncellemesi, LESSONS, STATE (15:58)

### Amaç
2026-11-09 haftalık denetiminin açık kalan üç düşük bulgusunu kapatmak.

### Yapılanlar
- **Skill güncellemesi (kullanıcı kararı: ikisi de):** kaynak repolar sığ klonlandı (scratchpad), kayıtlı commit'ten bu yana farklar okundu.
  - `review-animations` → `715c1807` (emilkowalski/skills): `SKILL.md`, `STANDARDS.md`'de 6 satır; web Motion kütüphanesinin `x`/`y`/`scale` kısayolları 14.2'den beri GPU'da, kural buna göre düzeltilmiş. React Native kodunu doğrudan etkilemiyor.
  - `react-native-best-practices` → `43cde80a` (software-mansion-labs/skills): cihaz içi AI bölümü ayrı skill'e taşınmış; `references/on-device-ai/` altındaki `llm.md`, `setup.md`, `speech.md`, `vision.md` silindi (~1.300 satır), `SKILL.md` yönlendirme sayfası oldu; `README.md` ve kök `SKILL.md` tabloları buna göre. Animasyon, hareket, SVG bölümleri değişmedi.
  - Kopyalar kaynakla satır sonu dışında birebir aynı (`diff -rq --strip-trailing-cr`).
  - [THIRD_PARTY_NOTICES](../../.claude/skills/THIRD_PARTY_NOTICES.md): iki commit satırı; yeni sayfanın `npx skills add` önerisi için not (çalıştırılmaz, gerekirse önce karar kaydı).
- [LESSONS](../LESSONS.md) "Supabase": Data API maddesi [kaynaklı] → [ölçüldü], kanıt satırıyla (2026-10-30 sonrası senkron hatasız; 2026-11-05 Web Push tabloları açık `grant`'la bulutta çalışıyor).
- [STATE](../STATE.md) kullanıcı işleri: "uygulamayı 7 günde bir açmak" maddesi PWA'ya göre sadeleştirildi (hatırlatmaları sunucu gönderir; Expo Go yerel hatırlatmaları kapalı tutulur; iki yol native derlemede birleşir).

### Kararlar
- yok (skill güncellemesi mevcut kopyalama düzeniyle; yeni karar kaydı gerekmedi).

### Sorunlar ve hatalar
- İlk `diff` bütün dosyaları farklı gösterdi: klon CRLF ile çıkmıştı (`core.autocrlf=true`); `--strip-trailing-cr` ile gerçek fark yalnız beklenen dosyalar.

### Öğrenilenler
- yok

## Açık kalanlar
- PWA'nın ana ekran kipinde yeni sürümle açıldığı cihazda ayrıca görülmedi (Expo Go denendi; PWA aynı kaynaktan, canlı paket doğrulandı).
- Apple Developer kaydı yanıt bekliyor (kullanıcı haber verecek). Metro tüneli oturum sonunda kapatıldı (8081 boş).

## Sıradaki adım
- TestFlight (Apple onayı gelince).
