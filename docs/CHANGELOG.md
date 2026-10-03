# Değişiklik günlüğü

Uygulamaya veya altyapıya görünür değişiklikler. Biçim: [Keep a Changelog](https://keepachangelog.com/tr-TR/1.1.0/).

## [Yayınlanmamış]

### Eklendi
- Proje iskeleti: `code` (repo) ve `private` (repo dışı) ayrımı.
- Oturum sistemi: `/ac` ve `/kapat` komutları; SessionStart, PreCompact ve SessionEnd hook'ları.
- Gizlilik bekçisi (`tools/guard`) ve negatif testleri; pre-commit ve pre-push kapıları.
- Kaynak doğrulayıcı (`tools/research`): biçim, kural-kaynak bağları, DOI/PMID ve geri çekilme kontrolü.
- GitHub Actions `Kontroller` iş akışı (her push ve haftalık).
- Karar kayıtları 0001-0007, LESSONS, ROADMAP, STATE.
- Proje düzeyi skill'ler ve plugin tanımları.
- Ürün tanımı ve kapsam belgesi (`docs/PRODUCT.md`); CLAUDE.md belge haritası.
- Gizlilik bekçisi: denylist ifadeleri farklı yazım biçimleriyle de yakalanıyor.
- Gizlilik bekçisi: `--history` (tüm git geçmişi) ve CI'da GitHub secret'ından denylist.
- `private` klasörünün Drive'a eklemeli yedeği (`tools/backup`, SessionEnd hook'u, `/kapat`).
- Belgeler: `COSTS.md`, `DATA-INVENTORY.md`, `SETUP.md`; karar 0008.
- `/ac` hook ve plugin yüklemesini kendisi denetliyor.
- Faz 0 veri testi: Google Health API erişimi doğrulandı; karar 0009 (herkes kendi hesabıyla), Google Health bağlantısı rehberi, Faz 0 özeti.
