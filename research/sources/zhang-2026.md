---
id: zhang-2026
title: Effects of Player Characteristics and Periodization Strategies on External and Internal Loads, Wellness, and Recovery in Collegiate Male Basketball Players
authors: [Zhang S, Li M, Xing W, Zheng W, Zhai Z]
year: 2026
type: cohort
doi: 10.1519/jsc.0000000000005372
pmid: 41432633
journal: Journal of Strength and Conditioning Research
population: Üst düzey antrenmanlı kolej erkek basketbolcuları, n=18, aynı takım (Çin üniversite ligi)
verified_on: 2026-10-04
---

## Ne söylüyor (kendi cümlelerimizle)

- Dış yük, iç yük (seans RPE), iyi oluş ve toparlanma sezon boyunca izlendi; en yüksek yükü maç günleri üretti.
- İyi oluş her sabah saat 10:00'dan önce, basketbolculara uyarlanmış bir çevrim içi anketle toplandı.
- Anketin beş maddesi var: yorgunluk, uyku kalitesi, kas ağrısı, stres ve ruh hali. Her madde 1-5 aralığında puanlanıyor; toplam iyi oluş puanı beş maddenin toplamı.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| 5 madde: yorgunluk, uyku kalitesi, kas ağrısı, stres, ruh hali | madde | Sabah, antrenmandan önce |
| 1-5 | puan / madde | Çalışmada 0,5 adımla; HoopLab tam sayı kullanır ([karar 0017](../../docs/decisions/0017-sabah-check-in-olcegi.md)) |
| 5-25 | toplam puan | Beş maddenin toplamı |

## Sınırlılıklar

- Kolej düzeyi, tek takım, n=18; profesyonel ligle yük ve takvim farklı.
- Ölçeğin yönü (yüksek puanın iyi mi kötü mü olduğu) bu kayıt için tam metinden ayrıca not edilmedi. HoopLab tüm maddelerde 5 = en iyi kullanır (karar 0017).
- Açık erişimli tam metin okundu (PMC13098654).

## Bağlı kurallar

- `rules/iyi-olus.json` → `checkin-olcek`
