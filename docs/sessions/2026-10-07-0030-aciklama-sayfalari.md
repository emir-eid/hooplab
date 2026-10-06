# 2026-10-07 00:30 — Cihaz kontrolü, açıklama sayfaları, Trend'de tür rengi, kas / tendon kaynakları

- **Faz:** 2 (Faz 1'in TestFlight maddesi Apple'ı bekliyor)
- **Durum:** kapandı (/kapat, 01:04)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `b1fab3d` (Blok 1-2), `30c37b9` (Blok 3), bu raporun kapanış commit'i

## Blok 1 — Cihaz kontrolü: hale ve manken kenarı (2026-10-06 01:38'de açılan oturum)

### Amaç
Kullanıcı açılışta "önce küçük işler" dedi: STATE açık risklerindeki iki cihaz kontrolü. Biri hale gradyanında kademelenme ([0011](../decisions/0011-hale-efekti-svg.md)), diğeri Vücut mankeninde bel / uyluk birleşiminde tırtıklı kenar (README görüntüsünde, başsız Chrome'da görülmüştü).

### Yapılanlar
- Metro (8081) yeniden başlatıldı; LAN adresinden manifest denetlendi (`hostUri` doğru).
- Kullanıcı iPhone'da (Expo Go, demo) baktı: üç durumda da hale yumuşak, kademelenme yok; manken kenarı temiz. İki madde STATE açık risklerinden çıkarıldı.

### Kararlar
- yok

### Sorunlar ve hatalar
- Açılışta 8081'de önceki oturumdan kalan bir Metro `/status`'a yanıt verdi; "hazır" dendi ama süreç kısa süre sonra düşmüştü, Expo Go sunucuyu bulamadı. Port ve LAN manifesti denetlenip Metro yeniden başlatıldı.

### Öğrenilenler
- LESSONS "Expo / React Native": Metro'nun yaşadığı `/status` ile değil, dinleyen süreç ve LAN manifestiyle doğrulanır.

## Blok 2 — Açıklama sayfaları ve Trend'de seans türü rengi (00:30)

### Amaç
Kullanıcı demoya bakınca iki istekte bulundu. Birincisi, Bugün ve Trend'deki her verinin ne anlama geldiğinin ve neye göre değerlendirildiğinin uygulamada anlatılması (AU nedir, monotonluk ne demek). İkincisi, Trend'in renklenmesi. Kullanıcı 3. işten (kas / tendon modeli) önce bunu seçti.

### Yapılanlar
- **Açıklamalar:** `apps/mobile/src/copy/explainers.ts`'te 12 konu (HRV, son gece HRV, dinlenik nabız, uyku, solunum, check-in, seans yükü, günlük / haftalık yük, alıştığına göre, 4 hafta ortalaması, monotonluk, gerilim). Her biri `research/rules` kurallarına bağlı, kaynakları o kuralların kaynaklarından, sayılar motor sabitlerinden. Solunumun kuralı olmadığı için yalnız "yorumlanmıyor" der. Test: `copy/explainers.test.ts`.
- **Künyeler:** `copy/sources.ts` 35 kaynak dosyasının başlık bilgisinden üretildi. `copy/sources.test.ts` yazar, yıl ve türü dosyayla karşılaştırır. `copy/recovery-sources.ts` aynı künyeleri kullanacak şekilde sadeleşti.
- **Alt sayfa:** `app/explain/[id].tsx` (formSheet, %60 / tam ekran). İçerik: değerin türü rozeti, güncel değer, Bu ne? · Nasıl okunur? · Neye göre? · sınırlar · kaynaklar, "Kapat"; sağlık ölçümlerinde tanı değil notu. Güncel değer adres parametresiyle değil bellekte taşınıyor (`components/info-button.tsx`).
- **Giriş noktaları:** Bugün'de dört ölçüm kartı (`Tile` dokunulabilir, "i" işaretli), HRV grafiği, check-in kartı ve "Bugünün seansları"; Trend'de grafik başlığı ve dört kart (`components/recovery-section.tsx`, `components/load-section.tsx`, `app/(tabs)/index.tsx`).
- **Tür rengi:** `packages/theme` `loadGroup` token'ı. Gruplar: maç pembe, saha mavi, kuvvet / kondisyon mor, hafif gri. dataviz doğrulayıcısıyla açık (`#FFFFFF`) ve koyu (`#18191C`) kart zemininde denetlendi. Kartta 3:1 ve durum renklerinden ayrılık `tokens.test.ts`'te; maket eşleşme testi bu token'ı dışarıda tutuyor.
- **Veri:** `data/training-load-view.ts` seans türünü alıyor; yedi tür dört gruba katlanıyor (`loadGroupOf`); günlük `parts` ve son 7 günün `weekParts` değerleri eklendi. Sorgu (`data/training-load.ts`) ve demo deposu `kind` okuyor; test eklendi.
- **Grafik:** `components/load-chart.tsx` yığılmış çubuk çiziyor: parçalar arası 2 px boşluk (toplam boy değişmez), son 7 gün soluk zemin şeridinde. Altta türlerin son 7 günlük toplamı; güne dokununca başlıkta o günün dağılımı.
- **Demo:** sentetik geçmişe maç ertesi mobilite ve haftada bir şut seansı eklendi (`demo/demo-data.ts`); senaryo oranları testte aynı aralıkta.
- **Doğrulama:** `npm run check` temiz (tip denetimi, 234 test, gizlilik bekçisi, kaynak doğrulayıcı). Web önizlemesinde 390×844'te, açık ve koyu temada başsız Chrome ekran görüntüleriyle bakıldı: Bugün gece verisi, Uyku ve Monotonluk sayfaları, Trend, gün seçimi. Kullanıcı iPhone'da (Expo Go, demo) baktı: "hepsi çok güzel olmuş".

### Kararlar
- [0026 Açıklama sayfaları ve yük grafiğinde seans türü rengi](../decisions/0026-aciklama-sayfalari-ve-tur-rengi.md). Kullanıcı ikisinde de önerilen A'yı seçti: alt sayfa ve seans türüne göre renk. 0025'teki "renk yok" kuralı "risk rengi yok" olarak daraldı; 0025'in durum satırına not düşüldü.

### Sorunlar ve hatalar
- Testli modülde `@/copy/sources` importu Node testinde çözülmedi; göreli `.ts` importuna geçildi.
- `as const satisfies` ile `basis` daraldığı için sayfadaki `estimate` karşılaştırması tip hatası verdi; sayfada `Explainer` tipine genişletildi.
- 8082'de başka bir projenin Metro'su çalışıyordu (dokunulmadı); önizleme 8081'deki Metro'dan yapıldı.
- Tarayıcı paneli görünmezken ekran görüntüsü zaman aşımına uğradı, tıklamalar ulaşmadı. Görsel kontrol başsız Chrome betiğiyle yapıldı (`demo-screenshots.mjs` kalıbı, geçici betik scratchpad'de).

### Öğrenilenler
- LESSONS "Expo / React Native": testli modüllerde `@/` takma adı Node'da çözülmez.
- LESSONS "Önizleme ve maketler": panel görünmezken başsız Chrome + DevTools protokolüyle doğrulama.

## Blok 3 — Kas ve tendon bölge yükü: kaynaklar ve yöntem (00:50)

### Amaç
STATE sıradaki iş 1 (kullanıcı seçimi): Faz 2 kas ve tendon bölge yükü modeli. 0025'teki gibi önce kaynaklar doğrulanıp yöntem seçildi; migration, motor ve arayüz sonraki blokta.

### Yapılanlar
- PubMed E-utilities ile tarama (esearch, esummary, efetch); açık erişimli tam metinler Europe PMC'den (harper-2022, seidler-2025). 17 kaynak eklendi; künye alanları `esummary`'den üretildi (`research/sources/`): vanrenterghem-2017, kalkhoven-2021, gabbett-2025, magnusson-2010, miller-2005, doeven-2018, bahr-2014, bache-mathiesen-2024, sprague-2018, lian-2005, harper-2022, danielsson-2020, serner-2019, finnern-2026, silbernagel-2007, seidler-2025, panagiotakis-2017.
- `research/rules/bolge.json` (modül kas-tendon): `bolge-icerik-etiketleri`, `bolge-esleme`, `bolge-toparlanma-penceresi`, `bolge-yuku`, `bolge-agri-izleme`.
- `apps/mobile/src/copy/sources.ts` yeni kaynaklarla yeniden üretildi (`sources.test.ts` geçiyor).
- Karar [0027](../decisions/0027-kas-tendon-bolge-yuku.md) ve karar dizini.
- Doğrulama: `research:check` ve `research:check:online` temiz (52 kaynak, 20 kural); `npm run check` temiz.

### Kararlar
- [0027 Kas ve tendon bölge yükü](../decisions/0027-kas-tendon-bolge-yuku.md): kullanıcı üç soruda da önerileni seçti. Yöntem maruziyet + toparlanma penceresi (katsayısız eşleme; tendon 48, kas 72 saat; bölge yükü = pencere içinde bölgeyi çalıştıran seansların AU toplamı, eşiksiz). Ağrıda ağrı izleme modeli (sabah ağrısı 5'in üstü ya da yüklü günün ertesi sabahı azalmadıysa not). Etiketler türe göre hazır seçili. Ağırlıklı model (B) kaynaksız katsayı gerektirdiği için reddedildi. Ayak bileği ve bel modelde yok, "temas" etiketi alınmadı.

### Sorunlar ve hatalar
- Seans saati yalnız saatle eşleşen seanslarda var (`started_at`); elle girilenlerde yok. Pencereler bu yüzden takvim günüyle uygulanacak (karar 0027).
- Ağrı izleme modelinin sayısal ayrıntısı birincil kaynakta (silbernagel-2007) açık erişimde değil; açık erişimli seidler-2025 tam metninden doğrulandı.
- Kaynak dosyalarını yazan betik heredoc ile kabukta reddedildi (tırnak); Write aracıyla betik dosyası yazılarak çözüldü.

### Öğrenilenler
- LESSONS "Git ve süreç": tırnaklı uzun heredoc yerine Write ile betik; PubMed E-utilities ile kaynak taraması.

## Açık kalanlar
- Kas / tendon modelinin uygulaması: migration (`training_sessions.content_tags`), motor, seans formunda etiket çipleri, Vücut görünümünde bölge yükü, açıklama sayfaları (karar 0027).
- Takip (2026-10-08 / 10 civarı) ve Apple Developer desteğindeki vaka (STATE).
- Solunumun kişisel bandı ve kaynağı yok; açıklaması bant gelince güncellenecek.

## Sıradaki adım
- STATE sıradaki işler 1: kas ve tendon bölge yükünün motoru ve arayüzü (karar 0027).
