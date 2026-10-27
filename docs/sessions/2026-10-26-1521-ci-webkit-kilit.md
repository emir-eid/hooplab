# 2026-10-26 15:21 — Senkron yoklaması, CI WebKit yeniden denemesinin kilit kusuru

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-27 20:31)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** `af2075e`, `3e14e41`, `70014ac` (rep), `d259b8a` (rep), `d53b937` (rep), `53d4597` (rep), `db7b685`, `4760054` (rep), `bc5c201` (rep) ve kapanış commit'i

Oturum 2026-10-25 22:48'de açıldı (`/ac`), 2026-10-27 20:31'de kapandı (6 blok: CI kilit kusuru, Google token ölçümü ve geri sayım, iPhone doğrulaması, koç oranları ve Supabase duraklatma, CI zamanlaması, PWA hazırlığı).

## Blok 1 — CI WebKit yeniden denemesi apt / dpkg kilidinde düşüyordu (15:21)

### Amaç
Kullanıcıya GitHub'dan `Kontroller` hata e-postası geldi. Sebebi bulmak ve düzeltmek. Ayrıca blok öncesi: Google senkronunun durumunu token ölçümünden önce yoklamak.

### Yapılanlar
- **Senkron yoklaması** (2026-10-25 22:51, `db query --linked`, yalnız durum sütunları): `connected`, son deneme ve son başarı aynı an (22:17), `last_error` boş, veri bugüne kadar. Ölçüm değil; 7 günlük sınır ölçümü 2026-10-26 12:25 sonrasına kaldı.
- **E-postanın sebebi:** pazartesi zamanlanmış çalışması (`40319111439`, commit `42b9c8c`, dünkü yeşil kodla aynı). GitHub çalışmayı 09:00 yerine 14:59'da başlattı (yerel saat), bu yüzden 10:05 haftalık denetimi onu görmedi ([denetim](../audits/2026-10-26.md) "yeşil" dedi). `uctan-uca` işinin WebKit adımı düştü, testler hiç çalışmadı.
- **Kök neden:** apt aynası yine yavaştı; ilk deneme `timeout 6m`'de kesildi. `timeout` yalnız `npx`'i durdurdu, `sudo apt-get` arka planda sürüp dpkg kilidini tuttu; ikinci deneme "Could not get lock /var/lib/dpkg/lock-frontend" ile anında düştü. 2026-10-22'de eklenen yeniden deneme ilk kez tetiklendi ve işe yaramadığı görüldü.
- **Düzeltme** ([checks.yml](../../.github/workflows/checks.yml)), `af2075e`: denemeler arasında `pkill -x apt-get`, `dpkg --configure -a`; apt'ye `DPkg::Lock::Timeout "120"`; elle çalıştırmada `ilk_deneme_suresi` girdisi (biçim `^[0-9]+[sm]$`, değilse 6m; push ve schedule'da 6m).
- **Zorla sınama 1** (`40320833667`, `ilk_deneme_suresi=20s`): ilk deneme 20 sn'de kesildi; `apt-get` durduruldu ama altındaki `dpkg` paket kurmayı sürdürüyordu, `dpkg --configure -a` kilide çarptı, ikinci deneme "dpkg was interrupted" ile düştü. Aynı committeki push çalışması (`40320822592`) yeşil.
- **Düzeltme 2**, `3e14e41`: `apt-get` durdurulduktan sonra `dpkg` / `apt-get` bitene kadar en çok 2 dk beklenir, sonra toparlanır.
- **Zorla sınama 2** (`40321407883`, `20s`): ilk deneme kesildi, ikinci deneme 23 sn'de WebKit'i kurdu, uçtan uca 7/7; üç iş yeşil. Push çalışması (`40321404514`) üç iş yeşil.

### Kararlar
- yok (CI ayarı; karar kaydı gerektirmiyor)

### Sorunlar ve hatalar
- İlk düzeltme `dpkg` alt sürecini hesaba katmıyordu; normal yol yeşil olduğu için ancak zorla sınamada görüldü.

### Öğrenilenler
- LESSONS "Git ve süreç": `timeout` yalnız doğrudan başlattığı süreci durdurur; apt-get ve dpkg alt süreci, sıra (durdur → bekle → toparla) ve yeniden deneme yolunun zorla sınanması.

## Blok 2 — Google token ölçümü; 7 günlük geri sayım ve hatırlatmalar kalktı (2026-10-27 00:40)

### Amaç
STATE'teki ilk iş: production'a alınan Google OAuth uygulamasında yenileme token'ının 7 günde düşüp düşmediğini ölçmek. Sonucun ortaya çıkardığı yanlış ekran metnini ve bildirimleri düzeltmek.

