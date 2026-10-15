# 2026-10-15 12:26 — Saatlik yakılan kalori grafiği

- **Faz:** 4 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-15 13:51)
- **Model / efor:** Opus 5.5, orta
- **Commit'ler:** `8a9011b` (Blok 1), `e3e2f5e` (Blok 2), bu raporun kapanış commit'i

## Blok 1 — Saatlik yakılan kalori grafiği (karar 0044) (12:26)

### Amaç
Kullanıcı isteği (STATE sıradaki iş 1): Bugün'deki "Yakılan enerji" kartında, HRV grafiği gibi dokunarak seçilen saatlik grafik; seçilen saatin kalorisi ve yanda günün toplamı; varsayılan bugün, oklarla son 7 güne geri.

### Yapılanlar
- **Önce ölçüm (kod yazmadan):** yerel `ghealth` CLI'nın token'ı düşmüştü; kullanıcı tarayıcıdan yeniden izin verdi. Ölçüm betiği (scratchpad) yalnız nokta sayısı, dolu saat sayısı ve saatlik toplam / günlük toplam oranını yazdı; değer okunmadı. Sonuç:
  - Saatlik toplam kalori her saatte dolu, oran 1,000.
  - 14 gün sınırı var; pencereler en yeniden eskiye sıralı ve saat başına oturuyor; süren saat de geliyor.
  - `pageSize` kabul ediliyor; `basal-energy-burned` reddediliyor.
- **Senkron** (`supabase/functions/_shared/google-health/`):
  - `client.rollUp` ve `rollUp` yanıt tipleri eklendi.
  - Saat dilimi yardımcıları: `zonedMidnightUtc`, `localDateHour` (yaz saati testli).
  - `parseHourlyEnergy` ayrıştırıcısı.
  - `sync.ts`: bugün ve önceki 7 gün tek istekle (`HOURLY_ENERGY_DAYS`), saat dilimi `syncWindow`'a geçiyor.
  - `service.ts`: `health_hourly_energy` upsert.
- **Sahte Google** (`fake-google.ts`): `:rollUp` ölçülen kurallarla eklendi (14 gün, tam aile adı, `windowSize` zorunlu, sıralama, `now` ile gelecek yok). Yeni testler `sync.test.ts`'te; fonksiyon testleri 105/105.
- **Veritabanı:**
  - Migration `20261014230013_saatlik_enerji.sql`: tablo, `(user_id, local_date)` dizini, RLS, yetkiler.
  - pgTAP `saatlik_enerji.test.sql` (13 madde); yerelde politika gevşetilince 2 madde kırıldı, geri alınınca geçti.
- **Bulut:**
  - `db push` öncesi kuru çalıştırma yapıldı; `migration list` ve `db advisors` kontrol edildi (yalnız bilinen sızan şifre uyarısı).
  - `ghealth-sync`, `ghealth-connect` ve `ghealth-callback` dağıtıldı; senkron elle tetiklendi.
  - Sonuç: hata yok; 8 gün, 171 saat yazıldı; her günde saatlik toplam / günlük toplam 1,000.
  - Oturumsuz istek 401; `setup:check` tamam.
- **Motor ve kural:** `rules/enerji.json` → `enerji-gosterim` içine `hourly_days_back: 7`; motor `energyRule.hourlyDaysBack`, `rules-sync.test.ts` ile bağlı. Kanıt paketi yeniden üretildi; `coach-daily` (v15) ve `coach-ask` (v7) dağıtıldı. Saatlik veri koça gitmez.
- **Uygulama:**
  - `data/energy-view.ts`: `buildEnergyDays` (8 gün, saat yuvaları, süren saat, gün toplamı).
  - `data/energy.ts`: iki sorgu; saatlik okunamazsa kart grafiksiz kalır.
  - `components/energy-hour-chart.tsx`: 24 çubuk, ortak ölçek, LoadChart ile aynı jest, nötr renk.
  - `components/energy-section.tsx`: HRV kartı düzeni, gün okları; saatlik veri yoksa eski kart.
  - Metinler `copy/energy.ts` ve `copy/explainers.ts`'te.
  - Demo: günlük toplam sentetik saat profiline dağıtılıyor; bugün son senkrona kadar ve toplamı saatlerden.
- **Doğrulama:**
  - `npm run check` temiz.
  - Web önizlemesi 390×844, demo, açık ve koyu tema: gün geçişi, saat seçimi, süren saat.
  - Düzeltilenler: başlık yalnız saat aralığı oldu; sayı ile kcal arasına bölünmez boşluk; sağ sütun daralmıyor.
  - Kullanıcı iPhone'da gerçek hesapla baktı: sorun yok.
- **Belgeler:** karar [0044](../decisions/0044-saatlik-yakilan-enerji.md), DATA-INVENTORY, COSTS, PRODUCT (6a), LESSONS (iki Google Health dersi, bir önizleme dersi), CHANGELOG.

