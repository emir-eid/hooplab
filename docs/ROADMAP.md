# Yol haritası

Her faz, bitiş kriteri karşılanınca `/kapat` ile kapanır: faz özeti `docs/phases/faz-N.md` dosyasına yazılır ve `faz-N-tamam` git etiketi atılır.

## Faz 0: Veri erişimi testi ve altyapı ✓ ([özet](phases/faz-0.md))

- [x] Proje yapısı, oturum sistemi (`/ac`, `/kapat`), hook'lar, gizlilik bekçisi, kaynak doğrulayıcı, CI
- [x] Gizlilik altyapısı eklemeleri: geçmiş taraması, CI'da denylist desteği, `private` Drive yedeği ([0008](decisions/0008-gizlilik-altyapisi-eklemeleri.md))
- [x] Ürün tanımı, maliyet/hesaplar, veri envanteri, yeni makine rehberi
- [x] Skill seti: kopyalanan skill'ler yüklü (Expo ve Supabase plugin kurulumu Faz 1'e devredildi)
- [x] SessionStart hook'u tetikleniyor (doğrulandı); SessionEnd / PreCompact doğrulaması Faz 1'e devredildi
- [x] `GUARD_DENYLIST` GitHub secret'ı (kullanıcı ekledi; CI'ın okuduğu doğrulandı)
- [x] Google Cloud projesi + Google Health API + OAuth istemcisi (kullanıcı)
- [x] Go kurulumu, `ghealth` CLI derleme, giriş
- [x] Son 30 günün verisi `../private/data/` klasörüne (HRV, uyku evreleri, dinlenik nabız, nabız, SpO2, solunum, egzersiz)
- [x] Ölçülenler: erişim var mı, Türkiye hesabında veri dönüyor mu, Fitbit Air'in ürettiği alanlar, veri çözünürlüğü, token ömrü
- [x] Karar 0001 kesinleşti (veya B planı)
- [x] "Herkes kendi hesabıyla" ilkesi ([0009](decisions/0009-herkes-kendi-hesabiyla.md)) ve [Google Health bağlantısı rehberi](guides/google-health-baglantisi.md)
- Takip: yenileme token'ının 7. günde düştüğünün pratik ölçümü (2026-10-10 civarı, STATE'te)

**Bitiş kriteri:** Kendi verine programatik erişimin çalıştığı (veya çalışmadığı ve B planının seçildiği) ölçülerek kanıtlandı.

## Faz 0.5: Tasarım yönü

- [x] 2-3 farklı görsel yön, telefon boyutunda HTML maket (`frontend-design`): [design/maketler/](../design/maketler/index.html)
- [x] Kullanıcı seçimi: C · Hale, açık ve koyu tema ([0010](decisions/0010-tasarim-yonu-hale.md)); hale aracı [0011](decisions/0011-hale-efekti-svg.md)
- [x] Tasarım sistemi: renk, tipografi, boşluk, köşe, hareket token'ları: [packages/theme](../packages/theme/README.md) ([0013](decisions/0013-tasarim-tokenlari.md))

**Bitiş kriteri:** Seçilmiş yön ve TypeScript tema dosyasına çevrilebilir token seti.

## Faz 1: Temel uygulama (MVP)