### Yapılanlar
- **Ölçüm** (2026-10-26 16:49, `db query --linked`, yalnız durum sütunları): bağlantı 2026-10-19 12:25; 7 gün dolduktan sonra 13:17, 14:17, 15:17, 16:17 senkronları başarılı, `last_error` boş, `connected`. Saatlik senkron her seferinde yenileme token'ını kullandığı için yeterli kanıt. Haftalık yeniden bağlanma kalktı.
- **Belgeler:** [0053](../decisions/0053-alan-adi-ve-google-yayin.md) durum ve ölçüm; [0019](../decisions/0019-google-health-senkronu.md) eki; [0045](../decisions/0045-yerel-bildirimler.md) eki; [kurulum.md](../guides/kurulum.md) Testing / production farkı.
- **Ekran** ([google-health.tsx](../../apps/mobile/src/app/(tabs)/me/google-health.tsx), [google-health-status.ts](../../apps/mobile/src/data/google-health-status.ts)): "İzin süresi (tahmini)" satırı, `tokenDaysLeft` ve `TOKEN_LIFETIME_DAYS` kalktı (bağlantıdan 7 gün sonra "Bugün dolabilir" diyordu); alt metin "Google izni geri alınır ya da geçersiz olursa burada yeniden bağlanırsın."; geçersiz izin uyarısı "Google izni artık geçerli değil".
- **Bildirimler** ([notification-plan.ts](../../apps/mobile/src/data/notification-plan.ts), [notifications.tsx](../../apps/mobile/src/app/(tabs)/me/notifications.tsx)): 24 ve 3 saat önceki "izin doluyor" bildirimleri kaldırıldı; senkron durunca ertesi sabah 09:00 hatırlatması kaldı; ayar "Senkron durursa hatırlat".
- **Testler:** geri sayım testleri yerine "7 gün sonra da sorun yok" ve "bağlıyken hatırlatma yok"; sayı denetimi izin listesinden eski metin çıktı.
- **Doğrulama:** `typecheck` temiz, `test:apps` 200/200, `npm run check` yeşil; web 390×844 demo (kurulumsuz yapılandırma): Google Health ve Bildirimler ekranları doğru, konsolda hata yok. iPhone'da bakılmadı.

### Kararlar
- yok (0053'ün beklenen sonucu ölçüldü; 0019 ve 0045'e ek)

### Sorunlar ve hatalar
- `mobil-web` önizlemesi bayat Metro önbelleğiyle "Requiring unknown module" verdi (kod değil); kurulumsuz yapılandırmayla açıldı.

### Öğrenilenler
- LESSONS "Google Health / veri": production'daki External OAuth uygulamasında yenileme token'ı 7 günde düşmez (kalıcı garanti değil).

## Blok 3 — Google Health ve Bildirimler ekranları iPhone'da (2026-10-27 17:33)

### Amaç
Blok 2'deki ekran değişikliğini cihazda doğrulamak.

### Yapılanlar
- Metro tünelle önbellek temizlenerek (`mobile:tunnel -- --clear`) açıldı; kullanıcının isteğiyle bir kez yeniden başlatıldı, adres aynı kaldı.
- iPhone'da (Expo Go 58, tünel) kullanıcı ekran görüntüsüyle doğruladı: Google Health ekranında "İzin süresi" satırı yok, yeni alt metin yerinde, bağlantı "Bağlı", son senkron aynı günün saatlik senkronu; Bildirimler ekranında "Senkron durursa hatırlat" ve yeni açıklama; önceden açık olan anahtar açık kaldı.
- Kod değişikliği yok.

### Kararlar
- yok

