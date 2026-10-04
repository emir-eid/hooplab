# 2026-10-05 01:38 — Faz 1: public'e geçiş öncesi denetim

- **Faz:** 1
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5 · yüksek
- **Commit'ler:** bu bloğun `/rep` commit'i

## Blok 1 — Public'e geçiş öncesi denetim, README, LICENSE, bekçide commit mesajı taraması (01:38)

### Amaç
STATE'teki 3. iş, ROADMAP Faz 1 maddesi: repo public olmadan önce herkese açılacak her şeyi denetlemek, README hikayesini ve LICENSE (MIT) dosyasını yazmak, GitHub secret scanning ve push protection'ı açmak. 1. iş (bant ve token takibi) 2026-10-08'den önce yapılamadığı için bu iş seçildi.

### Yapılanlar
- **Denetim:** sonuçlar ve kanıtlar [denetim raporunda](../audits/2026-10-05-public-oncesi.md). Taranan yüzeyler:
  - dosyaların bugünkü hali ve tüm git geçmişi (bekçi + denylist; ek sır biçimleri ayrıca)
  - commit / etiket mesajları ve yazar satırları
  - belgelerde birimli sayılar ve kişisel ifadeler
  - altyapı tanımlayıcıları
  - 32 GitHub Actions çalışmasının logu (indirilip tarandı, sonra silindi)
  - lisanslar

  Sonuç yeşil: sır, kişisel veri veya sağlık değeri yok.
- **Secret scanning ve push protection:** API ile açılmak istendi, `422` döndü (private kişisel repoda yok). İş [ROADMAP](../ROADMAP.md)'te "Repo public" maddesine taşındı; public anının adımları denetim raporunda.
- **Bekçide boşluk ve düzeltme:** CLAUDE.md §2 commit mesajını kapsıyor, ama bekçi mesajlara bakmıyordu. Değişiklik [privacy-guard.mjs](../../tools/guard/privacy-guard.mjs) içinde:
  - `--history` artık her commit ve etiket mesajını ve yazar / commit eden satırını tarıyor.
  - Yeni `--message <dosya>` modu yazılan mesajı tarıyor; [.githooks/commit-msg](../../.githooks/commit-msg) onu commit'ten önce çalıştırıyor.
  - 4 negatif test eklendi: mesajdaki sır, mesajdaki denylist ifadesi, denylist'teki yazar e-postası, dosya yoksa çıkış 2. Bekçinin 25 testinin hepsi geçti; geçmiş taraması 908 girdi ile temiz.
- **[LICENSE](../../LICENSE):** MIT, telif satırında `emir-eid`. Kök `package.json` içine `"license": "MIT"` eklendi.
- **[README](../../README.md) baştan yazıldı:** başta kısa İngilizce özet, ardından şu bölümler: neden, şu an ne yapıyor, ilkeler, nasıl geliştiriliyor (kararlar, oturum raporları, dersler), gizlilik, demo moduyla hızlı deneme, yığın ve yapı, lisans. Göreli bağlantılar betikle denetlendi, kırık yok.
- **Küçük düzeltmeler:**
  - [THIRD_PARTY_NOTICES](../../.claude/skills/THIRD_PARTY_NOTICES.md) içindeki kendi skill listesine eksik `rep` eklendi.
  - [ROADMAP](../ROADMAP.md)'te toparlanma maddesindeki eski "iPhone denemesi bekliyor" notu düzeltildi.
  - CLAUDE.md §2 bekçi listesine `commit-msg` eklendi.
  - [audits/README](../audits/README.md) elle yapılan denetimlerin adlandırmasını anlatıyor.
- **Doğrulama:** `npm run check` yeşil (tip denetimi, araç / paket / uygulama / fonksiyon testleri, gizlilik taraması: 331 dosya ve 908 geçmiş girdisi, kaynak doğrulama: 18 kaynak, 9 kural).

### Kararlar
- LICENSE telif satırında GitHub kullanıcı adı (`emir-eid`) yazılır. README Türkçe olur, başında kısa İngilizce özet bulunur. İkisi de kullanıcının seçimi; karar kaydı gerektirmedi (MIT [0005](../decisions/0005-repo-ve-gizlilik-ayrimi.md) ve ROADMAP'te zaten vardı).
- Commit mesajı taraması [0008](../decisions/0008-gizlilik-altyapisi-eklemeleri.md)'deki geçmiş taramasının kapsam genişlemesi; yeni karar kaydı açılmadı.

### Sorunlar ve hatalar
- Bekçiyi Python betiğiyle düzenleme denemesi kaçış karakterlerinde takıldı (eşleşme bulunamadı, dosya değişmedi). Değişiklik doğrudan düzenleme aracıyla yapıldı.

### Öğrenilenler
- [LESSONS](../LESSONS.md) "Git ve süreç" bölümüne 2 ders eklendi:
  - private kişisel repoda secret scanning yok (422);
  - public olacak repoda dosya dışında yayımlanan şeyler de var (mesajlar, yazar satırı, Actions logları), bekçi bunların bir kısmını artık tarıyor.

## Açık kalanlar
- Repo public: kullanıcı onayıyla; adımlar [denetim raporunda](../audits/2026-10-05-public-oncesi.md) "Public anında".
- Takip (2026-10-08 / 10 civarı): kişisel bant ve OAuth yenileme token'ının 7. gün düşüşü (STATE sıradaki işler 1).
- İsteğe bağlı: README'ye demo modundan sentetik ekran görüntüleri.

## Sıradaki adım
- STATE sıradaki işler 1: takip (2026-10-08 / 10 civarı). Bugün yapılabilecek olan: Apple Developer Programı, EAS Build, TestFlight veya repoyu public yapmak.