- [x] Expo ve Supabase plugin'lerinin kurulumu (Faz 0'dan devir; 2026-10-03)
- [ ] SessionEnd / PreCompact arşiv hook'unun doğrulanması
- [x] Expo projesi (`apps/mobile`), TypeScript strict, Expo Router (2026-10-04, [0014](decisions/0014-uygulama-iskeleti.md))
- [x] Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi (2026-10-04, [0015](decisions/0015-veritabani-tek-sahip-rls.md); şema ilk tabloyla, diğer tablolar formlarla)
- [x] Supabase oturumu için SecureStore parçalama adaptörü (2026-10-04, testli)
- [x] Google Health senkronu (Edge Function + zamanlayıcı); gün içi nabız sunucuda özetlenir, ham saklanmaz; adım/mesafe kaynağa göre tekilleştirilir; `swim-lengths-data` yok sayılır (2026-10-04, [0019](decisions/0019-google-health-senkronu.md); bulutta ve iPhone'da doğrulandı). Haftalık "yeniden bağlan" akışı da bu işte geldi (Ben → Google Health)
- [ ] Kurulum sihirbazı (kullanıcının kendi Google Cloud / Supabase değerleri, [0009](decisions/0009-herkes-kendi-hesabiyla.md)); haftalık "yeniden bağlan" akışı Google Health senkronuyla geldi
- [x] Seans etiketleme: basketbol API'de `SPORT` / `BASKETBALL` olarak geliyor; maç / antrenman / şut kullanıcıdan (2026-10-04, [0020](decisions/0020-seans-etiketleme.md); Bugün → Saatten gelenler; bulutta ve iPhone'da doğrulandı)
- [x] Sabah check-in (uyku kalitesi, yorgunluk, kas ağrısı, stres, ruh hali) + ağrı haritası (2026-10-04, [0017](decisions/0017-sabah-check-in-olcegi.md); web ve iPhone'da doğrulandı; kaydırıcı Gesture Handler'la)
- [x] Seans kaydı (tür, süre, RPE, oynanan dakika) (2026-10-04; web ve iPhone'da doğrulandı)
- [x] Vücut görünümü: döndürülebilir 3D manken, ağrı haritası, 1 gün / 3 gün / 1 hafta (2026-10-04, [0018](decisions/0018-vucut-gorunumu.md); iPhone'da doğrulandı). Filtrenin bölge yükü raporu Faz 2'de
- [ ] Toparlanma ekranı (HRV / dinlenik nabız / uyku, kişisel banda göre)
- [ ] Demo modu (sentetik "demo sporcu")
- [ ] Apple Developer Programı, EAS Build, TestFlight
- [ ] Public'e geçiş öncesi denetim: `npm run guard:history` temiz (denylist dosyası ve secret ile), README hikayesi, LICENSE (MIT), GitHub secret scanning + push protection
- [ ] Repo public

**Bitiş kriteri:** Uygulama iPhone'da TestFlight'tan kurulu, gerçek veriyle her gün kullanılabiliyor; repo public ve temiz.

## Faz 2: Hesap motoru (`packages/engine`)

- [ ] Kişisel baseline'lar (HRV, dinlenik nabız, uyku, solunum)
- [ ] Antrenman yükü: seans yükü (RPE × dakika), akut/kronik yük, monotonluk
- [ ] Kas ve tendon bölge yükü modeli (tahmin olarak etiketli), ağrı haritasıyla kalibrasyon
- [ ] Beslenme hedefleri (yük gününe göre karbonhidrat/protein g/kg), enerji yetersizliği uyarısı
- [ ] Hidrasyon: ter oranı testi, sıvı hedefi
- [ ] Her eşik `research/rules` + doğrulanmış `research/sources` kaydına bağlı

## Faz 3: AI koç

- [ ] Kanıt tabanının Supabase'e (pgvector) yüklenmesi
- [ ] Günlük özet: hesaplanmış sayılar + ilgili kanıtlar → Claude, her iddia kaynaklı
- [ ] Soru-cevap: yalnız kanıt tabanından, kaynak yoksa "yeterli kanıt yok"
- [ ] Kırmızı bayrak ve doping güvenlik kuralları

## Faz 4: Son rötuşlar

- [ ] Bildirimler
- [ ] Haftalık rapor
- [ ] Maç günü ve seyahat protokolleri
- [ ] Performans skill'i (Vercel React Native kuralları) ve performans turu
- [ ] iOS uçtan uca test (EAS Workflows + Maestro veya EAS Simulator)
- [ ] Portfolyo sayfası
