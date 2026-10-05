# 2026-10-05 01:38 — Faz 1: public'e geçiş öncesi denetim

- **Faz:** 1
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5 · yüksek
- **Commit'ler:** bu bloğun `/rep` commit'i

## Blok 1 — Public'e geçiş öncesi denetim, README, LICENSE, bekçide commit mesajı taraması (01:38)

### Amaç
STATE'teki 3. iş, ROADMAP Faz 1 maddesi: repo public olmadan önce herkese açılacak her şeyi denetlemek, README hikayesini ve LICENSE (MIT) dosyasını yazmak, GitHub secret scanning ve push protection'ı açmak. 1. iş (bant ve token takibi) 2026-10-08'den önce yapılamadığı için bu iş seçildi.

### Yapılanlar
- **Denetim:** sonuçlar ve kanıtlar [denetim raporunda](../audits/2026-10-05-public-oncesi.md). Taranan yüzeyler:
  - dosyaların bugünkü hali ve tüm git geçmişi (bekçi + denylist; ek sır biçimleri ayrıca)
  - commit / etiket mesajları ve yazar satırları
  - belgelerde birimli sayılar ve kişisel ifadeler
  - altyapı tanımlayıcıları
  - 32 GitHub Actions çalışmasının logu (indirilip tarandı, sonra silindi)
  - lisanslar

  Sonuç yeşil: sır, kişisel veri veya sağlık değeri yok.
- **Secret scanning ve push protection:** API ile açılmak istendi, `422` döndü (private kişisel repoda yok). İş [ROADMAP](../ROADMAP.md)'te "Repo public" maddesine taşındı; public anının adımları denetim raporunda.
- **Bekçide boşluk ve düzeltme:** CLAUDE.md §2 commit mesajını kapsıyor, ama bekçi mesajlara bakmıyordu. Değişiklik [privacy-guard.mjs](../../tools/guard/privacy-guard.mjs) içinde:
  - `--history` artık her commit ve etiket mesajını ve yazar / commit eden satırını tarıyor.
  - Yeni `--message <dosya>` modu yazılan mesajı tarıyor; [.githooks/commit-msg](../../.githooks/commit-msg) onu commit'ten önce çalıştırıyor.
  - 4 negatif test eklendi: mesajdaki sır, mesajdaki denylist ifadesi, denylist'teki yazar e-postası, dosya yoksa çıkış 2. Bekçinin 25 testinin hepsi geçti; geçmiş taraması 908 girdi ile temiz.
- **[LICENSE](../../LICENSE):** MIT, telif satırında `emir-eid`. Kök `package.json` içine `"license": "MIT"` eklendi.
- **[README](../../README.md) baştan yazıldı:** başta kısa İngilizce özet, ardından şu bölümler: neden, şu an ne yapıyor, ilkeler, nasıl geliştiriliyor (kararlar, oturum raporları, dersler), gizlilik, demo moduyla hızlı deneme, yığın ve yapı, lisans. Göreli bağlantılar betikle denetlendi, kırık yok.
- **Küçük düzeltmeler:**
  - [THIRD_PARTY_NOTICES](../../.claude/skills/THIRD_PARTY_NOTICES.md) içindeki kendi skill listesine eksik `rep` eklendi.
  - [ROADMAP](../ROADMAP.md)'te toparlanma maddesindeki eski "iPhone denemesi bekliyor" notu düzeltildi.
  - CLAUDE.md §2 bekçi listesine `commit-msg` eklendi.
  - [audits/README](../audits/README.md) elle yapılan denetimlerin adlandırmasını anlatıyor.
- **Doğrulama:** `npm run check` yeşil (tip denetimi, araç / paket / uygulama / fonksiyon testleri, gizlilik taraması: 331 dosya ve 908 geçmiş girdisi, kaynak doğrulama: 18 kaynak, 9 kural).

