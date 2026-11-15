---
id: hirten-2021
title: "Use of Physiological Data From a Wearable Device to Identify SARS-CoV-2 Infection and Symptoms and Predict COVID-19 Diagnosis: Observational Study"
authors: [Hirten RP, Danieletto M, Tomalin L, Choi KH, Zweig M, Golden E, Kaur S, Helmus D, Biello A, Pyzik R, Charney A, Miotto R, Glicksberg BS, Levin M, Nabeel I, Aberg J, Reich D, Charney D, Bottinger EP, Keefer L, Suarez-Farinas M, Nadkarni GN, Fayad ZA]
year: 2021
type: cohort
doi: 10.2196/26107
pmid: 33529156
journal: Journal of Medical Internet Research
population: Sağlık çalışanları (ileriye dönük gözlem, Apple Watch ile sürekli izleme); sporcu değil
verified_on: 2026-11-15
---

## Ne söylüyor (kendi cümlelerimizle)

- Apple Watch'un gün boyu kaydettiği SDNN'nin günlük ritmi COVID-19 olan ve olmayan katılımcılar arasında farklıydı.
- Tanıdan önceki ve sonraki haftalarda ve ilk belirti gününde SDNN'nin ortalaması ve günlük ritminin genliği değişti.
- Yani Apple'ın SDNN'si, tek tek değerleri hatalı olsa da uzun süreli kişisel izlemede fizyolojik bir değişimi taşıyabiliyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| Uzun süreli kişisel SDNN izlemesi sinyal taşır (eşik yok) | ilke | Apple'da HRV kişisel bantla gösterilir ama yalnız uyku nabzıyla birlikte duruma girer (`hrv-olcu-apple`) |

## Sınırlılıklar

- Konu enfeksiyon, antrenman yükü değil; model istatistiksel, bireysel karar eşiği vermiyor.
- Sporcu değil; ölçümler gün boyu, gece penceresine özgü değil.
- Yazarların çoğunun ticari ilişkileri var (makalede belirtilmiş).
- Yalnız özet okundu (tam metin açık: PMC7901594).

## Bağlı kurallar

- `rules/toparlanma.json` → `hrv-olcu-apple`
