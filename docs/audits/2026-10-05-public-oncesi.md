# 2026-10-05 — Public'e geçiş öncesi denetim

Elle yapılan denetim (ROADMAP Faz 1, [0005](../decisions/0005-repo-ve-gizlilik-ayrimi.md), [0008](../decisions/0008-gizlilik-altyapisi-eklemeleri.md)). Kapsam: repo public olunca herkese açılacak her şey. Buna dosyaların bugünkü hali, tüm git geçmişi, commit ve etiket mesajları, yazar satırları, GitHub Actions logları ve lisanslar dahil.

## Özet

**Yeşil.** Sır, kişisel veri veya sağlık değeri bulunmadı. README ve LICENSE (MIT) yazıldı. Bekçinin bir kapsam boşluğu (commit mesajları) kapatıldı. Secret scanning ve push protection private repoda açılamıyor, bu yüzden public yapıldıktan hemen sonra açılacak (aşağıda "Public anında").

## Bulgular

### 1. Dosyalar ve git geçmişi: temiz
- **Kanıt:** `npm run guard:all` → 328 dosya temiz. `npm run guard:history` → 876 geçmiş girdisi temiz. İki taramada da kişisel denylist (5 ifade, repo dışındaki dosyadan) kullanıldı. Tek dal (`main`), etiketler `faz-0-tamam` ve `faz-0.5-tamam`. Stash yok, geçmişte silinmiş dosya yok.
- **Ek tarama:** Bekçinin kalıplarında olmayan sır biçimleri de tüm geçmişte arandı: Supabase erişim token'ı, Expo token'ı, AWS anahtarı, Slack token'ı, `password|secret|token = "..."`. Yalnız sentetik test değerleri ve `config.toml` içindeki `env(...)` göstergeleri çıktı.
- **Öneri:** yok.

### 2. Commit mesajları ve yazar satırları: temiz, ama bekçi taramıyordu
- **Kanıt:** 32 commit mesajı ve etiket mesajı bekçinin kurallarıyla ayrıca tarandı, ihlal çıkmadı. Bütün commit'ler `<id>+emir-eid@users.noreply.github.com` adresiyle atılmış. Ancak CLAUDE.md §2 commit mesajını da kapsıyor ve bekçi mesajlara hiç bakmıyordu.
- **Yapılan:** `--history` artık her commit ve etiket mesajını ve yazar / commit eden satırını tarıyor. Yeni `--message` modu, `.githooks/commit-msg` üzerinden yazılan mesajı commit'ten önce durduruyor. Negatif testler: mesajdaki sır, mesajdaki denylist ifadesi, denylist'teki yazar e-postası, dosya yoksa çıkış 2. Yeniden tarama sonucu: 908 geçmiş girdisi, temiz.

### 3. Belgelerde sağlık değeri veya kişisel bilgi: yok
- **Kanıt:** Belgeler, oturum raporları, kararlar, kurallar ve maketler; birim taşıyan sayılar (ms, bpm, kg, cm, %, adım, kcal) ve sakatlık, doğum, telefon, e-posta, takım / kulüp ifadeleri için tarandı. Bulunan sayıların hepsi ya arayüz animasyon süresi ya da maketlerin sentetik verisi ([veri.js](../../design/maketler/veri.js) "hiçbir sayı gerçek bir ölçüm değildir" diyor). Önceki oturumlar gerçek veriyi yalnız saymış, değerlere bakmamış ([0021](../decisions/0021-toparlanma-kisisel-bant.md)).
- **Kalan, kabul edilebilir:** Belgeler sahibin profesyonel basketbolcu olduğunu ve Türkiye'de bulunduğunu söylüyor ([PRODUCT](../PRODUCT.md) §1-2). Gece sayısı gibi kullanım sayımları da geçiyor. Bunlar sağlık değeri değil, ürünün hikayesi. GitHub kullanıcı adıyla birlikte okununca kimin projesi olduğu anlaşılır; bu bilinçli bir tercih (portfolyo).

### 4. Altyapı tanımlayıcıları: yok
- **Kanıt:** Supabase proje adresi, publishable anahtar, Google OAuth istemci kimliği ve proje numarası repoda yok. Hepsi `.env.local` (gitignore'lu) veya Supabase secrets içinde. `supabase/config.toml` içindeki `project_id = "hooplab"` yalnız yerel Docker adı.

### 5. GitHub Actions logları: temiz
- **Kanıt:** 32 çalışmanın logu indirilip bekçinin kurallarıyla ve denylist'le tarandı, ihlal yok. Bekçi değer yazdırmıyor, yalnız "kişisel denylist 5 ifade (ortam değişkeni)" satırı var. İlk 7 çalışmada denylist henüz yoktu ("atlandı"). Loglar indirildikten sonra silindi.

### 6. Lisanslar: uyumlu
- Kod: [LICENSE](../../LICENSE) (MIT, `emir-eid`; kullanıcının seçimi). Kök `package.json` içinde `"license": "MIT"`.
- Üçüncü taraf skill'ler (`animate-expo`, `apple-design`, `review-animations`, `react-native-best-practices`) MIT; kaynak, commit ve lisans metni [THIRD_PARTY_NOTICES](../../.claude/skills/THIRD_PARTY_NOTICES.md) içinde. Kendi skill listesinde eksik olan `rep` eklendi.
- Font: Bricolage Grotesque kesimi SIL OFL 1.1; ayrılmış font adı yok; [OFL.txt](../../packages/theme/fonts/OFL.txt) yanında.
- 3D manken kod içinde geometrik parçalardan üretiliyor, dış model dosyası yok ([0018](../decisions/0018-vucut-gorunumu.md)). Uygulama ikonları Expo şablonundan.
- Kaynak özetleri kendi cümlelerimizle yazılmış (en uzunu yaklaşık 320 kelime); uzun alıntı yok.

### 7. GitHub güvenlik ayarları: public olmadan açılamıyor
- **Kanıt:** `PATCH repos/emir-eid/hooplab` ile `secret_scanning` ve `secret_scanning_push_protection` açılmak istendi; yanıt `422 Secret scanning is not available for this repository` oldu. Dependabot uyarıları kapalı. Wiki ve Projects açık ama kullanılmıyor.
- **Öneri:** aşağıdaki "Public anında" listesi.

## Public anında (ROADMAP "Repo public"; kullanıcı onayıyla, CLAUDE.md §7)

1. Hemen önce: `npm run guard:history` (dosya + mesaj), Actions loglarının taraması, `git status` temiz ve push'lanmış.
2. `gh repo edit emir-eid/hooplab --visibility public --accept-visibility-change-consequences`
3. Hemen sonra: secret scanning ve push protection açılır, `gh api repos/emir-eid/hooplab --jq .security_and_analysis` ile doğrulanır.
4. İsteğe bağlı: kullanılmayan Wiki ve Projects kapatılır, Dependabot uyarıları açılır.
5. Kullanıcı (yalnız konsoldan, isteğe bağlı): GitHub → Settings → Code security → **Push protection for yourself**.
6. Repo sayfası tarayıcıda açılıp README'nin ve bağlantıların düzgün göründüğü kontrol edilir.

## /ac'de konuşulacaklar

- Repo'yu public yapma kararı ve zamanı. Bu denetimden sonra teknik engel yok.
- README'ye demo modundan sentetik ekran görüntüleri eklenmesi (portfolyo için güçlü, isteğe bağlı).
