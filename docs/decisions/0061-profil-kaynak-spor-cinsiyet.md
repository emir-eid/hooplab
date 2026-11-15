# 0061. Profil: veri kaynağı × spor × cinsiyet; ikinci kullanıcı (Apple Watch, fitness)

- **Durum:** Kabul edildi (kullanıcı, 2026-11-15). Sıra 1 uygulandı ve bulutta (2026-11-15: `profiles`, `source`, kaynak bekçisi, altın test, iki kullanıcılı pgTAP). Sıra 2 tamam (2026-11-15: kütüphane SDK 58'de sahibinin iPhone'unda izin istedi ve 11 tipi okudu, build 0.1.0 (4); [oturum raporu](../sessions/2026-11-15-0028-profil-karari.md) Blok 3). Sıra 3a tamam (2026-11-15: Apple kaynakları ve kural sürümleri, koç tabanı profile göre; [oturum raporu](../sessions/2026-11-15-1541-altin-test-saat-dilimi.md) Blok 3). Sıra 3b-3d ve 4-6 bekliyor. Aday kaynaklar [research/inbox/2026-11-15-profil-0061.md](../../research/inbox/2026-11-15-profil-0061.md).
- **Tarih:** 2026-11-15
- **İlgili:**
  - [0001](0001-veri-kaynagi-google-health-api.md): Apple Health o gün HRV aktarılmadığı için elenmişti
  - [0015](0015-veritabani-tek-sahip-rls.md): "ikinci kullanıcı istenirse yeniden değerlendir" tetikleyicisi
  - [0021](0021-toparlanma-kisisel-bant.md), [0041](0041-gunun-durumunda-nabiz.md): toparlanma bandı ve uyku nabzı (Fitbit yolu, değişmez)
  - [0024](0024-eas-derleme-ve-guncelleme.md): EAS derlemesi ve TestFlight
  - [0032](0032-ai-koc-tasarimi.md): koç; kanıt paketi profile göre süzülecek

## Bağlam

Uygulama tek kullanıcı (sahibi, profesyonel basketbolcu, Fitbit Air / Google Health) için kuruldu (PRODUCT §1). Sahibi, yakın çevresinden **bir** kişiyi TestFlight iç testine almak istiyor: Apple Watch SE ve iPhone kullanıyor, rekreasyonel fitness yapıyor (kuvvet + kardiyo, yarışmacı değil), koçu da kullanacak. Halka açık yayın, kayıt ekranı veya App Store yok (PRODUCT §8 değişmiyor; yalnız "başka kullanıcılar" maddesi davetli tek kişiyle daralıyor).

**Kırmızı çizgi (sahibinin isteği):** sahibinin verisi, hesapları ve ekranları bu işten hiç etkilenmez.

Bugünkü durum:
- Veritabanı zaten kullanıcı başına ayrık: her tabloda `user_id`, RLS `auth.uid() = user_id` (0015); senkron ve bildirim gönderimi kullanıcı kullanıcı dönüyor. Baseline'lar kişinin kendi geçmişinden hesaplanıyor; başka bir hesabın verisi sahibinin bandına karışamaz.
- Profil tablosu yok; kaynak, spor ve cinsiyet örtük (Fitbit, basketbol).
- Motor eşikleri `packages/engine` içinde kural kimliğine bağlı sabitler; HRV `hrv_deep_rmssd_ms`, nabız `nrem_hr_bpm` sütunlarından okunuyor.

## Araştırma özeti (2026-11-14/15)

