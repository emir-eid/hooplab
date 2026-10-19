# Yeni makinede kurulum

Projeyi başka bir bilgisayarda (ör. laptop) çalıştırmak için. Git yalnız `code` klasörünü taşır. `private` klasörü, yerel ayarlar ve zamanlanmış görevler elle kurulur.

> İki makinede aynı anda çalışma. Makine değiştirmeden önce açık oturumda `/kapat` (commit + push + yedek), yeni makinede önce `git pull`.

## 1. Ön koşullar

- Git, Node.js 22+ ve GitHub CLI (`gh auth login` ile, repoya erişimi olan hesapla)
- Google Drive masaüstü uygulaması (yedeğe erişim için)
- Google Health verisini CLI'dan çekmek için: Go (`winget install --id GoLang.Go -e`) ve `ghealth` ([rehber](guides/google-health-baglantisi.md) §5). Ana makinede kaynak `C:\gh\ghealth-src`, ayar ve token'lar `private/ghealth` (`GHEALTH_CONFIG_DIR` ile); yedekten gelir, yeniden giriş gerekmez (token 7 günden eskiyse `ghealth auth login`)

## 2. Klasörler ve repo

```bash
mkdir -p /e/HoopLab && cd /e/HoopLab
git clone https://github.com/emir-eid/hooplab.git code
cd code && npm install && npm run hooks:install
```

`npm install` şart: pre-push kapısı tip denetimi için `node_modules` ister, yoksa push durur.

Commit kimliği (bu klonda bir kez):

```bash
git config user.name "Emir Eid"
git config user.email "60217362+emir-eid@users.noreply.github.com"
```

## 3. `private` klasörünü yedekten geri yükle

`E:\HoopLab\private` klasörünü Drive'daki yedekten kopyala (`<Drive>\HoopLab-yedek\private`). İçinde `guard-denylist.txt` ve `backup-target.txt` de gelir. Drive harfi veya yolu farklıysa `backup-target.txt` içindeki yolu düzelt.

Ana makineden taşınırken git'in taşımadığı dosyalar `private/tasima/` klasöründe gelir (içindeki README nereye kopyalanacağını yazar): Claude hafızası (`C:\Users\<kullanıcı>\.claude\projects\E--HoopLab-code\memory\`; klasör adı proje yolundan türer, aynı yol `E:\HoopLab\code` kullanılırsa ad aynı kalır), `apps/mobile/.env.local` (kurulum sihirbazı EAS kimlik değerlerini yazmaz), `apps/mobile/.expo/settings.json` (tünel adresi aynı kalır) ve `.claude/settings.local.json`. Taşımadan önce ana makinede bu dosyalar oraya kopyalanır ve yedek alınır (`node tools/backup/backup-private.mjs`).

Yedek yoksa klasörleri boş oluştur (`data`, `journal`, `transcripts`). `guard-denylist.txt` dosyasını yeniden yaz: kişisel bilgiler olmadan bekçi yalnız sır kalıplarını yakalar.

## 4. Claude Code yerel ayarı

