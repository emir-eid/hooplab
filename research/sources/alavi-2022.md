---
id: alavi-2022
title: Real-time alerting system for COVID-19 and other stress events using wearable data
authors: [Alavi A, Bogu GK, Wang M, Rangan ES, Brooks AW, Wang Q]
year: 2022
type: cohort
doi: 10.1038/s41591-021-01593-2
pmid: 34845389
journal: Nature Medicine
population: Fitbit veya Apple Watch kullanan 3.318 yetişkin (genel nüfus, sporcu değil); 84'ü SARS-CoV-2 ile enfekte
verified_on: 2026-10-13
---

## Ne söylüyor (kendi cümlelerimizle)

- Gece dinlenik nabzını (gece yarısından sabaha, adım atılmayan dakikalar) kişinin kendi geçmişinin medyanıyla kıyaslayan basit bir uyarı kuralı (NightSignal) ileriye dönük olarak denendi.
- Kırmızı uyarı: iki gece üst üste gece nabzı medyanın en az 4 atım/dk üstünde. 3 atım/dk'lık bir ara düzey de var; yazarlar bu sayıyı medyanların aylar içindeki olağan oynamasından seçmiş.
- COVID-19'u yakalama oranı yaklaşık %80, uyarısız gün oranı (özgüllük) %87,7. Sinyal belirtilerden ortalama 3 gün önce görüldü.
- Uyarılar yalnız enfeksiyonda değil, stres, alkol, seyahat, aşı ve tatil dönemlerinde de çıktı. Yedi gece sonra kişisel medyan çoğu kişide kararlı hale geliyor.

## Uygulamada kullanılan sayılar

| Değer | Birim | Bağlam / koşul |
|---|---|---|
| Medyanın en az 4 üstü, iki gece üst üste | atım/dk | Gece nabzı notu (tanı değil) |
| 7 gece | gece | Kişisel medyan için en az gece sayısı |

## Sınırlılıklar

- Doğrulama yalnız COVID-19'a karşı; diğer hastalıklar için temiz bir referans yok. Özgüllük alarm günü başına; COVID olmayanlarda üç haftada ortalama bir gün uyarı var (yanlış alarm sık).
- Popülasyon sporcu değil; ağır antrenman, geç maç ve seyahat sporcuda daha çok yanlış alarm üretebilir.
- Makaledeki ölçü cihazın ham nabzından hesaplanan gece ortalaması; HoopLab'in aldığı Google Health günlük dinlenik nabzı aynı ölçü değil (aktarım varsayım). Makalede taban o geceye kadarki bütün gecelerin medyanı; HoopLab önceki 28 günün medyanını alır (uyarlama).
- Kıdemli yazarın şirket ortaklıkları var (cihaz üreticisi değil); kod açık.

## Bağlı kurallar

- `rules/hastalik-isaretleri.json` → `gece-nabzi-yuksek`
