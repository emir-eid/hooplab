# Faz 4 özeti: Son rötuşlar

- **Başlangıç / bitiş:** 2026-10-13 / 2026-10-17
- **Etiket:** `faz-4-tamam`
- **Not:** Faz 1 açık. TestFlight maddesi Apple üyeliğini bekliyor ([0024](../decisions/0024-eas-derleme-ve-guncelleme.md)). Faz 4 bundan bağımsız kapandı; uygulama iPhone'da Expo Go ile (tünel), gerçek hesapla çalışıyor.

## Hedef
Günlük kullanımda eksik kalanları tamamlamak: gece işaretleri, okunabilirlik, yakılan enerji, bildirimler, haftalık rapor, maç ve seyahat. Performansı ölçüp düzeltmek, ana akışları otomatik test etmek ve projeyi dışarıya gösterilebilir hale getirmek.

## Sonuç
ROADMAP'teki bütün maddeler tamam. Kanıt tabanında 118 kaynak ve 50 kural var. Faz 3'te 84 kaynak ve 36 kural vardı.

| Madde | Karar | Not |
|---|---|---|
| Gece işaretleri | [0039](../decisions/0039-gece-isaretleri.md) | Nabız, SpO2 ve cilt sıcaklığında tanı koymayan, tahmin etiketli not. Günün durumuna girmez |
| Haftalık rapor | [0040](../decisions/0040-haftalik-rapor.md) | Takvim haftası. Yeni eşik yok, her gün mevcut kurallarla okunur |
| Günün durumunda nabız | [0041](../decisions/0041-gunun-durumunda-nabiz.md) | Google'ın yumuşatılmış dinlenik nabzı yerine aynı gecenin NREM uyku nabzı. Nabız yalnız HRV ile birlikte "Toparlan"a çeker |
| Okunabilirlik | [0042](../decisions/0042-okunabilirlik-kartlar-ve-kisaca.md) | Değer ve ortalama ayrı sayılarla gösterilir. Her açıklamada "Kısaca" bölümü var |
| Yakılan enerji | [0043](../decisions/0043-yakilan-enerji.md), [0044](../decisions/0044-saatlik-yakilan-enerji.md) | Günlük, seans başına, haftalık ve saatlik. Tahmin etiketli, eşik yok, koça gitmez |
| Yerel bildirimler | [0045](../decisions/0045-yerel-bildirimler.md) | Check-in ve Google izni hatırlatması. Push TestFlight'tan sonra |
| Maç ve seyahat | [0046](../decisions/0046-mac-takvimi-ve-mac-cevresi.md), [0047](../decisions/0047-seyahat-ve-jet-lag.md) | Maç çevresi gün tipi ve notları, jet lag uyum tahmini |
| Performans | [0048](../decisions/0048-performans-turu.md) | 3D sahne geç yükleniyor, oturum depolaması önbellekte, odakta koşullu yenileme |
| Uçtan uca test | [0049](../decisions/0049-uctan-uca-test-web-webkit.md) | Web çıktısı, Playwright ve WebKit, demo modu. CI'da çalışır |
| Portfolyo sayfası | [0050](../decisions/0050-portfolyo-sayfasi.md) | https://emir-eid.github.io/hooplab/: İngilizce ve Türkçe tanıtım, canlı web demosu. Yayından önce gizlilik denetimi yapıldı |

## Kararlar
[0039](../decisions/0039-gece-isaretleri.md)–[0050](../decisions/0050-portfolyo-sayfasi.md).

## Dersler
LESSONS.md'de bu fazdan:
- Google'ın dinlenik nabzının yumuşatılmış davranışı,
- saatlik rollUp sınırları,
- tünel ve global ngrok,
- Playwright WebKit kurulumu ve seçicileri,
- Expo web çıktısının yapılandırmayı pakete gömmesi ve Metro önbelleği,
- Git Bash'in yol çevirmesi,
- Pages artifact'ında gizli dosyalar,
- tarayıcı panelinin 404 sayfasını göstermemesi.

## Sonraki faza devredilenler
- **TestFlight ve push (Faz 1):** TestFlight Apple onayını bekliyor. Push bildirimleri ondan sonra gelecek.
- **Kalite izleme:** koç kalitesi ve maliyeti `npm run coach:usage` ile ayda bir izleniyor (Faz 3'ten).
- **Henüz gerçek kullanımda görülmeyenler:** gece işaretleri, maç ve seyahat kartları ile koç cümleleri gerçek kullanımda değerlendirilecek.
- **Haftalık rapor:** koç yorumu ve PDF paylaşımı ertelendi (0040).
- **Dependabot:** 4 açık uyarı var, hepsi Expo'nun dolaylı bağımlılığı. Expo SDK yükseltmesinde yeniden bakılacak.
- **Git geçmişi:** eski belge metinleri geçmişte duruyor. Sır ya da sayısal sağlık değeri içermiyorlar. Kullanıcı kararıyla geçmiş yeniden yazılmadı ([oturum raporu](../sessions/2026-10-17-1649-portfolyo-sayfasi.md)).
