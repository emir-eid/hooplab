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
- [ ] Tasarım sistemi: renk, tipografi, boşluk, köşe, hareket token'ları (`design:design-system`, `apple-design`)

**Bitiş kriteri:** Seçilmiş yön ve TypeScript tema dosyasına çevrilebilir token seti.

## Faz 1: Temel uygulama (MVP)

- [ ] Expo ve Supabase plugin'lerinin kurulumu (Faz 0'dan devir); SessionEnd / PreCompact arşiv hook'unun doğrulanması
- [ ] Expo projesi (`apps/mobile`), TypeScript strict, Expo Router
- [ ] Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi
- [ ] Supabase oturumu için SecureStore parçalama adaptörü (bkz. LESSONS)
- [ ] Google Health senkronu (Edge Function + zamanlayıcı); gün içi nabız sunucuda özetlenir, ham saklanmaz; adım/mesafe kaynağa göre tekilleştirilir; `swim-lengths-data` yok sayılır
- [ ] Kurulum sihirbazı (kullanıcının kendi Google Cloud / Supabase değerleri, [0009](decisions/0009-herkes-kendi-hesabiyla.md)) ve haftalık "yeniden bağlan" akışı
- [ ] Seans etiketleme: basketbol API'de `SPORT` olarak geliyor; maç / antrenman / şut kullanıcıdan
- [ ] Sabah check-in (uyku kalitesi, yorgunluk, kas ağrısı, stres, ruh hali)
- [ ] Seans kaydı (tür, süre, RPE, oynanan dakika)
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
