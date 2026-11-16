---
id: jasinski-2024
title: "A Novel method for quantifying fluctuations in wearable derived daily cardiovascular parameters across the menstrual cycle"
authors: [Jasinski SR, Presby DM, Grosicki GJ, Capodilupo ER, Lee VH]
year: 2024
type: cohort
doi: 10.1038/s41746-024-01394-0
pmid: 39715818
journal: npj Digital Medicine
population: Bilek cihazı (WHOOP) kullanan kadınlar, n=11 590, 45 811 döngü; ortalama döngü ~27 gün
verified_on: 2026-11-16
---

## Ne söylüyor (kendi cümlelerimizle)

- Aynı kişide dinlenik nabız ve RMSSD döngü boyunca düzenli bir desenle iniş çıkış gösteriyor.
- Toplulukta dinlenik nabız en düşük ve RMSSD en yüksek döngünün 5. gününde; nabız en yüksek 26., RMSSD en düşük 27. günde, yani bir sonraki adetten hemen önce.
- Bu dalgalanmanın genliği yaşla ve hormonal korunma kullananlarda küçülüyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| Gün 26 / 27 | döngü günü | Nabız en yüksek / RMSSD en düşük (topluluk ortalaması, ~27 günlük döngü); notun adet öncesi evrede verilmesinin dayanağı (`dongu-notu`) |
| daha küçük genlik | — | Hormonal korunmada (`dongu-notu`) |

## Sınırlılıklar

- Yazarlar WHOOP çalışanı; şirket bu bulguya dayanan ürün geliştiriyor ve "üreme evresine göre koçluk" patent başvurusu var (makalede belirtilmiş).
- Evreler kullanıcı kaydından; hormonla doğrulanmamış. WHOOP verisi; Apple Watch'a aktarım varsayımdır.
- Sayılar özetten ve tam metinden (açık: PMC11666598).

## Bağlı kurallar

- `rules/dongu.json` → `dongu-notu`
