# 2026-10-06 01:08 — Faz 2: antrenman yükü (kaynaklar, yöntem, motor ve arayüz)

- **Faz:** 2 (Faz 1'in TestFlight maddesi Apple'ı bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `d6159df` (Blok 1), Blok 2'nin `rep:` commit'i

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

## Blok 2 — Antrenman yükü: motor, Trend ekranı ve Bugün notu (01:10)

### Amaç
Karar 0025'in uygulanması: motor (testli), arayüz, demo verisi; web önizlemesinde ve iPhone'da doğrulama. Kullanıcı bağlamın yettiğini söyleyip aynı oturumda devam etti.

### Yapılanlar
- **Motor:** `packages/engine/src/training-load.ts` (`readTrainingLoad`, `dailyLoads`, `ewma`): günlük yük, son 7 / önceki 7 gün, değişim, 28 günün haftalık ortalaması, normalleştirilmiş EWMA (7 / 28), oran ve 1,5 notu, monotonluk ve gerilim. Hesap günü bugün kayıt varsa bugün, yoksa dün (`asOf`). `test/training-load.test.ts` (15 test, kapalı formla oran doğrulaması dahil); `rules-sync` testine yük sabitleri; motor README.
- **Uygulama:** `data/training-load-view.ts` (saf, testli; 120 günlük seans penceresi, 28 günlük grafik, etiketsiz oturumlar en yeni önce), `data/training-load.ts` (Supabase ve demo), `copy/training-load.ts` (eşik metne kuraldan gelir), `components/load-chart.tsx` (çubuklar, 2 px aralık, 4 px uç, kesikli kronik çizgi, HrvChart'la aynı jest), `components/load-section.tsx` (Trend bölümü ve Bugün satırı), Trend sekmesi yer tutucusu yerine yük, Bugün'de not satırı; `Tile` paylaşıma açıldı.
- **Demo:** 42 günlük sentetik seans geçmişi, ayrı tohumla (toparlanma verisi değişmedi); yeşil oran ≈ 1,0, sarı ≈ 1,1, kırmızı kamp haftası ≈ 1,7 ve not. `demo-data.test.ts` dört tarihte denetliyor.
- **Doğrulama:** `npm run check` yeşil (araçlar 60, paketler 63, uygulama 84, fonksiyonlar 21 test; gizlilik taraması temiz). Web önizlemesinde 390×844, açık ve koyu, üç senaryo, grafikte gün seçme; iPhone'da (Expo Go, demo) kullanıcı denedi: başarılı.

### Kararlar
- Kullanıcı seçimleri karar [0025](../decisions/0025-antrenman-yuku.md)'e işlendi: ayrıntı Trend'de, Bugün'de yalnız not düşünce tek satır; etiketsiz saat oturumları sayı + "Etiketle" (en yeni oturumu açar), grafikte işaret yok.
- Hesap günü kuralı (bugün kayıt yoksa dün) ve EWMA oranının sıkışıklığı 0025'e eklendi: sabit yükten sonra haftalık yük 2 katına çıkınca oran ≈ 1,34; not ancak yaklaşık 2,8 katlık bir haftada düşer (murray-2017 ile uyumlu).

### Sorunlar ve hatalar
- İlk motor testi "yük iki katına çıkınca oran 1,5'i geçer" bekliyordu, 1,33 çıktı. Hata beklentideydi; test kapalı formla yeniden yazıldı, bulgu karara girdi.
- Önizlemede bulunup düzeltilen metinler: not yöntemi yanlış anlatıyordu ("4 haftalık ortalama"), oran kartı değeri tekrar ediyordu, grafik içindeki "alıştığın" etiketi çubuklarla çakışıyordu (açıklama satırına taşındı), koyu temada "Koyu: son 7 gün" yanlıştı ("Belirgin").
- Grafikte gün seçme ilk denemede çalışmadı: HMR sonrası bayat jest; tam yenilemeyle çalıştı (LESSONS).
- Kullanıcı cihaz denemesi için Metro'yu kendisi açtı; Claude'un port denetimi reddedildi.

### Öğrenilenler
- LESSONS "Önizleme ve maketler": jestli bileşen HMR'den sonra web önizlemesinde bayat kalabilir; etkileşim tam yenilemeyle denenir.

## Açık kalanlar
- Takip (2026-10-08 / 10 civarı) ve Apple Developer desteğindeki vaka (STATE).
- Gerçek hesapta oran ve not ilk seans kaydından 28 gün sonra görünür; seans kaydı alışkanlığı oranın doğruluğunu belirler.

## Sıradaki adım
- STATE sıradaki işler 1: takip (2026-10-08 / 10 civarı); ondan önce Faz 2'de kalan baseline'lar (solunum, check-in) yapılabilir.
