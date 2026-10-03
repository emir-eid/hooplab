# Faz 0 özeti: veri erişimi testi ve altyapı

- **Başlangıç / bitiş:** 2026-10-03 / 2026-10-03
- **Etiket:** `faz-0-tamam`

## Hedef
Kendi Fitbit Air verine programatik erişimin çalıştığını (veya çalışmadığını ve B planının seçildiğini) ölçerek kanıtlamak. Projenin oturum, gizlilik ve kanıt altyapısını kurmak.

## Sonuç
Erişim çalışıyor. Google'ın dokümanında "yeni proje kabul etmiyoruz" notu olmasına rağmen kişisel Google Cloud projesi ve Testing modundaki OAuth istemcisiyle Google Health API v4'ten Türkiye hesabının verisi alındı. B planına gerek kalmadı.

## Ölçülenler
| Soru | Cevap |
|---|---|
| Erişim açılıyor mu? | Evet (API etkinleştirme, OAuth onayı ve veri çekme sorunsuz) |
| Türkiye hesabında veri dönüyor mu? | Evet |
| Fitbit Air ne üretiyor? | Gece HRV (günlük özet + uyku boyunca örnekler), dinlenik nabız, evreli uyku, SpO2, solunum, cilt sıcaklığı sapması, yaklaşık 3 saniyelik gün içi nabız, egzersiz (bölgeler ve olaylar), aktivite. VO2max, EKG, irtifa gelmiyor. Ayrıntı: [LESSONS](../LESSONS.md) |
| Token ne sıklıkla yenilenmeli? | Erişim token'ı 1 saat (otomatik yenilenir). Yenileme token'ı Testing modunda 7 gün (Google belgesi; pratik ölçüm 2026-10-10 civarı) |

## Kararlar
[0001](../decisions/0001-veri-kaynagi-google-health-api.md)–[0009](../decisions/0009-herkes-kendi-hesabiyla.md). Faz sonunda öne çıkan: 0001 doğrulandı, 0009 ile merkezi servis olmadan "herkes kendi hesabıyla" kurulumu seçildi.

## Dersler
LESSONS.md "Windows" ve "Google Health / veri" bölümleri. En önemlisi: API sessizce eksik dönebilir (kayıt sınırı), aralıklar parçalanır ve kayıt sayısı kontrol edilir.

## Faz 1'e devredilenler
- Expo ve Supabase plugin'lerinin kurulumu (henüz yüklü değil).
- SessionEnd / PreCompact arşiv hook'unun gerçek tetiklenmesinin doğrulanması.
- Senkron kuralları, kurulum sihirbazı, seans etiketleme ([ROADMAP](../ROADMAP.md) Faz 1).

## Sonraki faz
Faz 0.5: tasarım yönü (2-3 maket, seçim, token'lar).
