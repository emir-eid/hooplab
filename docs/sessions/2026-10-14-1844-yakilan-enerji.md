# 2026-10-14 18:44 — Yakılan enerji

- **Faz:** 4 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-14 18:49)
- **Model / efor:** Opus 5.5, orta
- **Commit'ler:** `b88eabc` (Blok 1), bu raporun kapanış commit'i

## Blok 1 — Yakılan enerji (karar 0043) (18:44)

### Amaç
Kullanıcı isteği (STATE sıradaki iş 1): Bugün'de günlük toplam yakılan kalori, seans kaydında ve "Saatten gelenler"de seansın kalorisi, haftalık raporda haftalık toplam. Tahmin etiketli, doğrulanmış bir geçerlilik kaynağıyla, 0042 kart düzeninde.

### Yapılanlar
- **Ölçüm (bulut, yalnız evet / hayır ve oran):**
  - `health_daily.calories_kcal` dinlenirken yakılanı da içeriyor.
  - Bugünün değeri gün içinde birikiyor.
  - `exercise_sessions.calories_kcal` neredeyse her oturumda dolu.
  - Sayılar `private/journal`'da.
  - Discovery belgesinin yeni revizyonunda (20261013) `active-energy-burned` ve `basal-energy-burned` tipleri var; Fitbit Air'le ölçülmedi.
- **Kaynak taraması (arka plan ajanı + elle doğrulama):**
  - 7 kaynak eklendi: lambe-2026, reddy-2018, shcherbina-2017, chevance-2022, feehan-2018, doherty-2024, argent-2022.
  - Künyeler PubMed `esummary`'den. Tam metinler Europe PMC'den; arayüze giren sayılar (%15,02; %25,1; %27,4; −%12 ile −%19; −2,77 kcal/dk; 62 çalışmanın 5'i) ham metinde bulundu.
  - Kurallar `research/rules/enerji.json`: `enerji-harcamasi-tahmin` (tipik hata %15-30, eşik yok, alımla karşılaştırılmaz) ve `enerji-gosterim` (10 kcal, 7 gün).
  - `research:check:online` temiz. Toplam 105 kaynak, 43 kural.
- **Motor:** `packages/engine/src/energy.ts` (`readEnergy`, `readWeeklyEnergy`, `roundKcal`, `sumKcal`, `energyRule`). Testler `energy.test.ts`; kural bağı `rules-sync.test.ts`'te.
- **Uygulama:**
  - Bugün'de "Yakılan enerji" kartı (`components/energy-section.tsx`): Tile, tam genişlik, Gece verisinin üstünde.
    - Büyük sayı "Bugün şu ana kadar · SS:DD itibarıyla".
    - Satırlar "Dün (tam gün)" ve "7 gün ort.".
    - Açıklama sayfasında "Bugün şu ana kadar" satırı da var.
  - Veri ve görünüm `data/energy.ts` ve `data/energy-view.ts`; metinler `copy/energy.ts`.
  - Seans satırında ve "Saatten gelenler"de "~640 kcal":
    - `training_sessions` sorgusu bağlı oturumun kalorisini gömülü okur (`exercise_sessions(calories_kcal)`).
    - `ExerciseSession.kcal` ve `TrainingSession.kcal` eklendi.
  - Haftalık raporda "Yakılan enerji · tahmin": toplam, gün ortalaması (süren haftada bugün hariç), önceki hafta.
  - "Yakılan enerji" açıklama sayfası: Tahmin etiketli, 7 kaynak.
  - Koç sözleşme testinde bu sayfa "koça gitmez" diye istisna.
  - Demo sporcuya sentetik günlük toplam (bugün `now`a kadar) ve oturum kalorisi eklendi.
- **Koç:** kanıt paketi yeniden üretildi. `coach-ask` v6 ve `coach-daily` v14 bulutta. Oturumsuz istek 401, `setup:check` 13/13.
- **Belgeler:** [0043](../decisions/0043-yakilan-enerji.md), PRODUCT (modül 6a, beslenme satırı), DATA-INVENTORY, CHANGELOG.
- **Doğrulama:**
  - `npm run check` temiz: 484 test, tip denetimi, gizlilik bekçisi, kaynaklar.
  - Web önizlemesinde demo (390×844, açık ve koyu tema): kart, "Saatten gelenler", açıklama sayfası, biten ve süren haftanın raporu.
  - Ekran görüntüleri başsız Chrome ile çekildi; tarayıcı paneli çizmiyordu.
  - Konsolda hata yok.
  - Kullanıcı uygulamayı iPhone'da açtı ve onayladı.

### Kararlar
- [0043 Yakılan enerji](../decisions/0043-yakilan-enerji.md):
  - Bilekliğin tahmini olarak gösterilir: 10 kcal'e yuvarlanır, tipik hata %15-30.
  - Eşik ve hedef yok, günün durumuna girmez.
  - Alımla karşılaştırılmaz. Bu HoopLab'in çıkarımı, kaynağın doğrudan önerisi değil.
  - Koçun anlık değerlerine girmez.

### Sorunlar ve hatalar
- **Satır bölünmesi:** "Saatten gelenler"de "~360" ile "kcal" ayrı satıra düştü. Ekranda fark edildi; bölünmez boşlukla çözüldü.
- **Görünmez karakter:** bölünmez boşluğun kaçışı Python heredoc'uyla yazılınca dosyaya kaçış değil, görünmez U+00A0 karakteri olarak girdi. Ayrı bir Node betiğiyle ` ` kaçışına çevrildi.
- **Gömülü okumanın tipi:** supabase-js şemasız istemcide gömülü okumayı dizi sandı; tip denetimi yakaladı. Nesne ve dizi ikisi de kabul edildi.
- **Koç sözleşme testi:** yeni açıklama sayfası koçta yok diye kırıldı. Gerekçeli istisna eklendi.
- **Tarayıcı paneli:** pencere arkadayken ekran görüntüsü zaman aşımına uğradı (bilinen ders). Başsız Chrome betiği kullanıldı.
- **Demo:** ardışık haftalar birebir aynı toplamı veriyordu; küçük bir oynama eklendi.

### Öğrenilenler
- LESSONS "Git ve süreç": kaçış karakteri dersi tekrarladı (U+00A0). Yöntem: karakter kodla üretilir.
- LESSONS "Supabase": şemasız supabase-js gömülü çoğa-bir okumayı dizi diye tipliyor.

## Açık kalanlar
- Saatlik yakılan kalori grafiği (kullanıcı isteği; STATE sıradaki iş 1).
- `active-energy-burned` / `basal-energy-burned` tiplerinin Fitbit Air'le gelip gelmediği ölçülmedi.
- Koç cümleleri hala "bant" diyor; ekranda "aralık".
- Kaydırınca içerik iOS durum çubuğunun altından geçiyor (önceki oturumlardan).
- Google Health izni 2026-10-19 11:55'te düşer.
- Apple Developer üyeliği onayı.

## Sıradaki adım
- Saatlik yakılan kalori grafiği:
  1. Senkrona saatlik `rollUp` (pencere 3600 sn) eklenir, sahte Google ile test edilir.
  2. Buluta dağıtılıp gerçek API ölçülür.
  3. Ölçüm tutarsa yeni tablo, Bugün kartının içinde dokunarak seçilen 24 saatlik çubuk grafik ve yanında günün toplamı gelir. Son 7 güne oklarla geri gidilir.
