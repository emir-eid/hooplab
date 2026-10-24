# 2026-10-24 14:03 — CI: WebKit kurulumunda zaman sınırı ve yeniden deneme

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** `9d981f2`, `3df6d0a` (rep) ve Blok 2 rep commit'i

## Blok 1 — Kontroller iptalinin sebebi ve WebKit adımının sağlamlaştırılması (14:03)

### Amaç
`/ac`'de görülen iptal: 2026-10-22 17:49 UTC'deki `Kontroller` çalışması (`39825966827`) 15 dk 20 sn'de iptal olmuştu. Sebebi bulmak; ağ kaynaklıysa CI'ı bu tür yavaşlıklara karşı dayanıklı yapmak.

### Yapılanlar
- Teşhis (`gh run view --log`): `kontrol` ve `veritabani` yeşil; `uctan-uca` işinde `npx playwright install --with-deps webkit` adımında apt, paketleri `azure.archive.ubuntu.com`'dan saniyede ~40-100 KB ile indirdi (7,5 MB'lık yazı tipi paketi ~2 dk). 35. pakette işin 15 dk sınırı doldu, testler hiç başlamadı. Kod sorunu değil.
- Geçmiş: son 40 çalışmanın 38'i yeşil; öteki hata (2026-10-21, `39669535342`) `kontrol` işinde `npm ci`'de `ECONNRESET`, o da ağ. WebKit adımı normalde 30-50 sn; 2026-10-22 10:31'deki başarılı çalışmada 8 dk 22 sn sürmüş (yavaş ayna, bitmiş).
- [checks.yml](../../.github/workflows/checks.yml) (`9d981f2`): WebKit kurulumu deneme başına `timeout 6m`, bitmezse uyarı ve bir yeniden deneme; iki deneme de bitmezse adım hata verir. İndirilen paketler apt önbelleğinde kaldığı için ikinci deneme kaldığı yerden sürer. İş sınırı 15 → 20 dk (2 × 6 dk + kurulum ve testler).
- Doğrulama: YAML yerelde `yaml` ile ayrıştırıldı, betik `bash -n` ile denetlendi; push sonrası çalışma `39945472803` üç işte yeşil, WebKit adımı 41 sn.

### Kararlar
- yok (CI ayarı; ayrı karar kaydı gerekmedi)

### Sorunlar ve hatalar
- Sınır: yeniden deneme yolu gerçek bir yavaşlıkta henüz çalışmadı; ilk tetiklenişte Actions'ta "WebKit kurulumu 1. denemede bitmedi" uyarısı görünür.

### Öğrenilenler
- LESSONS "Git ve süreç": CI'da `--with-deps` kurulumu apt aynasına bağlı, tek bir adım işin bütün süresini yiyebilir; ağa bağlı adımlara kendi sınırı ve yeniden deneme.

## Blok 2 — Expo Go çökmesi ve Expo SDK 58 yükseltmesi (15:28)

### Amaç
Kullanıcı: Expo Go, HoopLab'i açarken üç denemede de çöküyor. Sebebi bulmak; projeyi çalışır hale getirmek.

