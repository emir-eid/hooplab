---
id: bonneval-2025
title: "Validity of Heart Rate Variability Measured with Apple Watch Series 6 Compared to Laboratory Measures"
authors: [Bonneval L, Wing D, Sharp S, Tristao Parra M, Moran R, LaCroix A, Godino J]
year: 2025
type: cross-sectional
doi: 10.3390/s25082380
pmid: 40285070
journal: Sensors
population: Sağlıklı yetişkinler, n=78 (20-75 yaş); laboratuvarda dinlenme, konuşma, film izleme ve yürüyüş öncesi / sonrası
verified_on: 2026-11-15
---

## Ne söylüyor (kendi cümlelerimizle)

- Apple Watch Series 6'nın Breathe oturumlarında ölçtüğü değerler aynı anda alınan 3 derivasyonlu EKG ile kıyaslandı.
- En iyi uyum dinlenirken görüldü: atımlar arası süre ve nabızda neredeyse tam uyum (ortalama mutlak yüzde hata ~%1).
- HRV'nin dayandığı normal atım aralıklarında uyum orta düzeydeydi (dinlenirken ortalama mutlak yüzde hata ~%31).

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| ~%1 | MAPE | Dinlenirken Apple Watch nabzı doğru (`nabiz-olcu-apple`) |
| ~%31 | MAPE | HRV'nin dayandığı aralıklarda hata büyük (`hrv-olcu-apple`) |

## Sınırlılıklar

- Laboratuvar koşulu, kısa kayıtlar; uyku içi ölçüm değil.
- Tek model (Series 6); sporcu değil.
- Yalnız özet okundu (tam metin açık: PMC12031371).

## Bağlı kurallar

- `rules/toparlanma.json` → `hrv-olcu-apple`, `nabiz-olcu-apple`
