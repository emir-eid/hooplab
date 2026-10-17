# 0050. Portfolyo sayfası: tanıtım ve canlı web demosu, GitHub Pages

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-17
- **İlgili:** [0005](0005-repo-ve-gizlilik-ayrimi.md), [0022](0022-demo-modu.md), [0049](0049-uctan-uca-test-web-webkit.md)

## Bağlam
Faz 4'ün son maddesi. Repo public (2026-10-05) ve README demo ekran görüntülerini gösteriyor. Ama projeyi görmek isteyen birinin klonlayıp Expo Go kurması gerekiyor, README de Faz 1'de kalmıştı. Uçtan uca testler (0049) için uygulamanın sunucusuz web çıktısı zaten derleniyor ve demo modu çevrimdışı çalışıyor (0022).

## Seçenekler
1. **Tanıtım sayfası + canlı demo:** tek sayfalık anlatım ve uygulamanın tarayıcıda çalışan demo derlemesi, GitHub Pages'te.
2. **Yalnız tanıtım sayfası:** ekran görüntüleri ve anlatım; uygulama denenemez.
3. **Yalnız README:** ayrı site yok.

Barındırma için GitHub Pages seçildi. Repo zaten orada, ücretsiz, hesap ya da sır gerektirmiyor ve Actions'tan yayınlanıyor. Vercel ya da Netlify yeni bir hesap ve servis demek; kazancı yok.

## Karar
Seçenek 1, sayfa İngilizce ve Türkçe, kimlik olarak yalnız GitHub kullanıcı adı (kullanıcı kararları, 2026-10-17):
- **Demo derlemesi:** `EXPO_PUBLIC_HOOPLAB_DEMO_ONLY=1` ile uygulama doğrudan demoyla açılır. Demodan çıkınca giriş formu yerine kısa bir tanıtım ve "Demoyu aç" çıkar (`src/lib/demo-only.ts`). `HOOPLAB_WEB_BASE_URL` ile `experiments.baseUrl` alt yola (`/hooplab/demo`) ayarlanır ve web çıktısı tek sayfa (`single`) olur. Pages dinamik rotada (`explain/[id]`) rota başına dosya bulamaz; doğrudan açılan alt rotayı sitenin `404.html`'i (demonun `index.html` kopyası) yakalar. Supabase değerleri boş derlenir: sır yok, sunucuya istek yok.
- **Tanıtım sayfası** (`site/`): şablon `index.html`, metinler `strings/en.json` ve `tr.json`, stil `site.css`. Uygulamanın token'ları ve fontları (C · Hale) kullanılır; tek renkli öğe demodaki günün halesidir. Geniş ekranda canlı demo telefon çerçevesinde açılır. Dar ekranda ve JS kapalıyken yerine görsel konur; dokununca demo tam ekran açılır.
- **Sayılar repodan:** kaynak, kural, modül, karar ve oturum sayıları ve kaynak izi örneği (`toparlanma-bant` kuralı ve DOI'li kaynakları) derleme sırasında okunur, elle yazılmaz (`tools/site/build-site.mjs`). Doldurulmamış yer tutucu ya da sıfır sayı derlemeyi kırar.
- **Yayın:** `.github/workflows/pages.yml` ilgili yollar değişince derler ve `actions/deploy-pages` ile yayınlar. Pages kaynağı "GitHub Actions"tır.
- Yerel önizleme: `npm run site -- --serve` (Pages'in alt yolunu ve 404 davranışını taklit eder), `.claude/launch.json` → `portfolyo`.

## Sonuçlar
- Projeyi görmek için kurulum gerekmez. Demo ziyaretçinin tarayıcısında, bellekte çalışır; hiçbir kayıt bir yere gitmez.
- Demo web'de çalışır: iOS'a özgü his (haptics, native sayfalar, klavye) burada görünmez. Sayfa bunu "uygulamanın web demosu" diye sunar.
- Tanıtım sayfası Google Fonts'tan font çeker (ziyaretçinin tarayıcısı istek atar). Uygulamanın kendisi ve demo fontları paketten yükler.
- Uygulama arayüzü Türkçe kalır; İngilizce sayfa bunu söyler.
- Ekran görüntüleri `docs/gorseller`'den gelir; yeni ekranlar için `npm run screenshots` ile güncellenir.
- Yeniden değerlendirme tetikleyicisi: demo derlemesi uygulamanın normal web çıktısından ayrışırsa (ör. bir ekran yalnız alt yolda bozulursa) uçtan uca testlere bir demo derlemesi akışı eklenir.
