---
id: fukagawa-2022
title: "USDA's FoodData Central: what is it and why is it needed today?"
authors: [Fukagawa NK, McKillop K, Pehrsson PR, Moshfegh A, Harnly J, Finley J]
year: 2022
type: expert-opinion
doi: 10.1093/ajcn/nqab397
pmid: 34893796
journal: The American Journal of Clinical Nutrition
population: Yok (besin bileşimi veritabanının tanıtımı; USDA Tarımsal Araştırma Servisi)
verified_on: 2026-10-07
---

## Ne söylüyor (kendi cümlelerimizle)

- FoodData Central (FDC), USDA'nın besin bileşimi verisini tek yerde toplayan sistem. Beş veri türü var: Foundation Foods, Experimental Foods, SR Legacy, FNDDS ve markalı ürünler.
- SR Legacy, uzun yıllar kullanılan standart referans veritabanının son, artık güncellenmeyen sürümü; ev ölçülerinin gram karşılıklarını da içeriyor.
- Amaç, besin değerlerini şeffaf, belgeli ve web üzerinden kolay erişilir kılmak.

## Uygulamada kullanılan sayılar

Bu makaleden sayı alınmıyor. Öğün kaydındaki besin listesinin değerleri (100 g'daki karbonhidrat ve protein, ev ölçüsünün gram karşılığı) doğrudan FDC'den, her besinin FDC kimliğiyle alınır: `research/foods/foods.json`.

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| FDC kimliği | — | Her besin satırında; değer FDC API'siyle yeniden doğrulanabilir |

## Sınırlılıklar

- Veritabanı tanıtımı, kanıt düzeyi yok (yöntemsel kaynak). Veri ABD besinlerinden; Türk yemekleri birebir karşılanmıyor, eşleme yaklaşık.
- Veri kamu malı (CC0 1.0; FDC API kılavuzunda yazıyor). Önerilen atıf: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.
- Yalnız özet okundu.

## Bağlı kurallar

- `rules/beslenme.json` → `ogun-besin-listesi`
