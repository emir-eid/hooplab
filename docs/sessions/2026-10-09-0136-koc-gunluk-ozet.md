# 2026-10-09 01:36 — Koçun günlük özeti: şema, denetçi, `coach_summaries` ve `coach-daily`

- **Faz:** 3 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, yüksek
- **Commit'ler:** bu raporun `rep` commit'i

## Blok 1 — Anlık değerler, günün sayıları belgesi, denetçi ve `coach_summaries` (01:22)

### Amaç
STATE'teki 1. işin ilk dilimi ([0032](../decisions/0032-ai-koc-tasarimi.md)): uygulamanın göndereceği anlık değerlerin şeması, ölçüm → kural kimliği eşlemesi, alıntı ve sayı denetçisi, `coach_summaries` tablosu.

### Yapılanlar
- **Anlık değerler** ([snapshot.ts](../../supabase/functions/_shared/coach/snapshot.ts)): sürümlü katı şema; şemada olmayan alan reddedilir (kilo, ad gibi veri modele sızmasın), aralık / tip / tarih denetimi, hataların hepsi birlikte döner. Ölçüm → kural eşlemesi (`metricRules`) sunucuda; kural kimliğini istemci göndermez. Tahmin olan ölçümler işaretli. Enum listeleri motorla testle eşit.
- **Günün sayıları belgesi** ([documents.ts](../../supabase/functions/_shared/coach/documents.ts)): her ölçüm ayrı blok (özel içerikli belge, citations blok kimliğiyle döner), kaynaklar ayrı düz metin belge; sayılar uygulamadaki gibi yuvarlanır; pencere uzunlukları ve eşikler istemciden değil kural paketinden okunur; tarih modele gitmez.
- **Kanıt tabanı paketi kural değerlerini de taşıyor:** `tools/research/coach-kb.mjs` artık `value` alanını paketler; `kb-data.ts` yeniden üretildi, üretici testi güncellendi.
- **Denetçi** ([audit.ts](../../supabase/functions/_shared/coach/audit.ts)): cümle cümle; rakamlı cümle sayının geçtiği bloğa alıntı yapmalı, öneri / yorum cümlesi kaynağa alıntı yapmalı (kökler, -meli, -abilir, cümle sonu emir kipi), alıntısız cümle yalnız kısa geçiş, tahmin bloğuna dayanan cümlede "tahmin", "â" yok; geçersiz alıntı (olmayan belge, yanlış konum türü, aralık dışı) reddedilir. Binlik nokta ve ondalık virgül iki yazımla da tanınır.
- **Uygulamayla sözleşme** ([coach-contract.test.ts](../../apps/mobile/src/copy/coach-contract.test.ts)): her açıklama sayfasının kuralları koçun ilgili ölçümünde; koçun kuralları açıklama sayfalarında (tek gerekçeli istisna `agri-olcek`); etiketler (durum, gün tipi, bölge, taraf, check-in maddeleri) uygulamadakiyle aynı. Eşleme için yükte `seans-rpe-olcek`, beslenmede `ogun-besin-listesi` eklendi.
- **`coach_summaries`** ([migration](../../supabase/migrations/20261009012204_koc_ozetleri.sql), [pgTAP](../../supabase/tests/database/koc_ozetleri.test.sql)): her deneme bir satır (`accepted` / `rejected` / `failed`), durum alanları CHECK ile tutarlı; sahibi yalnız okur, yazan yalnız service_role, güncelleme ve silme yok. Yerelde `npm run test:db` 140/140; politika bilerek gevşetilince test 5 maddede kırıldı, geri alınınca geçti. Bulutta `db push --dry-run`, push, `migration list`, `db advisors` (yalnız kabul edilmiş sızan şifre uyarısı) ve yetki / RLS sorgusu.
- Testler: `supabase/functions/tests/coach/` (`snapshot`, `documents`, `audit`).

### Kararlar
- Karar kaydı yok; [0032](../decisions/0032-ai-koc-tasarimi.md)'nin uygulaması. Ayrıntı kararları: eşikler sunucuda kural paketinden okunur (istemciden gelmez); denetçiye "tahmin bloğuna dayanan cümle tahmin der" kuralı eklendi; reddedilen yanıt denetim için saklanır ama gösterilmez.

### Sorunlar ve hatalar
- Python ile düzenlenen iki dosya CRLF'e döndü (LESSONS'taki bilinen tuzak, dördüncü kez); `sed 's/\r$//'` ile düzeltildi, sonraki düzenlemeler `newline` belirtilerek yapıldı.
- Denetçinin ilk sürümünde sonraki alıntılı parçanın başındaki nokta önceki cümleye o parçanın alıntısını taşıyordu (test yakaladı); parça cümleyle harf / rakam paylaşmıyorsa sayılmıyor. Geçersiz alıntının blokları da artık cümleye sayılmıyor.

### Öğrenilenler
- LESSONS: Citations yanıtının parça yapısı ve konum indisleri ([kaynaklı]); Python CRLF maddesine tekrar tarihi.

## Blok 2 — `coach-daily` Edge Function (01:30)

### Amaç
Günlük özetin sunucu tarafını tamamlamak: Claude çağrısı, denetim, kayıt, maliyet koruması; sahte Anthropic sunucusuyla testler ve buluta dağıtım.

