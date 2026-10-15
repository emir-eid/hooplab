# HoopLab — ürün tanımı ve kapsam

Uygulamanın **ne** yaptığını ve **neden** yaptığını anlatır. Nasıl yapıldığı: [decisions/](decisions/README.md). Ne zaman yapılacağı: [ROADMAP.md](ROADMAP.md). Bu belge değişen ürün kararlarıyla birlikte güncellenir; kapsam değişikliği bir karar kaydı gerektirir.

## 1. Problem

- Fitbit Air ve Google Health'in topladığı veri değerli, ama **referans aralıkları ve yorumlar sedanter bireylere göre ayarlı.** Profesyonel bir sporcunun değerleri bu çerçevede yanlış okunuyor (ör. çok düşük dinlenik nabız, yüksek haftalık yük, uzun toparlanma ihtiyacı).
- Google Health'in bazı özellikleri sahibinin bulunduğu Türkiye'de kullanılamıyor (sahibin gözlemi; hangi özelliklerin kapalı olduğu ayrıca belgelenmedi).
- Cihaz bazı kritik şeyleri ölçemez: seansın ne kadar zorlandığı, hangi kasın ağrıdığı, ne yenildiği, ne kadar sıvı alındığı, maç takvimi.

## 2. Kim için

**Tek kullanıcı:** uygulamanın sahibi, profesyonel basketbolcu, iPhone kullanıcısı. Uygulama başkalarına dağıtılmaz. Portfolyo için yalnız sentetik verili **demo modu** gösterilir.

Kod public ve MIT lisanslı. Başkası kendi Supabase ve Google Cloud hesabıyla kendisi kurabilir. Merkezi servis yok ([0009](decisions/0009-herkes-kendi-hesabiyla.md)). Sunucu tarafını terminaldeki kurulum sihirbazı kurar ve denetler (`npm run setup`, `npm run setup:check`). Uygulama yalnız kurulum eksikse bunu söyler ([0023](decisions/0023-kurulum-sihirbazi-terminalde.md), [rehber](guides/kurulum.md)). Bu bir kolaylıktır, hedef kitle değil: ürün kararları sahibine göre verilir.

## 3. Ne yapar: modüller