`code\.claude\settings.local.json` (git'e girmez):

```json
{
  "permissions": {
    "additionalDirectories": ["E:\\HoopLab\\private"]
  }
}
```

## 5. İlk oturum

1. Claude Code'da klasör olarak `E:\HoopLab\code` seç.
2. Plugin'ler (Expo, Supabase) masaüstü uygulamasında kendiliğinden yüklenmez. Bir kez yükle (Claude Code CLI'si PATH'te değilse masaüstü uygulamasının paketlediği `%APPDATA%\Claude\claude-code\<sürüm>\<hash>\claude.exe` kullanılır), sonra yeni oturum aç:
   ```bash
   claude plugin install expo@expo-plugins -s project
   claude plugin install supabase@supabase-agent-skills -s project
   claude plugin install postgres-best-practices@supabase-agent-skills -s project
   ```
3. `/ac` yaz. "Dikkat" bölümünde hook veya plugin uyarısı olmamalı.

## 6. Zamanlanmış görevler

Haftalık denetim ve aylık literatür taraması **makineye özeldir** ve yalnız ana bilgisayarda kurulu olmalı; iki makinede kurulursa aynı rapor iki kez yazılır. Görevler masaüstü uygulaması açıkken çalışır. Ana bilgisayar değişirse görev talimatları eski makinedeki `C:\Users\<kullanıcı>\.claude\scheduled-tasks\hooplab-*\SKILL.md` dosyalarından (taşımada `private/tasima/scheduled-tasks/`) alınıp yeni makinede aynı zamanlamayla yeniden oluşturulur (haftalık `0 10 * * 1`, aylık `0 10 1 * *`) ve eski makinedekiler duraklatılır.

## 7. Doğrulama

```bash
npm run check
```

Araç testleri, tip denetimi (tema paketi ve uygulama), paket ve uygulama testleri, gizlilik taraması (güncel ağaç ve tüm geçmiş) ve kaynak doğrulaması geçmeli. Çıktıda "kişisel denylist N ifade (dosya)" görünmeli.

**Uçtan uca testler** (`e2e/`, Playwright): uygulamanın web çıktısı Supabase değerleri boş derlenir (`e2e/serve.mjs`), WebKit motoru iPhone boyutunda demo moduyla ana akışları dener (sekmeler, demo günü, su kaydı, sabah check-in); sayfada tek bir JS hatası testi kırar. Sunucu, sır ve gerçek veri yok.

```bash
npx playwright install webkit   # bir kez
npm run e2e                     # derler (~35 sn) ve koşar; E2E_NO_BUILD=1 var olan e2e/.dist ile
```

GitHub Actions'ta `uctan-uca` işi her push'ta koşar; hata olursa rapor ve izler (`uctan-uca-raporu`) 7 gün saklanır. `npm run check`'e ve pre-push'a girmez (süre). iOS'a özgü sorunları (klavye, native bileşenler) yakalamaz; onlar cihazda bakılır (§8). Bu makinede `playwright install` Node'un indirmesi zaman aşımına uğrarsa: LESSONS "Windows".

## 8. Uygulamayı iPhone'da açmak

1. iPhone'a App Store'dan **Expo Go**'yu kur.
2. **Varsayılan yol: tünel** (kullanıcı kararı, 2026-10-16). Telefon bilgisayarla aynı ağda olmak zorunda değil, mobil veri de olur; bilgisayar evde açık ve internete bağlı kalmalı. Bu makinede bir kez: `npm i -g @expo/ngrok@4.1.3` (Expo'nun resmi paketi; kurulu).
3. **Metro'yu Claude yönetir** (kullanıcı isteği, 2026-10-04): başlatma, yeniden başlatma, kapatma. Terminal paneli bu makinede komut alamadığı için (LESSONS "Windows") Claude şunu çalıştırır:
   - Başlat: `Start-Process npm.cmd -ArgumentList 'run','mobile:tunnel' -WorkingDirectory 'E:\HoopLab\code' -WindowStyle Hidden -RedirectStandardOutput "$env:TEMP\hooplab-metro.log" -RedirectStandardError "$env:TEMP\hooplab-metro.err.log"`. Önbellek temizliği gerekiyorsa `'run','mobile:tunnel','--','--clear'`. Günlükte `[tunnel] exp://…` satırı görülünce hazır ([tools/dev/mobile-tunnel.mjs](../tools/dev/mobile-tunnel.mjs)).
   - Hazır demeden önce: tünel adresinden manifest okunur (`curl -H "expo-platform: ios" https://<alan adı>/` yanıtında `hostUri`).
   - Durdur: `expo start` içeren `node.exe` süreçleri ve `ngrok` (`Get-CimInstance Win32_Process`, `taskkill /T /F`); 8081'i dinleyen süreç `Get-NetTCPConnection -LocalPort 8081 -State Listen`.
4. Adres kalıcı: `exp://<rastgele>-<Expo kullanıcı adı>-8081.exp.direct` biçiminde (gerçek adres public repoya yazılmaz: bilen, Metro açıkken geliştirme paketini indirebilir; pakette yalnız herkese açık `EXPO_PUBLIC_` değerleri var, veriye giriş ve RLS korur), rastgele kısım `apps/mobile/.expo/settings.json`'da (gitignore'lu; silinirse adres değişir). Expo Go projeyi son açılanlardan açar; ilk seferde ya da adres değişince Claude bağlantıyı sohbete yazar, kullanıcı telefonda dokunur. QR gösterilmez.
5. Tünel LAN'dan yavaştır: telefondaki hız hissi performans ölçüsü değildir (ölçüm geçici günlükle, [0048](decisions/0048-performans-turu.md)).
6. Yedek yol, aynı Wi-Fi: `npm run mobile` (LAN; manifest `http://<LAN IP>:8081/`, bu makinede Wi-Fi bağdaştırıcısı "Ethernet 2", VMware / WSL adresleri değil). Bağlanmazsa Windows Güvenlik Duvarı Node.js'e özel ağda izin vermeli. `npm run mobile -- --tunnel` çalışmaz (bayrak düşer; LESSONS "Expo / React Native").

Ayrıntı: [apps/mobile/README.md](../apps/mobile/README.md).

## 9. Supabase

Proje kullanıcının kendi Supabase hesabındadır (0009). Bu makinede bir kez:

1. Kullanıcı: `npx.cmd supabase login` (tarayıcıda HoopLab'e ayrılmış hesapla).
2. Claude yürütür (CLAUDE.md §7): `npm run setup -- --project-ref <ref> --yes`. Kurulum sihirbazı ([0023](decisions/0023-kurulum-sihirbazi-terminalde.md)) şunları yapar:
   - projeyi bağlar
   - `apps/mobile/.env.local` dosyasını yazar (yalnız publishable anahtar)
   - migration'ları uygular
   - Google istemci sırlarını yazar (`../private/ghealth/web_client_secret.json`'dan, değer ekrana basılmadan)
   - zamanlayıcı sırrını Supabase secrets'a ve Vault'a aynı değerle yazar
   - Vault'a `project_url` yazar
   - Edge Functions'ı dağıtır (`--use-api`)
3. Elle kalanları sihirbaz numaralı listeler. Yeni projede panodan:
   - kullanıcıyı ekle (**Auto Confirm User**)
   - **Allow new users to sign up** kapalı

   Ayrıntı: [0015](decisions/0015-veritabani-tek-sahip-rls.md).
4. Denetim: `npm run setup:check` (salt-okur, bulutta 13 madde; Anthropic API anahtarı 2026-10-09'da eklendi). Migration veya fonksiyon dağıtımından sonra da çalıştırılır.
5. Yerel test için Docker Desktop açık olmalı: `npm run db:start`, `npm run test:db`, `npm run db:stop`.

Sıfırdan, başka birinin hesabıyla kurulum: [guides/kurulum.md](guides/kurulum.md).

### Google Health senkronu ([0019](decisions/0019-google-health-senkronu.md))

Bulut tarafını kurulum sihirbazı kurar (yukarıda). Kurduğu değerler:

- Supabase secrets: `GOOGLE_HEALTH_CLIENT_ID`, `GOOGLE_HEALTH_CLIENT_SECRET`, `GHEALTH_CRON_SECRET`
- Vault: `project_url`, `ghealth_cron_secret`
- Fonksiyonlar: `ghealth-connect`, `ghealth-callback`, `ghealth-sync`, `coach-daily` (koçun günlük özeti), `coach-ask` (koçta soru-cevap), `coach-weekly` (haftalık yorum, [0052](decisions/0052-haftalik-koc-yorumu.md)); üçü de `ANTHROPIC_API_KEY` ister

Fonksiyon kodu değiştiğinde yeniden dağıtım: `npm run setup -- --redeploy --yes`. Web istemcisinin kurulumu: [rehber](guides/google-health-baglantisi.md) §4.

Yerel uçtan uca deneme (sentetik, gerçek Google'a gidilmez):

1. `node tools/dev/fake-google-health.ts` (sahte Google, port 54399).
2. `supabase/functions/.env` (gitignore'lu): istemci değerleri sahte (zamanlayıcı sırrı ve yerel Vault için `npm run setup -- --local --yes`; yerel mod gerçek Google dosyasını okumaz), `GHEALTH_REDIRECT_URI=http://127.0.0.1:54321/functions/v1/ghealth-callback`, `GHEALTH_AUTH_URL=http://127.0.0.1:54399/auth`, `GHEALTH_TOKEN_URL` / `GHEALTH_REVOKE_URL` / `GHEALTH_API_BASE` `http://host.docker.internal:54399/...`, `GHEALTH_CRON_SECRET`.
3. `npx supabase functions serve --env-file supabase/functions/.env`, sonra `npm run web:local` ile Ben → Google Health. `npm run db:reset` yerel senkron verisini siler.

Koçun günlük özeti yerelde (sentetik, gerçek Anthropic API'sine gidilmez, ücret yok): `node tools/dev/fake-anthropic.mjs` (port 54398), `supabase/functions/.env`'e `ANTHROPIC_API_KEY=sk-ant-yerel-sahte` ve `COACH_ANTHROPIC_BASE_URL=http://host.docker.internal:54398`, sonra `functions serve`. Demo kullanıcısıyla (seed) giriş yapıp `POST /functions/v1/coach-daily` gövdesinde anlık değerler (`supabase/functions/_shared/coach/snapshot.ts`); `?regenerate=1` elle yeniden üretme. Soru-cevap: `POST /functions/v1/coach-ask` gövdesi `{ date, question, snapshot | null }`; sahte sunucu sınıflandırmaya `in_scope`, yanıta ilk kaynağa alıntılı tek cümle döner. Windows'ta curl ile Türkçe soru gönderilirse harfler bozuk kaydedilir (kodlama); arayüzden denenir.

Koçun maliyet / kalite ölçümü (gerçek API, **ücretli, önce kullanıcı onayı**): kullanıcı Console'da kısa süreli ayrı bir anahtar açar ve kendi PowerShell'inde gizli girişle `tools/coach-eval/.env.local`'a (gitignore'lu) `ANTHROPIC_API_KEY=...` olarak yazar. `node tools/coach-eval/run.ts --dry` ücretsiz tahmin verir, `node tools/coach-eval/run.ts` Batch API ile (%50) koşar, sonuçlar ve yan yana metinler `private/data/coach-eval/<batch>/` altına yazılır. İş bitince anahtar dosyası silinir ([0035](decisions/0035-koc-kaynak-secimi-dikkat.md), LESSONS).

Koçun aylık token kullanımı raporu (ücretsiz, API çağırmaz): `npm run coach:usage` bağlı bulut projesinden `coach_summaries` / `coach_messages`'in yalnız token, durum, sınıf, hata kodu ve denetim sayılarını okur (metin sütunları seçilmez), resmi fiyatlarla maliyeti hesaplar ve markdown raporu ekrana yazar: ay toplamı, 30 günlük karşılık ve karar 0032 tahminiyle kıyas, kalite oranları (atılan cümle, durumlar), 0032 tetikleri, krediden kalan (tahmin; Console bakiyesi esastır). Seçenekler: `-- --ay 2026-10`, `-- --kredi <toplam yüklenen $>`, `-- --yerel`, `-- --dosya <sorgu çıktısı.json>`. Fiyat, kredi ve tablo dışı harcama `tools/coach-usage/usage-lib.mjs`'te; fiyat değişince resmi sayfadan güncellenir ([COSTS](COSTS.md)).

## 10. EAS (iOS derleme ve güncelleme)

Proje mevcut kişisel Expo hesabında ([0024](decisions/0024-eas-derleme-ve-guncelleme.md)). Bu bilgisayarda EAS CLI o hesapla girişli. Yeni makinede kullanıcı bir kez `npx.cmd eas-cli@24.10.0 login` yapar.

- Kimlik değerleri `apps/mobile/.env.local`'da durur (`HOOPLAB_IOS_BUNDLE_ID`, `HOOPLAB_EAS_PROJECT_ID`, `HOOPLAB_EAS_OWNER`; [.env.example](../apps/mobile/.env.example)). Aynı değerler ve iki `EXPO_PUBLIC_SUPABASE_*` değeri EAS'ta "production" ortam değişkeni olarak da durur: `npm run eas -- env:list --environment production`.
- EAS CLI `.env.local`'ı kendisi yüklemez. Komutlar her zaman `npm run eas -- <komut>` ile çalıştırılır; sarmalayıcı değerleri ortama verir, sürüm sabittir.
- Native değişiklik (paket, izin, eklenti, SDK) olursa derleme: `npm run eas -- build --platform ios --profile production`. TestFlight'a gönderim (`submit`) her seferinde kullanıcı onayıyla yapılır (CLAUDE.md §7).
- Yalnız JS, stil veya görsel değiştiyse güncelleme: `npm run eas -- update --channel production --environment production --message "..."`. Üretim kanalına yayın kullanıcı onayıyla yapılır. `runtimeVersion` politikası `fingerprint`: uyumsuz güncelleme eski derlemeye gitmez.
- İlk derleme Apple Developer üyeliği onaylanınca yapılır. App Store Connect API anahtarı (`.p8`) `private/` klasörüne konur.

