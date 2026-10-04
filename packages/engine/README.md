# @hooplab/engine

HoopLab'in hesap motoru: sayıları kod hesaplar, AI hesaplamaz ([CLAUDE.md §3](../../CLAUDE.md), [0004](../../docs/decisions/0004-mimari-hesap-motoru-kanit-ai.md)). Deterministik, React Native'siz, testli. Her ölçek ve eşik `research/rules` içindeki bir kurala karşılık gelir.

| Dosya | İçerik | Kural |
|---|---|---|
| [src/scales.ts](src/scales.ts) | Check-in maddeleri ve 1-5 ölçeği, RPE 0-10 ve sözel çapaları, ağrı 0-10 | `iyi-olus.json → checkin-olcek`, `yuk.json → seans-rpe-olcek`, `agri.json → agri-olcek` |
| [src/body-regions.ts](src/body-regions.ts) | Ağrı haritası ve vücut görünümünün bölge listesi, sol / sağ / orta | [0017](../../docs/decisions/0017-sabah-check-in-olcegi.md) |
| [src/session-load.ts](src/session-load.ts) | `sessionLoad(rpe, dakika)` = RPE × dakika (AU) | `yuk.json → seans-yuku` |
| [src/wellness.ts](src/wellness.ts) | `wellnessTotal` (5-25) | `iyi-olus.json → checkin-olcek` |

## Bekçiler

- [test/rules-sync.test.ts](test/rules-sync.test.ts): motor sabitleri `research/rules` JSON'larıyla ve `supabase/migrations` içindeki CHECK'lerle aynı mı? Biri değişip diğeri değişmezse kırılır.
- Geçersiz girdide fonksiyonlar `null` döner; kısmi veya uydurma sayı üretmez.

Faz 2'de baseline, akut / kronik yük, monotonluk ve kas / tendon bölge yükü (tahmin) buraya gelir.
