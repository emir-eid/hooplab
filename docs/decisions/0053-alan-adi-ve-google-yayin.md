# 0053. Alan adı (hooplab.dev), gizlilik politikası ve Google OAuth'un "In production"a alınması

- **Durum:** Kabul edildi (7 günlük sınırın kalktığı 2026-10-26'da ölçüldü)
- **Tarih:** 2026-10-19
- **İlgili:** [0019](0019-google-health-senkronu.md), [0050](0050-portfolyo-sayfasi.md), [0009](0009-herkes-kendi-hesabiyla.md)

## Bağlam
Google OAuth projesi "Testing" modunda; yenileme token'ı tam 7 günde düşüyor ve haftada bir elle yeniden bağlanmak gerekiyor (LESSONS, ölçüldü 2026-10-11). Kullanıcı 2026-10-12'de "uygulama hazır olunca production" demişti; Apple dışında iş kalmayınca (2026-10-18) geçiş istendi. Google belgesine göre 7 günlük sınır yalnız Testing için yazılı. Google Health kapsamları "restricted"; doğrulanmamış production uygulaması 100 kullanıcıyla sınırlı ve izin ekranından önce uyarı gösterir (tek kullanıcı için engel değil). Konsolda "Publish app" kapalıydı: Branding'de ana sayfa ve gizlilik politikası bağlantısı eksikti. Logo yüklemek Testing dışında doğrulamayı zorunlu kılıyor. Kullanıcı ayrıca izin ekranında görünen `<ref>.supabase.co` adresini istemedi: doğrulanmamış uygulamada Google, uygulama adı yerine geri dönüş adresinin alan adını gösterebiliyor (forum raporları; resmi belgede yok).

## Seçenekler
1. **Kendi alan adı + GitHub Pages:** alan adı Pages'e bağlanır; gizlilik sayfası ve Google'ın geri döndüğü küçük bir yönlendirme sayfası orada. Yılda ~10-20 $.
2. **Ücretsiz github.io:** aynı yapı, izin ekranında `emir-eid.github.io`.
3. **Supabase özel alan adı:** yalnız ücretli planda ek ücretli eklenti (Pro + eklenti, ayda ~35 $, hafızadan, doğrulanmadı); yönlendirme sayfası gerekmez.

## Karar
Seçenek 1 (kullanıcı kararı, 2026-10-19); alan adı `hooplab.dev` (kullanıcı satın aldı; kayıt ve DNS Vercel'de, kayıt firması Name.com).
- **DNS** (Vercel DNS, CLI ile): kökte GitHub Pages'in 4 A ve 4 AAAA kaydı, `www` → `emir-eid.github.io`. Özel kayıt eklenince Vercel'in varsayılan ALIAS ve HTTPS (ECH) kayıtları artık dönmüyor (2026-10-19, dns.google ile ölçüldü); CAA Let's Encrypt'e izin veriyor.
- **Site kökte:** `SITE_BASE` varsayılanı boş; demo `/demo/`. Eski `github.io/hooplab/...` bağlantıları alan adına `/hooplab/...` olarak yönlenir; `404.html`'in başındaki küçük betik yolun başını atıp yeniden açar.
- **Gizlilik politikası:** `/privacy/` ve `/tr/gizlilik/` (`site/privacy.html`, metin `site/privacy/<dil>.html`, DATA-INVENTORY'den). Google API Hizmetleri Kullanıcı Verisi Politikası ve Sınırlı Kullanım beyanı içerir; iletişim GitHub issues (e-posta yazılmaz).
- **Google geri dönüşü:** `https://hooplab.dev/oauth/google/` statik sayfası sorguyu (`code`, `state` ya da `error`) olduğu gibi Supabase'deki `ghealth-callback`'e iletir (`location.replace`). Token değişimi, PKCE ve tek kullanımlık `state` denetimi sunucuda değişmeden kalır; değişimde kullanılan `redirect_uri` ile izin isteğindeki aynıdır (ikisi de `GHEALTH_REDIRECT_URI` sırrından). Sayfa dış kaynak yüklemez, `no-referrer`, betik CSP özetiyle sınırlı.
- **Hedef adres repoda değil:** GitHub repo değişkeni `GHEALTH_CALLBACK_URL` Pages derlemesine verilir; değişken yoksa sayfa "yapılandırılmamış" der. Adres sayfanın kaynağında herkese açık görünür (Supabase proje adresi gizli değildir, erişimi RLS ve kapalı kayıt korur; yine de repoya yazılmaz, 0009).
- **Google'da:** istemciye yeni geri dönüş adresi eklenir, eski Supabase adresi yedek olarak kalır (sır silinirse eski yol çalışır; `setup:check` eskiyi denetler). Branding'de ana sayfa, gizlilik bağlantısı ve yetkili alan adı `hooplab.dev`; logo yüklenmez; doğrulama başvurusu yapılmaz.

## Sonuçlar
- Haftalık yeniden bağlanma kalkması bekleniyor; **ölçülecek**: production'da alınan token'la senkron, bağlantıdan 7 gün sonra da çalışmalı. Düşerse Testing'e dönmek tek tık ve kayıpsız.
  - **Ölçüldü (2026-10-26):** bağlantı 2026-10-19 12:25 (yerel saat); 7 gün dolduktan sonra 13:17, 14:17, 15:17 ve 16:17 senkronları başarılı, `last_error` boş, durum `connected`. Haftalık yeniden bağlanma kalktı.
- İzin ekranında "Google bu uygulamayı doğrulamadı" uyarısı çıkar (Gelişmiş → devam). Google ileride doğrulanmamış restricted uygulamalara sıkı davranırsa ilk belirti senkron hata kodu olur.
- Yeni dış servis: Vercel (yalnız alan adı ve DNS; mevcut kişisel hesap, başka projelerle paylaşılır). Alan adı yıllık yenilenir (COSTS).
- Yeniden değerlendirme: token yine 7 günde düşerse; Google uygulamayı engellerse; ikinci bir kullanıcı gerekirse (doğrulama ve CASA gerekir).
