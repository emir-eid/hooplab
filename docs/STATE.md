# HoopLab — canlı durum

Tek doğruluk kaynağı. `/rep` her iş sonunda, `/kapat` her oturum sonunda günceller; `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 1 başlamadı; Faz 0.5 tamamlandı (2026-10-03, `faz-0.5-tamam`). Tasarım: **C · Hale**, açık ve koyu tema ([0010](decisions/0010-tasarim-yonu-hale.md)); token'lar [packages/theme](../packages/theme/README.md) ([0013](decisions/0013-tasarim-tokenlari.md)); hale `react-native-svg` ile ([0011](decisions/0011-hale-efekti-svg.md)).
**Son oturum:** [2026-10-03 22:52 Faz 0.5: plugin kurulumu, /rep ve tasarım token'ları](sessions/2026-10-03-2252-faz05-plugin-ve-rep.md) (açık; `/rep` ile sürüyor)

**Sıradaki işler (sıralı):**
1. **Faz 1 başı:** `apps/mobile` iskeleti: Expo SDK 57, TypeScript strict, Expo Router; npm workspace'e ekle, `@hooplab/theme`'i bağla (Metro'nun workspace paketini ve `.ts` importlarını çözdüğünü doğrula), fontları alt yol importuyla yükle, tema context'i (Sistem / Açık / Koyu). Önce PRODUCT.md ve LESSONS "Expo / React Native". Önerilen: Opus + yüksek (ilk iskelet, sürüm ve yapı kararları).
2. **Faz 1:** Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi ([ROADMAP](ROADMAP.md) Faz 1).
3. **Takip (2026-10-10 civarı):** yenileme token'ı 7. günde düştü mü? `GHEALTH_CONFIG_DIR` = `E:\HoopLab\private\ghealth` ile `C:\gh\ghealth-src\ghealth.exe user paired-devices list`; sonucu LESSONS'taki [kaynaklı] maddeye [ölçüldü] olarak işle.

**Açık riskler:**
- Testing modundaki OAuth'ta yenileme token'ı 7 günde düşer; uygulamada haftalık yeniden bağlanma akışı şart ([0009](decisions/0009-herkes-kendi-hesabiyla.md)).
- Google kişisel projelere erişimi kapatabilir (doküman "yeni proje kabul etmiyoruz" diyor; şu an çalışıyor).
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor (Faz 1'de gözlenecek).
- Arşiv hook'u: SessionEnd döküm yazıyor (2026-10-03'te görüldü); PreCompact henüz doğrulanmadı.
- Hale `react-native-svg` gradyanlarıyla cihazda kademelenme (banding) gösterebilir; görülürse yalnız `<Aura>` Skia'ya taşınır ([0011](decisions/0011-hale-efekti-svg.md)).
- Token'ların cihazda bakılacak noktaları (satır yüksekliği kırpması, koyu kart halkası, cam): [packages/theme/README.md](../packages/theme/README.md).

**Kullanıcı işleri:**
- Expo Go'yu iPhone'a kur (Faz 1 iskeleti cihazda bununla açılacak).
- Expo MCP (plugin'le geldi) Expo hesabıyla yetkilendirilmedi; Faz 1'de EAS gerekince.
- İstersen zamanlanmış görevleri kenar çubuğundaki "Scheduled" bölümünden bir kez "Run now" ile çalıştır.
- C maketi telefonda: https://claude.ai/artifact/GWScS6NjHsxUphrHSFLo7J (özel). Erişilebilirlik renkleri öncesinden kalma; istersen aynı adrese güncel hali yayınlanır.
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Tamamlandı (2026-10-03, `faz-0-tamam`) |
| 0.5 Tasarım yönü | Tamamlandı (2026-10-03, `faz-0.5-tamam`) |
| 1 Temel uygulama (MVP) | Başlamadı |
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
| Claude Code plugin'leri | `expo` 1.13.9, `supabase`, `postgres-best-practices` (proje kapsamı; kurulum [SETUP.md](SETUP.md) §5) |
| Expo Go (iPhone) | kullanıcı Faz 1 öncesi kurar |
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