### Kararlar
- LICENSE telif satırında GitHub kullanıcı adı (`emir-eid`) yazılır. README Türkçe olur, başında kısa İngilizce özet bulunur. İkisi de kullanıcının seçimi; karar kaydı gerektirmedi (MIT [0005](../decisions/0005-repo-ve-gizlilik-ayrimi.md) ve ROADMAP'te zaten vardı).
- Commit mesajı taraması [0008](../decisions/0008-gizlilik-altyapisi-eklemeleri.md)'deki geçmiş taramasının kapsam genişlemesi; yeni karar kaydı açılmadı.

### Sorunlar ve hatalar
- Bekçiyi Python betiğiyle düzenleme denemesi kaçış karakterlerinde takıldı (eşleşme bulunamadı, dosya değişmedi). Değişiklik doğrudan düzenleme aracıyla yapıldı.

### Öğrenilenler
- [LESSONS](../LESSONS.md) "Git ve süreç" bölümüne 2 ders eklendi:
  - private kişisel repoda secret scanning yok (422);
  - public olacak repoda dosya dışında yayımlanan şeyler de var (mesajlar, yazar satırı, Actions logları), bekçi bunların bir kısmını artık tarıyor.

## Blok 2 — README'ye demo ekran görüntüleri (01:54)

### Amaç
Repo public olmadan önce README'yi vitrin haline getirmek. Görüntüler yalnız sentetik demo verisinden (CLAUDE.md §2, [0022](../decisions/0022-demo-modu.md)).

### Yapılanlar
- Çalışan Metro'ya (8081, bu projenin `expo start`'ı) bağlanıldı; demo modu tarayıcı panelinde 390×844'te açılıp ekranlar seçildi.
- [tools/dev/demo-screenshots.mjs](../../tools/dev/demo-screenshots.mjs), `npm run screenshots`: başsız Chrome'u DevTools protokolüyle sürer. Adımlar: demoyu açar, Hazır / Toparlan durumlarını seçer, Gece verisi'ne kayar, Vücut'ta 1 haftayı seçer. Her ekranı 390×844, 2x, açık ve koyu temada WebP olarak yazar.
- 8 görüntü [docs/gorseller/](../gorseller/) içinde, tanesi 34-73 KB. Görüntüler okunarak gözle kontrol edildi. İlk çekimdeki iki sorun düzeltildi: Gece verisi kaydırması ve Vücut'un kayık açılıp 1 günde boş kalması. Betik ikinci kez çalıştırıldığında dosya boyutları aynı çıktı (tekrarlanabilir).
- [README](../../README.md): dört görüntü yan yana, `<picture>` ile açık / koyu temaya göre değişiyor; altında "sentetik sporcu verisi" notu. README GitHub markdown API'siyle HTML'e çevrilip başsız Chrome'da iki temada görüntülendi; düzen doğru.
- [apps/mobile/README](../../apps/mobile/README.md) ve [CHANGELOG](../CHANGELOG.md) güncellendi. `npm run check` yeşil.

### Kararlar
- yok

### Sorunlar ve hatalar
- Betiğin ikinci denemesinde Chrome açılmadı. Sebep: profil klasörü göreli yolla verilmişti. Repodaki betik mutlak geçici klasör kullanıyor (kodda not var).

### Öğrenilenler
- yok (göreli profil yolu betikte yorum olarak duruyor; tekrar yaşanma yolu kapalı)

## Blok 3 — Repo public (01:59)

### Amaç
STATE'teki 3. iş: [denetim raporundaki](../audits/2026-10-05-public-oncesi.md) "Public anında" listesiyle repoyu public yapmak. Onay kullanıcıdan geldi: "önce 1, sonra 2'yi art arda yap" (CLAUDE.md §7, herkese açık yayın).

### Yapılanlar
- **Önce:**
  - CI'ın iki yeni çalışmasının bitmesi beklendi (yeşil).
  - 34 Actions logu indirilip bekçi kurallarıyla tarandı; temiz, loglar silindi.
  - Geçmiş taraması (928 girdi) push öncesinde temizdi; çalışma kopyası temiz ve push'lanmış.
  - Hesap doğrulandı: `gh auth status`, `emir-eid`.
