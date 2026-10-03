# Google Health bağlantısı (kendi hesabınla)

HoopLab merkezi bir servis kullanmaz ([karar 0009](../decisions/0009-herkes-kendi-hesabiyla.md)). Fitbit / Google Health verine erişmek için **kendi** Google Cloud projeni ve OAuth istemcini açarsın. Veri, kota ve olası ücret tamamen senin hesabında kalır. Uygulamadaki kurulum sihirbazı (Faz 1) aynı adımları anlatır.

Son doğrulama: 2026-10-03 (Google Cloud konsolu, `ghealth` commit `9cf0274`). Konsol arayüzü değişebilir; menü adları farklıysa aynı anlamdaki seçeneği seç.

## Gerekenler

- Fitbit cihazının bağlı olduğu Google hesabı
- Tarayıcı

## 1. Google Cloud projesi

1. [console.cloud.google.com](https://console.cloud.google.com) adresine o Google hesabıyla gir.
2. Üstteki proje seçiciden **New Project**. Ad serbest (ör. `hooplab-veri`). **Create**.
3. Proje kimliğini (Project ID) not et: proje seçicide adın yanındaki **ID** sütununda veya ana sayfadaki "Project info" kartında yazar.

**Ücret:** Projeye faturalandırma hesabı (billing account) bağlamazsan Google ücret alamaz. Veri testi için gerekmez. Durumu **Billing** sayfasından görebilirsin.

## 2. Google Health API

**APIs & Services → Library** → "Google Health API" ara → **Enable**.

Google'ın dokümanı yeni projeleri kabul etmediğini söylese de 2026-10-03'te kişisel projede etkinleştirme çalıştı. Buton yoksa veya ret mesajı çıkarsa erişim kapanmış demektir.

## 3. OAuth izin ekranı (Google Auth Platform)

1. **APIs & Services → OAuth consent screen** (yeni arayüzde "Google Auth Platform").
2. User type: **External**. Uygulama adı serbest (ör. `HoopLab`); destek ve geliştirici e-postası olarak kendi adresin.
3. **Audience → Test users**: kendi Google hesabını ekle.
4. Uygulamayı **yayımlama**, "Testing" durumunda kalsın. Sonucu: yenileme token'ı 7 günde düşer, haftada bir yeniden bağlanırsın ([Google OAuth belgesi](https://developers.google.com/identity/protocols/oauth2#expiration)).

## 4. OAuth istemcisi

1. **Clients → Create client** (veya Credentials → Create credentials → OAuth client ID).
2. Application type: **Desktop app**. Ad serbest.
3. "This client will be used by an AI-powered agent" kutusunu **işaretleme**. Akış kullanıcı onaylı normal bir masaüstü istemcisidir; kutunun etkisi belgelenmemiş.
4. **Create** → **Download JSON**. Bu dosya istemci sırrını içerir: repoya, sohbete veya paylaşılan bir klasöre koyma.

## 5. Bağlantıyı dene (isteğe bağlı, `ghealth` CLI)

Google'ın resmi CLI'ı ile verinin geldiğini uygulamadan önce görebilirsin.

```bash
winget install --id GoLang.Go -e
git clone https://github.com/Google-Health-API/google-health-cli.git
cd google-health-cli && go build -o ghealth .
```

Ayar ve token'ları repo dışında bir klasörde tutmak için `GHEALTH_CONFIG_DIR` kullan:

```bash
export GHEALTH_CONFIG_DIR=/yol/repo-disi/ghealth
./ghealth setup --project-id <proje-kimligin> --client-secret <indirdigin-json> --scopes-preset readonly --skip-enable-api --no-prompt
```

Tarayıcıda izin ekranı açılır. "Google hasn't verified this app" uyarısında **Advanced → Go to <uygulama adı>** (kendi projen olduğu için çıkar). İzinlerin hepsi salt okumadır.

Deneme:

```bash
./ghealth user paired-devices list
./ghealth data daily-heart-rate-variability list --from 2026-09-01
```

Bilinen API sınırları (14 günlük rollup sınırı, gün içi nabzın gün gün çekilmesi, basketbolun `SPORT` olarak gelmesi): [LESSONS.md](../LESSONS.md) "Google Health / veri".
