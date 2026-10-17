# 2026-10-16 19:34 — Performans turu

- **Faz:** 4 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-17 12:12; ilk kapanıştan sonra Blok 2-3 eklendi)
- **Model / efor:** Opus 5.5, orta
- **Commit'ler:** `72b3f49` (Blok 1), `1b2ad2b` (ilk kapanış), `041f827`, `78aefcd`, `9f98bdf`, `785cb60` (Blok 2), `e0d293f` (Blok 3), bu raporun kapanış commit'i

## Blok 1 — Performans turu (19:34)

### Amaç
STATE'teki sıradaki iş: Faz 4'ün performans maddesi. Kullanıcı ana işi seçti. ROADMAP'teki "Vercel React Native kuralları" skill'i kurulu değil; yöntem `react-native-best-practices` skill'inden alındı.

### Yapılanlar
- **Ölçüm:**
  - Yerel web önizlemesinde (seed'deki sentetik kullanıcı) Bugün'ün istekleri sayıldı: 27 REST isteği, hepsi paralel, `training_sessions` 9 kez.
  - Üretim iOS paketi (`expo export --source-maps`) paket paket ayrıştırıldı: three.js 2 MB kaynak, %21.
  - Metro modül kaydıyla, Bugün açıkken `body-scene` ve three.js'in yüklenmiş olduğu görüldü.
  - Sekme dönüşü `longtask` gözlemcisiyle ölçüldü (demo, masaüstü dev: Bugün'e dönüşte 60 ms).
  - iPhone'da geçici günlükle Bugün'ün veri süresi ve Keychain okuma sayısı ölçüldü (aşağıda).
- **3D geç yükleme:** [body-view.tsx](../../apps/mobile/src/components/body-view.tsx) `BodyScene`'i GL bağlamı kurulunca `import()` ile alır. Açılışta three.js artık yüklenmiyor (web, modül kaydı), Vücut'ta model çiziliyor (web ve iPhone).
- **Oturum önbelleği:** [chunked-storage.ts](../../apps/mobile/src/lib/chunked-storage.ts) okunan ve yazılan değeri bellekte tutar; yazma veya silme yarıda kalırsa önbellek bırakılır. 2 yeni test (eşzamanlı 27 okuma depoya bir kez gider; silme ve yarıda kalan yazma).
- **Odakta koşullu yenileme:** yeni [revision.ts](../../apps/mobile/src/data/revision.ts) (4 test).
  - Veri sürümünü artıranlar: istemcinin `global.fetch` sarmalayıcısındaki yazma istekleri ([supabase.ts](../../apps/mobile/src/lib/supabase.ts)), kullanıcı değişimi, demo deposunun 15 yazma metodu ve demo açma / kapama.
  - Bugün ve Trend kapıdan geçince çeker: sürüm değişmişse, gün dönmüşse ya da 5 dakika geçmişse.
  - Web'de doğrulandı: sekme dönüşünde istek sayısı sabit kaldı ve uzun görev yok. Su kaydından sonra Bugün yenilendi (gerçek yerel kullanıcıda 0,0 → 0,3 L, demoda 1,5 → 2,0 L).
- **iPhone:** kullanıcı denedi: oturum açık geliyor, Vücut'ta model açılıp dönüyor, su kaydı Bugün'e yansıyor.
- `npm run check` yeşil.

### Kararlar
- [0048 Performans turu](../decisions/0048-performans-turu.md) — 3D geç yükleme, oturum önbelleği, odakta koşullu yenileme; `training_sessions` birleştirmesi yapılmadı.

### Sorunlar ve hatalar
- **İlk sekme dönüşünde gereksiz yeniden çekiş.** Kapı ilk dönüşte bir kez daha çekti. Sebep, oturum geri yüklenirken gelen `SIGNED_IN` olayının sürümü artırmasıydı. Çözüm: olay adı yerine kullanıcı kimliğinin değişmesine bakılıyor.
- **Hissedilen yavaşlık.** Kullanıcı telefonda "sanki daha yavaş" dedi. Ölçüm yapıldı: Bugün'ün veri süresi önbellek açıkken 194 / 598 / 391 / 204 ms, kapalıyken 433 / 234 / 328 ms. Keychain okuması 0'a karşı 95-98. Fark ağ gürültüsünün içinde, yavaşlama yok. Önbelleğin etkisini bloğun başında fazla iddialı anlatmıştım; ölçüm düzeltti. Hissin olası nedeni: Metro'nun `--clear` ile yeniden derlemesi ve geliştirme modunda 3D parçanın Metro'dan ayrıca inmesi. Geçici ölçüm kodu kaldırıldı.
- **Düzenleme sırasında anlık hata.** Bir anlık yenileme `createFocusGate is not defined` verdi (import eklenmeden önceki ara durum). Kalıcı değil.

### Öğrenilenler
- LESSONS "Expo / React Native"e 2 madde: expo-router sekmeleri açılışta birlikte yükler (ağır bağımlılık dinamik `import()` ile); supabase-js her istekte oturumu depodan okur ve oturum geri yüklenirken `SIGNED_IN` olayı gelir.

## Blok 2 — Evden uzakta Expo Go: tünel varsayılan (2026-10-16 akşam)

### Amaç
Kullanıcı evde değilken telefonda test etmek istedi; ardından "artık hep böyle yapalım" dedi.

### Yapılanlar
- `npm run mobile:tunnel` ([tools/dev/mobile-tunnel.mjs](../../tools/dev/mobile-tunnel.mjs)): `npx expo start --tunnel` doğrudan `apps/mobile`'da, global `@expo/ngrok` `NODE_PATH` ile; hazır olunca `[tunnel] exp://…` basar. Adres kalıcı (rastgele kısım gitignore'lu `.expo/settings.json`'da).
- Bu makineye bir kez `npm i -g @expo/ngrok@4.1.3` (Expo'nun resmi paketi).
- Belgeler: [SETUP §8](../SETUP.md) (tünel varsayılan, LAN yedek; gerçek adres public repoya yazılmaz), STATE, LESSONS, [apps/mobile/README.md](../../apps/mobile/README.md), [kurulum rehberi](../guides/kurulum.md), CHANGELOG (performans turu dahil; Blok 1'de atlanmıştı). Hafıza notu güncellendi.
- Doğrulama: tünel adresinden manifest okundu; kullanıcı evden uzakta iPhone'da açtı.
- Commit'ler: `041f827`, `78aefcd`, `9f98bdf` (belgedeki yol kaçışları), `785cb60`.

### Kararlar
- Tünel varsayılan geliştirme yolu (kullanıcı kararı); LAN'lı `npm run mobile` yedek. Ayrı karar kaydı yok; SETUP §8.

### Sorunlar ve hatalar
- `npm run mobile -- --tunnel` bayrağı iç içe `npm run -w` zincirinde düştü (günlükte yalnız `expo start`).
- Expo CLI global `@expo/ngrok`'u bulamadı ve etkileşimsiz modda "Input is required" diye durdu.
- Python ile yazılan belgede ters bölülü yollar kaçış dizisine dönüştü (`%APPDATA%` sonrası satır sonu); iki düzeltme commit'i. Bundan sonra belge düzenlemesi Edit aracıyla ya da dosyaya yazılmış betikle yapılır.

### Öğrenilenler
- LESSONS "Expo / React Native": tünelin iki engeli ve çözümü (Blok 2 commit'lerinde).

## Blok 3 — Uçtan uca test: web, WebKit, demo (10:39)

### Amaç
STATE'teki sıradaki iş: iOS uçtan uca test. Kullanıcı seçti.

### Yapılanlar
- **Yol araştırması:**
  - EAS Simulator: `simulator:availability` → hesapta açık değil.
  - EAS Maestro: ücretsiz planda yok (fiyat sayfası).
  - Kullanıcıya dört yol sunuldu; "Web E2E" seçildi ([0049](../decisions/0049-uctan-uca-test-web-webkit.md)).
- **Altyapı:**
  - [e2e/serve.mjs](../../e2e/serve.mjs): boş Supabase değerleriyle `expo export --platform web` ve rota çözen statik sunucu. Pakette bulut adresi olmadığı denetlendi.
  - [e2e/playwright.config.ts](../../e2e/playwright.config.ts): WebKit, `iPhone 13`.
  - `@playwright/test` 1.63.0 (sabit; son sürümler iki haftadan yeni), `npm run e2e`.
  - `e2e/tsconfig.json` ve kök `typecheck`.
  - `.gitignore` (`e2e/.dist`, `.results`, `.report`).
- **Testler:** [e2e/tests/](../../e2e/tests/). Ortak demo düzeni her JS hatasında testi kırar; 5 akış (0049). Yerelde 5/5, derleme dahil ~50 sn.
- **Mutasyon denemesi:** demo deposunda su eklemenin sürüm artırması kaldırıldı. Su testi kırıldı (beklenen 2,0 L, görülen 1,5 L), kod geri alındı.
- **CI:** [checks.yml](../../.github/workflows/checks.yml)'a `uctan-uca` işi (`playwright install --with-deps webkit`, `npm run e2e`, hata olursa 7 gün rapor).
- **Belgeler:** [SETUP §7](../SETUP.md), [apps/mobile/README.md](../../apps/mobile/README.md).
- `npm run check` yeşil. GitHub'daki ilk koşuda `kontrol` ve `uctan-uca` işleri geçti (`uctan-uca` ~2,5 dk).

### Kararlar
- [0049 Uçtan uca test: web çıktısı, WebKit, demo modu](../decisions/0049-uctan-uca-test-web-webkit.md).

### Sorunlar ve hatalar
- **Tarayıcı indirmesi.** `playwright install webkit` Node'un indirmesinde her adreste zaman aşımına uğradı (curl aynı dosyayı 6 sn'de indiriyor; proxy yok; IPv4 önceliği işe yaramadı). Çözüm: dosyalar curl ile indirildi, yerel bir HTTP sunucusundan `PLAYWRIGHT_DOWNLOAD_HOST` ile verildi (yol kalıbı `builds/<tarayıcı>/<sürüm>/<dosya>`).
- **Seçici eşleşmesi.** İlk koşuda 5 test kırmızıydı: "Bugün" başlığı "Beslenme · bugün"e de uydu (ad eşleşmesi büyük-küçük harf duyarsız alt dize). `exact: true` eklendi.
- **Bayat çıktı.** İlk mutasyon denemesi yanlışlıkla geçti: açık kalmış `--no-build` sunucusunu Playwright yeniden kullandı, değişiklik derlenmedi. `reuseExistingServer: false`.
- **Test adları.** Kesme işareti ("Bugün'e") tek tırnaklı dizgiyi bozdu, çift tırnağa çevrildi.

### Öğrenilenler
- LESSONS'a 2 madde. "Windows": Playwright tarayıcı indirmesi ve yerel ayna. "Önizleme ve maketler": Playwright ad eşleşmesi ve sunucunun yeniden kullanılması.

## Açık kalanlar
- iOS'ta otomatik test yok (EAS Simulator erişimi / ücretli Maestro); iOS'a özgü kontrol tünelle cihazda.
- Performans: `training_sessions` okumalarının birleştirilmesi yapılmadı (0048); açılış süresi TestFlight derlemesinde ölçülür.
- Google Health yeniden bağlanma: sınır 2026-10-19.

## Sıradaki adım
- STATE'teki ilk iş: portfolyo sayfası.
