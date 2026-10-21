# 0055. Uygulama simgesi: durum halkası

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-21
- **İlgili:** [0010](0010-tasarim-yonu-hale.md), [0024](0024-eas-derleme-ve-guncelleme.md), [0053](0053-alan-adi-ve-google-yayin.md), [0054](0054-pwa-yedek-yolu.md)

## Bağlam
Uygulama simgesi hala Expo şablonunun simgesiydi: iOS'ta `assets/expo.icon`, web'de favicon, açılış ekranı ve Android dosyaları. TestFlight (0024) ve PWA (0054) ikisi de gerçek bir simge ister. Portfolyonun favicon'u da aynı dosyadan geliyor (0050).

## Seçenekler
Üç yön Hale dilinden (0010) çizildi, ana ekranda 60 / 40 px ve sekmede 32 / 16 px boyutlarında karşılaştırıldı ([design/simge](../../design/simge/)):
1. **Hale ve top:** açık zeminde sıcak hale, koyu çizgili basketbol topu.
2. **Durum halkası:** koyu zeminde yeşilden sarıya ve kırmızıya giden bir ölçer yayı, ortada açık bir nokta.
3. **H ve file:** kalın H harfi, alt yarısında pota filesi.

Kullanıcı 2'yi seçti. Beş varyasyonu denendi: açık zemin, ortada top, üç ayrı parça, ışıklı yay. Seçilen, ilk haliyle **A · Temel** oldu.

## Karar
Simge **durum halkası (A)**: `#0E0F11` zemin; yay koyu temanın durum renklerinden (`#2EE6A0` → `#FFAE33` → `#FF6B52`), iz `#2A2B30`, nokta `#F1F0EC`. Basketbolu değil, uygulamanın her sabah verdiği şeyi (günün durumu) anlatır.

Yay bir gösterge simgesidir, bir değer göstermez. Renk geçişi süs içindir; uygulamadaki durum renkleri gibi tek başına anlam taşımaz.

Kaynak dosyalar `design/simge/`:
- `simge.svg`: tam simge.
- `simge-katman.svg`: zeminsiz halka; iOS Icon Composer katmanı ve Android ön planı.
- `simge-tek-renk.svg`: Android tek renk.

PNG'ler SVG'den başsız Chrome ve jimp-compact ile üretildi: `icon.png` 1024 (opak), `favicon.png` 48, `splash-icon.png` (iOS köşeli, dışı saydam), `public/icons` 180 / 192 / 512 ve Android dosyaları.

`assets/expo.icon/icon.json` yalnız dosyada zaten olan alanlarla güncellendi: koyu `automatic-gradient` zemin, tek katman `halka.svg`, yarı saydamlık kapalı.

## Sonuçlar
- **iOS'ta son görünüm denenmedi:** Liquid Glass görünümü ve koyu / renkli kipleri burada önizlenemez (Mac yok). `.icon` dosyası ilk EAS derlemesinde actool'dan geçer; ilk TestFlight'ta ana ekranda bakılır. Bozuk görünürse `ios.icon` geçici olarak `icon.png`'ye çevrilir.
- **Portfolyo:** favicon'u sonraki Pages derlemesinde yeni simgeye geçer.
- **Google izin ekranı:** simge yüklenmez. Logo, doğrulamasız production'da doğrulamayı zorunlu kılar (0053).
- **Yeniden değerlendirme tetikleyicisi:** simge küçük boyutta ya da ana ekranda okunmazsa veya durum renkleriyle karışırsa.
