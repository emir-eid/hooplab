---
id: haddad-2017
title: "Session-RPE Method for Training Load Monitoring: Validity, Ecological Usefulness, and Influencing Factors"
authors: [Haddad M, Stylianides G, Djaoui L, Dellal A, Chamari K]
year: 2017
type: narrative-review
doi: 10.3389/fnins.2017.00612
pmid: 29163016
journal: Frontiers in Neuroscience
population: Seans RPE geçerlik ve güvenirlik çalışmaları (çeşitli sporlar, basketbol dahil)
verified_on: 2026-10-04
---

## Ne söylüyor (kendi cümlelerimizle)

- Foster ve arkadaşlarının (2001) değiştirilmiş CR-10 ölçeğini tablo olarak veriyor. Sözel çapalar: 0 dinlenme, 1 çok çok kolay, 2 kolay, 3 orta, 4 biraz zor, 5 zor, 7 çok zor, 10 maksimal. 6, 8 ve 9'un sözel karşılığı yok.
- Seans yükü, seansın şiddet puanı ile süresinin çarpımıyla tek bir keyfi birim (AU) olarak hesaplanıyor.
- Yöntemin farklı sporlarda geçerliğini ve güvenirliğini gösteren çalışmaları derliyor; sporcunun ölçeğe önce alışması gerektiğini not ediyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| 0-10, sözel çapalar 0, 1, 2, 3, 4, 5, 7, 10'da | RPE | Seans kaydı formundaki ölçek |
| RPE × dakika | AU | Seans yükü (`packages/engine` → `sessionLoad`) |

## Sınırlılıklar

- Anlatı derlemesi (düzey 4); ölçeğin birincil kaynağı `foster-2001`.
- Açık erişimli tam metin okundu (PMC5673663).

## Bağlı kurallar

- `rules/yuk.json` → `seans-rpe-olcek`, `seans-yuku`, `yuk-gunluk`, `yuk-monotonluk`
