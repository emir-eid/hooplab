# 2026-10-17 16:49 — Portfolyo sayfası ve yayın öncesi gizlilik denetimi

- **Faz:** 4 (bu blokla kapandı; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-17 16:53)
- **Model / efor:** Opus 5.5, orta
- **Commit'ler:** `8b3c20e` (Blok 1), `6db72b3` (rep, `faz-4-tamam` etiketi), bu raporun kapanış commit'i

## Blok 1 — Portfolyo sayfası, gizlilik denetimi ve yayın (16:49)

### Amaç
Faz 4'ün son maddesi olan portfolyo sayfası. Kullanıcı kararları: tanıtım sayfası ve canlı demo, İngilizce ve Türkçe, kimlik olarak yalnız GitHub kullanıcı adı. Yayından hemen önce kullanıcı durdurup sıkı bir denetim istedi: kişisel bilgi, API anahtarı ya da başka tehlikeli veri var mı?

### Yapılanlar
- **Demo derlemesi** ([0050](../decisions/0050-portfolyo-sayfasi.md)):
  - `EXPO_PUBLIC_HOOPLAB_DEMO_ONLY` ile uygulama doğrudan demoyla açılır. Demodan çıkınca giriş formu yerine kısa bir tanıtım gelir ([demo-only.ts](../../apps/mobile/src/lib/demo-only.ts), [sign-in.tsx](../../apps/mobile/src/app/sign-in.tsx)).
  - `HOOPLAB_WEB_BASE_URL` alt yolu ve tek sayfa çıktıyı açar ([app.config.ts](../../apps/mobile/app.config.ts)).