**Teknik** (resmi belge ve paket kaynağı; URL'ler aşağıda):
- HealthKit kütüphanesi: `@kingstinct/react-native-healthkit` 16.x (Nitro, New Architecture, Expo config plugin, arka plan teslimatı, döngü tipleri). `react-native-health` eski köprüde, bakımı zayıf. SDK 58 / RN 0.88 uyumu **denenmedi** (örnek uygulama Expo 54).
- Apple Watch HRV'yi **SDNN** olarak, kullanıcı hareketsizken fırsat buldukça (varsayılan ~4 saatte bir) ve Breathe oturumlarında ölçer; uykuya özel HRV yok. Fitbit'in derin uyku RMSSD'siyle aynı ölçü değil.
- Okunabilen: SDNN, dinlenik nabız, nabız örnekleri, uyku evreleri, solunum hızı, aktif ve bazal enerji, adım, workout'lar, adet kaydı ve döngü sapmaları. Apple'ın döngü ve yumurtlama **tahminleri API'de yok**. Bilek ısısı yalnız SE 3 ve sonrası (SE 2'de yok); SpO2 ve EKG SE'de yok.
- Arka plan: `enableBackgroundDelivery` en sık saatlik; cihaz kilitliyken HealthKit okunamaz. Veri sunucuya saatler gecikmeyle ulaşabilir; uygulama açılınca ve ön plana geçince yakalama senkronu gerekir.
- TestFlight iç testi App Store Connect kullanıcısı olmayı ister (en düşük uygun rol Developer veya Marketing; App Review gerekmiyor gibi, doğrulanacak). HealthKit kullanan uygulama için uygulama içinde **gizlilik politikası bağlantısı** şart (Guidelines 5.1.1, 5.1.3); sağlık verisi iCloud'a yazılmaz, reklamda kullanılmaz.

**Bilim** (her DOI / PMID Crossref ve PubMed'de sorgulandı; kaynak dosyaları kabulden sonra açılır, `research:check:online` ile):
- Apple Watch nabzı iyi (ogrady-2024 dinlenik nabız MAPE %5,9; lambe-2026b), **HRV'de bireysel hata büyük** (ogrady-2024 MAPE %28,9; miller-2022 ICC 0,67; dobbs-2019 en büyük hata SDNN'de). SDNN kayıt süresine bağlı, RMSSD ile kıyaslanmaz (task-force-1996, munoz-2015). Ln + 7/28 gün bandının SDNN'de denendiği çalışma yok: aktarım **varsayım**.
- Döngü: vagal HRV foliküler → luteal düşer (schmalenberger-2019, d = −0,39); giyilebilir kohortlarda luteal evrede nabız ~3 atım/dk yüksek, HRV ~%14 düşük, solunum ~0,6 nefes/dk yüksek (heneghan-2026, jasinski-2024, dejager-2026); hormonal korunmada genlik küçülür. Faza özel bant veya eşik kaydırma için kanıt yetersiz.
- Döngüye göre antrenman önerisi için kanıt düşük (mcnulty-2020, colensosemple-2023, schlie-2025); kişisel izleme ve semptom kaydı önerilir (sims-2023, bruinvels-2020).
- Fitness: mevcut kuralların çoğu "aktif yetişkin"i kapsıyor (protein, hidrasyon, check-in, seyahat, toparlanma bandı). Maça özgü kurallar ve takım sporu kohortlarından gelen yük artış eşiği (1,5) fitness'ta geçersiz. Yeni alanlar için kaynaklar: WHO 2020 (bull-2020), ACSM 2026 kuvvet antrenmanı (currier-2026), adım (paluch-2022, ding-2025), uyku (watson-2015), RPE'nin kuvvet antrenmanında geçerliliği (lea-2022, day-2004). Kadın-erkek kuvvet antrenmanı yanıtı benzer (roberts-2020): cinsiyete özel kuvvet eşiği gerekmez.

## Seçenekler ve kullanıcı kararları

