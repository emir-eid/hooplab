# Yol haritası

Her faz, bitiş kriteri karşılanınca `/kapat` ile kapanır: faz özeti `docs/phases/faz-N.md` dosyasına yazılır ve `faz-N-tamam` git etiketi atılır.

## Faz 0: Veri erişimi testi ve altyapı

- [x] Proje yapısı, oturum sistemi (`/ac`, `/kapat`), hook'lar, gizlilik bekçisi, kaynak doğrulayıcı, CI
- [x] Skill seti (Expo, Supabase, animate-expo, apple-design, review-animations, react-native-best-practices)
- [ ] Google Cloud projesi + Google Health API + OAuth istemcisi (kullanıcı)
- [ ] Go kurulumu, `ghealth` CLI derleme, giriş
- [ ] Son 30 günün verisi `../private/data/` klasörüne (HRV, uyku evreleri, dinlenik nabız, nabız, SpO2, solunum, egzersiz)
- [ ] Ölçülenler: erişim var mı, Türkiye hesabında veri dönüyor mu, Fitbit Air'in ürettiği alanlar, veri çözünürlüğü, token ömrü
- [ ] Karar 0001 kesinleşti (veya B planı)

**Bitiş kriteri:** Kendi verine programatik erişimin çalıştığı (veya çalışmadığı ve B planının seçildiği) ölçülerek kanıtlandı.

## Faz 0.5: Tasarım yönü

- [ ] 2-3 farklı görsel yön, telefon boyutunda HTML maket (`frontend-design`)
- [ ] Kullanıcı seçimi
- [ ] Tasarım sistemi: renk, tipografi, boşluk, köşe, hareket token'ları (`design:design-system`, `apple-design`)

**Bitiş kriteri:** Seçilmiş yön ve TypeScript tema dosyasına çevrilebilir token seti.

## Faz 1: Temel uygulama (MVP)

- [ ] Expo projesi (`apps/mobile`), TypeScript strict, Expo Router
- [ ] Supabase projesi (Frankfurt), şema, RLS, tek kullanıcı girişi
- [ ] Supabase oturumu için SecureStore parçalama adaptörü (bkz. LESSONS)
- [ ] Google Health senkronu (Edge Function + zamanlayıcı)
- [ ] Sabah check-in (uyku kalitesi, yorgunluk, kas ağrısı, stres, ruh hali)
- [ ] Seans kaydı (tür, süre, RPE, oynanan dakika)
- [ ] Toparlanma ekranı (HRV / dinlenik nabız / uyku, kişisel banda göre)
- [ ] Demo modu (sentetik "demo sporcu")
- [ ] Apple Developer Programı, EAS Build, TestFlight
- [ ] Public'e geçiş öncesi denetim: tüm git geçmişinde gizlilik taraması, README hikayesi, LICENSE (MIT), GitHub secret scanning + push protection
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
