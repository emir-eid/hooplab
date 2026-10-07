# Kurallar

Makinenin okuduğu eşik ve hedefler. Biçim ve kurallar: [../README.md](../README.md#kural-dosyası). Her kural en az bir doğrulanmış kaynağa bağlıdır; `npm run research:check` bunu denetler.

İlk kurallar Faz 1'de girdi ölçekleriyle geldi (2026-10-04): `iyi-olus.json`, `agri.json`, `yuk.json`. İlk eşikler toparlanmayla (2026-10-05): `toparlanma.json` (kişisel bant, veri yeterliliği, kısa uyku, günün durumu; [0021](../../docs/decisions/0021-toparlanma-kisisel-bant.md)). Antrenman yükü (2026-10-05): `yuk.json` içinde günlük ve haftalık yük, EWMA, akut / kronik oran (yalnız bağlam), 1,5 bilgi notu, monotonluk ([0025](../../docs/decisions/0025-antrenman-yuku.md)). `packages/engine/test/rules-sync.test.ts` motor sabitlerini bu dosyalarla karşılaştırır. Arayüz metinlerindeki sayılar motor sabitlerinden üretilir; `apps/mobile/src/copy/hardcoded-numbers.test.ts` elle yazılmış eşik ve pencere sayısını yakalar (Faz 2 kapanışı, 2026-10-08).
