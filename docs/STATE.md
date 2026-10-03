# HoopLab — canlı durum

Tek doğruluk kaynağı. `/rep` her iş sonunda, `/kapat` her oturum sonunda günceller; `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 1 sürüyor: uygulama iskeleti hazır (`apps/mobile`, Expo SDK 57, iPhone'da Expo Go ile doğrulandı; [0014](decisions/0014-uygulama-iskeleti.md)). Tasarım: **C · Hale** ([0010](decisions/0010-tasarim-yonu-hale.md)); token'lar [packages/theme](../packages/theme/README.md) ([0013](decisions/0013-tasarim-tokenlari.md)).
**Son oturum:** [2026-10-04 00:23 Faz 1: uygulama iskeleti](sessions/2026-10-04-0023-faz1-uygulama-iskeleti.md)

**Sıradaki işler (sıralı):**
1. **Faz 1:** Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi; oturum için SecureStore parçalama adaptörü (testli, LESSONS "Expo / React Native") ([ROADMAP](ROADMAP.md) Faz 1). Önce `supabase` + `postgres-best-practices` skill'leri, PRODUCT §4 (girdiler) ve LESSONS "Supabase". Önerilen: Opus + yüksek (şema ve RLS sonradan değiştirmesi pahalı).
2. **Faz 1:** Sabah check-in ve seans kaydı formları (sekme çubuğuna artı düğmesi bunlarla gelir).
3. **Takip (2026-10-10 civarı):** yenileme token'ı 7. günde düştü mü? `GHEALTH_CONFIG_DIR` = `E:\HoopLab\private\ghealth` ile `C:\gh\ghealth-src\ghealth.exe user paired-devices list`; sonucu LESSONS'taki [kaynaklı] maddeye [ölçüldü] olarak işle.

**Açık riskler:**
- Testing modundaki OAuth'ta yenileme token'ı 7 günde düşer; uygulamada haftalık yeniden bağlanma akışı şart ([0009](decisions/0009-herkes-kendi-hesabiyla.md)).
- Google kişisel projelere erişimi kapatabilir (doküman "yeni proje kabul etmiyoruz" diyor; şu an çalışıyor).
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor (Faz 1'de gözlenecek).
- Arşiv hook'u: SessionEnd döküm yazıyor (2026-10-03'te görüldü); PreCompact henüz doğrulanmadı.
- Hale `react-native-svg` gradyanlarıyla cihazda kademelenme (banding) gösterebilir; görülürse yalnız `<Aura>` Skia'ya taşınır ([0011](decisions/0011-hale-efekti-svg.md)).
- Cihazda henüz bakılmayan token noktaları: büyük display yazısında satır kırpması (ekranlarda henüz yok) ([packages/theme/README.md](../packages/theme/README.md)).
- Expo Go bu bilgisayarda başka bir projenin Expo hesabıyla açılıyor; HoopLab'in Expo hesabı EAS işinde kararlaştırılacak ([COSTS](COSTS.md)).

**Kullanıcı işleri:**
- Uygulamayı açmak: `E:\HoopLab\code` içinde `npm.cmd run mobile`, QR'ı iPhone kamerasıyla okut ([SETUP](SETUP.md) §8).
- Expo MCP (plugin'le geldi) Expo hesabıyla yetkilendirilmedi; EAS işinde.
- İstersen zamanlanmış görevleri kenar çubuğundaki "Scheduled" bölümünden bir kez "Run now" ile çalıştır.
- C maketi telefonda: https://claude.ai/artifact/GWScS6NjHsxUphrHSFLo7J (özel). Erişilebilirlik renkleri öncesinden kalma; istersen aynı adrese güncel hali yayınlanır.
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Tamamlandı (2026-10-03, `faz-0-tamam`) |
| 0.5 Tasarım yönü | Tamamlandı (2026-10-03, `faz-0.5-tamam`) |
| 1 Temel uygulama (MVP) | Sürüyor (iskelet 2026-10-04) |
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
