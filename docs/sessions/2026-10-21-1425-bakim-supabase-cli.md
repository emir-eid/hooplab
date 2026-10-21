# 2026-10-21 14:25 — Bakım: Supabase CLI

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1-2), orta (Blok 3-4)
- **Commit'ler:** rep commit'i

## Blok 1 — Supabase CLI 2.119.0 → 2.121.0 (14:25)

### Amaç
Önceki oturumda açık kalan bakım işi: kök devDependency olan Supabase CLI'yı son kararlı sürüme almak. Kullanıcı Apple kaydından bağımsız işlere odaklanmak istedi.

### Yapılanlar
- 2.120.0 ve 2.121.0 sürüm notları okundu (GitHub release): kırıcı değişiklik yok; yenilikler çoğunlukla yerel yığın güvenilirliği, `functions serve` ajan altında stream-json, `db remote commit` / `inspect db` için sonraki ana sürümde kaldırılma uyarısı (projede kullanılmıyor).
- `npm install -D -E supabase@2.121.0`: yalnız `package.json` ve kilitteki CLI paketleri değişti.
- Doğrulama: `npm run check` yeşil; `npm run setup:check` 13/13; `migration list --linked` 16 migration eşit; `db advisors --linked` yalnız bilinen `auth_leaked_password_protection` uyarısı (0015); `npm run db:start` + `npm run test:db` 205/205.
- STATE (Ortam tablosu, Apple kullanıcı işi), CHANGELOG ve LESSONS güncellendi; Apple belgesinin ayrıntısı `private/ops.md`'de.

### Kararlar
- yok.

### Sorunlar ve hatalar
- İlk `test:db` yerel veritabanı kapalı olduğu için bağlanamadı (Docker açık, yığın başlatılmamıştı). `db:start` sonrası geçti. Kapalıyken komut 1 ile çıkıyor (ayrıca denendi), yani yanlış yeşil yok.

### Öğrenilenler
- LESSONS "Supabase": 2.121'de ajan altındaki JSON çıktıları (`start`, hata nesnesi, `functions serve`) ve `test:db` için önce `db:start`.

## Blok 2 — STATE açık riskler kısaltıldı (14:43)

### Amaç
"Açık riskler" bölümü ~12 KB'tı ve SessionStart hook'u bunu her oturuma ekliyordu. Hareket etmeyen maddeleri arşive taşıyıp bölümü izlenen risklere indirmek.

### Yapılanlar
- 27 maddeden 20'si, yani ölçümle kapanmayan bilimsel ve tasarım sınırları, olduğu gibi [archive/STATE-2026-10-21.md](../archive/STATE-2026-10-21.md) dosyasına taşındı. Bağlantılar klasöre göre düzeltildi, hepsi denetlendi (kırık yok).
- STATE'te kalan 7 madde izlenen ya da tarihe bağlı risklerdir: AI koç oranları, Google OAuth, Google kişisel proje erişimi, Supabase duraklatma, yerel bildirim gelişi, haftalık yorum kırpması ve Expo / TestFlight / PWA. Bunlara arşivin konularını sayan tek bir "Kalıcı sınırlar" satırı eklendi.
- Sonuç: STATE 25,1 KB → 16,9 KB. Arşivin başında, bir madde yeniden hareketlenirse STATE'e geri alınacağı yazıyor.

### Kararlar
- yok.

### Sorunlar ve hatalar
- yok.

### Öğrenilenler
- yok.

## Blok 3 — PWA kod hazırlığı: manifest ve Google dönüş adresi (15:02)

### Amaç
Apple kaydından bağımsız ilerlemek. [0054](../decisions/0054-pwa-yedek-yolu.md) seçenek 2'nin kod tarafını karar tarihinden önce hazırlamak: manifest ve Google dönüş adresi izin listesi. Yayın yok (kullanıcı talimatı).