| # | Modül | Girdiler | Çıktı | Faz |
|---|---|---|---|---|
| 1 | **Toparlanma** | HRV, dinlenik nabız, uyku, solunum hızı, SpO2, gece cilt sıcaklığı; sabah check-in | Kişisel banda göre günün durumu (yeşil / sarı / kırmızı) ve nedeni; gece işaretleri (solunum, gece nabzı, SpO2, cilt sıcaklığı kişisel olağandan belirgin ayrılınca tanı koymayan "doktora danış" notu; günün durumuna girmez, [0028](decisions/0028-solunum-ve-checkin-kisisel.md), [0039](decisions/0039-gece-isaretleri.md)) | 1 (temel), 2, 3 |
| 2 | **Antrenman yükü** | Seans türü, süre, RPE, oynanan dakika | Seans yükü, akut ve kronik yük, monotonluk; yük artışı uyarısı | 2 |
| 3 | **Kas ve tendon yorgunluğu** (tahmin) | Seans içeriği (sıçrama / iniş, yön değiştirme / ani duruş, sprint, alt / üst vücut kuvvet; temas alınmadı, [0027](decisions/0027-kas-tendon-bolge-yuku.md)), bölgesel ağrı haritası | Bölge bazında tahmini yük ve toparlanma durumu; arayüzde "tahmin" etiketli | 2 |
| 4 | **Uyku** | Süre, düzen, evreler; maç ve seyahat takvimi | Uyku borcu, düzen sapmaları; maç öncesi ve seyahat önerileri | 2-3 |
| 5 | **Beslenme** | Gün tipi (dinlenme / antrenman / maç), kilo, basit öğün kaydı | Günlük karbonhidrat ve protein hedefi (g/kg); düşük enerji yeterliliği uyarısı | 2 |
| 6 | **Hidrasyon** | Antrenman öncesi ve sonrası tartı, içilen sıvı, süre | Ter oranı, antrenman sonrası sıvı hedefi; %2'den fazla kilo kaybı uyarısı | 2 |
| 6a | **Yakılan enerji** (tahmin) | Bilekliğin günlük ve saatlik toplam kalorisi ve egzersiz oturumu kalorisi (Google Health) | Bugün'de günlük toplam (şu ana kadar) ve kartın içinde dokunarak seçilen saatlik grafik (geriye 7 gün, [0044](decisions/0044-saatlik-yakilan-enerji.md)), seans satırında oturum kalorisi, haftalık raporda toplam; "Tahmin" etiketli, kaynaklı hata payı; eşik ve hedef yok, alımla karşılaştırılmaz ([0043](decisions/0043-yakilan-enerji.md)) | 4 |
| 7 | **Takviye** | Kullanıcının sorusu veya mevcut takviyeleri | Yalnız kanıtı güçlü olanlar hakkında bilgi (koçta soru-cevap; kaynaklar IOC uzlaşısı, ISSN kreatin ve kafein bildirgeleri, basketbolda kafein meta-analizi; doz yalnız kaynaktan aktarılır, kişisel doz yok); her zaman doping riski uyarısı, kaynağa bağlı ([0038](decisions/0038-takviye-ve-doping.md)) | 3 |
| 8 | **AI koç** | Hesaplanmış değerler, maç günü işareti ve kanıt tabanı | Günlük özet (Bugün'de, check-in'den sonra, [0033](decisions/0033-koc-ozeti-check-in-sonrasi.md)); soru-cevap (Koç sekmesi: tek soru tek yanıt, bugünün sayılarıyla, günde 10 soru, örnek sorular, geçmiş, [0037](decisions/0037-koc-soru-cevap.md)); her cümle kaynağa veya hesaplanmış değere alıntılı, kaynak yoksa "yeterli kanıt yok"; kırmızı bayrak ve takviyede kodla sabit metin ([0032](decisions/0032-ai-koc-tasarimi.md)) | 3 |

**Haftalık rapor** (Faz 4, [0040](decisions/0040-haftalik-rapor.md)): Trend'den açılır; pazartesi-pazar haftasının yükü (önceki 4 haftayla), günlerin durumu, HRV / nabız / uyku, gece notları, check-in, ağrı (gün gün), beslenme ve sıvı, sabah kilosu. Her gün Bugün ve Trend'deki hesapla okunur; rapor yeni eşik getirmez. Koç yorumu ve paylaşım (uzun vadede PDF, kondisyoner / fizyoterapist / diyetisyen için) henüz yok.

