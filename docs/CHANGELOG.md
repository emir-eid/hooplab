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
- Sabah check-in (beş madde 1-5) ve ağrı haritası (bölge ve taraf başına 0-10), seans kaydı (tür, süre, RPE, oynanan dakika, canlı seans yükü); sekme çubuğunda artı düğmesi ve kayıt seçici; Bugün'de check-in özeti ve günün seansları. `daily_checkins`, `pain_reports`, `save_morning_checkin` (pgTAP). İlk doğrulanmış kaynaklar (10) ve kurallar (`iyi-olus`, `yuk`, `agri`); hesap motoru `packages/engine`; yerel Supabase'e bağlı web önizlemesi (`npm run web:local`, sentetik demo kullanıcısı); karar 0017.
- Vücut sekmesi: döndürülebilir 3D manken (three.js + expo-gl) üzerinde ağrı haritası; 1 gün (renk ölçeği), 3 gün / 1 hafta (gün gün, birleştirmeden); bölgeye dokununca ayrıntı, listeden seçince manken bölgeye döner ([0018](decisions/0018-vucut-gorunumu.md)).
- Google Health senkronu: Ben → Google Health ekranından bağlan / yeniden bağlan / şimdi senkronla / bağlantıyı kes; Edge Functions (`ghealth-connect`, `ghealth-callback`, `ghealth-sync`) ve saatlik zamanlayıcı (pg_cron + pg_net + Vault). Günlük HRV, dinlenik nabız, SpO2, solunum, cilt sıcaklığı; günlük nabız özeti, adım, mesafe, kalori, aktif bölge dakikası (bileklik kaynağı); uyku ve egzersiz oturumları. Gün içi ham nabız çekilmez ([0019](decisions/0019-google-health-senkronu.md)).
- Seans etiketleme: Bugün → Saatten gelenler (saatin bugün ve dün kaydettiği, etiketlenmemiş oturumlar); seans formu `?exercise=<id>` ile saat oturumunu etiketler (gün ve süre saatten, tür ve RPE kullanıcıdan, kesin tiplerde tür önerisi), aynı günün elle girilmiş kaydına bağlar veya "Seans değil" ile listeden çıkarır. Yeni seans türü Mobilite / yoga. `training_sessions.exercise_session_id` (bileşik dış anahtarla sahiplik), `exercise_sessions.dismissed_at` (pgTAP) ([0020](decisions/0020-seans-etiketleme.md)).
- Toparlanma: Bugün'de günün durumu (Hazır / Kontrollü / Toparlan / Bant oluşuyor), durum renginde hale (`<Aura>`), gerekçe, çipler ve tek öneri; Gece verisi bölümünde derin uyku HRV'sinin 7 günlük ortalaması ve kişisel bandıyla 21 günlük grafik (dokunarak veya sürükleyerek gün seçme), dinlenik nabız, uyku, son gece HRV ve solunum kartları; **Nasıl hesaplanıyor?** ekranı. Hesap `packages/engine` (`recovery.ts`), kural `research/rules/toparlanma.json`, 8 yeni doğrulanmış kaynak; karar 0021.
- Demo modu: giriş ekranında **Demoyu aç** ve Ben → **Demo sporcuyu göster**; sentetik sporcu cihazda üretilir, hiçbir sunucuya bağlanılmaz; Bugün'de Hazır / Kontrollü / Toparlan seçici; demoda girilen kayıtlar bellekte; Ben → **Demodan çık**. Karar 0022.
- `LICENSE` (MIT) ve README'nin yeni hali: ne yaptığı, ilkeler, nasıl geliştirildiği, gizlilik, demo ile hızlı deneme; başta kısa İngilizce özet.
- README'de demo modundan ekran görüntüleri (Bugün: Hazır ve Toparlan, gece verisi, Vücut; açık ve koyu tema, `docs/gorseller/`). Yeniden üretmek için `npm run screenshots` (`tools/dev/demo-screenshots.mjs`, başsız Chrome).
- Gizlilik bekçisi commit mesajlarını da tarıyor: `--history` her commit ve etiket mesajını ve yazar satırını tarar; yeni `--message` modu ve `.githooks/commit-msg` yazılan mesajı commit'ten önce durdurur (negatif testli).

### Değişti
- Sekme ekranlarının kabı (`Screen`) Gesture Handler'ın ScrollView'unu kullanıyor: içindeki sürüklemeli kontroller sayfa kaydırmasını bekletebiliyor.
- Kaydırıcı (ağrı / sertlik, RPE) Gesture Handler'a taşındı: yatay sürükleme kaydırıcıyı, dikey hareket sayfayı kaydırır; kaydırıcı sürüklenirken form kaymaz. Kök düzende `GestureHandlerRootView`, formlarda `GestureScrollView`.
- C maketi: açık temada soluk metin ve durum renginin yazı/ikon kullanımı WCAG 4,5:1'e göre koyulaştırıldı; koyu temada soluk metin açıldı.
