# 0015. Veritabanı: tek sahip RLS, açık GRANT, migration'lar repoda, oturum Keychain'de parçalı

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-04
- **İlgili:** [0003](0003-backend-supabase.md), [0009](0009-herkes-kendi-hesabiyla.md), [0016](0016-dis-servisleri-claude-yurutur.md)

## Bağlam
Faz 1'de Supabase projesi açıldı (Frankfurt, ücretsiz plan, yalnız HoopLab'e ayrılmış ayrı bir Supabase hesabında). Publishable anahtar uygulama paketine gömülür; yani herkes onu okuyabilir ve veriyi koruyan tek şey RLS ve giriş ayarlarıdır. Supabase 2026-04-28'de kural değiştirdi: yeni tablolar Data API'ye artık kendiliğinden açılmıyor (yeni projelerde 2026-05-30'dan beri varsayılan). Oturum token'ları iPhone'da saklanmalı; `expo-secure-store` değer başına ~2048 baytla sınırlı (LESSONS).

## Seçenekler
1. **Şema:** (a) panodan tıklayarak; (b) repoda migration dosyaları + Supabase CLI (sürümü sabit devDependency). (b) seçildi: geçmiş, inceleme ve yerelde test mümkün; public repo için de tekrar üretilebilir kurulum (0009).
2. **Erişim:** (a) `auto_expose_new_tables` açık, her tabloya varsayılan yetki; (b) kapalı, yalnız `authenticated` rolüne açık GRANT. (b) seçildi: unutulan bir tablo kapalı kalır (fail-closed).
3. **Giriş:** e-posta + şifre / e-postaya kod / sihirli bağlantı. E-posta + şifre seçildi: dış bağımlılık yok, deep link gerekmez, oturum Keychain'de kaldığı için seyrek girilir. Kullanıcı panodan bir kez açılır, yeni kayıt kapatılır.
4. **Oturum deposu:** (a) AsyncStorage (şifresiz); (b) Supabase dokümanındaki AES + AsyncStorage; (c) SecureStore üzerinde bayta göre parçalayan adaptör. (c) seçildi: token Keychain'de kalır, ek kripto bağımlılığı yok.

## Karar
- Her kullanıcı tablosunda: `user_id uuid not null default auth.uid() references auth.users on delete cascade`; RLS açık; dört işlem için `to authenticated` + `(select auth.uid()) = user_id` politikası (UPDATE'te `using` ve `with check` birlikte); `anon`'dan yetki geri alınır, yalnız `authenticated`'a GRANT verilir; `(user_id, local_date)` indeksi.
- Tarih: günlük toplamlar sporcunun yerel tarihine (`local_date`) göre; zaman damgaları `timestamptz`.
- CHECK sınırları yalnız veri girişi doğrulamasıdır; bilimsel eşikler `research/rules` + `packages/engine`'de kalır.
- Yardımcı fonksiyonlar Data API'ye açık olmayan `private` şemasında.
- Her migration önce yerelde (`npm run db:reset`, `npm run test:db` pgTAP), sonra `db advisors`, sonra buluta (`db push --dry-run`, `db push`) gider.
- Uygulama yalnız `sb_publishable_` anahtarını kabul eder; `sb_secret_` görürse istemciyi kurmaz. Proje adresi ve anahtar repoya değil `apps/mobile/.env.local`'a yazılır.
- Oturum `createChunkedStorage` ile Keychain'de: parçalar önce, manifest en son; iki kuşak (a/b) arasında dönülür, yarıda kalan yazma eski oturumu bozmaz.

## Sonuçlar
- Her yeni tablo migration'ında GRANT ve dört politika elle yazılır; pgTAP'taki genel bekçiler (her tabloda RLS açık, anon'da yetki yok, politikalar yalnız authenticated) unutulanı yakalar.
- Yerel test Docker ister (`npm run db:start`). CI'da henüz koşmuyor; Docker'lı CI işi ileride değerlendirilir.
- Ücretsiz planda "sızan şifre koruması" yok (yalnız Pro); denetçinin bu uyarısı kabul edildi. Uzun ve benzersiz şifre şifre yöneticisinde.
- Sabah check-in tablosu ölçek kararı (PRODUCT §10) kaynakla verilince, seans içerik etiketleri Faz 2'de kas / tendon modeliyle eklenir.
- **Yeniden değerlendirme tetikleyicisi:** çevrimdışı kayıt kuyruğu gerekirse (istemcide üretilen kimlikler zaten uuid), ikinci kullanıcı veya paylaşım istenirse (politikalar sahiplikten fazlasını ister), Pro plana geçilirse (sızan şifre koruması açılır).