**Vücut görünümü** (Faz 1'de ağrı haritasıyla, [0018](decisions/0018-vucut-gorunumu.md)): döndürülebilir manken; 1 gün / 3 gün / 1 hafta. Hedef (kullanıcı tarifi, Faz 2-3): 3 gün ve 1 haftada o dönemdeki aktivitelerin türü ve yoğunluğu, hangi bölgeleri ne kadar etkilemiş olabileceği, kullanıcı girdileri ve cihaz verisiyle birlikte değerlendirilir ve bölge bazında bir rapor çıkar. Bölge yükünü modül 3 (motor) hesaplar, raporun metnini koç (modül 8) yazar; her ikisi "tahmin" etiketli.

Basketbola özgü odak: sıçrama yükü ve patellar / Aşil tendonu, ani duruş ve yön değiştirmede quadriceps ve adduktorlar, sprintte hamstring, sık maç ve seyahat takvimi.

## 4. Kullanıcı girdileri (cihazın ölçemediği)

| Girdi | Ne zaman | Süre hedefi | Not |
|---|---|---|---|
| **Sabah check-in:** uyku kalitesi, yorgunluk, kas ağrısı, stres, ruh hali | Her sabah | 30 saniye | Hooper / McLean tipi öznel iyi oluş ölçeği; her madde 1-5, 5 = en iyi, toplam 5-25 ([0017](decisions/0017-sabah-check-in-olcegi.md)) |
| **Seans kaydı:** tür (takım antrenmanı, maç, şut, kuvvet, kondisyon, mobilite / yoga, rehabilitasyon), süre, RPE (0-10), maçta oynanan dakika, içerik etiketleri | Her seanstan sonra | 30 saniye | Seans yükü = RPE × dakika. Saatin kaydettiği oturum Bugün ekranında "Saatten gelenler"de çıkar; gün ve süre saatten, tür ve RPE kullanıcıdan ([0020](decisions/0020-seans-etiketleme.md)). İçerik etiketleri türe göre hazır seçili gelir ([0027](decisions/0027-kas-tendon-bolge-yuku.md)) |
| **Ağrı haritası:** bölge ve taraf bazında 0-10 ağrı / sertlik (NRS) | Check-in içinde | 15 saniye | Bölgeler: baldır, Aşil, ayak bileği, patellar tendon, quadriceps, hamstring, adduktor, kalça, bel, omuz; bel dışında sol / sağ ayrı ([0017](decisions/0017-sabah-check-in-olcegi.md)) |
| **Sabah kilo** | Her sabah (isteğe bağlı) | 5 saniye | |
| **Ter testi:** öncesi / sonrası tartı, içilen sıvı | Ara sıra (farklı koşullarda) | 1 dakika | |
| **Beslenme ve su** | Gün içinde (basit) | Öğün başına 15 saniye | Kalori sayacı değil (alım tarafı; yakılan enerji cihazdan, tahmin olarak gösterilir ama alımla karşılaştırılmaz, [0043](decisions/0043-yakilan-enerji.md)); karbonhidrat / protein kaba tahmini. Besin listesinden, etiketten gram ya da Bugün'deki halkadan doğrudan gram |
| **Takvim:** maç günleri, seyahat (saat dilimi) | Haftalık | | Faz 1'de elle; otomatik kaynak açık soru. Faz 3'te Bugün'de tek dokunuşluk "Bugün maç var" işareti ([0032](decisions/0032-ai-koc-tasarimi.md), [0036](decisions/0036-mac-gunu-isareti.md)): işaretli gün beslenmede yoğun, koç maça hazırlık dilini kullanır |

İlke: girdi yükü düşük kalmalı. Her ekran tek elle, birkaç dokunuşla doldurulabilmeli.

## 5. Cihazdan beklenen veriler

Google Health API v4 üzerinden ([karar 0001](decisions/0001-veri-kaynagi-google-health-api.md)): HRV, uyku (süre, evreler), dinlenik nabız, gün içi nabız, SpO2, solunum hızı, egzersiz kayıtları, adım, VO2max / kardiyo skoru. **Fitbit Air'in bunlardan hangilerini, hangi çözünürlükte ürettiği Faz 0'da ölçülecek** ve bu bölüm o ölçüme göre güncellenecek.

## 6. İlkeler

Ayrıntı: [CLAUDE.md §3](../CLAUDE.md) ve [karar 0004](decisions/0004-mimari-hesap-motoru-kanit-ai.md).

- **Kişisel baseline önce gelir.** Ör. HRV, kendi 7 günlük ortalamasının kendi 60 günlük normal bandıyla kıyaslanmasıyla yorumlanır.
- **Sayıları kod hesaplar**, AI yorumlar.
- **Her eşik kaynaklı**; kaynak tıklanınca görünür.
- **Tahmin etiketlidir.** Ölçülemeyen bir şey ölçülmüş gibi sunulmaz.
- **Tıbbi sınır:** teşhis yok; kırmızı bayrakta doktora yönlendirme. Gece işaretlerinin yönlendirmesi IOC'nin sporcularda akut solunum yolu enfeksiyonu uzlaşısındaki sistemik belirtilere dayanır ([0039](decisions/0039-gece-isaretleri.md)).
- **Kanıt hiyerarşisi:** konsensüs → meta-analiz → basketbol / elit sporcu çalışmaları → uzman görüşü. Uzmanlar (ör. Louise Burke, Asker Jeukendrup, Stuart Phillips, Martin Buchheit, Shona Halson, Cheri Mah) yalnız yayınlarıyla kaynak olur; podcast ve sosyal medya iddiaları kaynak değildir.

## 7. Aday kaynaklar (henüz doğrulanmadı)

Planlama sırasında anılan çalışmalar. Doğrulanıp `research/sources`'a girenler işaretli (✓); kalanlar Faz 2'de DOI / PMID ile doğrulanarak eklenecek; künye ayrıntıları o sırada kesinleşir. Doğrulanamayan çıkarılır.

| Modül | Aday |
|---|---|
| Toparlanma | Plews ve ark. 2013 (HRV ile antrenman takibi, Sports Medicine); Buchheit 2014 (nabız ve HRV ile sporcu takibi) |
| Yük | ✓ Foster ve ark. 2001 (seans RPE yöntemi, `foster-2001`; çapalar `haddad-2017`); Williams ve ark. 2017 (üstel ağırlıklı akut/kronik yük); Impellizzeri ve ark. 2020 (akut/kronik oran eleştirisi) |
| İyi oluş ölçeği | ✓ Hooper ve ark. 1995 (`hooper-1995`); ✓ McLean ve ark. 2010 (`mclean-2010`); ek olarak ✓ `saw-2016`, `conte-2018`, `zhang-2026`, `burger-2024` |
| Uyku | Mah ve ark. 2011 (basketbolcularda uyku uzatma); Walsh ve ark. 2021 (sporcu ve uyku uzman konsensüsü, BJSM) |
| Beslenme | Thomas, Erdman ve Burke 2016 (ACSM / AND / DC ortak bildirgesi); Morton ve ark. 2018 (protein meta-analizi); Jäger ve ark. 2017 (ISSN protein bildirgesi); Mountjoy ve ark. 2023 (IOC REDs konsensüsü) |
| Hidrasyon | Sawka ve ark. 2007 (ACSM sıvı bildirgesi); McDermott ve ark. 2017 (NATA bildirgesi) |
| Takviye | Maughan ve ark. 2018 (IOC takviye konsensüsü); Guest ve ark. 2021 (ISSN kafein bildirgesi) |

## 8. Kapsam dışı

- Teşhis veya tıbbi cihaz işlevi.
- Başka kullanıcılar, sosyal özellikler, App Store'da genel yayın.
- Android.
- Antrenman sırasında canlı takip (gerçek zamanlı nabız ekranı).
- Takım / koç paneli. Faz 4'te paylaşılabilir rapor isteğe bağlı olarak değerlendirilebilir.

## 9. Başarı ölçütleri

- Sabah check-in ve günün durumu 1 dakikadan kısa sürede görülüyor.
- Uygulamadaki her öneri, dokunulunca dayandığı kaynağı gösteriyor.
- Sahibi uygulamayı en az 4 hafta boyunca her gün kullanıyor (Faz 1 sonrası gözlem).
- Çıktılar, sahibinin kondisyoneri, fizyoterapisti veya diyetisyeniyle paylaşabileceği kadar güvenilir ve kaynaklı.

## 10. Açık ürün soruları

| Soru | Ne zaman karar |
|---|---|
| Fitbit Air hangi alanları üretiyor, hangi çözünürlükte? | Faz 0 (ölçüm) |
| ~~Check-in ölçeği (1-5, 1-7 veya 0-10)?~~ 1-5, 5 = en iyi ([0017](decisions/0017-sabah-check-in-olcegi.md)) | Faz 1 ✓ |
| Kas / tendon modelinin bölge listesi ve hareket → bölge eşlemesi | Faz 2 başı |
| Maç takvimi elle mi girilecek, otomatik bir kaynak var mı? | Faz 1 |
| Takım staff'ıyla paylaşım isteniyor mu? | Faz 4 |
| ~~Günün durumu maç gününü bilmeli mi?~~ Durumun kendisi değişmez; Bugün'e "Bugün maç var" işareti gelir, koç maç günü hazırlık dilini kullanır ([0032](decisions/0032-ai-koc-tasarimi.md)). Ayrıntılı protokol Faz 4'te | Faz 3 ✓ (koç), Faz 4 (protokol) |
