# Faz 1 özeti: Temel uygulama (MVP)

- **Başlangıç / bitiş:** 2026-10-03 / 2026-11-14
- **Etiket:** `faz-1-tamam`
- **Not:** Fazın son maddesi, TestFlight, Apple Developer kaydının uzamasıyla (2026-10-05 → 2026-11-14) en sona kaldı. Bu sırada Faz 2, 3 ve 4 bitti. Uygulama da Expo Go'da ve 2026-11-03'ten beri PWA olarak (`app.hooplab.dev`, [0054](../decisions/0054-pwa-yedek-yolu.md)) her gün kullanıldı.

## Hedef
Uygulamayı iPhone'da TestFlight'tan kurulu, gerçek veriyle her gün kullanılabilir hale getirmek. Repoyu public ve temiz tutmak.

## Sonuç
ROADMAP'teki bütün maddeler tamam. Bitiş kriteri 2026-11-14'te karşılandı: 0.1.0 (1) derlemesi TestFlight'tan iPhone'a kuruldu, uygulama çalışıyor (kullanıcı teyidi).

| Madde | Karar | Not |
|---|---|---|
| Uygulama iskeleti | [0014](../decisions/0014-uygulama-iskeleti.md) | Expo Router, TypeScript strict |
| Supabase, şema, tek kullanıcı girişi | [0015](../decisions/0015-veritabani-tek-sahip-rls.md) | Frankfurt, RLS, oturum Keychain'de parçalı |
| Sabah check-in ve ağrı haritası | [0017](../decisions/0017-sabah-check-in-olcegi.md) | Gesture Handler kaydırıcı |
| Vücut görünümü | [0018](../decisions/0018-vucut-gorunumu.md) | 3D manken, gün aralığı filtresi |
| Google Health senkronu | [0019](../decisions/0019-google-health-senkronu.md) | Bulutta saatlik; OAuth 2026-10-19'da "In production" ([0053](../decisions/0053-alan-adi-ve-google-yayin.md)) |
| Seans etiketleme ve kaydı | [0020](../decisions/0020-seans-etiketleme.md) | Maç / antrenman / şut; RPE ve dakika |
| Toparlanma, kişisel bant | [0021](../decisions/0021-toparlanma-kisisel-bant.md) | HRV, dinlenik nabız, uyku |
| Demo modu | [0022](../decisions/0022-demo-modu.md) | Sentetik sporcu, çevrimdışı |
| Kurulum sihirbazı | [0023](../decisions/0023-kurulum-sihirbazi-terminalde.md) | `npm run setup` / `setup:check` |
| EAS ve TestFlight | [0024](../decisions/0024-eas-derleme-ve-guncelleme.md) | Kimlik ortamdan, fingerprint, tek üretim profili; ilk derleme 2026-11-14 ([ek](../decisions/0024-eas-derleme-ve-guncelleme.md)) |
| Repo public | — | 2026-10-05; secret scanning ve push protection açık ([denetim](../audits/2026-10-05-public-oncesi.md)) |

## Ölçülenler
- **Apple Developer kaydı:** başvuru 2026-10-05, onay 2026-11-14 (Individual). Arada destek üç kez belge istedi.
- **İlk EAS derlemesi:** kuyruk ve derleme yaklaşık 7 dakika (ücretsiz plan, 2026-11-14 öğlen). Gönderim birkaç dakika daha sürdü, Apple'ın işlemesi e-postayla bildirildi.
- **Yedek yol:** Apple kaydı uzarken PWA çalıştı ([0054](../decisions/0054-pwa-yedek-yolu.md)), Web Push hatırlatmaları da iPhone'a geldi ([0058](../decisions/0058-pwa-web-push.md)).

## Kararlar
[0014](../decisions/0014-uygulama-iskeleti.md)–[0024](../decisions/0024-eas-derleme-ve-guncelleme.md); yedek yol [0054](../decisions/0054-pwa-yedek-yolu.md).

## Dersler
LESSONS.md'de bu fazdan:
- SecureStore'un 2048 bayt sınırı,
- EAS CLI'ın `.env.local`'ı yüklememesi,
- `eas init`'in kimliği `app.json`'a yazması,
- Google token'ının Testing kipinde 7 günde düşmesi,
- ilk EAS iOS derlemesinin interaktif Apple oturumu istemesi ve `ascAppId`'nin ortamdan çözülmemesi.

## Sonraki işler
- **Native push ve bildirim yollarının birleşmesi:** APNs anahtarı ve Push yetkisi ilk derlemede kuruldu. Native push gelene kadar PWA'nın sunucu hatırlatmaları sürer, native yerel hatırlatmalar kapalı tutulur.
- **Expo yamaları:** 14 Expo paketinin yama sürümü sonraki derlemeden önce alınacak.
- **Girişsiz gönderim:** `ascAppId`'nin nerede tutulacağına karar verilecek (0024 eki).
- **EAS CLI yükseltmesi:** 24.10'dan 27.10'a.
- **Süre sınırı:** TestFlight derlemesi 90 günde düşer (~2027-02-12). En geç o tarihten önce yeni derleme gerekir.