- **Tanıtım sayfası** ([site/](../../site/)):
  - Şablon ve iki dilin metinleri ayrı dosyalarda. Stil uygulamanın token'larından; tek renkli öğe günün halesi.
  - Geniş ekranda canlı demo telefon çerçevesinde açılır. Dar ekranda yerine görsel çıkar, dokununca demo tam ekran açılır.
  - Sayılar ve `toparlanma-bant` kuralının kaynak izi (DOI'lerle) derleme sırasında repodan okunur.
- **Derleme ve yayın:**
  - Derleme betiği [build-site.mjs](../../tools/site/build-site.mjs): `npm run site`, yerel önizleme için `-- --serve`. Önizleme Pages'in 404 davranışını taklit eder; `.claude/launch.json`'da `portfolyo` adıyla kayıtlı.
  - Yayın iş akışı [pages.yml](../../.github/workflows/pages.yml).
  - Pages kaynağı "GitHub Actions" olarak açıldı (`gh api`, kullanıcı onayıyla).
- **Yayın öncesi denetim:**
  - Git geçmişi, commit mesajları, etiketler ve derleme çıktısı bağımsız bir betikle tarandı: 1.575 blob ve 93 commit. Betik eşleşmeleri maskeli yazdı.
  - Gizli dosyalardaki her gerçek değer, geçmişin her sürümünde birebir arandı.
  - İki ajan belgeleri okuyarak denetledi: biri oturum raporlarını, STATE ve LESSONS'ı baştan sona okudu; diğeri repoyu, görselleri ve silinmiş dosyaları inceledi.
  - GitHub tarafında secret scanning uyarıları (0), push protection ve Actions secret'ları denetlendi.
  - Bulutta yeni kaydın kapalı olduğu canlı denendi: `signup_disabled`.
- **Temizlik** (kullanıcı kararı):
  - Belgelerden çıkarılanlar: sahibin gerçek durum geçmişini sözle anlatan ifadeler, takvim ve davranış ayrıntıları, hesap adları, Apple süreci, özel bağlantı ve anahtar / kredi ayrıntıları.
  - İşe yarayan operasyon bilgisi repo dışına (`private/ops.md`) taşındı; belgelerde yalnız o dosyaya atıf kalıyor.
  - Demo sporcunun kilosu değiştirildi.
  - Örnek nabız değeri açıkça sahte bir değere çevrildi.
- **README güncellendi:** durum Faz 1'de kalmıştı; özellikler ve demo bağlantısı da güncel değildi.
- **Yayın ve canlı denetim** (`8b3c20e`):
  - Pages ve `Kontroller` iş akışları başarılı.
  - Canlı adreste denetlenen her şey doğru çıktı:
    - Masaüstünde çerçevedeki demo açılıyor, konsolda hata yok.
    - Telefonda Türkçe sayfa yatay kaydırmasız.
    - Derin bağlantı (`/hooplab/demo/trend`) 404 yedeği üzerinden Trend'i açıyor.
    - Canlı pakette EAS kimliği, Supabase adresi ve hesap adı yok.

### Kararlar
- [0050 Portfolyo sayfası](../decisions/0050-portfolyo-sayfasi.md): tanıtım ve canlı web demosu, GitHub Pages, sayılar repodan.
- **Git geçmişi yeniden yazılmadı** (kullanıcı kararı). Geçmişte sır yok: gizli dosyalardaki değerlerin hiçbiri geçmişte geçmiyor. Temizlenen metinler eski commit'lerde duruyor, ama sır ya da sayısal sağlık değeri içermiyorlar.
- **Sahibin adı görünür kalıyor.** Ad, GitHub kullanıcı adında ve commit yazarında zaten geçiyor.

### Sorunlar ve hatalar
- **Yerel demo paketine EAS proje kimliği ve Expo hesap adı gömülmüştü.**
  - Sebep: Expo, uygulama yapılandırmasını pakete gömüyor ve yapılandırma `.env.local`'den okunuyor. Kimlik değişkenlerini boş vermek de yetmedi, çünkü Metro önbelleği eski modülü tuttu.
  - Çözüm: derleme betikleri değişkenleri boş veriyor ve her derlemede `--clear` kullanıyor. Çıktı `.env` değerlerine karşı tarandı.
  - Paket hiç yayınlanmadı. CI'da `.env.local` olmadığı için oradaki derleme zaten temiz olurdu.
- **Git Bash `/hooplab/demo` değerini Windows yoluna çevirdi.** `app.config.ts`'teki doğrulama yakaladı. `MSYS_NO_PATHCONV` ile çıktı yanlışlıkla `E:\c\...` altına düştü; taşındı ve klasör silindi.
- **Pages iş akışı:** `upload-pages-artifact` v5 gizli dosyaları (`.nojekyll`) dışarıda bırakıyor; `include-hidden-files: true` eklendi.
- **Tarayıcı paneli 404 durum kodlu sayfayı göstermiyor.** Yerelde derin bağlantı yalnız `fetch` ile denetlenebildi. Canlıda aynı alan adındaki çerçeve üzerinden doğrulandı.

### Öğrenilenler
- [LESSONS](../LESSONS.md)'a eklenenler:
  - Expo web çıktısı yapılandırmayı pakete gömüyor; boş değişken önbellekte kalabiliyor.
  - Git Bash'in yol çevirmesi.
  - `upload-pages-artifact` gizli dosyaları dışarıda bırakıyor.
  - Tarayıcı paneli 404 sayfasını göstermiyor.
- Faz özeti: [faz-4.md](../phases/faz-4.md).

## Açık kalanlar
- TestFlight Apple onayını bekliyor; push bildirimleri ondan sonra.
- Dependabot'ta 4 açık uyarı var (2 yüksek). Hepsi Expo'nun dolaylı bağımlılığı; Expo SDK yükseltmesinde bakılacak.
- Google Health izni 2026-10-19'da düşüyor; kullanıcı öncesinde yeniden bağlanacak.
- Kişisel gözlem (demo kilosu ve geçmişte kalan metinler) `private/journal`'a kaydedildi.

## Sıradaki adım
- TestFlight (Apple onayı gelince). O zamana kadar alternatif: haftalık rapora koç yorumu ya da PDF paylaşımı (0040'ta ertelenmişti).
