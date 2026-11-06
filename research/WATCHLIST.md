# Literatür takip listesi

Aylık literatür taramasının konuları. Her konu için PubMed sorgusu; tarama yalnız `consensus`, `position-stand`, `systematic-review`, `meta-analysis` türlerini ve basketbol/elit sporcu popülasyonundaki güçlü birincil çalışmaları önerir.

PubMed yayın türü filtresi (her sorguya eklenir):
`AND (consensus development conference[pt] OR guideline[pt] OR practice guideline[pt] OR systematic review[pt] OR meta-analysis[pt] OR "position stand"[tiab] OR "consensus statement"[tiab])`

| Konu | Modül | PubMed sorgusu |
|---|---|---|
| Sporcularda uyku | uyku | `(sleep[tiab]) AND (athlete*[tiab] OR basketball[tiab])` |
| HRV ile antrenman takibi | toparlanma | `("heart rate variability"[tiab] OR HRV[tiab]) AND (athlete*[tiab] OR training[tiab]) AND (monitoring[tiab] OR readiness[tiab])` |
| Basketbolda yük ve sakatlık | yük | `basketball[tiab] AND (load[tiab] OR workload[tiab] OR injur*[tiab])` |
| Akut/kronik yük yöntemleri | yük | `("acute:chronic"[tiab] OR "acute chronic workload"[tiab] OR ACWR[tiab])` |
| Öznel iyi oluş ölçekleri | toparlanma | `(wellness[tiab] OR "perceived fatigue"[tiab] OR soreness[tiab]) AND athlete*[tiab] AND (questionnaire[tiab] OR monitoring[tiab])` |
| Sporcu beslenmesi: karbonhidrat ve protein | beslenme | `(athlete*[tiab] OR "sports nutrition"[tiab]) AND (carbohydrate[tiab] OR protein[tiab])` |
| Düşük enerji yeterliliği (REDs) | beslenme | `("relative energy deficiency"[tiab] OR REDs[tiab] OR "low energy availability"[tiab])` |
| Hidrasyon ve ter oranı | hidrasyon | `(hydration[tiab] OR dehydration[tiab] OR "sweat rate"[tiab]) AND (exercise[tiab] OR athlete*[tiab])` |
| Patellar / Aşil tendinopatisi | kas-tendon | `(tendinopathy[tiab] OR "jumper's knee"[tiab]) AND (patellar[tiab] OR achilles[tiab])` |
| Egzersize bağlı kas hasarı ve toparlanma | kas-tendon | `("exercise-induced muscle damage"[tiab] OR "muscle soreness"[tiab] OR DOMS[tiab]) AND recovery[tiab]` |
| Takviyeler (kafein, kreatin, nitrat, beta-alanin, bikarbonat) | beslenme | `(caffeine[tiab] OR creatine[tiab] OR nitrate[tiab] OR "beta-alanine"[tiab] OR bicarbonate[tiab] OR "dietary supplement*"[tiab] OR "sports supplement*"[tiab] OR "ergogenic aid*"[tiab]) AND (athlete*[tiab] OR "team sport*"[tiab] OR basketball[tiab] OR "exercise performance"[tiab] OR "sport performance"[tiab] OR "sports performance"[tiab] OR "physical performance"[tiab])` |
| Seyahat, jet lag, maç takvimi | uyku / yük | `("jet lag"[tiab] OR travel[tiab] OR "fixture congestion"[tiab]) AND (athlete*[tiab] OR basketball[tiab])` |

Konu eklemek veya çıkarmak bir oturumda kullanıcıyla kararlaştırılır.

## Sorgu değişiklikleri

- **2026-11-06, Takviyeler daraltıldı:** eski sorgudaki tek başına `supplement*` ve `performance` her alandan sonuç getiriyordu (2026-11-01 taramasında 20 sonucun çoğu yapay zeka, onkoloji vb.). Yeni sorgu IOC uzlaşısında (maughan-2018) iyi kanıtı olan maddeleri adıyla arar, ikinci yarı sporcu ve spor performansı ifadeleriyle sınırlı. Ölçüm (PubMed, yayın türü filtresiyle): son 45 günde 44 → 10 sonuç, 10'u da konuyla ilgili; 2026-11-01 taramasındaki takviye adaylarının hepsi yeni sorguda da çıkıyor; son 365 günde 338 → 76. Düşen ilgili tür: sporcu olmayan gruplarda protein takviyesi (beslenme konusunun sorgusu sporcu çalışmalarını zaten kapsıyor).
