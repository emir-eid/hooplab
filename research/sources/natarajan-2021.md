---
id: natarajan-2021
title: Measurement of respiratory rate using wearable devices and applications to COVID-19 detection
authors: [Natarajan A, Su HW, Heneghan C, Blunt L, O'Connor C, Niehaus L]
year: 2021
type: cross-sectional
doi: 10.1038/s41746-021-00493-6
pmid: 34526602
journal: npj Digital Medicine
population: Fitbit kullanıcıları (sağlıklı yetişkinler, büyük örneklem); doğrulama için uyku laboratuvarı kayıtları; COVID-19 tanılı semptomlu ve semptomsuz kullanıcılar
verified_on: 2026-10-07
---

## Ne söylüyor (kendi cümlelerimizle)

- Fitbit, solunum hızını uykudaki kalp atımı aralıklarından (solunumun nabzı dalgalandırmasından) hesaplıyor; uyku laboratuvarı ölçümüyle ortalama mutlak hata yaklaşık 0,5 nefes/dk.
- Sağlıklı yetişkinlerde gece solunum hızının ortalaması yaklaşık 15 nefes/dk; kişiler arası fark büyük (yaş, cinsiyet, beden kitle indeksi ve gece nabzıyla değişiyor). Bu yüzden popülasyon aralığı kişisel değerlendirmeye uygun değil.
- Kişi içinde ise çok kararlı: 20-24 yaşta 14 günlük değişim katsayısının %90 aralığı yaklaşık %2-9,5 (60 yaş altında ortalama %4-6).
- COVID-19'da gece solunumu sık sık yükseliyor: belirtilerin başladığı günün çevresindeki bir haftada semptomlu kişilerin yaklaşık üçte birinde en az bir gece olağan değerin 3 nefes/dk üstünde ölçüm görüldü. Tam metindeki ikinci analiz kişinin kendi ortalaması ve SD'sine göre z-skoru kullanıyor (referans, belirtilerden 30-90 gün önceki dönem).

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| Kişi içi kararlılık (14 günde CV %2-9,5, 20-24 yaş) | % | Kişisel bant yaklaşımının dayanağı; popülasyon aralığı kullanılmaz |
| Olağanın 3 nefes/dk üstü | nefes/dk | Tek gece notu: son gece kişisel 4 haftalık ortalamanın bu kadar üstündeyse (tanı değil) |

## Sınırlılıklar

- Yazarların hepsi Fitbit çalışanı; çalışma Fitbit tarafından finanse edildi.
- Popülasyon sporcu değil. Hastalık analizi COVID-19'a özgü; 3 nefes/dk tanımlayıcı bir sayı, doğrulanmış bir uyarı eşiği değil ve özgüllüğü (yanlış alarm oranı) verilmedi.
- HoopLab'in kullandığı Google Health solunum değeri bu algoritmanın ürün sürümü olabilir, ama sürüm farkı bilinmiyor.

## Bağlı kurallar

- `rules/toparlanma.json` → `solunum-bant`
- `rules/toparlanma.json` → `solunum-tek-gece`
