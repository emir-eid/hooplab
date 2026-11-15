---
id: miller-2022
title: "A Validation of Six Wearable Devices for Estimating Sleep, Heart Rate and Heart Rate Variability in Healthy Adults"
authors: [Miller DJ, Sargent C, Roach GD]
year: 2022
type: cross-sectional
doi: 10.3390/s22166317
pmid: 36016077
journal: Sensors
population: Sağlıklı yetişkinler, n=53 (26 kadın, 27 erkek, yaş ~25); uyku laboratuvarında tek gece, polisomnografi ve EKG ile
verified_on: 2026-11-15
---

## Ne söylüyor (kendi cümlelerimizle)

- Apple Watch S6 dahil altı cihaz, uyku laboratuvarında tek gece polisomnografi ve EKG ile kıyaslandı.
- Uyku / uyanıklık ayrımında bütün cihazlar geçerliydi; uyku evrelerini ayırmada hepsi zayıftı (Apple Watch evre uyumu ~%53).
- Uykuda ve uykudan hemen önce Apple Watch'un nabzı EKG ile çok uyumluydu (ICC 0,96, ortalama fark ~0,5 atım/dk).
- Aynı koşulda Apple Watch HRV'yi EKG'den hesaplanan RMSSD'ye göre ortalama ~9,6 ms düşük verdi; mutlak fark ~22,5 ms, ICC 0,67; düşük değerlerde fazla, yüksek değerlerde az tahmin etti (orantılı sapma).

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| 0,96 | ICC | Uykuda Apple Watch nabzı EKG'ye karşı; uyku nabzı Apple'da güvenilir işaret (`nabiz-olcu-apple`, `gunun-durumu-apple`) |
| 0,67 | ICC | Uykuda Apple Watch HRV'si EKG RMSSD'sine karşı; HRV Apple'da tek başına durum tetiklemez (`gunun-durumu-apple`) |
| Evre uyumu ~%53 | % | Uyku evreleri güvenilir değil; uyku nabzı evreye göre değil bütün uyku penceresinden hesaplanır (`nabiz-olcu-apple`) |

## Sınırlılıklar

- Tek gece, genç ve sağlıklı yetişkinler; sporcu değil.
- Apple Watch'un HRV değeri SDNN iken referans RMSSD; fark kısmen ölçü farkından gelir.
- Araştırma grubu WHOOP'tan destek alıyor (makalede belirtilmiş; WHOOP çalışmaya katılmamış).
- Sayılar tam metinden okundu (açık: PMC9412437, Tablo 6).

## Bağlı kurallar

- `rules/toparlanma.json` → `hrv-olcu-apple`, `nabiz-olcu-apple`, `gunun-durumu-apple`