### Yapılanlar
- `apps/mobile/src/app/+html.tsx`: Expo'nun varsayılan kök şablonu (`node_modules`'taki `@expo/router-server` `html.js`'ten) ve şunlar: `lang="tr"`, `viewport-fit=cover`, manifest bağlantısı, `apple-touch-icon`, iOS ana ekran meta etiketleri, açık / koyu `theme-color`. Adresler `process.env.EXPO_BASE_URL` ile (babel-preset-expo gömüyor). Demo derlemesinde (`demoOnlyBuild`) manifest yok.
- `apps/mobile/public/manifest.webmanifest` (göreli `start_url` / `scope`, `standalone`, Hale arka plan rengi) ve `public/icons/icon-{180,192,512}.png`. Simgeler uygulama simgesinden jimp-compact ile küçültüldü, saydamlık kaldırıldı. Service worker yok.
- Google dönüş adresi: `isAllowedReturnUrl(value, webReturnUrl?)`, `readEnv`'de `GHEALTH_WEB_RETURN_URL`, `ghealth-connect` ayarı geçiriyor. Tek `https` adres, köken ve yol birebir; sorgu, parça, kullanıcı bilgisi, başka port ya da alt alan reddedilir. Ayar `https` değilse ya da bozuksa hiçbir web adresi açılmaz. 16 maddelik yeni test (`dates-oauth.test.ts`). Değişken ayarlı değil, fonksiyon dağıtılmadı.
- Doğrulama: tip denetimi; `test:functions` 119/119. Üç web derlemesi: normalde manifest, simge ve `lang="tr"` var; demoda manifest yok; `/app` alt yolunda şablon hiç kullanılmıyor, aşağıya bakın. Web önizlemesi 390×844: manifest ve simge 200, giriş ekranı ve demo Bugün normal, konsolda uygulama hatası yok. `npm run e2e` 7/7 (WebKit, iPhone boyutu).
- 0054'e "Erken hazırlık" bölümü, STATE sıradaki iş 3, CHANGELOG, LESSONS.

### Kararlar
- Yok (0054'ün uygulaması; dönüş adresi koda gömülmedi, ortam değişkeni oldu ki kurulum sihirbazıyla kendi alanını kullanan da aynı kodu kullanabilsin).

### Sorunlar ve hatalar
- Alt yolda derlenen tek sayfalık çıktı (`output: single`) `+html.tsx`'i kullanmıyor. Manifest o derlemeye girmiyor. PWA'nın kök adreste static çıktıyla mı (ör. alt alan), yoksa `public/index.html` şablonuyla mı yayınlanacağı yayın adımına kaldı (0054).
- Git Bash `HOOPLAB_WEB_BASE_URL=/demo` değerini Windows yoluna çevirdi; `MSYS_NO_PATHCONV=1` ile çözüldü.
- Uygulama simgesi hala Expo şablonunun simgesi (native ile aynı); ayrı bir iş (Blok 4'te yapıldı).

### Öğrenilenler
- LESSONS "Expo / React Native": `+html.tsx` yalnız static çıktıda kullanılıyor, `EXPO_BASE_URL` gömülüyor, `public/` her çıktıya kopyalanıyor, Git Bash yol çevirisi.

## Blok 4 — Uygulama simgesi (16:55)

### Amaç
Expo şablonundan kalan uygulama simgesini HoopLab'e ait bir simgeyle değiştirmek. TestFlight ve PWA ikisi de bunu istiyor.

### Yapılanlar
- `logo-designer` skill'iyle Hale dilinden üç yön çizildi: hale ve top, durum halkası, H ve file. Önizleme sayfası ([design/simge/onizleme.html](../../design/simge/onizleme.html)) hepsini iOS köşeleriyle, ana ekranda 60 / 40 px ve 32 / 16 px boyutlarında gösteriyor.
- Kullanıcı durum halkasını seçti. Beş varyasyon denendi, seçilen A · Temel oldu ([0055](../decisions/0055-uygulama-simgesi.md)).
- Çıktılar SVG'den başsız Chrome ve jimp-compact ile üretildi: `icon.png`, `favicon.png`, `splash-icon.png`, Android simgeleri, `public/icons` (180 / 192 / 512). iOS `assets/expo.icon` tek katmanlı (`halka.svg`) hale geldi; şablonun SVG'si ve ızgara görseli silindi.
- Doğrulama: köşe pikselleri denetlendi (simge opak, ön plan saydam), açılış simgesi gözle bakıldı, `expo config` simge yollarını gösteriyor, `expo-doctor` 21/21.

### Kararlar
- [0055 Uygulama simgesi](../decisions/0055-uygulama-simgesi.md): durum halkası.

### Sorunlar ve hatalar
- Başsız Chrome'un ekran görüntüsü pencereden küçük çıktı; kenarlarda siyah şerit kaldı. 1300 px pencerede çizilip 1024'e kırpılarak çözüldü.
- iOS `.icon` dosyasının son görünümü burada önizlenemiyor; ilk TestFlight'ta bakılacak (0055).

### Öğrenilenler
- yok.

## Açık kalanlar
- Apple Developer kaydı: ek belge 2026-10-21'de gönderildi, yanıt bekleniyor; 2026-11-03'te sonuç yoksa PWA yedek yolu (0054).
- PWA yayın adımı (0054 "Erken hazırlık" → Kalan): barındırma ve adres seçimi, `GHEALTH_WEB_RETURN_URL`, dağıtım, ana ekran kipinde cihaz denemesi.
- iOS simgesinin (`.icon`) ana ekrandaki görünümü ilk TestFlight'ta bakılır (0055).
- Durum cümlesindeki tek ihlalin özeti düşürmesi (önceki oturumdan; yeni check-in'lerle izlenir).

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
