# @hooplab/engine

HoopLab'in hesap motoru: sayıları kod hesaplar, AI hesaplamaz ([CLAUDE.md §3](../../CLAUDE.md), [0004](../../docs/decisions/0004-mimari-hesap-motoru-kanit-ai.md)). Deterministik, React Native'siz, testli. Her ölçek ve eşik `research/rules` içindeki bir kurala karşılık gelir.

| Dosya | İçerik | Kural |
|---|---|---|
| [src/scales.ts](src/scales.ts) | Check-in maddeleri ve 1-5 ölçeği, RPE 0-10 ve sözel çapaları, ağrı 0-10 | `iyi-olus.json → checkin-olcek`, `yuk.json → seans-rpe-olcek`, `agri.json → agri-olcek` |
| [src/body-regions.ts](src/body-regions.ts) | Ağrı haritası ve vücut görünümünün bölge listesi, sol / sağ / orta | [0017](../../docs/decisions/0017-sabah-check-in-olcegi.md) |
| [src/session-load.ts](src/session-load.ts) | `sessionLoad(rpe, dakika)` = RPE × dakika (AU) | `yuk.json → seans-yuku` |
| [src/wellness.ts](src/wellness.ts) | `wellnessTotal` (5-25) | `iyi-olus.json → checkin-olcek` |
| [src/recovery.ts](src/recovery.ts) | `readMetric` (7 günlük ortalama, 28 günlük bant ± 0,5 SD, HRV ln), `readSleep`, `dayStatus` | `toparlanma.json` → `hrv-olcu`, `toparlanma-bant`, `toparlanma-veri-yeterliligi`, `uyku-kisa`, `gunun-durumu` ([0021](../../docs/decisions/0021-toparlanma-kisisel-bant.md)) |
| [src/training-load.ts](src/training-load.ts) | `readTrainingLoad` (günlük yük, son 7 / önceki 7 gün, 28 günün haftalık ortalaması, normalleştirilmiş EWMA 7 / 28, oran ve 1,5 notu, monotonluk ve gerilim; hesap günü bugün kayıt yoksa dün), `dailyLoads`, `ewma` | `yuk.json` → `yuk-gunluk`, `yuk-haftalik`, `yuk-ewma`, `yuk-orani`, `yuk-artis-notu`, `yuk-monotonluk` ([0025](../../docs/decisions/0025-antrenman-yuku.md)) |

## Bekçiler

- [test/rules-sync.test.ts](test/rules-sync.test.ts): motor sabitleri `research/rules` JSON'larıyla ve `supabase/migrations` içindeki CHECK'lerle aynı mı? Biri değişip diğeri değişmezse kırılır.
- Geçersiz girdide fonksiyonlar `null` döner; kısmi veya uydurma sayı üretmez.

Faz 2'de check-in ve solunum baseline'ı ve kas / tendon bölge yükü (tahmin) buraya gelir.
