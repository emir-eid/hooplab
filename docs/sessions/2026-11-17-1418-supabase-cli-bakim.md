# 2026-11-17 14:18 — Supabase CLI, bakım, skill güncellemesi ve davet şifresi

- **Faz:** 4
- **Durum:** kapandı (/kapat, 2026-11-17 15:30)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `3ec39d8` (Blok 1), `8195d38` (Blok 2), `034c968` (Blok 3), `48af695` (Blok 4), kapanış commit'i

## Blok 1 — Supabase CLI 3.1.0 (14:18)

### Amaç
STATE "Sıradaki işler" 2: Supabase CLI'ı 3.0.0'dan 3.1.0'a yükseltmek ve `setup:check` ile doğrulamak.

### Yapılanlar
- Sürüm seçimi: npm'de `latest` 3.2.0 (2026-11-16, bir günlük); 3.1.0 2026-11-09'dan beri yayında. Plan gereği 3.1.0 seçildi.
- Sürüm notu (`gh release view v3.1.0 -R supabase/cli`) okundu. Tek tuzak: yerel ağ geçidi `/functions/v1`'e artık CORS başlığı eklemiyor (#7472). Fonksiyonlar `withSupabase` ile CORS'u varsayılan olarak kendisi yanıtlıyor (`node_modules/@supabase/server` tiplerinden doğrulandı); `ghealth-callback` bilerek `cors: false` (302 yönlendirme). Etki yok.
- `npm install -D supabase@3.1.0 --save-exact`: [package.json](../../package.json) ve kilitte yalnız `supabase` ve `@supabase/cli-*` platform paketleri değişti.
- Doğrulama: `setup:check` bulut 16/16; yerel `setup:check -- --local` ilk koşuda 8/10 (Vault'ta zamanlayıcı sırrı ve proje adresi boş), `setup -- --local --yes` sonrası 10/10; `npm run test:db` 297/297; `npm run check` yeşil; `db advisors --remote` yalnız bilinen sızan şifre uyarısı; `migration list --remote` eşit (son `20261116225532`). 3.1.0'ın bağlı bağlantılardaki CA sabitlemesi bu komutlarla sorunsuz.
- Belgeler: [CHANGELOG](../CHANGELOG.md), [LESSONS](../LESSONS.md) (Supabase: CORS ve CA), [STATE](../STATE.md).

### Kararlar
- yok

### Sorunlar ve hatalar
- Yerel Vault iki değeri boştu (yeniden başlatılan yığın); kod sorunu değil, `setup -- --local` yazdı.

### Öğrenilenler
- LESSONS Supabase: 3.1.0'da yerel `/functions/v1` CORS'u fonksiyona bıraktı; `withSupabase` dışı fonksiyon tarayıcıdan düşer.

## Blok 2 — setup:check davetli metni ve kaçan denetim (14:34)

### Amaç
STATE "Sıradaki işler" 2: `setup:check` "Giriş hesabın" metnini davetliye göre düzeltmek; 2026-11-16 haftalık denetiminin neden rapor bırakmadığına bakmak.

### Yapılanlar
- [setup-lib.mjs](../../tools/setup/setup-lib.mjs): birden çok kullanıcıda "N kullanıcı (sen ve N-1 davetli; davet tools/admin/invite-user.mjs ile)"; eski "tek kullanıcılı uygulama; fazlası gerekmez" kalktı. Test [setup-lib.test.mjs](../../tools/setup/setup-lib.test.mjs) (1 ve 2 kullanıcı); kurulum testleri 34/34, `npm run check` yeşil.
- Zamanlanmış görev `hooplab-haftalik-denetim`: açık, `lastRunAt` 2026-11-16 09:12 (tetiklenmiş), ama görevin çalıştırma listesinde o güne oturum yok (son çalıştırma 2026-11-09). Tetikleme olmuş, oturum açılmamış; kesin sebep kayıtlardan çıkmıyor (uygulama kapalı / uyku olasılığı).
- Görev elle çalıştırıldı (Run now): [denetim 2026-11-17](../audits/2026-11-17.md), sarı, 5 düşük bulgu. CI, bekçiler, Dependabot temiz. Bulgulardan yeni olan: emilkowalski/skills'te `animate-expo`, `apple-design`, `review-animations` klasörlerine dokunan `0f2e23b3` (2026-11-13); kopyalama yapılmadı.

### Kararlar
- yok

### Sorunlar ve hatalar
- Denetim bu bloğun commit edilmemiş değişikliğini bulgu olarak yazdı (beklenen; bu commit'le kapanır).

### Öğrenilenler
- yok (bir kez görüldü; pazartesi tekrar ederse LESSONS'a)

## Blok 3 — kopyalanan skill'lerin güncellenmesi (14:42)

### Amaç
STATE "Sıradaki işler" 2 (denetim 2026-11-17 bulgusu): emilkowalski/skills `0f2e23b3` (2026-11-13) farkını okuyup üç kopyalanmış skill'i güncellemek.

### Yapılanlar
- Kaynak commit "Fix wrong APIs and cross-skill contradictions" okundu; üç klasördeki fark yalnız metin: `Haptics.ImpactFeedbackStyle` / `NotificationFeedbackType` tam adları, sürükleme başında `cancelAnimation`, basma geri bildirimi spring yerine timing, 300 ms sınırına modal / drawer / sheet / toast istisnası, Motion `bounce: 0` eşlemesi. Komut, indirme veya kurulum önerisi yok.
- Bizdeki kopyaların kaynağın `0f2e23b3~1` haliyle aynı olduğu doğrulandı (yalnız satır sonu farkı; yerel değişiklik yok). `review-animations` için ara commit `f1090bec` (2026-11-02) kayıtlı `715c1807`'den (2026-11-09) eski.
- `animate-expo`, `apple-design`, `review-animations` `0f2e23b3`'ten değiştirilmeden kopyalandı (5 dosya, +33 / -41); [THIRD_PARTY_NOTICES.md](../../.claude/skills/THIRD_PARTY_NOTICES.md) commit satırları ve not: yeni metin kaynak repodaki `choreograph` / `animation-performance` skill'lerine göreli bağlantı veriyor, bunlar kopyalanmadı. `react-native-best-practices` güncel (`43cde80a`).
- `npm run check` yeşil.

### Kararlar
- yok (kopyalama kuralı değişmedi: değiştirilmeden kopya)

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- yok

## Blok 4 — davetli şifresi elle belirlenen değerle (15:21)

### Amaç
Kullanıcı davetliyi App Store Connect'te Developer rolüyle ekledi (davet gitti) ve `private/ops.md`'deki geçici şifreyi kendi seçtiği değerle değiştirdi; buluttaki davetli hesabının şifresi bu değere çekilecek.

### Yapılanlar
- [invite-user.mjs](../../tools/admin/invite-user.mjs) `--set-password` kipi: e-postayla hesabı bulur, `ops.md` "Geçici şifre" satırını okur (boş, yer tutucu, 6 karakterden kısa → durur), yalnız `must_change_password` hala açıksa Admin API `PUT /auth/v1/admin/users/<id>` ile şifreyi koyar; meta veri korunur, bayrak açık kalır ve yanıtta denetlenir. Hiçbir değer basılmaz.
- [invite-lib.mjs](../../tools/admin/invite-lib.mjs) `readInvitePassword`, `resetPasswordBody`; testler [invite-lib.test.mjs](../../tools/admin/invite-lib.test.mjs) 6/6; `npm run check` yeşil.
- Bulut: önce `--check` (hesap açık, yönetici erişimi çalışıyor), sonra `--set-password`: şifre değiştirildi, ilk girişte değiştirme zorunlu: evet. Şifreyle giriş Claude tarafından denenmedi (gerçek hesap); ilk girişi davetli yapar.
- Kullanıcının sorusu (yeni hesapta ne sorulur) koddan yanıtlandı: cihaz / kaynak ve spor sorulmaz (hesap açılırken Apple Sağlık · fitness atanır); cinsiyet, kadınsa döngü takibi ve hormonal korunma sorulur; boy, kilo, yaş sorulmaz (kilo isteğe bağlı, gram hedefleri için kullanıcı girer).

### Kararlar
- yok ([0061](../decisions/0061-profil-kaynak-spor-cinsiyet.md) eki gerekmedi: geçici şifre + zorunlu değişiklik kararı aynı, yalnız değeri kullanıcı seçti)

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- yok

## Açık kalanlar
- Davetli: daveti kabul edince TestFlight dahili gruba alınması ve e-posta + şifrenin iletilmesi (kullanıcı); ilk girişte rıza / şifre / profil ve ilk Apple yüklemesi sunucuda salt okuma sorgularıyla denetlenir.
- Haftalık denetim 2026-11-23 pazartesi kendiliğinden çalışıyor mu (çalışmazsa görev saati / makine durumu).
- Supabase CLI 3.2.0 çıktı (2026-11-16); bir sonraki bakımda bakılır.

## Sıradaki adım
- 0061 sıra 6, davetlinin ilk haftası (STATE "Sıradaki işler" 1).