### Kararlar
- [0044 Saatlik yakılan enerji](../decisions/0044-saatlik-yakilan-enerji.md) — senkron saatlik rollUp, yeni tablo, kartın içinde dokunarak seçilen grafik, geriye 7 gün; tahmin, nötr renk, eşik yok, koça gitmez.

### Sorunlar ve hatalar
- Yerel CLI token'ı 7 günü geçtiği için `invalid_grant` verdi. Tarayıcıdan izin alındı; ilk izin bağlantısı beklerken zaman aşımına uğradı, komut yeniden başlatıldı.
- Kabuk betiğinde iç içe tırnak hatası: düzenlemeler tek tek yapıldı.
- Node testleri `@/` kısayolunu değer import'unda çözmedi (`demo-data.ts`); göreli yola çevrildi.
- `functions deploy` `--linked` bayrağını tanımadı; bayraksız bağlı projeye gitti.
- Önizleme panosunda tıklamalar yarı koordinatta düştü, JS'ten gönderilen dokunma Gesture Handler'ı tetiklemedi. Ölçüldü; LESSONS'a yazıldı.

### Öğrenilenler
- LESSONS "Google Health / veri": `rollUp` sınırları ve biçimi, `ghealth` CLI token'ının da 7 günde düşmesi. "Önizleme ve maketler": yarı ölçekte tıklama ve sentetik jest.

## Blok 2 — Yerel bildirimler (karar 0045) (13:34)

### Amaç
STATE'teki sıradaki iş (Faz 4: bildirimler). Kullanıcı Google yeniden bağlanma, sabah check-in ve maç günü hatırlatmasını seçti.

### Yapılanlar
- **Doğrulama:**
  - Expo SDK 57 belgesine göre yerel bildirimler Expo Go'da çalışıyor; push ayrı derleme istiyor.
  - `npx expo install expo-notifications` (57.0.23). API tip dosyalarından doğrulandı: `scheduleNotificationAsync` (DATE / TIME_INTERVAL), izin, `useLastNotificationResponse`, `setNotificationHandler`.
- **Plan (saf):** `apps/mobile/src/data/notification-plan.ts` ve testi (6 test).
  - Check-in: seçilen saatte, 7 gün ileriye, yapılmış gün atlanır.
  - Google izni: bağlanmadan 7 gün sonra dolar; 24 ve 3 saat önce hatırlatma, durmuşsa ertesi 09:00.
  - Metinde rakam yok (test). Tercih ayrıştırma ve saat adımı da testli.
- **Telefon tarafı:**
  - `notifications/scheduler.ts`: tercih AsyncStorage'da; izin; kendi bildirimlerini silip planı yeniden yazma; deneme bildirimi.
  - `notifications/use-notifications.ts`: öne gelince yenileme, öndeyken afiş, dokununca ekran açma.
  - Kök düzene bağlandı. Check-in kaydında ve Google bağlantısı kurulup kesilince plan yenileniyor.
- **Ekran:** `app/(tabs)/me/notifications.tsx` (iki anahtar, saat −/+, deneme, reddedilmiş izinde Ayarlar). Ben'de "Bildirimler · Açık / Kapalı" satırı.
- **Doğrulama:**
  - Tip denetimi ve 170 uygulama testi temiz.
  - Web önizlemesinde ekran 390×844'te (web'de anahtarlar pasif, not doğru, konsol temiz).
  - Metro `--clear` ile yeniden başlatıldı. Kullanıcı iPhone'da izin verdi; deneme bildirimi geldi.
- **Belgeler:** karar [0045](../decisions/0045-yerel-bildirimler.md), ROADMAP (kalori ve yerel bildirim tamam, maç sabahı hatırlatması maç takvimine), DATA-INVENTORY, CHANGELOG, LESSONS.

### Kararlar
- [0045 Yerel bildirimler](../decisions/0045-yerel-bildirimler.md): yalnız telefonda zamanlanan bildirim; metinde sağlık değeri yok; maç günü hatırlatması maç takvimiyle; yapılandırma eklentisi push gelince.

### Sorunlar ve hatalar
- Maç günü hatırlatması bu işte yapılamadı: "Bugün maç var" yalnız o gün konuyor, maç sabahı için tarihin önceden bilinmesi gerekiyor. Kullanıcıya söylendi, sıradaki işe taşındı.
- Web önizlemesinde demoyu açan tıklama ilk denemede sayfa geçişine denk geldi; yeniden denendi.

### Öğrenilenler
- LESSONS "Expo / React Native": yerel bildirim Expo Go'da çalışır, push derleme ister; eklenti `aps-environment` ekler; paket sonrası Metro `--clear`.

## Açık kalanlar
- Google Health bağlantısının sınırı 2026-10-19 11:55 (uygulamadan yeniden bağlan; bildirim 18 Ekim 11:55'te hatırlatacak).
- Bildirimlerin gerçek zamanlamada (sabah check-in, izin hatırlatması) geldiği henüz görülmedi; yalnız deneme bildirimi görüldü.

## Sıradaki adım
- Maç günü ve seyahat protokolleri (maç takvimi ve maç sabahı hatırlatması dahil).
