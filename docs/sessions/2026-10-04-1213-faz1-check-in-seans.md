# 2026-10-04 12:13 — Faz 1: sabah check-in ve seans kaydı

- **Faz:** 1
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** bu bloğun `rep` commit'i

## Blok 1 — Check-in ölçeği kaynakları, check-in + ağrı haritası + seans kaydı formları (12:13)

### Amaç
STATE'teki ilk iş: check-in ölçeğini doğrulanmış kaynaklarla kararlaştırmak, `daily_checkins` + ağrı haritası şemasını 0015 desenine göre kurmak, sabah check-in ve seans kaydı formlarını ve sekme çubuğundaki artı düğmesini yapmak.

### Yapılanlar
- **Kaynaklar (10, PubMed/Crossref'te bulundu, başlık ve yıl eşleşti; `research:check:online` temiz):** [hooper-1995](../../research/sources/hooper-1995.md), [mclean-2010](../../research/sources/mclean-2010.md), [saw-2016](../../research/sources/saw-2016.md) (sistematik derleme), [conte-2018](../../research/sources/conte-2018.md), [zhang-2026](../../research/sources/zhang-2026.md) (basketbol, tam metin: 5 madde, 1-5), [burger-2024](../../research/sources/burger-2024.md) (elit basketbol izleme derlemesi), [foster-2001](../../research/sources/foster-2001.md), [haddad-2017](../../research/sources/haddad-2017.md) (CR-10 çapaları, tam metin), [hawker-2011](../../research/sources/hawker-2011.md), [todri-2025](../../research/sources/todri-2025.md) (NRS-11, tam metin). Tam metne erişilemeyenlerden sayı alınmadı; bu, her kaynak dosyasında yazıyor.
- **Kurallar (ilk kural dosyaları):** [iyi-olus.json](../../research/rules/iyi-olus.json) `checkin-olcek`, [yuk.json](../../research/rules/yuk.json) `seans-rpe-olcek` ve `seans-yuku`, [agri.json](../../research/rules/agri.json) `agri-olcek`.
- **Hesap motoru `packages/engine` (`@hooplab/engine`):** ölçekler, bölge listesi (sol / sağ / orta), `sessionLoad`, `wellnessTotal`; geçersiz girdide `null`. [rules-sync testi](../../packages/engine/test/rules-sync.test.ts) motor sabitlerini kural JSON'larıyla ve migration CHECK'leriyle karşılaştırır. Kök `typecheck`'e eklendi. [README](../../packages/engine/README.md).
- **Şema:** [migration](../../supabase/migrations/20261004085105_sabah_check_in.sql): `daily_checkins` (günde bir satır, beş madde 1-5), `pain_reports` (gün, bölge ve taraf başına 0-10; bel yalnız orta hat), `save_morning_checkin` (tek işlem, SECURITY INVOKER, yalnız `authenticated`). [pgTAP](../../supabase/tests/database/daily_checkins.test.sql) 22 madde; toplam 39/39. Mutasyon denemesi: anon'a EXECUTE, SECURITY DEFINER ve gevşek okuma politikası verilince 3 madde kırıldı (1, 3, 20), `db reset` sonrası yine 39/39.
- **Bulut:** `projects list` (doğru proje) → `db push --dry-run` → `db push` → `migration list --linked` eşit → `db advisors --linked` yalnız bilinen sızan şifre uyarısı → `curl` ile anon: iki tablo ve RPC `42501 permission denied`.
- **Uygulama:** sekme çubuğuna artı düğmesi ([tab-bar.tsx](../../apps/mobile/src/components/tab-bar.tsx)) → [kayıt seçici](../../apps/mobile/src/app/add.tsx) (formSheet) → [sabah check-in](../../apps/mobile/src/app/checkin.tsx) ve [seans kaydı](../../apps/mobile/src/app/session-new.tsx) (modal). Yeni bileşenler: [form](../../apps/mobile/src/components/form.tsx), [ScaleQuestion](../../apps/mobile/src/components/scale-question.tsx), [Chip](../../apps/mobile/src/components/chip.tsx), [Stepper](../../apps/mobile/src/components/stepper.tsx), [ScaleSlider](../../apps/mobile/src/components/scale-slider.tsx) (dokun / sürükle, ekran okuyucuda ayarlanabilir, RPE seçilmeden boş başlar), [PainMapPicker](../../apps/mobile/src/components/pain-map-picker.tsx). Veri: [daily-log.ts](../../apps/mobile/src/data/daily-log.ts), [pain-map.ts](../../apps/mobile/src/data/pain-map.ts) (testli), [local-date.ts](../../apps/mobile/src/utils/local-date.ts) (testli). [Bugün](../../apps/mobile/src/app/(tabs)/index.tsx): check-in yoksa çağrı, varsa "toplam / 25" özeti, günün seansları ve yükü.
- **Yerel önizleme altyapısı:** `npm run web:local` ([tools/dev/web-local.mjs](../../tools/dev/web-local.mjs)) web önizlemesini yerel Supabase'e bağlar (değerler `supabase status`'tan, `.env.local`'a dokunmaz); [supabase/seed.sql](../../supabase/seed.sql) yalnız yerelde sentetik demo kullanıcısı açar; `.claude/launch.json` → `mobil-web-yerel`.
- **Görsel doğrulama (web, 390 × 844, açık ve koyu):** giriş → artı → seçici → check-in (beş seçim, Aşil sol 3 / sağ 5, dokunma ve sürükleme) → kaydet → Bugün "20 / 25"; seans (Maç, 90 dk, RPE 7 "Çok zor", 20 dk oynadı) → 630 AU → Bugün listesi. Yerel veritabanında satırlar doğru; aynı gün yeniden açılan check-in kaydı yükledi. Hepsi sentetik demo verisi.
- Belgeler: [0017](../decisions/0017-sabah-check-in-olcegi.md), PRODUCT §4 / §7 / §10, ROADMAP, DATA-INVENTORY, `research/rules/README.md`, `apps/mobile/README.md`, LESSONS.

### Kararlar
- [0017 Sabah check-in ölçeği](../decisions/0017-sabah-check-in-olcegi.md) — beş madde 1-5 tam sayı, tüm maddelerde 5 = en iyi; ağrı haritası NRS 0-10, bel dışında sol / sağ ayrı; check-in + ağrı tek işlemde. Ölçek ve taraf ayrımı kullanıcı seçimi.
- Hesap motoru paketi bu işle açıldı: seans yükü formda canlı gösterildiği için hesap uygulamada değil motorda (CLAUDE.md §3).
- Seans içerik etiketleri bu işte yok; Faz 2'de kas / tendon modeliyle (0015'teki plan).

