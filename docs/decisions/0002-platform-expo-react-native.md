# 0002. Platform: Expo (React Native), PWA değil

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0001, 0007

## Bağlam
Kullanıcı kesinlikle bir mobil uygulama istiyor ve tasarım kalitesi önemli. Geliştirme ortamı Windows; Mac yok. Uygulama aynı zamanda bir portfolyo projesi olacak.

## Seçenekler
1. **PWA (Next.js, ana ekrana ekle):** Ücretsiz, Mac gerekmez, web tasarım skill'leri birebir uyar. Ama iOS PWA'larda haptics, jest hassasiyeti ve arka plan davranışı sınırlı; "web sitesi" hissi.
2. **Native Swift/SwiftUI:** En iyi iOS deneyimi, ama Xcode için Mac şart.
3. **Expo (React Native) + EAS:** Kod Windows'ta yazılır, iOS derlemeleri EAS bulutunda yapılır. Geliştirmede Expo Go ücretsiz; kalıcı kurulum için Apple Developer Programı (yıllık 99$) gerekir.

## Karar
Expo (React Native, TypeScript, Expo Router). Mac olmadan gerçek bir iPhone uygulaması, native animasyon ve haptics, güçlü bir portfolyo parçası. Veri buluttan geldiği için (0001) native modüle başlangıçta ihtiyaç yok; bu yüzden Expo Go ile uzun süre ücretsiz geliştirilebilir.

## Sonuçlar
- Expo Go'da uygulama yalnız bilgisayardaki geliştirme sunucusu açıkken çalışır. Apple Developer Programı Faz 1 sonunda alınır, uygulama TestFlight ile kalıcı kurulur.
- iOS simülatörü yerelde yok. Görsel doğrulama: web önizlemesi (iPhone boyutu) ve gerçek cihaz ekran görüntüsü.
- Web odaklı tasarım skill'leri yalnız ilke ve yön için kullanılır; uygulamada RN'ye özel skill'ler (0007).
- **Yeniden değerlendirme tetikleyicisi:** Expo'nun karşılayamadığı bir native ihtiyaç (ör. widget, arka plan HealthKit) zorunlu hale gelirse; bu durumda bile Expo geliştirme derlemesi (dev client) ile çözüm aranır.
