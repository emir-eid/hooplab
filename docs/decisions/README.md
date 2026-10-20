# Karar kayıtları

Kod ne yapıldığını gösterir, nedenini göstermez. Bu klasör "neden böyle yaptık" sorusunun cevabıdır. Her mimari, ürün, araç veya süreç kararı bir dosyadır. Kararlar silinmez; değişen karar yeni bir kayıtla yerini alır ve eskisinin durumu güncellenir.

Kayıtları `/rep` veya `/kapat` açar. Ad biçimi: `NNNN-kisa-ad.md` (sıradaki numara).

## Şablon

```markdown
# NNNN. Başlık

- **Durum:** Önerildi | Kabul edildi | Yerini aldı: NNNN | Geri çekildi
- **Tarih:** YYYY-AA-GG
- **İlgili:** (diğer kararlar, oturum raporu)

## Bağlam
Hangi sorun ya da ihtiyaç bu kararı gerektirdi? Hangi kısıtlar vardı?

## Seçenekler
1. **Seçenek A:** artıları / eksileri
2. **Seçenek B:** artıları / eksileri

## Karar
Hangisi seçildi ve tek paragrafta neden.

## Sonuçlar
- Kabul edilen dezavantajlar
- Bu kararın açtığı veya kapattığı yollar
- Yeniden değerlendirme tetikleyicisi (hangi durumda bu karara geri dönülür)
```

## Dizin

