# HoopLab'i kendi hesaplarınla kurmak

HoopLab merkezi bir servis kullanmaz ([karar 0009](../decisions/0009-herkes-kendi-hesabiyla.md)). Veritabanı kendi Supabase projende, Fitbit / Google Health erişimi kendi Google Cloud projende durur. Veri, kota ve olası ücret senin hesabındadır. Sunucu tarafını kurulum sihirbazı kurar ([karar 0023](../decisions/0023-kurulum-sihirbazi-terminalde.md)). Senin işin hesapları açmak ve birkaç konsol ayarı yapmak.

Yalnız denemek istiyorsan kuruluma gerek yok: uygulamayı aç ve giriş ekranında **Demoyu aç**'a dokun (sentetik veri, sunucusuz).

> Windows PowerShell "running scripts is disabled" derse komutlarda `npm` yerine `npm.cmd`, `npx` yerine `npx.cmd` yaz.

## Gerekenler

- Git ve Node.js 22 veya üstü
- Supabase hesabı (ücretsiz plan yeter; hesap başına en fazla 2 aktif ücretsiz proje)
- Fitbit cihazının bağlı olduğu Google hesabı
- iPhone ve App Store'dan **Expo Go**
- AI koç için (isteğe bağlı): Anthropic Console hesabı ve bir API anahtarı ([platform.claude.com](https://platform.claude.com)). Kullanım kadar ödenir, Claude aboneliğinden ayrıdır; ön ödemeli kredi ve kapalı otomatik yükleme harcamaya kesin bir tavan koyar

## 1. Repo

```bash
git clone https://github.com/emir-eid/hooplab.git
cd hooplab
npm install
```

## 2. Supabase projesi

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**. Ad serbest, bölge sana en yakın olan, veritabanı şifresini bir şifre yöneticisine kaydet.
2. Bilgisayarda bir kez CLI girişi yap (tarayıcı açılır):

   ```bash
   npx supabase login
   ```

   Bu giriş hesabındaki tüm projelere tam yetki verir; ortak bir bilgisayarda iş bitince `npx supabase logout`.

## 3. Google Cloud (Fitbit verisi için)

[Google Health bağlantısı rehberinde](google-health-baglantisi.md) §1-4a'yı izle:

- proje
- Google Health API
- OAuth izin ekranı (Testing, kendini test kullanıcısı yap)
- **Web application** istemcisi

Geri dönüş adresi (Authorized redirect URI) şu biçimdedir:

```
https://<supabase-proje-kimligin>.supabase.co/functions/v1/ghealth-callback
```

Proje kimliği Supabase panosunda Project Settings → General'da yazar. Emin değilsen 4. adımdan sonra sihirbaz adresi tam olarak yazar.

İstemcinin JSON dosyasını indir ve repo dışında bir klasöre koy. Dosya istemci sırrını içerir: repoya, sohbete veya paylaşılan bir klasöre koyma.

## 4. Kurulum sihirbazı

```bash
npm run setup -- --google-json <indirdigin-json-dosyasinin-yolu>
```

Sihirbaz önce durumu denetler ve bir liste basar. Listedeki her maddenin durumu dört etiketten biridir:

- **tamam:** hazır
- **kurulacak:** sihirbaz kuracak
- **senin adımın:** konsolda senin yapacağın iş
- **bekliyor:** önceki bir adıma bağlı

Sonra eksikleri tek tek onayına sunarak kurar:

1. Hesabındaki projelerden birini seçtirir ve bu klasörü ona bağlar.
2. Uygulamanın bağlantı değerlerini `apps/mobile/.env.local` dosyasına yazar. Yalnız publishable anahtar yazılır, gizli anahtar asla.
3. Veritabanı şemasını kurar. Önce neyin uygulanacağını gösterir.
4. Google istemci kimliğini ve sırrını Supabase secrets'a yazar.
5. AI koçun Anthropic API anahtarını gizli girişle ister (yazarken yıldız görünür; boş bırakırsan atlanır) ve Supabase secrets'a `ANTHROPIC_API_KEY` olarak yazar. Etkileşimli bir terminal gerekir.
6. Saatlik senkronun paylaşılan sırrını üretir ve hem Supabase secrets'a hem Vault'a yazar.
7. Vault'a proje adresini yazar.
8. Edge Functions'ı dağıtır (Docker gerekmez).

Sır değerleri ekrana basılmaz. Sihirbazı istediğin kadar yeniden çalıştırabilirsin; yalnız eksik olanı kurar.

## 5. Senin adımların

Sihirbaz bitince "Senin yapman gerekenler" listesini basar. Yeni bir projede genellikle şunlardır:

1. **Giriş hesabın:** Supabase panosu → Authentication → Users → **Add user → Create new user**. E-posta ve şifreni gir, **Auto Confirm User** işaretli olsun.
2. **Yeni kaydı kapat:** Authentication → Sign In / Providers → **Allow new users to sign up** kapalı. Açık kalırsa uygulamanın paketindeki adresi bulan herkes hesap açabilir. E-posta sağlayıcısının kendisi açık kalmalı, yoksa sen de giremezsin.
3. **Google'daki geri dönüş adresi:** sihirbaz farklı bulursa doğru adresi yazar. Google Cloud'da düzelt, JSON'u yeniden indir.

Sonra denetle:

```bash
npm run setup:check
```

Bütün maddeler **tamam** olmalı. Bu komut hiçbir şeyi değiştirmez; bir şey ters giderse ilk bakılacak yer burası.

## 6. Uygulama

```bash
npm run mobile
```

1. Terminaldeki QR kodu iPhone kamerasıyla okut; uygulama Expo Go'da açılır. iPhone ile bilgisayar aynı Wi-Fi'da olmalı.
2. 5. adımda açtığın hesapla giriş yap.
3. **Ben → Google Health → Google Health'e bağlan.** İzin ekranında "Google hasn't verified this app" uyarısı çıkar, çünkü uygulama senin projen. **Advanced → Go to …** seç ve istenen izinlerin hepsini onayla.

Son 90 günün verisi birkaç dakikada gelir, sonra saatte bir kendiliğinden güncellenir.

## İsteğe bağlı: TestFlight ile kalıcı kurulum

Expo Go bilgisayar açıkken çalışır. Uygulamayı telefonda kalıcı kurmak için Apple Developer Programı üyeliği (yıllık ücretli) ve bir Expo hesabı gerekir. iOS derlemesi Mac'siz, EAS bulutunda yapılır.

1. `apps/mobile` klasöründe `npx eas-cli init` ile kendi EAS projeni aç.
2. Komutun `app.json`'a yazdığı proje kimliğini ve sahibini oradan sil, `apps/mobile/.env.local`'a yaz ([.env.example](../../apps/mobile/.env.example)). Paket kimliğini de oraya ekle.
3. Aynı değerleri ve iki `EXPO_PUBLIC_SUPABASE_*` değerini EAS'ta "production" ortam değişkeni yap.
4. Derle: `npm run eas -- build --platform ios --profile production`.

Ayrıntı ve gerekçe: [karar 0024](../decisions/0024-eas-derleme-ve-guncelleme.md). Bu akışın ilk gerçek derlemesi henüz yapılmadı; yapılınca bu bölüm doğrulanmış adımlarla güncellenecek.

## Haftalık

Google, Testing modundaki kişisel projelerde izni 7 günde bir düşürür. Süre dolunca **Ben → Google Health**'te **Yeniden bağlan** görünür; bir dokunuş yeter.

## Sorun giderme

| Belirti | Bak |
|---|---|
| Giriş ekranında "Bağlantı ayarlanmadı" | `npm run setup` çalışmamış veya `.env.local` sonradan değişmiş. Değer değiştiyse Metro'yu yeniden başlat. |
| Google Health'te "Sunucuda Google Health kurulumu eksik" | `npm run setup:check`. Genellikle Google sırları veya fonksiyonlar eksiktir. |
| `setup:check`'te "Supabase projesi — Proje durumu INACTIVE" | Ücretsiz plan 7 gün istek gelmezse projeyi duraklatır. Panodan **Restore**. |
| İzin ekranında `redirect_uri_mismatch` | Google'daki geri dönüş adresi 3. adımdakiyle harfi harfine aynı olmalı (sonda `/` yok). |

## Geliştirici notu: yerel Supabase

Docker Desktop açıkken sihirbaz yerel yığına karşı da çalışır:

```bash
npm run db:start
npm run setup -- --local --google-json <sentetik-json>
```

Yerel modda sırlar `supabase/functions/.env`'e yazılır (gitignore'lu). Gerçek Google dosyası kendiliğinden okunmaz; sahte Google ile deneme için [SETUP](../SETUP.md) §9.
