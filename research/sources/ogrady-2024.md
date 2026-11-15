---
id: ogrady-2024
title: "The Validity of Apple Watch Series 9 and Ultra 2 for Serial Measurements of Heart Rate Variability and Resting Heart Rate"
authors: [O'Grady B, Lambe R, Baldwin M, Acheson T, Doherty C]
year: 2024
type: cohort
doi: 10.3390/s24196220
pmid: 39409260
journal: Sensors
population: Sağlıklı yetişkinler, n=39, 14 günde 316 ölçüm; referans Polar H10 göğüs bandı + Kubios
verified_on: 2026-11-15
---

## Ne söylüyor (kendi cümlelerimizle)

- Apple Watch Series 9 ve Ultra 2'nin tekrarlı HRV ve dinlenik nabız ölçümleri iki hafta boyunca göğüs bandıyla kıyaslandı.
- Apple Watch HRV'yi ortalama ~8 ms düşük verdi; ortalama mutlak yüzde hata ~%29, ortalama mutlak hata ~20 ms; önceden belirlenen ±10 ms eşdeğerlik sınırına girmedi.
- Dinlenik nabız ise doğruydu: ortalama fark ~0, ortalama mutlak yüzde hata ~%6, mutlak hata ~3,7 atım/dk.
- Yazarlar HRV'nin performans izlemesinde temkinle yorumlanmasını öneriyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| ~%29 | MAPE | Apple Watch HRV'sinin bireysel hatası büyük; HRV tek başına durum tetiklemez, arayüzde "tahmin" (`hrv-olcu-apple`, `gunun-durumu-apple`) |
| ~%6 | MAPE | Apple Watch dinlenik nabzı doğru; Apple'da durumun dayanağı uyku nabzı (`nabiz-olcu-apple`, `gunun-durumu-apple`) |

## Sınırlılıklar

- Küçük örneklem, sağlıklı yetişkinler; sporcu değil.
- Ölçümler gündüz dinlenirken; uyku içi ölçüm değil (aktarım varsayım).
- Yalnız yeni modeller (Series 9, Ultra 2); SE modelleri kapsamda değil.
- Yalnız özet okundu (tam metin açık: PMC11478500).

## Bağlı kurallar

- `rules/toparlanma.json` → `hrv-olcu-apple`, `nabiz-olcu-apple`, `gunun-durumu-apple`
