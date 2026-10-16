# 0048. Performans turu: 3D geç yükleme, oturum önbelleği, odakta koşullu yenileme

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-16
- **İlgili:** [0018](0018-vucut-gorunumu.md), [0022](0022-demo-modu.md), [oturum raporu](../sessions/2026-10-16-1934-performans-turu.md)

## Bağlam
Faz 4'ün performans maddesi. Son iki haftada Bugün'e çok kart eklendi. Ölçüm (yerel web önizlemesi, üretim iOS paketinin kaynak haritası, iPhone'da geçici günlük) şunları gösterdi:
- Üretim paketinin %21'i three.js (2 MB kaynak). expo-router sekmelerin dosyalarını açılışta birlikte yükler (`import` modu `sync`) ve Metro'da `inlineRequires` kapalıdır; bu yüzden Vücut'a hiç girilmese de three.js her açılışta çalışıyordu (Node'da ~45 ms).
- Bugün'ün açılışı Supabase'e 27 istek gönderir (`training_sessions` 9 kez). supabase-js her istekten önce oturumu depodan okur; parçalı SecureStore adaptörü her okumada Keychain'e manifest + parça sayısı kadar çağrı yapar. iPhone'da açılış başına 95-98 Keychain okuması ölçüldü.
- Bugün ve Trend her odakta, yani her sekme dönüşünde, bütün veriyi yeniden çekip ekranı baştan çiziyordu (Bugün'de 27 istek, masaüstü web'de 60 ms'lik uzun görev).

## Seçenekler
1. **Hiçbir şey yapmamak:** ölçülen maliyetler küçük ama her açılışta ve her sekme dönüşünde ödeniyor.
2. **Veri katmanını önbellekli bir sorgu kütüphanesine taşımak** (ör. TanStack Query): her şeyi çözer ama bütün ekranlara ve demo moduna dokunur, yeni bağımlılık.
3. **Hedefli üç değişiklik:** 3D sahneyi dinamik `import()` ile yüklemek, oturum depolamasına bellek önbelleği eklemek, odakta yalnız veri değiştiyse yeniden çekmek (veri sürümü sayacı).

## Karar
Seçenek 3:
- `BodyScene` (ve three.js), GL bağlamı kurulunca `import()` ile yüklenir.
- Parçalı depolama okunan / yazılan değeri bellekte tutar. Depoya yalnız uygulama yazar; yazma ya da silme yarıda kalırsa önbellek bırakılır.
- `data/revision.ts`'teki veri sürümü şunlarla artar: Supabase'e giden yazma istekleri (`/rest/v1/` ve `/functions/v1/ghealth-*`, okuma ve koç çağrıları hariç; istemcinin `global.fetch` sarmalayıcısı), kullanıcının değişmesi (olay adına bakılmaz; oturum geri yüklenirken de `SIGNED_IN` gelir) ve demo deposunun yazmaları ile demo açma / kapama. Bugün ve Trend odakta yalnız sürüm değiştiyse, gün döndüyse ya da son çekişin üstünden 5 dakika geçtiyse yeniden çeker. Yarıda kalan çekiş kapıyı açık bırakır.

## Sonuçlar
- Ölçülen: açılışta three.js yüklenmiyor (web'de modül kaydıyla); sekme dönüşünde 0 istek ve uzun görev yok, kayıttan sonra yenileniyor (web, gerçek yerel kullanıcı ve demo); Keychain okuması açılış başına 95-98'den 0'a indi (iPhone). **Bugün'ün veri süresi önbellekle belirgin değişmedi** (açık 194-598 ms, kapalı 234-433 ms; ağ gürültüsünün içinde); kazanç süre değil, gereksiz native çağrının kalkması.
- Uygulama açıkken başka bir cihazdan yapılan değişiklik ya da saatlik senkron, en geç 5 dakika sonra sekme dönüşünde görünür. Arka plandan öne gelmek odak sayılmaz; bu, değişiklikten önce de böyleydi.
- Geliştirme modunda 3D sahne Metro'dan ayrı bir parça olarak iner, Vücut'un ilk açılışı Expo Go'da biraz gecikebilir. Üretim paketinde aynı dosyanın içindedir.
- `training_sessions` okumalarının birleştirilmesi yapılmadı: süreyi ağ belirliyor ve istekler zaten paralel; kazanç küçük.
- Yeni bir veri yazma yolu Supabase istemcisini kullanmıyorsa (ör. doğrudan `fetch`) sürümü kendisi artırmalıdır.
- Yeniden değerlendirme tetikleyicisi: kullanıcı "kaydettim, ekranda görünmüyor" derse kapı ilk şüphelidir.
