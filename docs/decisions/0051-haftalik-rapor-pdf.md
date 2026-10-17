# 0051. Haftalık raporun PDF'i: telefonda üretilir, bölüm seçilir, paylaşım menüsüyle gider

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-17
- **İlgili:** [0040](0040-haftalik-rapor.md) (haftalık rapor; paylaşım bu karara bırakılmıştı), PRODUCT §9 (kondisyoner / fizyoterapist / diyetisyen), [DATA-INVENTORY](../DATA-INVENTORY.md), oturum raporu (2026-10-17)

## Bağlam
0040 haftalık raporu yalnız ekranda kurdu ve paylaşımı ayrı bir karara bıraktı: paylaşım sağlık verisini uygulamanın dışına çıkarır. Raporun görünüm nesnesi (`weekly-report-view.ts`) bunun için ekrandan bağımsız tutulmuştu.

Kullanıcıya iki soru soruldu (2026-10-17):
1. **İçerik:** her zaman tam rapor mu, bölüm seçerek mi? → Bölüm seçerek. Fizyoterapiste ağrı ve yük, diyetisyene beslenme ve kilo gibi.
2. **Koç yorumu PDF'e girsin mi?** → İsteğe bağlı bir bölüm olarak; haftalık koç yorumu ayrı karar: [0052](0052-haftalik-koc-yorumu.md).

## Seçenekler
1. **Telefonda HTML → PDF (`expo-print`), iOS paylaşım menüsü (`expo-sharing`).** Sunucu yok; alıcıyı kullanıcı seçer.
2. Sunucuda PDF üretip bağlantı paylaşmak. Sağlık verisini yeni bir yerde saklar, bağlantı sızabilir; gerekmiyor.
3. Ekran görüntüsü. Uzun raporu bölmez, bölüm seçilemez, okunabilirliği düşük.

## Karar
Seçenek 1.

- **Üretim:** `data/weekly-report-pdf.ts` (saf, testli) görünüm nesnesinden A4 HTML yazar. Sayı hesaplamaz; cümleler ekrandaki aynı `copy/weekly-report` fonksiyonlarından. Renkler açık paletten; yük çubukları seans türü renginde, durum noktaları günün durumu renginde (0026; risk rengi yok).
- **Bölümler:** yük, toparlanma, gece notları, check-in, ağrı, beslenme ve sıvı, sabah kilosu, yakılan enerji. Hepsi varsayılan açık; kapatılan bölüm HTML'e hiç girmez. Sıra her zaman ekrandaki sıra.
- **Kimlik yok:** ad, e-posta, kullanıcı kimliği yazılmaz. Dosya adı `HoopLab-haftalik-<hafta başı>.pdf`. Başlıkta hafta, durum (biten / sürüyor) ve hazırlandığı gün; altta "tanı değildir, tahmin ölçüm değildir" notu.
- **Paylaşım** (`lib/share-pdf.ts`): `Print.printToFileAsync` uygulamanın önbellek klasörüne yazar, dosya haftanın adıyla yeniden adlandırılır, `Sharing.shareAsync` paylaşım menüsünü açar; menü kapanınca dosya silinir. Web'de (önizleme, portfolyo demosu) HTML gizli bir çerçevede açılıp tarayıcının yazdırma penceresi gösterilir (`share-pdf.web.ts`).
- **Arayüz:** haftalık raporun başında "PDF olarak paylaş" satırı → `/weekly-share` modalı: bölüm anahtarları, gizlilik notu, "PDF hazırla ve paylaş".
- **Paketler:** `expo-print`, `expo-sharing`, `expo-file-system` (`npx expo install`; Expo Go'da var, yapılandırma eklentisi gerekmez: `expo-sharing` eklentisi yalnız gelen paylaşım içindir).

## Sonuçlar
- **Yeni veri akışı:** seçilen bölümlerin haftalık sayıları kullanıcının seçtiği alıcıya gider (DATA-INVENTORY'de satır). Gönderildikten sonra dosya HoopLab'in denetiminde değildir; ekranda bu yazılır.
- Sunucuya, Supabase'e ya da başka bir servise yeni istek yok; maliyet yok.
- Testler: `weekly-report-pdf.test.ts` (bölüm seçimi, boş hafta, kimliksiz çıktı, kaçış), uçtan uca `e2e/tests/weekly.spec.ts` (web'de kapatılan bölüm PDF'e girmez).
- **Sınırlar:** iOS'ta PDF WKWebView ile çizilir; sayfa bölünmesi bölüm bazında (`break-inside: avoid`), çok uzun ağrı listesi sayfayı taşırabilir. Ölçümler ekrandaki gibi yuvarlanır. Grafik yalnız günlük yük çubukları; HRV eğrisi yok.
- **Yeniden değerlendirme:** alıcıya özel hazır seçimler istenirse (ör. "fizyoterapist" ön ayarı); son seçimin hatırlanması istenirse; çok haftalık rapor istenirse.
