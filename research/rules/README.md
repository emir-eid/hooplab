# Kurallar

Makinenin okuduğu eşik ve hedefler. Biçim ve kurallar: [../README.md](../README.md#kural-dosyası). Her kural en az bir doğrulanmış kaynağa bağlıdır; `npm run research:check` bunu denetler.

İlk kurallar Faz 1'de girdi ölçekleriyle geldi (2026-10-04): `iyi-olus.json`, `agri.json`, `yuk.json`. İlk eşikler toparlanmayla (2026-10-05): `toparlanma.json` (kişisel bant, veri yeterliliği, kısa uyku, günün durumu; [0021](../../docs/decisions/0021-toparlanma-kisisel-bant.md)). `packages/engine/test/rules-sync.test.ts` motor sabitlerini bu dosyalarla karşılaştırır.
