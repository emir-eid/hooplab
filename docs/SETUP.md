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
cd code && npm run hooks:install
```

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
2. Plugin onay penceresi çıkarsa onayla (Expo, Supabase).
3. `/ac` yaz. "Dikkat" bölümünde hook veya plugin uyarısı olmamalı.

## 6. Zamanlanmış görevler

Haftalık denetim ve aylık literatür taraması **makineye özeldir** ve yalnız ana bilgisayarda kurulu olmalı; iki makinede kurulursa aynı rapor iki kez yazılır. Ana bilgisayar değişirse görev talimatları eski makinedeki `C:\Users\<kullanıcı>\.claude\scheduled-tasks\hooplab-*\SKILL.md` dosyalarından alınıp yeni makinede yeniden oluşturulur.

## 7. Doğrulama

```bash
npm run check
```

Araç testleri, gizlilik taraması (güncel ağaç ve tüm geçmiş) ve kaynak doğrulaması geçmeli. Çıktıda "kişisel denylist N ifade (dosya)" görünmeli.
