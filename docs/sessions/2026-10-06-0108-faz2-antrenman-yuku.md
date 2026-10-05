# 2026-10-06 01:08 — Faz 2: antrenman yükü (kaynaklar ve yöntem)

- **Faz:** 2 (Faz 1'in TestFlight maddesi Apple'ı bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** bu bloğun `rep:` commit'i

## Blok 1 — Antrenman yükü: kaynak taraması ve yöntem kararı (2026-10-05 16:04'te açılan oturum)

### Amaç
STATE'teki 3. iş (Faz 2 başlangıcı: antrenman yükü). 1. iş (bant ve token takibi) 2026-10-08'den önce yapılamıyor, 2. iş (TestFlight) Apple'ın yanıtını bekliyor. Akut / kronik yük oranı tartışmalı olduğu için önce kaynaklar doğrulanıp yöntem seçildi; motor ve arayüz sonraki bloklarda.

Açılışta kullanıcı Apple Developer Programı'nın yalnız App Store için mi gerektiğini sordu. Cevap: iPhone'a kalıcı kurulum (TestFlight veya ad hoc) için de gerekli; üyeliksiz yollar ücretsiz hesapla Xcode (Mac ve 7 günde bir yeniden kurulum), Expo Go (geliştirme aracı) ve web uygulaması (PWA). Kullanıcı: Apple süreci uzarsa PWA düşünülür (STATE açık riskler).

### Yapılanlar
- PubMed ve Crossref'te tarama; 17 aday DOI ve PMID ile doğrulandı, geri çekilen yok. Özetler, açık erişimli olanlarda tam metnin ilgili bölümleri okundu.
- 17 yeni kaynak dosyası `research/sources/`: konsensüs (soligard-2016, bourdon-2017), oranı savunan (gabbett-2016, murray-2017, griffin-2019, andrade-2020, maupin-2020), yöntem (williams-2017, ren-2024), eleştiren (lolli-2017, impellizzeri-2020, impellizzeri-2021), en güncel meta-analiz (ding-2026), basketbol (chan-2024, weiss-2017, ferioli-2020), monotonluk (foster-1998). haddad-2017'nin bağlı kuralları güncellendi.
- `research/rules/yuk.json`: 6 yeni kural (`yuk-gunluk`, `yuk-haftalik`, `yuk-ewma`, `yuk-orani`, `yuk-artis-notu`, `yuk-monotonluk`); `seans-yuku` notunda maçta tam seans süresi kararı.
- Karar [0025](../decisions/0025-antrenman-yuku.md) ve karar dizini.
- Doğrulama: `npm run research:check` ve `research:check:online` temiz (35 kaynak, 15 kural).

### Kararlar
- [0025 Antrenman yükü](../decisions/0025-antrenman-yuku.md) — kullanıcı B'yi seçti: bileşenler ayrı ve eşiksiz, EWMA (N = 7 / 28) oranı yalnız bağlam, oran ≥ 1,5 ise tahmin etiketli bilgi notu, "güvenli bölge" rengi ve risk dili yok, monotonluk ve gerilim eşiksiz. EWMA ağırlıkları ilk kayıt gününden normalleştirilir (kayıt öncesi 0 sayılmaz).

### Sorunlar ve hatalar
- Williams 2017 (EWMA formülü) açık erişimde değil; formül ona atıf yapan açık erişimli ren-2024 tam metninden doğrulandı ve kaynak olarak eklendi.
- Sık anılan "monotonluk 2'nin üstü" eşiği doğrulanmış bir kaynakta bulunamadı; kullanılmıyor (kural notunda).
- Kaynak dosyalarını tek bash heredoc'uyla yazma denemesi tırnak işaretine takıldı (hiçbir dosya yazılmadan); dosyalar tek tek yazıldı.

### Öğrenilenler
- yok (LESSONS'a madde eklenmedi; kaynak doğrulama yöntemi research/README'deki kuralla aynı).

## Açık kalanlar
- Antrenman yükü motoru: `packages/engine` içinde günlük yük, 7 / 14 / 28 günlük değerler, normalleştirilmiş EWMA, oran ve not, monotonluk ve gerilim; testler, `rules-sync` testine yeni sabitler, motor README.
- Arayüz: yük görünümü, demo sporcuya sentetik yük geçmişi, 390×844 web önizlemesi; etiketlenmemiş saat oturumlarının nasıl belirtileceği kullanıcıyla kararlaştırılacak.
- Takip (2026-10-08 / 10 civarı) ve Apple Developer desteğindeki vaka (STATE).

## Sıradaki adım
- STATE sıradaki işler 1: antrenman yükü motoru (karar 0025).