### Yapılanlar
- **Akış** ([daily.ts](../../supabase/functions/_shared/coach/daily.ts)): doğrulama (tarih sunucunun UTC gününden en fazla bir gün sapabilir) → aynı gün kayıt varsa model çağrılmaz, saklanan sonuç döner → yoksa Claude: `claude-sonnet-5-5`, `thinking: adaptive`, efor `medium`, `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`), citations; yanıt denetlenir ve kaydedilir. Yeniden üretme yalnız `?regenerate=1` ile, günde en fazla 3 deneme. Ret (`refusal_<kategori>`), kesilme (`max_tokens`), API (`anthropic_<durum>`) ve bağlantı hataları kodla kaydedilir; mesaj metni saklanmaz. Düşünme blokları saklanmaz. Yedek devreye girerse `fallback` ve yanıtı veren model kayda geçer. Solunum ve yüksek ağrı notları modele bırakılmaz; yanıtta not kodu döner, metni uygulama gösterecek.
- **Giriş noktası** ([coach-daily/index.ts](../../supabase/functions/coach-daily/index.ts)): `auth: 'user'`, SDK istemcisi (zaman aşımı 60 sn, bir yeniden deneme; ücretsiz planın 150 sn sınırı içinde). Veritabanı katmanı [service.ts](../../supabase/functions/_shared/coach/service.ts).
- **SDK:** `@anthropic-ai/sdk` 0.128.0 (iki haftadan eski son sürüm) devDependency; Deno'da `npm:` adresi, tsconfig `paths` ile repodaki pakete eşlendi. Tipler `node_modules`'tan doğrulandı (`fallbacks`, beta başlığı, `BetaCitationContentBlockLocation`, `output_config.effort`). Citations biçimi resmi dokümandan okundu.
- **Testler** ([daily.test.ts](../../supabase/functions/tests/coach/daily.test.ts), [fake-anthropic.ts](../../supabase/functions/tests/coach/fake-anthropic.ts)): gerçek SDK, `fetch` enjeksiyonuyla sahte sunucu; istek biçimi (beta başlıkta, `fallbacks`, belgeler, citations, tarih ve kullanıcı kimliği istekte yok), kabul / önbellek / ret / sınır / ret durumu / kesilme / 401 / 400 / ağ / yedek / geçersiz girdi / yönlendirme notları. Fonksiyon testleri toplam 66.
- **Yerelde Deno'da uçtan uca:** `functions serve` + sahte sunucu ([tools/dev/fake-anthropic.mjs](../../tools/dev/fake-anthropic.mjs), SETUP §9) + seed'deki sentetik demo kullanıcısı: ilk üretim 200, aynı gün önbellek, `regenerate`, şema reddi 400, oturumsuz 401.
- **Bulut:** `functions deploy coach-daily` (ACTIVE); oturumsuz istek 401; `npm run setup:check` 13/13. Kurulum sihirbazının fonksiyon listesine ve `config.toml`'a eklendi.
- Belgeler: ROADMAP (alt maddeler), SETUP §9, DATA-INVENTORY (koç satırları), LESSONS.

### Kararlar
- Karar kaydı yok; 0032'nin uygulaması. Ayrıntılar: günde 3 deneme sınırı (maliyet ayarı), normal açılış başarısız denemeyi yeniden çağırmaz (yeniden deneme elle), uygulama yalnız denetimden geçen metni alır.

### Sorunlar ve hatalar
- İlk gerçek çağrı yapılamadı: fonksiyon kullanıcı oturumu istiyor; kullanıcının oturumuyla Claude çağıramaz. Uygulama tarafıyla birlikte yapılacak.

### Öğrenilenler
- LESSONS: dolu bir günde kural grafiğiyle seçim tabanın neredeyse tamamını seçiyor (sentetik tam gün 78/78 kaynak, istek ~109 KB; yalnız toparlanma 8 kaynak, ~15 KB): 0032'deki günlük özet tahmini yalnız seyrek günler için geçerli ([ölçüldü]). Edge Runtime SDK'yı ve paketi yüklüyor; paylaşılan modüller SDK'yı yalnız `import type` ile alır ([ölçüldü]).

## Ek — Apple
- Apple Developer desteği yanıt verdi; kullanıcı istenen kimlik ve adres belgelerini 2026-10-09'da e-postayla gönderdi, onay bekleniyor (STATE, COSTS, ROADMAP). Belgelerin içeriği hiçbir dosyaya yazılmadı.

## Açık kalanlar
- Uygulamada anlık değerleri kuran modül, Bugün'de koç kartı, yönlendirme notlarının metni, demo özetleri.
- İlk gerçek çağrı ve `usage` ölçümü; dolu günde maliyet tahmini 0032'nin üstünde çıkabilir, ölçüme göre seçim daraltılabilir (kullanıcı kararı).
- Denetçinin bilinen boşlukları (yazıyla sayı, listede olmayan emir kipi, sayının yönü); gerçek yanıtlarla ayarlanacak.
- Token takibi (10 Ekim 01:17 ve 11 Ekim 17:18'den sonra); Apple onayı.

## Sıradaki adım
- Faz 3: uygulama tarafı (anlık değerler, Bugün'de koç kartı, demo özetleri) ve ilk gerçek çağrı ile `usage` ölçümü.
