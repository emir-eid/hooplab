# HoopLab — canlı durum

Tek doğruluk kaynağı. `/rep` her iş sonunda, `/kapat` her oturum sonunda günceller; `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 1 sürüyor: iskelet ([0014](decisions/0014-uygulama-iskeleti.md)), Supabase + giriş ([0015](decisions/0015-veritabani-tek-sahip-rls.md)) iPhone'da doğrulandı. Sabah check-in (5 madde 1-5) + ağrı haritası (sol / sağ, 0-10) ve seans kaydı hazır, buluttaki şemada; iPhone'da doğrulandı; kaydırıcı Gesture Handler'la akıcı ([0017](decisions/0017-sabah-check-in-olcegi.md)). **Vücut** sekmesi: döndürülebilir 3D manken üzerinde ağrı haritası, 1 gün / 3 gün / 1 hafta, iPhone'da doğrulandı ([0018](decisions/0018-vucut-gorunumu.md)); bölge yükü raporu Faz 2'de. Hesap motoru `packages/engine` açıldı; ilk 10 kaynak ve 4 kural `research/`'te. Dış servis işlerini Claude yürütür ([0016](decisions/0016-dis-servisleri-claude-yurutur.md)). Tasarım: **C · Hale** ([0010](decisions/0010-tasarim-yonu-hale.md)), token'lar [packages/theme](../packages/theme/README.md).
**Son oturum:** [2026-10-04 13:11 Faz 1: kaydırıcı düzeltmesi ve vücut görünümü](sessions/2026-10-04-1311-faz1-kaydirici.md)

**Sıradaki işler (sıralı):**
1. **Faz 1: Google Health senkronu.** Edge Function + zamanlayıcı; gün içi nabız sunucuda özetlenir, ham saklanmaz; adım / mesafe kaynağa göre tekilleştirilir; `swim-lengths-data` yok sayılır (ROADMAP Faz 1). Önce DATA-INVENTORY / COSTS ve LESSONS "Google Health / veri". Yeni tablo ve sır (OAuth) gelir; Supabase secrets ve RLS testleri. Önerilen: Opus + yüksek.
2. **Takip (2026-10-10 civarı):** yenileme token'ı 7. günde düştü mü? `GHEALTH_CONFIG_DIR` = `E:\HoopLab\private\ghealth` ile `C:\gh\ghealth-src\ghealth.exe user paired-devices list`; sonucu LESSONS'taki [kaynaklı] maddeye [ölçüldü] olarak işle.

**Açık riskler:**
- Testing modundaki OAuth'ta yenileme token'ı 7 günde düşer; uygulamada haftalık yeniden bağlanma akışı şart ([0009](decisions/0009-herkes-kendi-hesabiyla.md)).
- Google kişisel projelere erişimi kapatabilir (doküman "yeni proje kabul etmiyoruz" diyor; şu an çalışıyor).
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor (Faz 1'de gözlenecek). Ücretsiz planda sızan şifre koruması yok (kabul edildi, 0015).
- pgTAP RLS testleri yalnız yerelde (Docker, `npm run test:db`); CI'da yok. Her migration'dan önce yerelde koşulur.
- Check-in ölçeği doğrulanmış bir psikometrik araç değil (burger-2024); arayüz ve koç onu tanı aracı gibi sunmaz (0017).
- Arşiv hook'u: SessionEnd döküm yazıyor (2026-10-03'te görüldü); PreCompact henüz doğrulanmadı.
- Hale `react-native-svg` gradyanlarıyla cihazda kademelenme (banding) gösterebilir; görülürse yalnız `<Aura>` Skia'ya taşınır ([0011](decisions/0011-hale-efekti-svg.md)).
- Cihazda henüz bakılmayan token noktaları: büyük display yazısında satır kırpması (artık seans formunda ve check-in özetinde var) ([packages/theme/README.md](../packages/theme/README.md)).
- three.js / expo-gl sürüm yükseltmesinde WebGL2 denetimi değişebilir; yükseltmeden sonra Vücut sekmesi iPhone'da açılır ([0018](decisions/0018-vucut-gorunumu.md), LESSONS).
- Expo Go bu bilgisayarda başka bir projenin Expo hesabıyla açılıyor; HoopLab'in Expo hesabı EAS işinde kararlaştırılacak ([COSTS](COSTS.md)).

**Kullanıcı işleri:**
- Supabase CLI bu makinede HoopLab hesabıyla girişli; uzak işlemleri Claude yürütür ([SETUP](SETUP.md) §9). Görsel doğrulama yerel Supabase'le (`npm run db:start`, `npm run web:local`, sentetik demo kullanıcısı).
- Metro'yu (Expo sunucusu) Claude başlatır / yeniden başlatır / kapatır ([SETUP](SETUP.md) §8); Expo Go projeyi son açılanlardan açar.
- Expo MCP (plugin'le geldi) Expo hesabıyla yetkilendirilmedi; EAS işinde.
- İstersen zamanlanmış görevleri kenar çubuğundaki "Scheduled" bölümünden bir kez "Run now" ile çalıştır.
- C maketi telefonda: https://claude.ai/artifact/GWScS6NjHsxUphrHSFLo7J (özel). Erişilebilirlik renkleri öncesinden kalma; istersen aynı adrese güncel hali yayınlanır.
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Tamamlandı (2026-10-03, `faz-0-tamam`) |
| 0.5 Tasarım yönü | Tamamlandı (2026-10-03, `faz-0.5-tamam`) |
| 1 Temel uygulama (MVP) | Sürüyor (iskelet, Supabase + giriş, check-in + seans kaydı, kaydırıcı düzeltmesi, vücut görünümü 2026-10-04) |
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
| Supabase CLI | 2.119.0 (kök devDependency, `npx supabase`); bulut projesine bağlı (`supabase/.temp`, gitignore'lu) |
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
| PreCompact / SessionEnd hook | compact öncesi, oturum sonu | `../private/transcripts/` |
| `private` yedeği (SessionEnd hook + `/kapat`) | oturum sonu | Drive: `HoopLab-yedek\private` (eklemeli kopya; hedef `../private/backup-target.txt`) |

Zamanlanmış görevler masaüstü uygulaması açıkken çalışır; kapalıysa bir sonraki açılışta. Görev talimatları: `C:\Users\user\.claude\scheduled-tasks\<görev>\SKILL.md` (repo dışı).
