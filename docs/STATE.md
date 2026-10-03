# HoopLab — canlı durum

Tek doğruluk kaynağı. `/kapat` her oturum sonunda günceller, `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 0.5, tasarım yönü. Faz 0 tamamlandı ([özet](phases/faz-0.md)): Google Health API erişimi kişisel projeyle çalışıyor, B planına gerek yok.
**Son oturum:** [2026-10-03 21:56 Faz 0 veri testi](sessions/2026-10-03-2156-faz0-veri-testi.md)

**Sıradaki işler (sıralı):**
1. **Faz 0.5:** 2-3 görsel yön maketi (HTML, telefon boyutu 390×844, sentetik veri), kullanıcı seçimi. Önerilen: Opus + yüksek efor.
2. Seçilen yönden tasarım token'ları (renk, tipografi, boşluk, köşe, hareket).
3. **Takip (2026-10-10 civarı):** yenileme token'ı 7. günde düştü mü? `GHEALTH_CONFIG_DIR` = `E:\HoopLab\private\ghealth` ile `C:\gh\ghealth-src\ghealth.exe user paired-devices list`; sonucu LESSONS'taki [kaynaklı] maddeye [ölçüldü] olarak işle.

**Açık riskler:**
- Testing modundaki OAuth'ta yenileme token'ı 7 günde düşer; uygulamada haftalık yeniden bağlanma akışı şart ([0009](decisions/0009-herkes-kendi-hesabiyla.md)).
- Google kişisel projelere erişimi kapatabilir (doküman "yeni proje kabul etmiyoruz" diyor; şu an çalışıyor).
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor (Faz 1'de gözlenecek).
- SessionEnd / PreCompact arşiv hook'u henüz döküm yazmadı (`private/transcripts` boş); doğrulanacak.

**Kullanıcı işleri:**
- Faz 1 öncesi: Expo ve Supabase plugin'leri yüklü değil; onay penceresi çıkarsa onayla.
- İstersen zamanlanmış görevleri kenar çubuğundaki "Scheduled" bölümünden bir kez "Run now" ile çalıştır.
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Tamamlandı (2026-10-03, `faz-0-tamam`) |
| 0.5 Tasarım yönü | Başlamadı |
| 1 Temel uygulama (MVP) | Başlamadı |
| 2 Hesap motoru | Başlamadı |
| 3 AI koç | Başlamadı |
| 4 Son rötuşlar | Başlamadı |

Ayrıntı: [ROADMAP.md](ROADMAP.md).

## Ortam

| Araç | Durum |
|---|---|
| Windows 11, PowerShell + Git Bash | var |
| Node.js | 24.14 |
| git | 2.52 (`core.hooksPath=.githooks` bu klonda ayarlı; yeni klonda `npm run hooks:install`) |
| GitHub CLI | var, `emir-eid` hesabı |
| Go | 1.27.0 (winget); `ghealth` kaynağı ve derlemesi `C:\gh\ghealth-src`, ayarları `../private/ghealth` |
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