- **Görünürlük:** `gh repo edit emir-eid/hooplab --visibility public --accept-visibility-change-consequences` → `PUBLIC`.
- **Hemen sonra:**
  - Secret scanning ve push protection API ile açıldı, `security_and_analysis` ile doğrulandı.
  - 30 sn sonra secret scanning uyarısı 0.
  - Wiki ve Projects kapatıldı (kullanılmıyor).
- **Doğrulama:** repo sayfası ve ham görsel giriş yapmadan 200 döndü. GitHub sayfası tarayıcı panelinde açıldı: README, 4 görüntü yüklendi (`naturalWidth > 0`), "MIT license" sekmesi var.
- **Belgeler:**
  - [ROADMAP](../ROADMAP.md) maddesi kapandı.
  - CLAUDE.md §2 "public olacak" → "public".
  - [STATE](../STATE.md)'te sıradaki iş 3 kurulum sihirbazı oldu.
  - Denetim raporuna "Sonuç" bölümü eklendi.

### Kararlar
- Dependabot uyarıları açılmadı: bildirim e-postası doğurur, kullanıcının kararı.

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- yok

## Blok 4 — Dependabot uyarıları (11:09)

### Amaç
Kullanıcı kararı: kişisel push protection zaten açıkmış. Dependabot uyarıları açılsın; e-postaya güvenilmesin, uyarıları haftalık denetim sınıflasın.

### Yapılanlar
- `PUT repos/emir-eid/hooplab/vulnerability-alerts` (204). Otomatik düzeltme PR'ları (`automated-security-fixes`) kapalı bırakıldı: Expo'nun sürüm sabitlemesini bozan PR'lar üretir.
- İlk taramada 4 açık uyarı çıktı. Dördü de Expo'nun dolaylı bağımlılığı; Edge Functions'ta açık yok. Her biri `npm ls` ile izlendi:
  - `braces` (yüksek, düzeltme yok): `@expo/cli` → Metro dosya haritası. Yalnız geliştirme.
  - `node-forge` (yüksek, düzeltme yok): `@expo/cli` → kod imzalama sertifikaları. Yalnız geliştirme; HoopLab expo-updates kod imzalamasını kullanmıyor.
  - `uuid` (orta): `@expo/config-plugins` → `xcode`. Yalnız derleme.
  - `decode-uri-component` (orta): `expo-router` → `query-string`. Uygulamaya giriyor. Risk: bozuk kodlanmış bir bağlantının uygulamayı kilitlemesi (hizmet engelleme). Veri sızıntısı değil. Düzeltme sürümü var ama `query-string` 7 eski sürüme bağlı; Expo güncellemesiyle çözülmesi beklenir, override yapılmadı.
- Haftalık denetim görevinin talimatına (`C:\Users\user\.claude\scheduled-tasks\hooplab-haftalik-denetim\SKILL.md`, repo dışı) `j` maddesi eklendi: açık uyarıları "uygulamada / sunucuda çalışan" veya "yalnız geliştirme" diye sınıflar, yenileri işaretler, dismiss ve güncelleme yapmaz. Aynı dosyada repo "private" yazıyordu; "public" yapıldı.
- [audits/README](../audits/README.md), [denetim raporu](../audits/2026-10-05-public-oncesi.md) "Sonuç" ve [CHANGELOG](../CHANGELOG.md) güncellendi.

### Kararlar
- Dependabot uyarıları açık, otomatik düzeltme PR'ları kapalı. Uyarılar e-posta yerine haftalık denetimden okunur (kullanıcı onayı). Uyarılar şimdilik kapatılmadı; Expo SDK yükseltmesinde yeniden bakılır.

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- yok

## Açık kalanlar
- Kullanıcı (konsol, isteğe bağlı): GitHub → Settings → Notifications → Dependabot alerts e-postasını kapatmak (uyarıları haftalık denetim okuyor).
- Takip (2026-10-08 / 10 civarı): kişisel bant ve OAuth yenileme token'ının 7. gün düşüşü (STATE sıradaki işler 1).

## Sıradaki adım
- STATE sıradaki işler 1: takip (2026-10-08 / 10 civarı).
