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
- Faz 0.5 tasarım maketleri (`design/maketler/`): üç görsel yön; seçilen C · Hale için koyu tema ve Görünüm ekranı; kararlar 0010 ve 0011; maket önizleme sunucusu (`.claude/launch.json`).
- Expo ve Supabase plugin'leri proje kapsamında yüklendi; kurulum komutları SETUP'ta.
- `/rep` ara rapor komutu: oturum içinde kayıt + push, oturum başına tek bloklu rapor; `/ac` ve `/kapat` buna göre güncellendi; karar 0012.
- Tasarım token'ları `packages/theme` (`@hooplab/theme`): açık/koyu palet, hale, tipografi, ölçüler, hareket, görünüm tercihleri; maketle birebir test ve WCAG kontrast testi; Bricolage opsz 96 display kesimi; karar 0013.
- npm workspaces, TypeScript 6.0 (Expo SDK 57 ile aynı); tip denetimi ve paket testleri `check`, pre-push ve CI'da.
- Uygulama iskeleti `apps/mobile` (Expo SDK 57, Expo Router): Bugün, Trend, Koç, Ben sekmeleri; maketteki cam sekme çubuğu; Ben → Görünüm'de Sistem / Açık / Koyu tema ve haleyi canlandır tercihi (cihazda saklanır); `@hooplab/theme` renk, yazı ve fontları; uygulama tip denetimi ve testleri `check`, pre-push ve CI'da; `npm run mobile`; karar 0014.
- Supabase temeli: CLI (sabit sürüm), `supabase/` migration'ları (`training_sessions`, tek sahip RLS, açık GRANT), pgTAP RLS testleri ve `db:*` / `test:db` komutları; e-posta + şifre girişi (`Stack.Protected`, giriş ekranı, Ben → Çıkış yap); oturum Keychain'de bayta göre parçalı (`chunked-storage`); yalnız publishable anahtar kabul eden yapılandırma; kararlar 0015 ve 0016 (dış servis işlerini Claude yürütür, CLAUDE.md §7).

### Değişti
- C maketi: açık temada soluk metin ve durum renginin yazı/ikon kullanımı WCAG 4,5:1'e göre koyulaştırıldı; koyu temada soluk metin açıldı.