1. **Ayrım nerede?** (a) Arayüzde cihaz seçimi; (b) kullanıcı başına profil, kural ve veri yolu profile göre. **(b)**, kullanıcının "cihaza, spora, cinsiyete göre araştırma ve hesap değişsin" önerisiyle (2026-11-14).
2. **Apple verisi hangi sütunlara?** (a) Fitbit sütunlarına (`hrv_deep_rmssd_ms`); (b) ayrı sütunlar. **(b)**: SDNN ile RMSSD'nin aynı sütunda karışması şemada imkansız olur.
3. **Apple verisini kim yazar?** (a) İstemci doğrudan tabloya; (b) Edge Function. **(b)**: `health_daily` bugün yalnız sunucunun yazdığı tablo; fonksiyon sınırları denetler ve yalnız `apple_health` profilli hesabın yüklemesini kabul eder.
4. **Döngü verisi buluta nasıl gider?** (a) Ham adet kayıtları; (b) yalnız telefonda hesaplanan döngü günü ve evre etiketi. **(b) önerilir** (veri en aza indirilir; ham kayıt telefondan çıkmaz).
5. **Döngü etkisi nasıl kullanılır?** (a) Faza göre bant / eşik; (b) eşik aynı, işarete açıklama notu. **(b)**: (a) için kanıt yetersiz.

## Karar (taslak)

### Profil
- Yeni tablo `profiles` (kullanıcı başına bir satır, 0015 kalıbı: RLS, dört politika, yalnız `authenticated`):
  - `data_source`: `google_health` | `apple_health`
  - `sport`: `basketbol` | `fitness` (ileride genişler)
  - `sex`: `kadin` | `erkek` | boş
  - `cycle_tracking`: boolean (yalnız `kadin` iken anlamlı)
  - `hormonal_contraception`: `yok` | `var` | `belirtmek_istemiyorum` | boş (kullanıcı kararı: sorulur)
- Migration var olan kullanıcıya `google_health` + `basketbol` yazar, cinsiyeti **boş** bırakır: repoya kişisel bilgi girmez, boş cinsiyet döngü özelliklerini kapatır, sahibinin davranışı birebir aynı kalır.
- Cinsiyet, döngü takibi ve korunma ilk girişte bir kez sorulur (sonradan Ben ekranından değişir). `data_source` ve `sport` hesabı açarken sunucuda atanır; kullanıcı değiştiremez (kaynak değişirse baseline anlamını yitirir).

### Kurallar profile göre
- Kural dosyalarına isteğe bağlı `profile` alanı: `{ "source": [...], "sport": [...], "sex": [...] }`. Alan yoksa kural herkese uygulanır. Aynı `id` için profil sürümleri ayrı kimlikle yazılır (ör. `hrv-olcu` → `hrv-olcu-apple`), kendi kaynaklarıyla.
- `npm run research:check` her profil bileşimi için her modülde en çok bir kuralın seçildiğini ve seçilen kuralın kaynağı olduğunu denetler.
- Motorda Fitbit sabitleri **değişmez**; profil sürümleri yanlarına eklenir, seçim profile göre yapılır.
- Koç paketi (`research:kb`) profile göre süzülür: modele yalnız o kullanıcının profiline uyan kurallar ve kaynaklar gider.

### Apple Watch yolu (`apple_health`)
- **HRV:** yalnız uyku penceresine düşen SDNN örneklerinin gecelik ortalaması, ayrı sütun (`hrv_sleep_sdnn_ms`). Bant yöntemi aynı (ln, 7/28 gün, ± 0,5 SD), `notes`: "SDNN için doğrudan kanıt yok, aktarım varsayımı". Arayüzde "tahmin" etiketi. Gece örnek yoksa değer boş (uydurma yok).
- **Uyku nabzı:** uyku evrelerindeki nabız örneklerinin ortalaması, ayrı sütun (`sleep_hr_bpm`). NREM'e özgü değil; `notes`'ta belirtilir.
- **Günün durumu:** "toparlan" yine iki işaret birlikteyken (HRV düşük + uyku nabzı yüksek). Apple'da "dikkat" **tek başına SDNN ile tetiklenmez** (bireysel hata ~%29); uyku nabzı ve uyku süresiyle tetiklenir.
- **Enerji:** aktif + bazal enerji; mevcut "tahmin" kuralının Apple sürümü (lambe-2026b, choe-2025).
- **Modelden bağımsız:** uygulama saat modelini sormaz ve modele göre dallanmaz. HealthKit'te bir tip için veri varsa kullanılır, yoksa ilgili kart ve işaret görünmez ("veri yok" denir, uydurulmaz). Aynı kod SE 2, SE 3 ve Series / Ultra'da çalışır; saat değişirse kendiliğinden yeni tipler devreye girer.
- **Kapalı (veri gelmedikçe):** SpO2'ye dayanan gece işareti; bilek ısısı işareti (SE 3 ve Series 8+ veri üretir; Apple sürümü kuralı ve kaynağı ayrı iş, o zamana kadar gösterilmez).
- **Senkron:** observer + saatlik arka plan teslimatı, anchored sorgu ile yalnız yeni veri; uygulama açılınca ve ön plana geçince yakalama senkronu. Yükleme `healthkit-ingest` Edge Function'a.
- Google Health ekranı ve senkron durum satırı `apple_health` profilinde gizlenir.

