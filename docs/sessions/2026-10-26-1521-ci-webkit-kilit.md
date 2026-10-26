# 2026-10-26 15:21 — Senkron yoklaması, CI WebKit yeniden denemesinin kilit kusuru

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** `af2075e`, `3e14e41`, `70014ac` (rep) ve Blok 2 rep commit'i

Oturum 2026-10-25 22:48'de açıldı (`/ac`), 2026-10-26'da sürdü.

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

## Açık kalanlar
- Google Health ve Bildirimler ekranlarına iPhone'da bakılmadı.
- TestFlight Apple onayını bekliyor; PWA karar tarihi 2026-11-03.

## Sıradaki adım
- TestFlight (Apple onayı gelince); gelmezse 2026-11-03'te PWA yedek yolu.
