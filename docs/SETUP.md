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

Haftalık denetim ve aylık literatür taraması **makineye özeldir** ve yalnız ana bilgisayarda kurulu olmalı; iki makinede kurulursa aynı rapor iki kez yazılır. Ana bilgisayar değişirse görev talimatları eski makinedeki `C:\Users\<kullanıcı>\.claude\scheduled-tasks\hooplab-*\SKILL.md` dosyalarından alınıp yeni makinede yeniden oluşturulur.

## 7. Doğrulama

```bash
npm run check
```

Araç testleri, tip denetimi (tema paketi ve uygulama), paket ve uygulama testleri, gizlilik taraması (güncel ağaç ve tüm geçmiş) ve kaynak doğrulaması geçmeli. Çıktıda "kişisel denylist N ifade (dosya)" görünmeli.

## 8. Uygulamayı iPhone'da açmak

1. iPhone'a App Store'dan **Expo Go**'yu kur.
2. `E:\HoopLab\code` klasöründe `npm run mobile`. Terminalde QR kod çıkar. Windows PowerShell "running scripts is disabled" derse `npm.cmd run mobile` (çalıştırma ilkesini değiştirmeye gerek yok).
3. iPhone kamerasıyla QR kodu okut; Expo Go'da açılır. iPhone ve bilgisayar aynı Wi-Fi'da olmalı.
4. **Metro'yu Claude yönetir** (kullanıcı isteği, 2026-10-04): başlatma, yeniden başlatma, kapatma. Terminal paneli bu makinede komut alamadığı için (LESSONS "Windows") Claude şunu çalıştırır:
   - Başlat: `Start-Process npm.cmd -ArgumentList 'run','mobile' -WorkingDirectory 'E:\HoopLab\code' -WindowStyle Hidden -RedirectStandardOutput "$env:TEMP\hooplab-metro.log" -RedirectStandardError "$env:TEMP\hooplab-metro.err.log"`; günlükte `Waiting on http://localhost:8081` görülünce hazır. QR basılmaz; Expo Go projeyi son açılanlardan açar.
   - Durdur: `taskkill /T /F /PID <8081'i dinleyen süreç>` (`Get-NetTCPConnection -LocalPort 8081 -State Listen`).
5. Bağlanmazsa: Windows Güvenlik Duvarı Node.js'e özel ağda izin vermeli (ilk çalıştırmada sorar). Olmazsa `npm run mobile -- --tunnel`.

Ayrıntı: [apps/mobile/README.md](../apps/mobile/README.md).

## 9. Supabase

Proje kullanıcının kendi Supabase hesabındadır (0009). Bu makinede bir kez:

1. Kullanıcı: `npx.cmd supabase login` (tarayıcıda HoopLab'e ayrılmış hesapla).
2. Claude yürütür (CLAUDE.md §7): `npx supabase link --project-ref <ref>`, `apps/mobile/.env.local` dosyasını `supabase projects api-keys` çıktısından yazar ([.env.example](../apps/mobile/.env.example)), `npx supabase db push`.
3. Yerel test için Docker Desktop açık olmalı: `npm run db:start`, `npm run test:db`, `npm run db:stop`.

Yeni projede panodan: kullanıcıyı ekle (**Auto Confirm User**), **Allow new users to sign up** kapalı. Ayrıntı: [0015](decisions/0015-veritabani-tek-sahip-rls.md).