### Fitness yolu (`fitness`)
- **Kapalı:** maç günü, maç takvimi ve maç çevresi; yük artış notu (`yuk-artis-notu`); basketbola / takım sporuna özgü takviye kaynakları; sıçrama, yön değiştirme ve sprint bölge eşlemeleri.
- **Değişen:** karbonhidrat gün tipleri (dinlenme / antrenman günü; kerksick-2018, thomas-2016 mevcut); seans etiketleri varsayılanı alt / üst vücut kuvvet ve kardiyo; RPE kuralına kuvvet antrenmanı kaynakları; uyku kuralının kaynağı genel yetişkin (watson-2015); günün durumu dili daha temkinli (HRV rehberli antrenmanın rekreasyonel bireyde üstünlüğü gösterilemedi).
- **Aynı:** protein, hidrasyon, check-in, ağrı, seyahat (takım sporu cümleleri metinden çıkar), toparlanma yöntemi, takviye doping uyarısı.
- **Sonraki aşama (bu kararın dışında):** adım, haftalık aktivite (WHO), kuvvet antrenmanı hacmi ve sıklığı. Önce mevcut modüllerin uyarlanması.

### Döngü (`sex = kadin` ve `cycle_tracking = true`)
- Telefon HealthKit adet kayıtlarından döngü gününü ve kaba evreyi (adet, foliküler, luteal, adet öncesi) hesaplar; buluta yalnız `local_date`, döngü günü ve evre gider (yeni tablo `cycle_days`). Ham adet kaydı telefondan çıkmaz.
- Geç luteal ve adet öncesi günlerde "HRV düşük" veya "uyku nabzı yüksek" işaretine **"döngüyle uyumlu olabilir"** notu eklenir. Bant ve eşik değişmez. Hormonal korunma `var` ise not zayıflatılır (genlik küçük).
- Döngüye göre antrenman önerisi **yok**. Koç döngü günü görmez; yalnız motorun notunu görür.
- Adet düzensizliği veya kesilmesi (HealthKit döngü sapması kaydı) görülürse yorum yapılmaz, doktora yönlendirilir (REDs ve tıbbi sınır, CLAUDE.md §3). Demir takviyesi önerilmez.

### Sahibini koruyan bekçiler
1. **Altın test:** değişiklikten önce sentetik Fitbit · basketbol verisiyle motorun ve görünüm katmanının çıktısı kilitlenir; bu iş boyunca bir bayt değişirse test düşer.
2. **İki kullanıcılı pgTAP:** biri ötekinin hiçbir satırını göremez; `ghealth-sync` yalnız `google_health`, `healthkit-ingest` yalnız `apple_health` profiline yazar; sahibinin profil satırı istemciden `data_source` / `sport` değiştiremez.
3. **Kaynak sütunu:** `health_daily`, `sleep_sessions`, `exercise_sessions` satırlarına `source`; profil kaynağıyla uyuşmayan satır CHECK / tetikleyiciyle reddedilir.
4. Fitbit kural dosyaları ve motor sabitleri yalnız ekleme alır; mevcut kural `id`'leri değişmez.

