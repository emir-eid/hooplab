# @hooplab/mobile

HoopLab'in iPhone uygulaması: Expo SDK 57, Expo Router, TypeScript strict. Kararlar: [0002](../../docs/decisions/0002-platform-expo-react-native.md), [0014](../../docs/decisions/0014-uygulama-iskeleti.md). Tasarım token'ları: [@hooplab/theme](../../packages/theme/README.md).

## Çalıştırma

Kök klasörden (`npm install` bir kez):

```bash
npm run mobile
```

Terminalde çıkan QR kodu iPhone kamerasıyla okut; Expo Go'da açılır. iPhone ve bilgisayar aynı Wi-Fi'da olmalı. Web önizlemesi: `npm run web -w @hooplab/mobile` (Claude Code'da `.claude/launch.json` → `mobil-web`).

## Düzen

| Klasör | İçerik |
|---|---|
| `src/app/` | Yalnız rotalar. `(tabs)`: Bugün (`index`), Trend, Koç, Ben (`me/`: yığın, Görünüm alt sayfası) |
| `src/components/` | Yeniden kullanılan arayüz: `Text`, `Card`, `Screen`, `PageHeader`, liste, sekme çubuğu, ikonlar, tema seçici |
| `src/theme/` | Görünüm tercihi ve etkin palet (`useAppearance`, `usePalette`), font listesi |
| `src/utils/` | Saf yardımcılar |

## Kurallar

- Renk yalnız `usePalette()` ile; statik stillerde renk yok. Yazı `Text` bileşeninin `variant`'ı ile (`@hooplab/theme` `type`).
- Paket eklerken `npx expo install <paket>` (SDK ile uyumlu sürüm). Expo Go'da olmayan native modül geliştirme derlemesi ister.
- Testler kaynağın yanında (`*.test.ts`), Node ile koşar: `npm run test:apps`. Test dosyaları uygulama kodu import edecekse yalnız saf modülleri (React Native'siz) import eder.
- Tip denetimi: `npm run typecheck` (kökte; tema paketi ve uygulama birlikte).
