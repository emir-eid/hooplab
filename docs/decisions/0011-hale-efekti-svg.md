# 0011. Hale efekti: react-native-svg radyal gradyan + Reanimated transform

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** [0010](0010-tasarim-yonu-hale.md), [0002](0002-platform-expo-react-native.md)

## Bağlam
C yönünün imzası, günün durumunu gösteren ve yavaşça hareket eden renk halesi. Maket bunu CSS `filter: blur` ile çiziyordu; React Native'de karşılığı seçilmeli. Kısıtlar: uygulama yalnız iOS, Expo Go ile geliştirme, görsel iş önce web önizlemesinde (390×844) sonra cihazda doğrulanıyor ([CLAUDE.md §4](../../CLAUDE.md)).

## Seçenekler
1. **`react-native-svg` radyal gradyanlar:** renkten şeffafa düşen 3 leke; Reanimated yalnız sarmalayıcı görünümlerin `transform`'unu oynatır. Artıları: grafik ve ikonlar için zaten gerekecek, Expo Go'da hazır, web önizlemesinde çalışır, renkler token'a bağlanır. Eksileri: gerçek bulanıklık değil; büyük yumuşak gradyanlarda renk kademelenmesi (banding) olabilir.
2. **`@shopify/react-native-skia`:** gerçek Gauss bulanıklığı, doku, tamamen GPU'da. Expo Go'da hazır ([Expo dokümanı](https://docs.expo.dev/versions/latest/sdk/skia/)). Eksileri: ayrı bir çizim motoru ve paket büyümesi; web için CanvasKit kurulumu gerekir; yalnız hale için ağır.
3. **`expo-blur` (BlurView):** içeriği değil arkasını buzlu cama çevirir, renkli halede grileşme olur; yoğunluğunu canlandırmak önerilmez ([Expo dokümanı](https://docs.expo.dev/versions/latest/sdk/blur-view/), `animate-expo` skill'i). Hale için yanlış araç; sekme çubuğu camı için doğru araç.
4. **React Native `experimental_backgroundImage` radial-gradient:** bağımlılık yok ama 0.86'da hala deneysel ve üretimde önerilmiyor; `filter: blur` iOS'ta yok ([RN 0.86 view style props](https://reactnative.dev/docs/0.86/view-style-props)).
5. **Hazır görseller:** en hafif; ama 3 durum × 2 tema = 6 görsel ve token sistemine bağlanmıyor.

## Karar
Seçenek 1. Hale tek bir `<Aura state theme />` bileşeninin içinde yaşar: 3 leke, her biri `RadialGradient` ile Gauss benzeri durak dizisi (`0:1, .2:.86, .4:.58, .6:.3, .8:.1, 1:0`), renkler durum ve tema token'larından. Hareket yalnız `transform` (kaydırma ve ölçek), uzun ve küçük döngüler; Hareketi Azalt açıksa hale durur. Maket de bu yöntemle yeniden çizildi (`design/maketler/c-hale.html`).

## Sonuçlar
- Gerçek bulanıklık ve doku yok; kabul edildi.
- Cihazda kademelenme veya görünüm yetersizliği görülürse yalnız `<Aura>` bileşeninin içi Skia'ya taşınır, başka yere dokunulmaz.
- **Yeniden değerlendirme tetikleyicisi:** cihaz testinde kademelenme; ya da Faz 2'de grafikler için Skia seçilirse hale de oraya taşınır.
