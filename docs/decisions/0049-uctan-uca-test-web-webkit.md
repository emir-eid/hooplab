# 0049. Uçtan uca test: web çıktısı, WebKit, demo modu

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-17
- **İlgili:** [0022](0022-demo-modu.md), [0048](0048-performans-turu.md), [oturum raporu](../sessions/2026-10-16-1934-performans-turu.md)

## Bağlam
Faz 4'ün "iOS uçtan uca test" maddesi. Amaç: değişikliklerin ana akışları bozduğunu her seferinde telefonda elle bakmadan yakalamak. Kısıtlar:
- Mac yok, TestFlight Apple onayını bekliyor.
- EAS Simulator hesapta açık değil (`simulator:availability` → `available: false`, bekleme listesi).
- EAS Workflows'un Maestro işi ücretsiz planda yok (expo.dev/pricing, 2026-10-16: Free sütununda "Run Maestro end-to-end test jobs" boş; Starter 19 $/ay + kullanım). Maestro işi alfa aşamasında.

## Seçenekler
1. **Web çıktısı + Playwright (WebKit, iPhone boyutu), demo modu:** ücretsiz, GitHub Actions'ta her push'ta, sunucu ve sır gerekmez. iOS'a özgü sorunları (klavye, native bileşenler, 3D) yakalamaz.
2. **Android emülatörü + Expo Go + Maestro (yerel):** ücretsiz ve native, ama iOS değil; Android Studio kurulumu birkaç GB; CI'da yok.
3. **EAS Starter + Maestro (iOS simülatörü):** gerçek iOS; aylık ücret, alfa.
4. **Ertelemek:** TestFlight / EAS Simulator erişimine kadar beklemek.

## Karar
Seçenek 1 (kullanıcı kararı, 2026-10-16):
- `e2e/serve.mjs` uygulamanın `static` web çıktısını Supabase değerleri boş derler ve rota başına HTML'i sunar.
- Playwright (1.63.0, sabit) WebKit'le `iPhone 13` profilinde demo modunu sürer.
- Ortak düzen (`e2e/tests/demo.ts`) sayfadaki her `pageerror` ve konsol hatasında testi kırar.
- İlk 5 akış: Bugün'ün ana bölümleri, beş sekme sırayla, demo günü değişimi, su kaydının halkaya yansıması ve sekme dönüşünde kalması (0048'in odak kapısı), sabah check-in'in karta dönüşmesi.
- CI'da ayrı `uctan-uca` işi; `npm run check`'e ve pre-push'a girmez (derleme ~35 sn).
- iOS'a özgü kontrol tünelle cihazda kalır.

## Sonuçlar
- Doğrulandı: yerelde 5/5 geçti. Bilerek bozulan su kaydı yenilemesini su testi yakaladı (2,0 L beklerken 1,5 L).
- Demo bellekte yaşar: testler sayfayı yenilemez, yalnız tıklayarak gezer. Gerçek veri katmanı (Supabase istekleri, RLS) bu testlerde yok; pgTAP ve birim testleri karşılar.
- Seçiciler erişilebilirlik adlarına dayanır: bir etiketi değiştirmek testi kırabilir. Bu bilinçli bir tercih, çünkü etiket ekran okuyucunun da gördüğü şey.
- Yeniden değerlendirme tetikleyicisi: TestFlight onayı ya da EAS Simulator erişimi gelince, ya da yalnız iPhone'da görülen bir hata web testlerinden kaçarsa iOS'ta otomatik test yeniden tartılır.
