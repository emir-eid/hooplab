---
id: lambe-2026b
title: "The accuracy of Apple Watch measurements: a living systematic review and meta-analysis"
authors: [Lambe R, Baldwin M, O'Grady B, Schumann M, Caulfield B, Doherty C]
year: 2026
type: meta-analysis
doi: 10.1038/s41746-025-02238-1
pmid: 41513748
journal: npj Digital Medicine
population: 82 doğrulama çalışması, 14 sağlık ölçüsü, toplam ~430.000 katılımcı (ortalama yaş ~41); Eylül 2025'e kadar
verified_on: 2026-11-15
---

## Ne söylüyor (kendi cümlelerimizle)

- Apple Watch'un ölçtüğü her şeyi kriter yöntemlerle kıyaslayan, güncellenen bir meta-analiz (repodaki `lambe-2026`'dan ayrı makale).
- Nabız ortalamada çok az düşük ölçülüyor (yaklaşık −0,3 atım/dk) ama tek ölçümde ±7 atım/dk'ya varan oynama olabiliyor.
- Uyku ve adımda doğruluk orta; enerji harcamasında hata tutarsız ve çoğu zaman büyük.
- Doğruluk ölçüye, ölçüm koşuluna ve kişinin fizyolojisine göre değişiyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| Ortalama fark −0,27, uyum sınırı yaklaşık −7 / +7 | atım/dk | Apple nabzı ortalamada doğru; tek gecelik değer değil bant kullanılır (`nabiz-olcu-apple`) |
| Enerji harcaması hatası tutarsız ve büyük | ilke | Apple'da yakılan enerji "tahmin" olarak gösterilir, durum ve beslenme hedefiyle kıyaslanmaz (`enerji-harcamasi-tahmin-apple`) |

## Sınırlılıklar

- Çalışmaların çoğu laboratuvar ve kısa süreli; uzun süreli saha doğrulaması az.
- Sporculara özgü değil.
- Yalnız özet okundu (tam metin açık: PMC12823594).

## Bağlı kurallar

- `rules/toparlanma.json` → `nabiz-olcu-apple`
- `rules/enerji.json` → `enerji-harcamasi-tahmin-apple`