### Hesap, TestFlight, gizlilik
- Hesap Supabase'te CLI / Admin API ile açılır; şifreyi kullanıcı kendisi koyar. E-posta ve ad repoya ve oturum raporuna girmez (`private/ops.md`).
- TestFlight: App Store Connect'e en düşük uygun rolle eklenir, iç testçi olur (konsoldan; kullanıcı işi).
- Gizlilik politikası sayfası (`hooplab.dev`, TR / EN) ve uygulama içinde bağlantı (Guidelines 5.1.1).
- İlk girişte açık rıza ekranı: ne saklanır, nereye gider (Supabase Frankfurt; koç kullanılırsa sayılar Anthropic'e), **veritabanı yöneticisi verileri teknik olarak görebilir**, silme talebiyle tüm veri silinir (`on delete cascade`).
- DATA-INVENTORY (yeni veri türleri: HealthKit, döngü günü, profil) ve COSTS (koç maliyeti kullanıcı başına, EAS derlemesi) aynı commit'te.

## Uygulama sırası (her biri ayrı `/rep`)
1. Profil tablosu, kaynak sütunu, altın test, iki kullanıcılı pgTAP. Sahibinin davranışı değişmez; kanıtı altın test.
2. HealthKit denemesi: dev client derlemesi, kütüphane SDK 58'de okuyor mu (sahibinin iPhone'unda sentetik / test hesabıyla, yükleme kapalı).
3. `healthkit-ingest`, Apple sütunları, Apple kural sürümleri ve kaynak dosyaları.
4. Fitness modül matrisi (kapalı / değişen modüller, ilk giriş profil ekranı).
5. Döngü (telefonda hesap, `cycle_days`, not).
6. Gizlilik sayfası, rıza ekranı, hesap, TestFlight daveti; ilk hafta veri gecikmesi sahada ölçülür.

## Kullanıcı cevapları (2026-11-15)
1. **Saat nesli bilinmiyor:** model sorulmaz; Apple yolu veri varlığına göre çalışır (yukarıda "Modelden bağımsız").
2. **Hormonal korunma sorulur:** ilk girişte, "belirtmek istemiyorum" seçeneğiyle; sonradan Ben ekranından değişir.
3. **Döngü Takibi aktif kullanılıyor:** döngü aşaması (sıra 5) planda kalır.

## Sonuçlar
- PRODUCT §1 ve §8 güncellenir: "tek kullanıcı" → "sahibi + davetli bir kullanıcı; genel yayın yok".
- 0015'in yeniden değerlendirme tetikleyicisi bu kararla karşılanır; RLS kalıbı aynı kalır.
- Ayda 15 iOS derlemesi kotasından ek derlemeler kullanılır (dev client + TestFlight).
- Koç maliyeti ikinci kullanıcının kullanımı kadar artar (`coach:usage` kullanıcı başına ayrılır).
- Kalıcı ölçüm: Apple yolunda gece SDNN örnek sayısı ve veri gecikmesi ilk iki haftada ölçülür; gece örneği azsa HRV Apple'da yalnız gösterilir, duruma girmez.

## Kaynaklar (teknik olgular)
- https://github.com/kingstinct/react-native-healthkit · https://www.npmjs.com/package/@kingstinct/react-native-healthkit
- https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/heartratevariabilitysdnn
- https://www.apple.com/health/pdf/Heart_Rate_Calorimetry_Activity_on_Apple_Watch_November_2024.pdf
- https://developer.apple.com/documentation/healthkit/hkcategorytypeidentifier
- https://developer.apple.com/documentation/healthkit/hkhealthstore/enablebackgrounddelivery(for:frequency:withcompletion:)
- https://developer.apple.com/documentation/healthkit/protecting-user-privacy
- https://www.apple.com/apple-watch-se-3/specs/ · https://www.apple.com/watch/compare/
- https://docs.expo.dev/build-reference/ios-capabilities/
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers
- https://developer.apple.com/app-store/review/guidelines/
