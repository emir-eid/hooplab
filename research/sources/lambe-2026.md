---
id: lambe-2026
title: "The accuracy of VO2 max, heart rate and energy expenditure measurements from Google Pixel Watch 3"
authors: [Lambe R, Schumann M, Hamilton S, Donnelly L, White T, O'Reilly S, Lally S, Doherty C]
year: 2026
type: cross-sectional
doi: 10.1371/journal.pone.0356808
pmid: 42743109
journal: PLOS One
population: Sağlıklı yetişkinler, n=34 (enerji harcaması analizinde 30); koşu bandında maksimal test, referans dolaylı kalorimetri
verified_on: 2026-10-14
---

## Ne söylüyor (kendi cümlelerimizle)

- Fitbit'in algoritmalarını kullanan bir Google saatinin enerji harcaması laboratuvarda dolaylı kalorimetriyle karşılaştırılmış.
- Saat ortalamada hafifçe az tahmin etmiş; ortalama mutlak yüzde hata %15,02 (%95 GA 10,70-19,33).
- Hata kişiden kişiye çok değişmiş: kişi bazında ortalama mutlak yüzde hata yaklaşık %2 ile %49 arasında.
- Yazarlar sensör ve yazılım değiştiği için eski Fitbit çalışmalarının sonuçlarının yeni cihazlara taşınamayacağını belirtiyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| 15 | % | Ortalama mutlak yüzde hata; tipik hata aralığının alt ucu (`enerji-harcamasi-tahmin`) |

## Sınırlılıklar

- Yalnız sürekli koşu bandı testi; aralıklı ya da sıçramalı hareket yok. Pixel Watch 3, Fitbit Air değil.
- Google çalışmayı fonlamış; yazarlar bağımsız olduklarını belirtiyor.
- Tam metin okundu (Europe PMC, PMC13577386).

## Bağlı kurallar

- `rules/enerji.json` → `enerji-harcamasi-tahmin`