### Yapılanlar
- Teşhis: Metro paketi bilgisayardan istenince hatasız derliyordu. ngrok'un yerel istek kaydında (`127.0.0.1:4040/api/requests/http`) telefonun istemcisi `Exponent/58.0.5` göründü: App Store'daki Expo Go SDK 58'e güncellenmiş, proje SDK 57. Telefon manifesti üç kez aldı, paketi hiç istemedi; çöküş manifest aşamasında, bizim kod çalışmadan. SDK 58 2026-09-29'da çıkmış (`npm view expo time`); sürüm notu "yeni Expo Go yalnız SDK 58'i destekler" diyor.
- Yükseltme (`expo-upgrade` skill'i, sürüm notları expo.dev/changelog/sdk-58): `npx expo install expo@^58.0.0` ve `--fix`. Expo 58.0.19, React Native 0.88.0, React 19.3.0, expo-router 58.0.26, Gesture Handler 2.32 → 3.3.0, Reanimated 4.7.1, Worklets 0.13.0, `@types/react` 19.3; Expo paketleri 58.x ([package.json](../../apps/mobile/package.json)).
- İlk kurulum iki React Native kopyası bıraktı (kökte 0.86.3, `apps/mobile/node_modules`'ta 0.88.0; `@expo/cli` kökteki expo-router 57'yi görüyordu); `npm dedupe` çözmedi. `node_modules` ve `package-lock.json` silinip yeniden kuruldu; her paketin tek kopyası (`npm ls`). Dolaylı bağımlılıklar kendi aralıklarında güncellendi.
- Kod: [tab-bar.tsx](../../apps/mobile/src/components/tab-bar.tsx) expo-router 58'in sekme çubuğu prop'larına geçti (`navigation` yok; `emitter.emit` + `navigateToTab(route.key)`, router'ın kendi `BottomTabBar`'ıyla aynı). [gesture-scroll.tsx](../../apps/mobile/src/components/gesture-scroll.tsx) `LegacyScrollView` kullanıyor: Gesture Handler 3'ün `ScrollView`'u hook API'siyle yazılmış ve eski `Gesture.Pan()` hareketleriyle ilişki kurulamıyor (geçiş rehberi); beş sürüklemeli bileşen `blocksExternalGesture(scrollRef)` ile buna dayanıyor. [sign-in.tsx](../../apps/mobile/src/app/sign-in.tsx), [text-field.tsx](../../apps/mobile/src/components/text-field.tsx): RN 0.88'in katı tiplerinde ref tipi `ComponentRef<typeof TextInput>`. [app.json](../../apps/mobile/app.json): `expo install`'ın istediği `expo-font`, `expo-sharing`, `expo-status-bar` eklentileri.
- Tünel: Expo CLI 58 `--tunnel`'da varsayılan olarak Expo hesabı tüneli (`*.on.expo.app`) açıyor; adres her başlatmada değişti (iki başlatmada iki farklı adres, `AsyncWsTunnel.js`: hesap için imzalı URL). [mobile-tunnel.mjs](../../tools/dev/mobile-tunnel.mjs) `--tunnel ngrok` ile başlatıyor (CLI'da "legacy"); kalıcı `exp.direct` adresi korunuyor.
- Doğrulama: `npm run typecheck`, `npm run check` yeşil; `expo-doctor` 20/20; `npm run e2e` 7/7 (sekme geçişi dahil); tünelden manifest 200 ve SDK 58.0.0; iOS paketi derlendi (2219 modül). Kullanıcı iPhone'da açtı: "Telefonda açıldı, çalışıyor." Metro günlüğünde yalnız bilinen `expo-notifications` Expo Go uyarıları.

### Kararlar
- yok (SDK yükseltmesi ve tünel sağlayıcısı; gerekçe bu blokta ve SETUP §8'de)

### Sorunlar ve hatalar
- `npx expo install --fix` `@types/react`'ı `dependencies`'e ekledi, `devDependencies`'teki eskisi kaldı; elle düzeltildi.
- npm 9 güvenlik uyarısı raporluyor (3 orta, 6 yüksek; ör. `node-forge`, `zod`); incelenmedi.
- Sınır: sürükleme davranışı (kaydırıcı, grafikler, vücut görünümü) cihazda ayrıca denenmedi; kullanıcı uygulamanın açıldığını ve çalıştığını bildirdi.

### Öğrenilenler
- LESSONS "Expo / React Native": App Store'daki Expo Go yeni SDK'ya geçince eski SDK'lı proje uyarısız çöker; tanı ngrok istek kaydındaki istemci sürümü. Expo CLI 58 tüneli ve kalıcı adres için `--tunnel ngrok`. Gesture Handler 3'te eski ve hook API'si arasında ilişki yok. SDK yükseltmesinden sonra `npm ls react-native` ile tek kopya denetimi.

## Açık kalanlar
- Sürüklemeli beş bileşeni (ScaleSlider, BodyView, HRV / yük / saatlik enerji grafikleri) Gesture Handler 3 hook API'sine taşımak; o zaman `LegacyScrollView` kalkar. Cihazda sürükleme davranışına bakılır.
- npm güvenlik uyarıları (9) incelenir; Dependabot ile birlikte.
- WebKit yeniden deneme yolunun ilk gerçek tetiklenişi izlenir (haftalık denetim CI sonucunu okur).
- Kullanıcı: check-in (koç oranları ölçümü için).

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
