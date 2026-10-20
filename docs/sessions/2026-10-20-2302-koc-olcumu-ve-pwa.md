# 2026-10-20 23:02 — Koç kalite ölçümü ve PWA yedek yolu

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1-2)
- **Commit'ler:** (rep commit'i)

## Blok 1 — Koçun gerçek yanıtlardaki kalite oranları (23:02)

### Amaç
STATE "Açık riskler"de "izlenir" diye bekleyen koç oranlarını ilk kez gerçek kayıtlarla ölçmek: kısmi kabulde atılan cümle, reddedilen özet, haftalık yorumda kırpma, soru-cevapta `no_source` / `rejected`, kısa cümle yönergesinin etkisi.

### Yapılanlar
- `npm run coach:usage` buluttan çalıştırıldı (bağlı proje doğrulandı). Ek olarak satır başına yalnız tarih, durum, cümle sayısı, gösterilen cümle sayısı, sorun kodu ve ortalama cümle uzunluğu sorgulandı; özet, soru ve anlık değer metni okunmadı.
- Günlük özet (2026-10-09 → 2026-10-17, 10 deneme, 8 farklı gün): 8 kabul, 2 red. Kabul edilenlerde atılan cümle 8 / 66 (%12); 6'sı tek bir özetten (2026-10-11). 2026-10-12'den beri 2 / 46.
- Reddedilen iki özet: ilki ilk gerçek çağrı (2026-10-09, 11 sorun, yönergeler sonra sıkılaştı). İkincisi (2026-10-15) tek sorunluydu: kaynaksız öneri, günün durumu cümlesindeydi; durum cümlesi düşünce kural gereği ([0034](../decisions/0034-koc-kismi-kabul.md), `salvageAudit` `requireStatus`) özetin tamamı gösterilmedi, 9 temiz cümle de gitti.
- Kısa cümle yönergesi (2026-10-09, `bc657c6`) gerçek yanıtta görüldü: ortalama cümle ilk gün 127 ve 175 karakter, sonraki özetlerde 77-95 karakter.
- Haftalık yorum: tek gerçek yanıt (2026-10-17) 10 cümle, 1'i `estimate_unlabeled` ile atıldı (9 gösterildi). 7 cümle sınırı ondan sonra (2026-10-18) geldi; sınırdan sonra henüz haftalık yorum yazılmadı, kırpma oranı ölçülemedi.
- Soru-cevap: 3 soru (2 `answered`, 1 `no_source`, `rejected` yok); yanıtlarda atılan cümle 0 / 11. Sınıflandırıcının yanlış sınıflama oranı için 3 soru az.
- Maliyet: 12 günde 1,49 $; 30 günlük karşılığı 3,73 $ (tahmin 3,50 $). Özet başına 0,100 $, soru başına 0,126 $.
- STATE "Açık riskler"de AI koç ve haftalık yorum maddeleri bu sayılarla güncellendi.

### Kararlar
- yok. 2026-10-15'teki tam ret tasarımın öngördüğü davranış; değiştirmek (ör. durum cümlesine öneri yazdırmamak) ayrı bir karar ister, "Açık kalanlar"da.

### Sorunlar ve hatalar
- yok.

### Öğrenilenler
- yok.

## Blok 2 — PWA yedek yolu karar notu (23:07)

### Amaç
Haftalık denetimin (2026-10-20) istediği karar tarihini koymak: Apple kaydı sonuçsuz kalırsa PWA'ya ne zaman ve hangi işlerle geçileceğini yazmak.

### Yapılanlar
- [0054](../decisions/0054-pwa-yedek-yolu.md) yazıldı (Önerildi): seçenekler (beklemek / PWA'yı yedek hazırlamak / yalnız PWA), öneri 2026-11-03'e kadar Expo Go + tünel, sonra seçenek 2.
- PWA iş listesi repoda doğrulandı: Google dönüş adresi izin listesi (`isAllowedReturnUrl`) yalnız uygulama şemalarını ve yerel adresleri kabul ediyor, barındırılan PWA için genişlemeli; yerel bildirimlerin (0045) web karşılığı yok (Web Push sunucu işi ister); uygulama `expo-haptics` kullanmıyor.
- Teknik olgular kaynakla: Expo PWA rehberi (manifest `+html.tsx`, Workbox, önbellek uyarısı), iOS 16.4 ana ekran Web Push, WebKit'te Vibration API yok (W3C uygulama raporu 2024).
- [decisions/README](../decisions/README.md) ve STATE (risk, kullanıcı işi, sıradaki iş 3) güncellendi.

### Kararlar
- [0054 PWA yedek yolu](../decisions/0054-pwa-yedek-yolu.md) — önerildi; karar tarihi kullanıcıda.

### Sorunlar ve hatalar
- yok.

### Öğrenilenler
- yok.

## Açık kalanlar
- Durum cümlesindeki tek bir ihlal özetin tamamını düşürüyor (1 / 10 denemede görüldü). Sık görülürse yönergede durum cümlesinin yalnız durumu anlatması, önerinin ayrı cümlede olması istenebilir.
- Haftalık yorumda 7 cümle kırpmasının oranı ilk yeni yorumla ölçülür.
- Apple Developer kaydı; PWA karar tarihi (öneri 2026-11-03, 0054) kullanıcı onayında.

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
