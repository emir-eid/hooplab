# 2026-10-16 19:34 — Performans turu

- **Faz:** 4 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-16 19:39)
- **Model / efor:** Opus 5.5, orta
- **Commit'ler:** `72b3f49` (Blok 1, `rep` commit'i), bu raporun kapanış commit'i

## Blok 1 — Performans turu (19:34)

### Amaç
STATE'teki sıradaki iş: Faz 4'ün performans maddesi. Kullanıcı ana işi seçti. ROADMAP'teki "Vercel React Native kuralları" skill'i kurulu değil; yöntem `react-native-best-practices` skill'inden alındı.

### Yapılanlar
- **Ölçüm:**
  - Yerel web önizlemesinde (seed'deki sentetik kullanıcı) Bugün'ün istekleri sayıldı: 27 REST isteği, hepsi paralel, `training_sessions` 9 kez.
  - Üretim iOS paketi (`expo export --source-maps`) paket paket ayrıştırıldı: three.js 2 MB kaynak, %21.
  - Metro modül kaydıyla, Bugün açıkken `body-scene` ve three.js'in yüklenmiş olduğu görüldü.
  - Sekme dönüşü `longtask` gözlemcisiyle ölçüldü (demo, masaüstü dev: Bugün'e dönüşte 60 ms).
  - iPhone'da geçici günlükle Bugün'ün veri süresi ve Keychain okuma sayısı ölçüldü (aşağıda).
- **3D geç yükleme:** [body-view.tsx](../../apps/mobile/src/components/body-view.tsx) `BodyScene`'i GL bağlamı kurulunca `import()` ile alır. Açılışta three.js artık yüklenmiyor (web, modül kaydı), Vücut'ta model çiziliyor (web ve iPhone).
- **Oturum önbelleği:** [chunked-storage.ts](../../apps/mobile/src/lib/chunked-storage.ts) okunan ve yazılan değeri bellekte tutar; yazma veya silme yarıda kalırsa önbellek bırakılır. 2 yeni test (eşzamanlı 27 okuma depoya bir kez gider; silme ve yarıda kalan yazma).
- **Odakta koşullu yenileme:** yeni [revision.ts](../../apps/mobile/src/data/revision.ts) (4 test).
  - Veri sürümünü artıranlar: istemcinin `global.fetch` sarmalayıcısındaki yazma istekleri ([supabase.ts](../../apps/mobile/src/lib/supabase.ts)), kullanıcı değişimi, demo deposunun 15 yazma metodu ve demo açma / kapama.
  - Bugün ve Trend kapıdan geçince çeker: sürüm değişmişse, gün dönmüşse ya da 5 dakika geçmişse.
  - Web'de doğrulandı: sekme dönüşünde istek sayısı sabit kaldı ve uzun görev yok. Su kaydından sonra Bugün yenilendi (gerçek yerel kullanıcıda 0,0 → 0,3 L, demoda 1,5 → 2,0 L).
- **iPhone:** kullanıcı denedi: oturum açık geliyor, Vücut'ta model açılıp dönüyor, su kaydı Bugün'e yansıyor.
- `npm run check` yeşil.

### Kararlar
- [0048 Performans turu](../decisions/0048-performans-turu.md) — 3D geç yükleme, oturum önbelleği, odakta koşullu yenileme; `training_sessions` birleştirmesi yapılmadı.

### Sorunlar ve hatalar
- **İlk sekme dönüşünde gereksiz yeniden çekiş.** Kapı ilk dönüşte bir kez daha çekti. Sebep, oturum geri yüklenirken gelen `SIGNED_IN` olayının sürümü artırmasıydı. Çözüm: olay adı yerine kullanıcı kimliğinin değişmesine bakılıyor.
- **Hissedilen yavaşlık.** Kullanıcı telefonda "sanki daha yavaş" dedi. Ölçüm yapıldı: Bugün'ün veri süresi önbellek açıkken 194 / 598 / 391 / 204 ms, kapalıyken 433 / 234 / 328 ms. Keychain okuması 0'a karşı 95-98. Fark ağ gürültüsünün içinde, yavaşlama yok. Önbelleğin etkisini bloğun başında fazla iddialı anlatmıştım; ölçüm düzeltti. Hissin olası nedeni: Metro'nun `--clear` ile yeniden derlemesi ve geliştirme modunda 3D parçanın Metro'dan ayrıca inmesi. Geçici ölçüm kodu kaldırıldı.
- **Düzenleme sırasında anlık hata.** Bir anlık yenileme `createFocusGate is not defined` verdi (import eklenmeden önceki ara durum). Kalıcı değil.

### Öğrenilenler
- LESSONS "Expo / React Native"e 2 madde: expo-router sekmeleri açılışta birlikte yükler (ağır bağımlılık dinamik `import()` ile); supabase-js her istekte oturumu depodan okur ve oturum geri yüklenirken `SIGNED_IN` olayı gelir.

## Açık kalanlar
- Performans: `training_sessions` okumalarının birleştirilmesi yapılmadı (0048; kazanç küçük).
- Uygulamanın açılış süresi telefonda ölçülmedi. Anlamlı ölçüm üretim derlemesinde (TestFlight) yapılır.
- Google Health yeniden bağlanma: sınır 2026-10-19 11:55.

## Sıradaki adım
- STATE'teki ilk iş: iOS uçtan uca test (EAS Simulator + Maestro) ya da portfolyo sayfası.
