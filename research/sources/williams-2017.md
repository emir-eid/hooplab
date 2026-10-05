---
id: williams-2017
title: "Better way to determine the acute:chronic workload ratio?"
authors: [Williams S, West S, Cross MJ, Stokes KA]
year: 2017
type: expert-opinion
doi: 10.1136/bjsports-2016-096589
pmid: 27650255
journal: British Journal of Sports Medicine
population: Yöntem mektubu (popülasyon yok)
verified_on: 2026-10-05
---

## Ne söylüyor (kendi cümlelerimizle)

- Akut ve kronik yükü basit kayan ortalama yerine üstel ağırlıklı kayan ortalamayla (EWMA) hesaplamayı öneriyor: yakın günler daha ağır sayılır, yükün birikmesi ve sönmesi daha gerçekçi modellenir.
- Günlük güncelleme: bugünkü EWMA = bugünkü yük × λ + (1 − λ) × dünkü EWMA; λ = 2 / (N + 1), N gün cinsinden zaman sabiti.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| λ = 2 / (N + 1) | - | EWMA ağırlığı |
| N = 7 | gün | Akut yük |
| N = 28 | gün | Kronik yük |

## Sınırlılıklar

- Bir mektup; ampirik karşılaştırma murray-2017'de.
- Mektubun tam metni açık erişimde değil, okunmadı. Formül ve N değerleri bu mektuba atıf yapan açık erişimli ren-2024 (PMC11402767) tam metninden doğrulandı.

## Bağlı kurallar

- `rules/yuk.json` → `yuk-ewma`