### Sorunlar ve hatalar
- **Yerelde e-posta girişi kapalıydı** (`email_provider_disabled`): `config.toml`'da `[auth.email] enable_signup = false`. `true` yapıldı; yeni kayıt genel anahtarla kapalı kaldı (yerel `signup` denemesi `signup_disabled`). Buluta `config push` edilseydi girişi kapatacaktı.
- **Form yuvasının geçişi web'de sağda kesikti:** react-native-svg'ye boyut verilmemişti (300 × 150). `width/height="100%"` ile düzeldi.
- **Display fontunda "–" büyük bir çubuk gibi görünüyordu** (RPE ve yük boşken): yerine kısa açıklama metni kondu.
- **Kaydettikten sonra bir kez "Ben" sekmesine düşüldü;** kartla ve seçiciyle tekrar denemelerde "Bugün"e döndü, tekrarlanamadı. Cihazda bakılacak.
- **Python metin modu yine CRLF yazdı** (bilinen ders); `sed` ile yalnız ilgili metin dosyalarında düzeltildi, sonra `newline=''` kullanıldı.
- Port 8081'de kullanıcının Metro'su çalışıyordu; yerel önizleme 8082'de ayrı açıldı.

### Öğrenilenler
- LESSONS "Supabase": `[auth.email] enable_signup` yerelde e-posta sağlayıcısını kapatır; yeni fonksiyonlara anon EXECUTE verilir, her RPC'de geri alınır.
- LESSONS "Önizleme": react-native-svg web'de boyutsuz 300 × 150 çizer.
- LESSONS "Windows": CRLF dersi tekrarlandı olarak işaretlendi.

## Açık kalanlar
- Cihazda doğrulama: artı düğmesinin açtığı sayfanın yüksekliği (`fitToContents`), sayfa kayarken kaydırıcıyı sürükleme, kayıttan sonra dönülen sekme. Metro yeni `@hooplab/engine` paketi için yeniden başlatılmalı.
- Vücut görünümü (kullanıcı isteği, bu oturum): çizim yolu, veri kapsamı ve sekme yeri için kullanıcı kararı bekleniyor.

## Sıradaki adım
- Vücut görünümü: kullanıcının üç kararından sonra (çizim yolu, ilk sürümün veri kapsamı, sekme yeri).
