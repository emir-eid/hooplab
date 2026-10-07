# HoopLab — canlı durum

Tek doğruluk kaynağı. `/rep` her iş sonunda, `/kapat` her oturum sonunda günceller; `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 1 sürüyor: iskelet ([0014](decisions/0014-uygulama-iskeleti.md)), Supabase + giriş ([0015](decisions/0015-veritabani-tek-sahip-rls.md)), sabah check-in + ağrı haritası ve seans kaydı ([0017](decisions/0017-sabah-check-in-olcegi.md)), **Vücut** sekmesi ([0018](decisions/0018-vucut-gorunumu.md)) iPhone'da doğrulandı. **Google Health senkronu** bulutta ve iPhone'da çalışıyor ([0019](decisions/0019-google-health-senkronu.md)): Ben → Google Health ile bağlan / yeniden bağlan; saatlik zamanlayıcı; günlük HRV, dinlenik nabız, SpO2, solunum, cilt sıcaklığı, nabız özeti (ham nabız yok), adım / mesafe / kalori / aktif dakika (bileklik kaynağı), uyku ve egzersiz oturumları. **Seans etiketleme** ([0020](decisions/0020-seans-etiketleme.md)) bulutta ve iPhone'da: Bugün → Saatten gelenler (bugün ve dün), saat oturumu seans kaydına bağlanır, tür ve RPE kullanıcıdan, "Seans değil"; yeni tür Mobilite / yoga. **Toparlanma** ([0021](decisions/0021-toparlanma-kisisel-bant.md)) web önizlemesinde ve iPhone'da: Bugün'de günün durumu (Hazır / Kontrollü / Toparlan / Bant oluşuyor) ve hale; derin uyku HRV'si, dinlenik nabız ve uyku kişisel banda göre (7 gün / önceki 4 hafta ± 0,5 SD); HRV grafiğinde dokunarak gün seçme; Nasıl hesaplanıyor? ekranı. **Demo modu** ([0022](decisions/0022-demo-modu.md), web önizlemesinde ve iPhone'da): giriş ekranı veya Ben'den, çevrimdışı sentetik sporcu, Hazır / Kontrollü / Toparlan seçici, kayıtlar bellekte. **Repo public** (2026-10-05; [denetim raporu](audits/2026-10-05-public-oncesi.md)): README demo ekran görüntüleriyle (`npm run screenshots`), LICENSE (MIT), secret scanning + push protection açık, bekçi commit mesajlarını da tarıyor (`commit-msg` hook'u). **Kurulum sihirbazı** ([0023](decisions/0023-kurulum-sihirbazi-terminalde.md), [rehber](guides/kurulum.md)): `npm run setup` kendi Supabase projeni kurar (bağlama, `.env.local`, migration, Google ve zamanlayıcı sırları, Vault, Edge Functions), `npm run setup:check` sırları okumadan denetler (bulutta 12/12), `--local` yerel Supabase; uygulama kurulum eksiğini söyler. **EAS hazır** ([0024](decisions/0024-eas-derleme-ve-guncelleme.md)): `@rotavi/hooplab` (mevcut Expo hesabı), tek üretim profili, `expo-updates` (`fingerprint`), paket kimliği `io.github.emireid.hooplab` ve EAS kimliği `app.config.ts` ile ortamdan, EAS "production" ortam değişkenleri, `npm run eas`; ilk derleme Apple üyeliğini bekliyor. **Faz 2 başladı: antrenman yükü** ([0025](decisions/0025-antrenman-yuku.md), web önizlemesinde ve iPhone'da): **Trend** sekmesinde 28 günlük yük grafiği (dokunarak gün seçme), son 7 / önceki 7 gün, alıştığına göre oran (EWMA 7 / 28, yalnız bağlam), 4 hafta ort., monotonluk ve gerilim (eşiksiz), etiketsiz saat oturumu sayısı ve "Etiketle"; oran ≥ 1,5 ise "Tahmin" rozetli not, **Bugün**'de tek satır. Hesap `packages/engine/src/training-load.ts`; demo sporcuda 42 günlük sentetik seans geçmişi. **Açıklama sayfaları ve tür rengi** ([0026](decisions/0026-aciklama-sayfalari-ve-tur-rengi.md), web önizlemesinde ve iPhone'da): Bugün ve Trend'deki her ölçüm ve hesap dokununca alttan açılan sayfada anlatılıyor (değerin türü, güncel değer, Bu ne? / Nasıl okunur? / Neye göre? / sınırlar / kaynaklar; `copy/explainers.ts` kurallara testle bağlı); Trend'deki yük grafiği seans türüne göre yığılmış ve renkli (maç, saha, kuvvet / kondisyon, hafif; risk rengi yok). **Kas ve tendon bölge yükü: kaynaklar ve yöntem** ([0027](decisions/0027-kas-tendon-bolge-yuku.md); 17 yeni kaynak, `rules/bolge.json`'da 5 kural): içerik etiketleri türe göre hazır seçili, katsayısız etiket → bölge eşlemesi, toparlanma penceresi tendon 48 / kas 72 saat, bölge yükü eşiksiz, ağrı izleme modeli. **Motor ve arayüz** (web önizlemesinde ve iPhone'da): `training_sessions.content_tags` (bulutta), seans formunda "İçerik" çipleri (türe göre seçili), **Vücut**'ta "Ağrı / Bölge yükü" anahtarı. Bölge yükü görünümünde son 48-72 saatte çalışan bölgeler nötr tonla işaretli; listede yük, seans, son yüklenme, olağan (28 gün). Ağrı görünümünde "Ağrı izleme" notu var. Üç açıklama sayfası eklendi; hepsi "Tahmin". Hesap `packages/engine/src/region-load.ts`. Hesap motoru `packages/engine`; 52 kaynak ve 20 kural `research/`'te. Dış servis işlerini Claude yürütür ([0016](decisions/0016-dis-servisleri-claude-yurutur.md)). Tasarım: **C · Hale** ([0010](decisions/0010-tasarim-yonu-hale.md)), token'lar [packages/theme](../packages/theme/README.md).
**Son oturum:** [2026-10-07 09:10 Kas ve tendon bölge yükü: motor ve arayüz](sessions/2026-10-07-0910-bolge-yuku.md) (açık)

**Sıradaki işler (sıralı):**
1. **Faz 2: kalan kişisel baseline'lar:** solunum ve sabah check-in için kişisel bant; kaynaklar `research/`'te doğrulanarak; check-in ölçeği doğrulanmış bir araç değil (0017). Solunum açıklaması bant gelince güncellenir. (Faz 1'in TestFlight maddesi Apple'ın yanıtını bekliyor; yanıt gelince öne alınır, [0024](decisions/0024-eas-derleme-ve-guncelleme.md), SETUP §10.)
2. **Takip (2026-10-08 / 10 civarı):** kişisel bant oluştu mu, Bugün'de renk ve hale iPhone'da çıkıyor mu ([0021](decisions/0021-toparlanma-kisisel-bant.md)); yenileme token'ı 7. günde düştü mü, Ben → Google Health "Yeniden bağlan" gösteriyor mu, yeniden bağlanma cihazda çalışıyor mu. Ayrıca `GHEALTH_CONFIG_DIR` = `E:\HoopLab\private\ghealth` ile `C:\gh\ghealth-src\ghealth.exe user paired-devices list`; sonucu LESSONS'taki [kaynaklı] maddeye [ölçüldü] olarak işle. Başlangıçta `npm run setup:check`.
3. **Faz 2: beslenme ve hidrasyon** (PRODUCT modülleri): önce kaynak taraması ve yöntem kararı, sonra motor ve arayüz.

**Açık riskler:**
- Testing modundaki OAuth'ta yenileme token'ı 7 günde düşer; yeniden bağlanma akışı var ama gerçek düşüşle cihazda denenmedi ([0019](decisions/0019-google-health-senkronu.md)).
- Google kişisel projelere erişimi kapatabilir (doküman "yeni proje kabul etmiyoruz" diyor; şu an çalışıyor). Google API'nin gerçek davranışı discovery belgesinden ayrışabilir (`pageSize` reddi, LESSONS); senkron hatası durum satırında kod olarak tutulur, ekranda açıklama olarak görünür.
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor; saatlik senkron muhtemelen önler, gözlenecek. Ücretsiz planda sızan şifre koruması yok (kabul edildi, 0015).
- pgTAP RLS testleri yalnız yerelde (Docker, `npm run test:db`); CI'da yok. Her migration'dan önce yerelde koşulur. Edge Function kodu Deno'da derlenmeden yalnız tsc + Node testleriyle denetleniyor; dağıtım öncesi yerel `functions serve` denemesi önerilir.
- Toparlanma bandının kaynakları dayanıklılık sporcularından ve sabah ölçümünden; basketbola ve gece bileklik ölçümüne aktarım varsayım. Günün durumundaki nabız ve uyku birleşimi doğrulanmış bir skor değil; renk gerçek hissiyatla çelişirse yeniden değerlendirilir ([0021](decisions/0021-toparlanma-kisisel-bant.md)). Ölçüm kartlarına dokunma (ayrıntı) ileride.
- Check-in ölçeği doğrulanmış bir psikometrik araç değil (burger-2024); arayüz ve koç onu tanı aracı gibi sunmaz (0017).
- Dependabot: 4 açık uyarı, hepsi Expo'nun dolaylı bağımlılığı (3'ü yalnız geliştirme, 1'i expo-router'da hizmet engelleme); Expo SDK yükseltmesinde yeniden bakılır. Haftalık denetim sınıflıyor.
- three.js / expo-gl sürüm yükseltmesinde WebGL2 denetimi değişebilir; yükseltmeden sonra Vücut sekmesi iPhone'da açılır ([0018](decisions/0018-vucut-gorunumu.md), LESSONS).
- Kurulum sihirbazı sıfırdan yeni bir bulut projesinde koşmadı (yerelde uçtan uca, bulutta denetim ve sır güncellemesi denendi; [0023](decisions/0023-kurulum-sihirbazi-terminalde.md)). Yeni sır, fonksiyon veya Vault değeri eklenirse `tools/setup/setup-lib.mjs` listesi de güncellenir, yoksa `setup:check` yanlış yeşil verir.
- Expo projesi mevcut kişisel hesapta (CLAUDE.md §7 istisnası, [0024](decisions/0024-eas-derleme-ve-guncelleme.md)): ayda 15 iOS derlemesi öbür projeyle paylaşılır. TestFlight derlemesi 90 günde düşer. Apple kaydı sonuçsuz kalırsa TestFlight yolu yeniden değerlendirilir; yedek yol web uygulaması (PWA, Safari'den ana ekrana ekleme; üyeliksiz, ama titreşim yok ve bildirimler sınırlı). Kullanıcı: süreç uzarsa PWA düşünülür (2026-10-05).
- Antrenman yükü: uygulama kaydedilmemiş bir seansı dinlenme gününden ayıramaz; unutulan kayıt oranı ve monotonluğu çarpıtır (etiketsiz saat oturumları Trend'de sayılıyor). Gerçek hesapta oran ilk seans kaydından 28 gün sonra görünür. EWMA oranı sıkışık: not ancak yaklaşık 2,8 katlık bir haftada düşer. Oran eşiği (1,5) başka takım sporlarından, basketbolda doğrulanmadı; not tahmin etiketli, risk dili yok ([0025](decisions/0025-antrenman-yuku.md)). Tür renkleri risk gibi okunursa yeniden değerlendirilir ([0026](decisions/0026-aciklama-sayfalari-ve-tur-rengi.md)).
- Kas / tendon modeli doku yükü ölçmez; bölge yükü yalnız o bölgeyi çalıştıran seansların yüküdür. Etiketsiz eski seanslar türün hazır etiketleriyle sayılır; "olağan" ilk seans kaydından yaklaşık 30 gün sonra görünür. Mobilite ve rehabilitasyonun hazır etiketi yok (kullanıcı elle işaretler). Pencereler derleme düzeyinde kanıta dayanır; futbol ve voleybol kaynaklarının basketbola aktarımı ve ağrı izleme modelinin sabah ağrısına uyarlanması doğrulanmadı. Ayak bileği ve bel modelde yok ([0027](decisions/0027-kas-tendon-bolge-yuku.md)).
- Açıklama metinleri kurallara ve kaynaklara testle bağlı ama metnin kendisi elle yazıldı: bir kural veya eşik değişince ilgili açıklama da gözden geçirilir; yeni kaynak eklenince `copy/sources.ts`'e de eklenir (test kırılır) ([0026](decisions/0026-aciklama-sayfalari-ve-tur-rengi.md)).

**Kullanıcı işleri:**
- Supabase CLI bu makinede HoopLab hesabıyla girişli; uzak işlemleri Claude yürütür ([SETUP](SETUP.md) §9; kurulum ve denetim `npm run setup` / `npm run setup:check`). Görsel doğrulama yerel Supabase'le (`npm run db:start`, `npm run web:local`, sentetik demo kullanıcısı); senkron yerelde sahte Google ile (SETUP §9).
- Google Health: haftada bir uygulamadan Ben → Google Health → **Yeniden bağlan** (izin 7 günde düşer). Web istemcisinin JSON'u `private/ghealth/web_client_secret.json`.
- Metro'yu (Expo sunucusu) Claude başlatır / yeniden başlatır / kapatır ([SETUP](SETUP.md) §8); Expo Go projeyi son açılanlardan açar.
- Apple Developer desteğindeki vakayı takip etmek; yanıt gelince Claude'a haber vermek. EAS CLI bu makinede mevcut Expo hesabıyla girişli; komutlar `npm run eas -- <komut>` ([SETUP](SETUP.md) §10).
- Expo MCP (plugin'le geldi) Expo hesabıyla yetkilendirilmedi; gerekirse ilk derlemede.
- C maketi telefonda: https://claude.ai/artifact/GWScS6NjHsxUphrHSFLo7J (özel; 2026-10-04'te erişilebilir renklerle güncellendi, `design/maketler/c-hale.html` ile aynı).
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Tamamlandı (2026-10-03, `faz-0-tamam`) |
| 0.5 Tasarım yönü | Tamamlandı (2026-10-03, `faz-0.5-tamam`) |
| 1 Temel uygulama (MVP) | Sürüyor (iskelet, Supabase + giriş, check-in + seans kaydı, kaydırıcı düzeltmesi, vücut görünümü, Google Health senkronu, seans etiketleme 2026-10-04; toparlanma, demo modu, arşiv hook'u doğrulaması ve public öncesi denetim, README görselleri, repo public, kurulum sihirbazı ve EAS hazırlığı 2026-10-05; kalan: Apple üyeliği, ilk derleme ve TestFlight) |
| 2 Hesap motoru | Sürüyor (antrenman yükü: kaynaklar ve yöntem 2026-10-05, motor ve Trend / Bugün arayüzü 2026-10-06, [0025](decisions/0025-antrenman-yuku.md); açıklama sayfaları ve tür rengi 2026-10-07, [0026](decisions/0026-aciklama-sayfalari-ve-tur-rengi.md); kas / tendon kaynakları, yöntem, motor ve arayüz 2026-10-07, [0027](decisions/0027-kas-tendon-bolge-yuku.md); kalan: baseline'lar, beslenme, hidrasyon) |
| 3 AI koç | Başlamadı |
| 4 Son rötuşlar | Başlamadı |

Ayrıntı: [ROADMAP.md](ROADMAP.md).

## Ortam

| Araç | Durum |
|---|---|
| Windows 11, PowerShell + Git Bash | var |
| Node.js | 24.14 (npm workspaces; `npm install` şart, [SETUP.md](SETUP.md)) |
| TypeScript | 6.0.3 (Expo SDK 57 şablonuyla aynı) |
| git | 2.52 (`core.hooksPath=.githooks` bu klonda ayarlı; yeni klonda `npm run hooks:install`) |
| GitHub CLI | var, `emir-eid` hesabı |
| Go | 1.27.0 (winget); `ghealth` kaynağı ve derlemesi `C:\gh\ghealth-src`, ayarları `../private/ghealth` |
| Expo SDK | 57 (`apps/mobile`; `npx expo install` ile paket ekle) |
| Supabase CLI | 2.119.0 (kök devDependency, `npx supabase`); bulut projesine bağlı (`supabase/.temp`, gitignore'lu). Edge Functions: Deno yok; tip denetimi `supabase/functions/tsconfig.json`, yerel çalıştırma `supabase functions serve` (Docker) |
| Docker Desktop | 29.2 (yerel Supabase ve pgTAP: `npm run db:start`, `npm run test:db`; yerel önizleme `npm run web:local`) |
| Claude Code plugin'leri | `expo` 1.13.9, `supabase`, `postgres-best-practices` (proje kapsamı; kurulum [SETUP.md](SETUP.md) §5) |
| Expo Go (iPhone) | kurulu; `npm.cmd run mobile` + QR (PowerShell'de `npm` betiği engelli, `npm.cmd` kullanılır) |
| Mac | yok (iOS derlemeleri EAS bulutunda) |

## Otomasyonlar

| Ne | Ne zaman | Çıktı |
|---|---|---|
| GitHub Actions `Kontroller` | her push + pazartesi 09:00 | GitHub Actions sekmesi (hata olursa e-posta) |
| Haftalık denetim (zamanlanmış Claude görevi `hooplab-haftalik-denetim`) | pazartesi 10:05 | `docs/audits/<tarih>.md` |
| Aylık literatür taraması (zamanlanmış Claude görevi `hooplab-aylik-literatur`) | her ayın 1'i 10:00 | `research/inbox/<tarih>.md` |
| SessionStart hook | her oturum açılışı | bu dosyanın özet bloğu bağlama eklenir |
| Google Health senkronu (pg_cron `google-health-senkron` → `ghealth-sync`) | her saatin 17. dakikası (bulutta) | `health_daily`, `sleep_sessions`, `exercise_sessions`; durum `health_sync_status` |
| PreCompact / SessionEnd hook (ikisi de doğrulandı) | compact öncesi, oturum sonu | `../private/transcripts/` (oturum başına tek dosya, her çağrıda en yeni hal) |
| `private` yedeği (SessionEnd hook + `/kapat`) | oturum sonu | Drive: `HoopLab-yedek\private` (eklemeli kopya; hedef `../private/backup-target.txt`) |

Zamanlanmış görevler masaüstü uygulaması açıkken çalışır; kapalıysa bir sonraki açılışta. Görev talimatları: `C:\Users\user\.claude\scheduled-tasks\<görev>\SKILL.md` (repo dışı).