| No | Karar | Durum |
|---|---|---|
| [0001](0001-veri-kaynagi-google-health-api.md) | Veri kaynağı: Google Health API v4 | Kabul edildi, Faz 0'da doğrulandı |
| [0002](0002-platform-expo-react-native.md) | Platform: Expo (React Native), PWA değil | Kabul edildi |
| [0003](0003-backend-supabase.md) | Backend: Supabase (Frankfurt) | Kabul edildi |
| [0004](0004-mimari-hesap-motoru-kanit-ai.md) | Mimari: deterministik hesap motoru + kanıt tabanı + AI yorum | Kabul edildi |
| [0005](0005-repo-ve-gizlilik-ayrimi.md) | Repo ve gizlilik: code/private ayrımı, önce private sonra public | Kabul edildi |
| [0006](0006-calisma-sistemi.md) | Çalışma sistemi: /ac-/kapat, STATE, hook'lar, CI, zamanlanmış görevler | Kabul edildi |
| [0007](0007-skill-seti.md) | Skill seti | Kabul edildi |
| [0008](0008-gizlilik-altyapisi-eklemeleri.md) | Gizlilik altyapısı: Drive yedeği, CI'da denylist, geçmiş taraması | Kabul edildi |
| [0009](0009-herkes-kendi-hesabiyla.md) | Herkes kendi hesabıyla: merkezi servis yok | Kabul edildi |
| [0010](0010-tasarim-yonu-hale.md) | Tasarım yönü: C · Hale, açık ve koyu tema (Sistem / Açık / Koyu) | Kabul edildi |
| [0011](0011-hale-efekti-svg.md) | Hale efekti: react-native-svg radyal gradyan + Reanimated transform | Kabul edildi |
| [0012](0012-ara-rapor-rep.md) | Ara rapor: /rep (oturum içinde kayıt + push, oturum açık kalır) | Kabul edildi |
| [0013](0013-tasarim-tokenlari.md) | Tasarım token'ları: @hooplab/theme, maketle birebir test, erişilebilir renkler, opsz 96 kesimi | Kabul edildi |
| [0014](0014-uygulama-iskeleti.md) | Uygulama iskeleti: apps/mobile (SDK 57), özel cam sekme çubuğu, cihazda saklanan görünüm tercihi | Kabul edildi |
| [0015](0015-veritabani-tek-sahip-rls.md) | Veritabanı: tek sahip RLS, açık GRANT, migration'lar repoda, oturum Keychain'de parçalı | Kabul edildi |
| [0016](0016-dis-servisleri-claude-yurutur.md) | Dış servis işlemlerini Claude yürütür (CLAUDE.md §7) | Kabul edildi |
| [0017](0017-sabah-check-in-olcegi.md) | Sabah check-in: beş madde 1-5 (5 = en iyi), ağrı haritası sol / sağ, NRS 0-10 | Kabul edildi |
| [0018](0018-vucut-gorunumu.md) | Vücut görünümü: stilize 3D manken (three.js + expo-gl), ağrı haritası, aşamalı bölge raporu | Kabul edildi |
| [0019](0019-google-health-senkronu.md) | Google Health senkronu: Web OAuth istemcisi + Edge Functions, günlük özetler (ham nabız yok), saatlik zamanlayıcı | Kabul edildi |
| [0020](0020-seans-etiketleme.md) | Seans etiketleme: saat oturumu ile seans kaydı bire bir bağlanır, tür ve RPE kullanıcıdan, "Seans değil" | Kabul edildi |
| [0021](0021-toparlanma-kisisel-bant.md) | Toparlanma: derin uyku HRV'si, 7 gün / 4 hafta kişisel bant (± 0,5 SD), HRV öncelikli günün durumu | Kabul edildi |
| [0022](0022-demo-modu.md) | Demo modu: uygulama içi, çevrimdışı sentetik sporcu, kayıtlar bellekte, durum seçici | Kabul edildi |
| [0023](0023-kurulum-sihirbazi-terminalde.md) | Kurulum sihirbazı terminalde: `npm run setup` kurar, `--check` denetler, uygulama eksikliği söyler | Kabul edildi |
| [0024](0024-eas-derleme-ve-guncelleme.md) | EAS derleme ve güncelleme: mevcut Expo hesabı, kimlik ortamdan, fingerprint, tek üretim profili | Kabul edildi |
| [0025](0025-antrenman-yuku.md) | Antrenman yükü: bileşenler ayrı, EWMA oranı yalnız bağlam, 1,5 üstünde tahmin etiketli bilgi notu, monotonluk eşiksiz | Kabul edildi |
| [0026](0026-aciklama-sayfalari-ve-tur-rengi.md) | Açıklama sayfaları (Bu ne? · Nasıl okunur? · Neye göre? · Kaynaklar) ve yük grafiğinde seans türü rengi | Kabul edildi |
| [0027](0027-kas-tendon-bolge-yuku.md) | Kas ve tendon bölge yükü: içerik etiketleri, katsayısız eşleme, toparlanma penceresi (tendon 48, kas 72 saat), ağrı izleme | Kabul edildi |
| [0028](0028-solunum-ve-checkin-kisisel.md) | Solunum ve check-in için kişisel kıyas: solunum bandı ve tek gece notu (+3 nefes/dk), check-in z-skoru (≤ −1 not); günün durumuna girmez | Kabul edildi |
| [0029](0029-beslenme-ve-hidrasyon.md) | Beslenme ve hidrasyon: gün tipine göre karbonhidrat (3-5 / 5-7 / 8-10 g/kg), protein 1,2-2,0 g/kg, seansa bağlı ter testi (%2 kayıp, kilo artışı notu, sıvı hedefi); REDs için uyarı yok | Kabul edildi |
| [0030](0030-ogun-kaydi.md) | Öğün kaydı: FDC'den sabit besin listesi (ev ölçüsü, gram) ve etiketten gram; alım hedef aralığa yerleştirilir (tahmin, renksiz); REDs için yine uyarı yok | Kabul edildi |
| [0031](0031-su-kaydi-ve-renkli-bugun.md) | Su kaydı (hedefsiz, + ve Bugün'den hızlı ekleme), Bugün'de beslenme halkaları ve kategori rengi (karbonhidrat / protein / su), kaydırarak silme | Kabul edildi |
| [0032](0032-ai-koc-tasarimi.md) | AI koç: Claude Sonnet 5.5, vektör araması yok (kural grafiğiyle seçim + önbellekli tam taban), citations ile kaynak zorunluluğu ve sayı denetimi, kodla güvenlik yönlendirmesi, maç günü işareti | Kabul edildi |
| [0033](0033-koc-ozeti-check-in-sonrasi.md) | Koçun günlük özeti check-in'den sonra yazılır (öncesinde yalnız bakılır, elle yazdırılabilir); kart cümleleri alıntıladıkları ölçümün konusuna göre gruplar | Kabul edildi |
| [0034](0034-koc-kismi-kabul.md) | Koç özetinde kısmi kabul: denetimden geçmeyen cümle atılır, gerisi gösterilir (durum cümlesi ve en az 3 cümle şartıyla); atılan sayısı kartta yazar | Kabul edildi |
| [0035](0035-koc-kaynak-secimi-dikkat.md) | Günlük özette yalnız dikkat isteyen ölçümlerin kaynakları (bandın dışı, not, bölge / ağrı / ter testi; durum ve beslenme her zaman); ölçüme dayalı, çağrı başına ~%21 daha az | Kabul edildi |
| [0036](0036-mac-gunu-isareti.md) | "Bugün maç var" işareti: `match_days` tablosu, işaretli gün beslenmede yoğun (günün durumu değişmez), koçta `mac-gunu` kuralı ve ısınma kaynakları (fradkin-2010, mcgowan-2015), eskiyen özette "Yeniden yaz" önerisi | Kabul edildi |
| [0037](0037-koc-soru-cevap.md) | Koçta soru-cevap: tek soru tek yanıt, bugünün sayılarıyla, günde 10 soru; Haiku sınıflandırır (tıbbi ve kapsam dışı sabit metne, takviyede doping uyarısı); kaynağın sayısı yalnız alıntılanan metinde varsa kabul | Kabul edildi |
| [0038](0038-takviye-ve-doping.md) | Takviye ve doping: IOC uzlaşısı, ISSN kreatin ve kafein bildirgeleri, basketbolda kafein meta-analizi; koç dozu yalnız kaynaktan aktarır, kişisel doz yok; doping uyarısı `takviye-doping-riski` kuralına ve IOC kaynağına bağlı | Kabul edildi |
| [0039](0039-gece-isaretleri.md) | Gece işaretleri: dinlenik nabız (iki gece medyanın 4 atım/dk üstü, alavi-2022), SpO2 (3 gecenin 2sinde %93,5 altı ya da medyanın 3 puan altı), cilt sıcaklığı (iki gece tabanın 0,3 °C üstü); tahmin, tanı yok, günün durumuna girmez; IOC uzlaşısına dayalı sabit yönlendirme; koçta `signs` ve `illness_signs` | Kabul edildi |
| [0040](0040-haftalik-rapor.md) | Haftalık rapor: takvim haftası (pazartesi-pazar, biten hafta varsayılan, geçmişe dönülür), her gün mevcut kurallarla okunup toplanır, yeni eşik yok; yük pazarda biter, önceki 4 haftayla monotonluk / gerilim; koç yorumu ve paylaşım (uzun vadede PDF) sonra | Kabul edildi |
| [0041](0041-gunun-durumunda-nabiz.md) | Günün durumunda nabız: Google'ın bütün gün dinlenik nabzı yerine HRV ile aynı gecenin NREM uyku nabzı; nabız yalnız HRV de düşükken "Toparlan"a çeker, tek başına not; gece nabzı notu da uyku nabzına geçer (bosquet-2008, roete-2021, altini-2021, nuuttila-2022) | Kabul edildi |
| [0043](0043-yakilan-enerji.md) | Yakılan enerji: bilekliğin günlük toplamı (Bugün, şu ana kadar), seans kalorisi ve haftalık toplam; tahmin etiketli (tipik hata %15-30, 7 kaynak), 10 kcal'e yuvarlanır; eşik ve hedef yok, alımla karşılaştırılmaz, koça gitmez | Kabul edildi |
| [0042](0042-okunabilirlik-kartlar-ve-kisaca.md) | Okunabilirlik: kartta büyük sayı günün durumunun baktığı ortalama, "Son gece" / "Aralığın" / "Hedef" satırları, ekranda "aralığın"; her açıklamada zorunlu kısa cümle, durumu belirleyen ölçümlerde "Neyi hedefliyoruz" ve "Senin değerlerin"; sınırda bir ondalık fazla, uyku aşağı kesilir | Kabul edildi |
| [0044](0044-saatlik-yakilan-enerji.md) | Saatlik yakılan enerji: senkron `total-calories` rollUp'ını saatlik çeker (bugün + 7 gün, yerel gece yarısından), yeni tablo `health_hourly_energy`; Bugün'deki kartta dokunarak seçilen saatlik grafik, oklarla geriye 7 gün; tahmin, nötr renk, eşik yok, koça gitmez | Kabul edildi |
| [0045](0045-yerel-bildirimler.md) | Bildirimler: telefonda zamanlanan yerel hatırlatmalar (sabah check-in seçilen saatte, yapılmışsa gelmez; Google izni dolmadan 24 ve 3 saat önce, senkron durmuşsa ertesi sabah); metinde sağlık değeri yok; push ve maç sabahı hatırlatması sonra | Kabul edildi |
| [0046](0046-mac-takvimi-ve-mac-cevresi.md) | Maç takvimi (`match_days` + saat ve yer) ve maç çevresi: MD-1 / MD / MD+1 notları Bugün'de (öğün, sıvı, şekerleme saatleri maç saatinden; maç gecesi uykusu), yeni gün tipi "maç çevresi" 6-8 g/kg (UEFA uzman grubu; maç günü 8-10'dan indi), maç sabahı hatırlatması, koça maç çevresi; günün durumu değişmez | Kabul edildi |
| [0047](0047-seyahat-ve-jet-lag.md) | Seyahat ve jet lag: `trips` (gidiş, dönüş, saat farkı; yer yok), yolculuk günü notları, konsensüsün kaba kuralıyla gün gün uyum tahmini (doğu 1, batı 2 saat/gün; dönüşte ters yön), kişisel ışık penceresi yok, melatonin yalnız açıklamada uyarıyla; koça `travel`; günün durumu değişmez | Kabul edildi |
| [0048](0048-performans-turu.md) | Performans turu: Vücut'un 3D sahnesi (three.js) dinamik `import()` ile, oturum depolamasında bellek önbelleği, Bugün ve Trend odakta yalnız veri sürümü değiştiyse / gün döndüyse / 5 dk geçtiyse yeniden çeker | Kabul edildi |
| [0049](0049-uctan-uca-test-web-webkit.md) | Uçtan uca test: uygulamanın web çıktısı (boş Supabase değerleri) + Playwright WebKit, iPhone boyutu, demo modu; her JS hatası testi kırar; CI'da ayrı iş; iOS simülatöründe otomatik test yok (EAS Simulator erişimi yok, EAS Maestro ücretli) | Kabul edildi |
| [0050](0050-portfolyo-sayfasi.md) | Portfolyo sayfası: İngilizce + Türkçe tanıtım ve uygulamanın yalnız demo web derlemesi (alt yol, tek sayfa, doğrudan demoyla açılır, sunucusuz), GitHub Pages'te Actions'la; sayılar ve kaynak izi örneği derlemede repodan | Kabul edildi |
| [0051](0051-haftalik-rapor-pdf.md) | Haftalık raporun PDF'i: görünüm nesnesinden telefonda HTML → PDF (`expo-print`), bölümleri kullanıcı seçer, iOS paylaşım menüsüyle (`expo-sharing`) kullanıcının seçtiği alıcıya; kimlik yok, sunucu yok, dosya paylaşımdan sonra silinir | Kabul edildi |
| [0052](0052-haftalik-koc-yorumu.md) | Haftalık koç yorumu: yalnız biten hafta, istek üzerine (hafta başına 2 deneme), `coach-weekly` + `coach_weekly_summaries`, "Haftanın sayıları" belgesi, günlük özetle aynı model / denetçi / kısmi kabul; kilo ve enerji gitmez; PDF'e isteğe bağlı bölüm | Kabul edildi |
| [0053](0053-alan-adi-ve-google-yayin.md) | Alan adı `hooplab.dev` (Vercel DNS → GitHub Pages), site kökte, gizlilik politikası, Google geri dönüşü statik yönlendirme sayfasıyla; Google OAuth "In production" (doğrulamasız, logo yok), 7 günlük sınırın kalktığı ölçülecek | Kabul edildi |
| [0054](0054-pwa-yedek-yolu.md) | Apple kaydı uzarsa PWA yedek yolu: 2026-11-03'e kadar Expo Go + tünel; sonuç yoksa aynı koddan PWA (manifest, Google dönüş adresi, ayrı web derlemesi; bildirim yolu ayrıca), Apple yolu açık kalır | Önerildi |