### Sorunlar ve hatalar
- yok (sağ üstteki dişli Expo Go'nun geliştirici düğmesi, uygulamanın değil)

### Öğrenilenler
- yok

## Blok 4 — Koç izleme oranları ve Supabase duraklatma kuralı (2026-10-27 17:40)

### Amaç
Beklenen işler dışa bağlıyken iki izleme maddesine bakmak: maç günü ve haftalık koç oranları; LESSONS'taki "doğrulanacak" Supabase duraklatma maddesi.

### Yapılanlar
- `db query --linked` ile yalnız tarih, durum, cümle / gösterilen / kırpılan sayısı, motor yedeği ve maç günü işareti sorgulandı; özet metinleri okunmadı.
- **Maç günü:** tek işaretli gün 2026-10-12; iki gerçek özet, ikisi kabul, gösterilen 9 / 10 ve 7 / 7 (ikincisi cümle sınırı yönergesinden sonra). STATE'teki "henüz görülmedi" eskimişti, düzeltildi. 2026-10-13'ten beri maç günü işareti yok.
- **Günlük özet** (2026-10-12'den beri): 7 kabul, 1 red (2026-10-15, 0056 öncesi), motor yedeği 0. Check-in 2026-10-18'den beri 1 (2026-10-24).
- **Haftalık yorum:** tek kayıt (2026-10-05 haftası, 10 cümle, 7 sınırından önce); kırpma oranı hala ölçülemiyor.
- **Supabase duraklatma:** [Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing) belgesi okundu: 7 günde yeterli kullanıcı veritabanı etkinliği yoksa duraklatma; eşik yok; pano ziyareti ve API istekleri sayılır; pg_cron anılmıyor; ~1 hafta önce uyarı e-postası; veri silinmez. LESSONS maddesi [doğrulanacak] → [kaynaklı]; STATE risk satırı güncellendi.

### Kararlar
- yok (bilerek 7 gün beklemeyle ölçüm yapılmaz; erken uyarı e-postası yeter)

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- LESSONS "Supabase": duraklatma kuralının kaynağı ve sınırları.

## Blok 5 — Haftalık CI çalışması pazar akşamına (2026-10-27 19:10)

### Amaç
Pazartesi 10:05 haftalık denetimin o haftanın zamanlanmış CI sonucunu görebilmesi.

### Yapılanlar
- `gh run list --event schedule`: 06:00 UTC cron'u dört haftada 11:42-14:02 UTC'de başladı (5,7-8 saat gecikme); denetim 07:05 UTC'de, hiçbirini görmedi (2026-10-26 denetimi "yeşil" dedi, çalışma sonradan kırmızı geldi).
- [checks.yml](../../.github/workflows/checks.yml): cron `0 6 * * 1` → `37 18 * * 0` (pazar 21:37 TSİ, saat başı dışı; 8 saat gecikmede bile denetimden ~4,5 saat önce biter), `db7b685`.
- Zamanlanmış görev `hooplab-haftalik-denetim` talimatı (repo dışı): son zamanlanmış çalışmayı ayrıca sorgular (`--workflow checks.yml --event schedule -L 1`); kırmızıysa log özü, 2 günden eskiyse veya sürüyorsa bulgu.
- STATE otomasyon tablosu, CHANGELOG.

### Kararlar
- yok (CI ayarı)

### Sorunlar ve hatalar
- yok

### Öğrenilenler
- LESSONS "Git ve süreç": zamanlanmış çalışma gecikmesi ve okuyucuyla arasına pay.

## Blok 6 — PWA yayın günü hazırlığı (2026-10-27 20:23)

### Amaç
2026-11-03'te PWA'ya geçilirse o gün yalnız onaylı adımlar kalsın; onay istemeyen denetimleri önden yapmak.

### Yapılanlar
- `npm run pwa:build` Expo SDK 58'le geçti (56 static rota; önceki deneme SDK 57'de). `cleanUrls` taklidi yapan yerel sunucuda (scratchpad, repo dışı) giriş / açıklama / Google sayfaları 200, bilinmeyen yol 404, manifest ve simgeler doğru türde; giriş ekranı 390×844, konsolda hata ve yatay taşma yok.
- Giriş metni ([sign-in.tsx](../../apps/mobile/src/app/sign-in.tsx)): web'de oturum `localStorage`'da şifresiz olduğu için web'de "Oturum bu tarayıcıda saklanır; ortak bir cihazda işin bitince çıkış yap."; iPhone metni aynı. Yeni derlemede görüldü.
- Salt okuma denetimleri: Vercel CLI girişli hesap alan adının hesabı, HoopLab projesi yok; `hooplab.dev` ad sunucuları Vercel'de, joker `*` ALIAS kaydı yüzünden `app.hooplab.dev` zaten Vercel'e çözülüyor (DNS kaydı gerekmez). Google fonksiyonları bulutta 2026-10-15 dağıtımı; yalnız `2c6dc6c` (`GHEALTH_WEB_RETURN_URL` desteği) dağıtılmadı; saatlik enerji verisi bugüne kadar geldiği için 10-15 sonrası senkron kodu bulutta.
- [0054](../decisions/0054-pwa-yedek-yolu.md) "Hazırlık denetimi" bölümü: bulgular ve yayın günü sırası (komutlarla).
- Doğrulama: `typecheck`, `npm run check` yeşil. Yayın ve uzak değişiklik yok.

### Kararlar
- yok (0054'e ek; Google fonksiyonlarının önden dağıtımı kullanıcı kararına bırakıldı)

### Sorunlar ve hatalar
- `supabase secrets list` çıktısı değerlerin özetlerini (hash) basıyor; sır değil ama sonraki çağrılarda yalnız adlar süzülür.

### Öğrenilenler
- yok

## Açık kalanlar
- Google fonksiyonlarının (`ghealth-*`) `2c6dc6c` ile dağıtımı: yayın günü ya da kullanıcı isterse önce.
- İlk pazar çalışması 2026-11-01, denetimde görülmesi 2026-11-02.
- Haftalık koç yorumunun 7 cümle sınırından sonraki ilk örneği (Trend → haftalık rapor → "Koç yorumu yaz").
- Supabase'ten duraklatma uyarı e-postası gelirse haber verilir.
- TestFlight Apple onayını bekliyor; PWA karar tarihi 2026-11-03.

## Sıradaki adım
- TestFlight (Apple onayı gelince); gelmezse 2026-11-03'te PWA yedek yolu.
