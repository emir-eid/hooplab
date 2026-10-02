# 0006. Çalışma sistemi: /ac-/kapat, STATE, hook'lar, CI, zamanlanmış görevler

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0005

## Bağlam
Tek bir oturumda sürekli compact olarak ilerlemek bağlam kaybına yol açıyor: kararların nedeni, hatalar ve açık işler kayboluyor. İstenen şey: düzenli rapor, ayrı depolanan araştırma ve geliştirme arşivi, kolay geri dönüş, hataların fark edilmesi.

## Seçenekler
1. **Çok oturumlu, rollere bölünmüş model** (her rolün kendi komutu, rapor kuyruğu, tek yazarlı belge oturumu): paralel çalışmaya uygun, ama tek kişilik bir projede ağır.
2. **Yalın model:** iki komut, tek durum dosyası, otomatik kontroller.
3. **Çok komutlu model:** `/karar`, `/kaynak`, `/denetim`, `/rapor` gibi ayrı komutlar. Kullanıcı bunların çoğunun ayrı komut olmasının gereksiz olduğunu, kontrollerin zamanlanmış çalışmasını tercih ettiğini belirtti.

## Karar
Yalın model:
- **İki komut:** `/ac` (oturum açılışı) ve `/kapat` (rapor, karar kaydı, ders, STATE, CHANGELOG, faz özeti, gizlilik ayrımı, doğrulama, commit, push).
- **Tek doğruluk kaynağı:** `docs/STATE.md` (özet bloğu SessionStart hook'uyla her oturuma otomatik eklenir).
- **İki ayrı bilgi deposu:** `research/` (uygulamanın beslendiği bilim) ve `docs/` (geliştirme arşivi).
- **Hook'lar:** SessionStart (bağlam), PreCompact ve SessionEnd (dökümü `private/transcripts` klasörüne arşivle).
- **Mekanik kontroller GitHub Actions'ta:** her push ve haftalık; gizlilik taraması, bekçi testleri, kaynak doğrulama (DOI, geri çekilme).
- **Yorum gerektiren kontroller zamanlanmış Claude görevlerinde:** haftalık denetim (`docs/audits/`) ve aylık literatür taraması (`research/inbox/`, onaysız kütüphaneye girmez).

## Sonuçlar
- Kararlar, oturum raporları ve dersler ayrı dosyalarda; her faz sonu git etiketi ile geri dönülebilir.
- Zamanlanmış görevler masaüstü uygulaması açıkken çalışır; kapalıysa bir sonraki açılışta.
- Oturumlar her zaman `E:\HoopLab\code` klasöründen açılmalı; aksi halde ayarlar ve hook'lar yüklenmez.
- **Yeniden değerlendirme tetikleyicisi:** Paralel çalışan birden çok oturum gerekirse (ör. bir oturum tasarım, diğeri backend).
