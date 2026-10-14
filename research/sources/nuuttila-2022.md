---
id: nuuttila-2022
title: Reliability and Sensitivity of Nocturnal Heart Rate and Heart-Rate Variability in Monitoring Individual Responses to Training Load
authors: [Nuuttila OP, Seipäjärvi S, Kyröläinen H, Nummela A]
year: 2022
type: cohort
doi: 10.1123/ijspp.2022-0145
pmid: 35894977
journal: International Journal of Sports Physiology and Performance
population: Rekreasyonel koşucular; iki özdeş hafif seans sonrası geceler (n=15) ve 3000 m testi öncesi / sonrası geceler (n=23)
verified_on: 2026-10-14
---

## Ne söylüyor (kendi cümlelerimizle)

- Gece nabzı ve HRV'si (ln RMSSD) iki benzer gece arasında çok tutarlı çıktı; nabızda tutarlılık HRV'den bile biraz yüksekti.
- Maksimal bir koşu testinden sonraki gece nabız yükseldi, HRV düştü; değişim bütün gecede ve uykunun ilk dört saatinde görüldü, sabaha doğru tahmin edilen değerde görülmedi.
- Değişim uykunun ilk saatlerinde en belirgindi: gece ölçümü yüklenmeye en duyarlı kesitlerden biri.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| Nabız ölçüsü uyku sırasında ölçülen nabız | ilke | Google Health'in NREM nabzı (`nrem_hr_bpm`), HRV ile aynı gece; Google'ın bütün gün verisinden hesaplanan günlük dinlenik nabzı yerine (karar 0041) |

## Sınırlılıklar

- Rekreasyonel koşucular, küçük örneklem; ölçüm göğüs bandıyla. Google'ın NREM nabzı uyku evresine göre hesaplanmış bir ortalama; çalışmadaki 4 saatlik ve bütün gece kesitleriyle aynı ölçü değil (aktarım varsayım).
- Yalnız özet okundu (tam metin ücretli).

## Bağlı kurallar

- `rules/toparlanma.json` → `nabiz-olcu`
- `rules/hastalik-isaretleri.json` → `gece-nabzi-yuksek`
