# HoopLab — canlı durum

Tek doğruluk kaynağı. `/rep` her iş sonunda, `/kapat` her oturum sonunda günceller; `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 1 sürüyor: iskelet ([0014](decisions/0014-uygulama-iskeleti.md)), Supabase + giriş ([0015](decisions/0015-veritabani-tek-sahip-rls.md)), sabah check-in + ağrı haritası ve seans kaydı ([0017](decisions/0017-sabah-check-in-olcegi.md)), **Vücut** sekmesi ([0018](decisions/0018-vucut-gorunumu.md)) iPhone'da doğrulandı. **Google Health senkronu** bulutta ve iPhone'da çalışıyor ([0019](decisions/0019-google-health-senkronu.md)): Ben → Google Health ile bağlan / yeniden bağlan; saatlik zamanlayıcı; günlük HRV, dinlenik nabız, SpO2, solunum, cilt sıcaklığı, nabız özeti (ham nabız yok), adım / mesafe / kalori / aktif dakika (bileklik kaynağı), uyku ve egzersiz oturumları. **Seans etiketleme** ([0020](decisions/0020-seans-etiketleme.md)) bulutta ve iPhone'da: Bugün → Saatten gelenler (bugün ve dün), saat oturumu seans kaydına bağlanır, tür ve RPE kullanıcıdan, "Seans değil"; yeni tür Mobilite / yoga. **Toparlanma** ([0021](decisions/0021-toparlanma-kisisel-bant.md)) web önizlemesinde ve iPhone'da: Bugün'de günün durumu (Hazır / Kontrollü / Toparlan / Bant oluşuyor) ve hale; derin uyku HRV'si, dinlenik nabız ve uyku kişisel banda göre (7 gün / önceki 4 hafta ± 0,5 SD); HRV grafiğinde dokunarak gün seçme; Nasıl hesaplanıyor? ekranı. **Demo modu** ([0022](decisions/0022-demo-modu.md), web önizlemesinde): giriş ekranı veya Ben'den, çevrimdışı sentetik sporcu, Hazır / Kontrollü / Toparlan seçici, kayıtlar bellekte. Hesap motoru `packages/engine`; 18 kaynak ve 9 kural `research/`'te. Dış servis işlerini Claude yürütür ([0016](decisions/0016-dis-servisleri-claude-yurutur.md)). Tasarım: **C · Hale** ([0010](decisions/0010-tasarim-yonu-hale.md)), token'lar [packages/theme](../packages/theme/README.md).
**Son oturum:** [2026-10-05 00:27 Faz 1: Toparlanma ekranı ve demo modu](sessions/2026-10-05-0027-faz1-toparlanma.md) (açık; /rep)

**Sıradaki işler (sıralı):**
1. **Demo modunu iPhone'da dene** (kısa): Ben → Demo sporcuyu göster, üç senaryo, Vücut → 1 hafta, Demodan çık ([0022](decisions/0022-demo-modu.md)). Ardından **Faz 1: SessionEnd / PreCompact arşiv hook'unun doğrulanması** (ROADMAP'te açık).
2. **Takip (2026-10-08 / 10 civarı):** kişisel bant oluştu mu, Bugün'de renk ve hale iPhone'da çıkıyor mu ([0021](decisions/0021-toparlanma-kisisel-bant.md)); yenileme token'ı 7. günde düştü mü, Ben → Google Health "Yeniden bağlan" gösteriyor mu, yeniden bağlanma cihazda çalışıyor mu. Ayrıca `GHEALTH_CONFIG_DIR` = `E:\HoopLab\private\ghealth` ile `C:\gh\ghealth-src\ghealth.exe user paired-devices list`; sonucu LESSONS'taki [kaynaklı] maddeye [ölçüldü] olarak işle.
3. **Faz 1: Apple Developer Programı, EAS Build, TestFlight** (ROADMAP Faz 1; ücretli üyelik ve mağaza gönderimi kullanıcı onayıyla, CLAUDE.md §7). Expo hesabı kararı da bu işte ([COSTS](COSTS.md)).

**Açık riskler:**
- Testing modundaki OAuth'ta yenileme token'ı 7 günde düşer; yeniden bağlanma akışı var ama gerçek düşüşle cihazda denenmedi ([0019](decisions/0019-google-health-senkronu.md)).
- Google kişisel projelere erişimi kapatabilir (doküman "yeni proje kabul etmiyoruz" diyor; şu an çalışıyor). Google API'nin gerçek davranışı discovery belgesinden ayrışabilir (`pageSize` reddi, LESSONS); senkron hatası durum satırında kod olarak tutulur, ekranda açıklama olarak görünür.
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor; saatlik senkron muhtemelen önler, gözlenecek. Ücretsiz planda sızan şifre koruması yok (kabul edildi, 0015).
- pgTAP RLS testleri yalnız yerelde (Docker, `npm run test:db`); CI'da yok. Her migration'dan önce yerelde koşulur. Edge Function kodu Deno'da derlenmeden yalnız tsc + Node testleriyle denetleniyor; dağıtım öncesi yerel `functions serve` denemesi önerilir.
- Toparlanma bandının kaynakları dayanıklılık sporcularından ve sabah ölçümünden; basketbola ve gece bileklik ölçümüne aktarım varsayım. Günün durumundaki nabız ve uyku birleşimi doğrulanmış bir skor değil; renk gerçek hissiyatla çelişirse yeniden değerlendirilir ([0021](decisions/0021-toparlanma-kisisel-bant.md)). Ölçüm kartlarına dokunma (ayrıntı) ileride.
- Check-in ölçeği doğrulanmış bir psikometrik araç değil (burger-2024); arayüz ve koç onu tanı aracı gibi sunmaz (0017).
- Arşiv hook'u: SessionEnd döküm yazıyor (2026-10-03'te görüldü); PreCompact henüz doğrulanmadı.
- Hale `react-native-svg` gradyanlarıyla cihazda kademelenme (banding) gösterebilir; görülürse yalnız `<Aura>` Skia'ya taşınır ([0011](decisions/0011-hale-efekti-svg.md)).
- three.js / expo-gl sürüm yükseltmesinde WebGL2 denetimi değişebilir; yükseltmeden sonra Vücut sekmesi iPhone'da açılır ([0018](decisions/0018-vucut-gorunumu.md), LESSONS).
- Expo Go bu bilgisayarda başka bir projenin Expo hesabıyla açılıyor; HoopLab'in Expo hesabı EAS işinde kararlaştırılacak ([COSTS](COSTS.md)).

**Kullanıcı işleri:**
- Supabase CLI bu makinede HoopLab hesabıyla girişli; uzak işlemleri Claude yürütür ([SETUP](SETUP.md) §9). Görsel doğrulama yerel Supabase'le (`npm run db:start`, `npm run web:local`, sentetik demo kullanıcısı); senkron yerelde sahte Google ile (SETUP §9).
- Google Health: haftada bir uygulamadan Ben → Google Health → **Yeniden bağlan** (izin 7 günde düşer). Web istemcisinin JSON'u `private/ghealth/web_client_secret.json`.
- Metro'yu (Expo sunucusu) Claude başlatır / yeniden başlatır / kapatır ([SETUP](SETUP.md) §8); Expo Go projeyi son açılanlardan açar.
- Expo MCP (plugin'le geldi) Expo hesabıyla yetkilendirilmedi; EAS işinde.
- C maketi telefonda: https://claude.ai/artifact/GWScS6NjHsxUphrHSFLo7J (özel; 2026-10-04'te erişilebilir renklerle güncellendi, `design/maketler/c-hale.html` ile aynı).
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Tamamlandı (2026-10-03, `faz-0-tamam`) |
| 0.5 Tasarım yönü | Tamamlandı (2026-10-03, `faz-0.5-tamam`) |
| 1 Temel uygulama (MVP) | Sürüyor (iskelet, Supabase + giriş, check-in + seans kaydı, kaydırıcı düzeltmesi, vücut görünümü, Google Health senkronu, seans etiketleme 2026-10-04; toparlanma ve demo modu 2026-10-05) |
| 2 Hesap motoru | Başlamadı |
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
| PreCompact / SessionEnd hook | compact öncesi, oturum sonu | `../private/transcripts/` |
| `private` yedeği (SessionEnd hook + `/kapat`) | oturum sonu | Drive: `HoopLab-yedek\private` (eklemeli kopya; hedef `../private/backup-target.txt`) |

Zamanlanmış görevler masaüstü uygulaması açıkken çalışır; kapalıysa bir sonraki açılışta. Görev talimatları: `C:\Users\user\.claude\scheduled-tasks\<görev>\SKILL.md` (repo dışı).
