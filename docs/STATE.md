# HoopLab — canlı durum

Tek doğruluk kaynağı. `/kapat` her oturum sonunda günceller, `/ac` her oturum başında okur. 150 satırı geçince eski bölümler `docs/archive/` klasörüne taşınır.

<!-- ozet:basla -->
**Faz:** 0, veri erişimi testi. Altyapı kuruldu, veri testi henüz başlamadı.
**Son oturum:** [2026-10-03 00:34 kurulum](sessions/2026-10-03-0034-kurulum.md)

**Sıradaki işler (sıralı):**
1. **Faz 0 veri testi:** Google Cloud projesi (kullanıcı, adım adım talimatla), Go kurulumu, `ghealth` CLI ile son 30 günün verisini `../private/data/` klasörüne çekmek. Dört soruya cevap: erişim açılıyor mu, Türkiye hesabında veri dönüyor mu, Fitbit Air hangi alanları üretiyor, token ne sıklıkla yenilenmeli.
2. Faz 0 sonucuna göre [0001 veri kaynağı](decisions/0001-veri-kaynagi-google-health-api.md) kararını kesinleştirmek (veya B planına geçmek).
3. **Faz 0.5:** 2-3 görsel yön maketi (HTML, telefon boyutu), seçim ve tasarım token'ları.

**Açık riskler:**
- Google Health API dokümanı "yeni projeleri şu an kabul etmiyoruz" diyor. Bireysel test modu çalışmayabilir (B planı: Takeout veya iOS Kısayollar + Apple Health, HRV hariç).
- Google OAuth test modunda yenileme token'ı 7 günde düşebilir (Faz 0'da ölçülecek).
- Supabase ücretsiz planı 7 gün istek gelmezse projeyi duraklatıyor (Faz 1'de gözlenecek).

**Kullanıcı işleri:**
- `../private/guard-denylist.txt` dosyasına kişisel tanımlayıcıları ekle (e-posta, telefon, doğum tarihi). Bekçi bunları repoda görürse commit'i durdurur.
- Bir sonraki oturumda: plugin onay penceresi çıkarsa onayla (Expo, Supabase).
<!-- ozet:bitti -->

## Faz durumu

| Faz | Durum |
|---|---|
| 0 Veri erişimi testi + altyapı | Altyapı tamam, veri testi bekliyor |
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
| Go | **yok**, Faz 0 için gerekli (`ghealth` derlemek için) |
| Expo Go (iPhone) | kullanıcı Faz 1 öncesi kurar |
| Mac | yok (iOS derlemeleri EAS bulutunda) |

## Otomasyonlar

| Ne | Ne zaman | Çıktı |
|---|---|---|
| GitHub Actions `Kontroller` | her push + pazartesi 09:00 | GitHub Actions sekmesi (hata olursa e-posta) |
| Haftalık denetim (zamanlanmış Claude görevi) | pazartesi 10:00 | `docs/audits/<tarih>.md` |
| Aylık literatür taraması (zamanlanmış Claude görevi) | her ayın 1'i 10:00 | `research/inbox/<tarih>.md` |
| SessionStart hook | her oturum açılışı | bu dosyanın özet bloğu bağlama eklenir |
| PreCompact / SessionEnd hook | compact öncesi, oturum sonu | `../private/transcripts/` |
