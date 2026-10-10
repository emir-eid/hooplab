# 2026-10-09 14:41 — Koçun günlük özeti, uygulama tarafı ve ilk gerçek çağrı

- **Faz:** 3 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** `bc657c6` (Blok 1), Blok 2'nin `/rep` commit'i

## Blok 1 — Günlük özet: uygulama tarafı, ilk gerçek çağrı, denetçi düzeltmesi (14:41)

### Amaç
STATE'teki 1. iş ([0032](../decisions/0032-ai-koc-tasarimi.md)): uygulamada anlık değerleri kuran modül, Bugün'de koç kartı, demo özetleri; ardından ilk gerçek çağrı ve `usage` ölçümü.

### Yapılanlar
- **Anlık değerler** ([coach-snapshot.ts](../../apps/mobile/src/data/coach-snapshot.ts)): Bugün'ün hesapladığı motor görünümlerinden (toparlanma, check-in kıyası, yük, bölge yükü ve ağrı notları, beslenme, su, bugünkü ter testi) sunucunun şemasına. Şema ve doğrulama aralıkları tek kaynak: uygulama sunucunun `snapshot.ts`'ini doğrudan içe aktarır (içe aktardığı bir şey yok; Metro paketledi, web'de ve iPhone'da çalıştı). Aralık dışı seçmeli değer null olur, gönderilmeden önce sunucunun doğrulaması uygulamada da koşar. Cihaz verisi yoksa toparlanma bölümü gitmez; "son gece" yalnız bugün ya da dün; bölge yalnız toparlanma penceresindekiler, ağrı yalnız notu olanlar.
- **Sözleşme** ([contract.ts](../../supabase/functions/_shared/coach/contract.ts)): yanıt biçimi, yönlendirme notları ve deneme sınırı `daily.ts`'ten ayrıldı (SDK import'u yok); uygulama ve fonksiyon aynı dosyayı kullanır. `snapshotLimits` dışa açıldı.
- **`?peek=1`** ([daily.ts](../../supabase/functions/_shared/coach/daily.ts), [index.ts](../../supabase/functions/coach-daily/index.ts)): yalnız saklanan sonuca bakar; o gün deneme yoksa `none` döner, model çağrılmaz. Test eklendi.
- **Veri katmanı** ([coach.ts](../../apps/mobile/src/data/coach.ts)): `peek` / `generate` / `regenerate`, 2xx dışı gövdelerin okunması, aynı gün ve kip için süren isteğin paylaşılması, 140 sn zaman aşımı; demo API çağırmaz.
- **Koç kartı** ([coach-card.tsx](../../apps/mobile/src/components/coach-card.tsx), [copy/coach.ts](../../apps/mobile/src/copy/coach.ts)): check-in yoksa bekler ("Check-in'siz yaz"), varsa yazdırır; özet konu başlıklarıyla gruplu (Toparlanma, Yük ve vücut, Beslenme ve sıvı), günün durumu cümlesi öne çıkar, alıntılı her cümlenin sonunda numaralı rozet (maket `.cite`); kodla eklenen yönlendirme notları (solunum, yüksek ağrı; Bugün'deki metinlerle aynı); ret, hata (koda göre neden), sınır ve geçersiz durumları; sınıra takılınca gösterilen özet kaybolmaz.
- **Dayanaklar sayfası** ([coach-basis.tsx](../../apps/mobile/src/app/coach-basis.tsx)): rozetten o cümle, "Dayanaklar"dan hepsi; günün sayıları satırı açıklama sayfasına ya da günün durumu yöntemine gider, kaynaklar künye ve türüyle. Veri bellekte, adres satırında sağlık verisi yok.
- **Demo özetleri** ([demo-coach.ts](../../apps/mobile/src/demo/demo-coach.ts)): üç senaryo, demo değerlerinden; test her senaryoyu ve dört takvim gününü sunucunun denetçisinden geçirir, denetçinin bu yolda gerçekten kırıldığı da sınanır ([demo-coach.test.ts](../../apps/mobile/src/demo/demo-coach.test.ts), [demo-inputs.ts](../../apps/mobile/src/demo/demo-inputs.ts)).
- **Bugün** ([index.tsx](../../apps/mobile/src/app/(tabs)/index.tsx)): görünümler gelince anlık değerler bir kez kurulur; kart check-in'in altında.
- **Doğrulama:** web önizlemesinde (390 × 844, açık ve koyu) demo; yerelde sahte Anthropic + `functions serve` + seed kullanıcısıyla gerçek yol (bekleme, yazdırma, kabul, günde 3 sınırı, bağlantı hatası); iPhone'da gerçek hesapla iki gerçek çağrı. `coach-daily` üç kez dağıtıldı (son hali yönerge ve denetçi düzeltmesi), oturumsuz istek 401.
- **İlk gerçek çağrı reddedildi, sebep denetçiydi:** Sonnet 5.5 alıntıları cümlenin üstüne değil, hemen ardından metni boş ayrı bir bloğa koyuyor; denetçi her cümleyi alıntısız saydı. Düzeltme ([audit.ts](../../supabase/functions/_shared/coach/audit.ts)): boş alıntılı parça önündeki cümleye bağlanır. İki yanlış alarm da giderildi: "işaretlenmedi" yorum sayılıyordu (kök "işaret ed" oldu), "Bugün öğün kaydı yok" bloğu tahmin işaretliydi ([documents.ts](../../supabase/functions/_shared/coach/documents.ts)). Reddedilen yanıt yeniden denetlendi: kalan tek sorun, kaynaktan alınan bir sayının günün sayıları yerine kaynağa alıntılanmasıydı (doğru ret); yönergeye eklendi. İkinci çağrı kabul edildi. Ham yanıt repo dışında (`private/data`).
- **Yönerge** (`systemPrompt`): 5-7 cümle, her biri en fazla 22 kelime ve tek fikir; ilk cümle günün durumu; konu başına en fazla iki cümle; olağan değerler atlanır; parantez içi açıklama ve kaynak tekrarı yok; kaynak sayısı cümleye yazılmaz.
- **Kaydırıcı** ([scale-slider.tsx](../../apps/mobile/src/components/scale-slider.tsx)): iPhone'da RPE dolgusu 2'den sonra başparmağı izlemiyordu; SVG'ye sayısal boyut prop'u verildi, kullanıcı iPhone'da doğruladı.
- `copy/training-load.ts` `@/` yerine göreli import (Node testlerinde açılsın diye).

### Kararlar
- [0033 Koçun günlük özeti check-in'den sonra yazılır; kart cümleleri konularına göre gruplar](../decisions/0033-koc-ozeti-check-in-sonrasi.md) — kullanıcı kararı (check-in'i bekleme) ve biçimin kodla kurulması. Ret durumundaki açıklama listesi kaldırıldı (kullanıcı geri bildirimi: çok yer kaplıyor, "i" düğmelerini tekrarlıyor).
- Maliyet düşürme işi kalite ve doğruluktan ödün vermeden yapılacak (kullanıcı talimatı; STATE 1. iş).

### Sorunlar ve hatalar
- İlk gerçek özet denetçi hatasıyla reddedildi (yukarıda); gerçek yanıtın yapısı repo dışına alınıp yeniden oynatılarak bulundu ve düzeltildi.
- Gerçek özet tek paragraf ve uzun cümleler halinde geldi (kullanıcı: okuması zor); kart gruplaması ve yönergeyle çözüldü, yeni yönerge bir sonraki yazımda görülecek.
- Yerel denemede `psql -c` ile iki sorgu tek işlemde koştu, ikincisi hata verince silme geri alındı; ayrı çalıştırıldı.

### Öğrenilenler
- LESSONS "Claude API (koç)": Sonnet 5.5'in alıntıyı boş ayrı blokta vermesi ([ölçüldü], bekçi `audit.test.ts`); dolu günde özet ~60 bin girdi token'ı, çağrı başına ~0,15 $ ([ölçüldü]).
- LESSONS "Expo / React Native": iOS'ta yalnız `style` genişliği değişen SVG'nin `100%` şekli ilk ölçüde kalıyor ([ölçüldü]).

## Blok 2 — Koç maliyeti: ölçüm, kısmi kabul, kaynak seçimi (2026-10-10 21:32)

### Amaç
STATE'teki 1. iş (kullanıcı isteği): koçun maliyetini, kaliteden ve doğruluktan ödün vermeden düşürme seçeneklerini araştırmak; aynı oturumda kullanıcı "beslenme halkalarından gram girişi" ve "maliyet araştırması" işlerini sıraya aldırdı, maliyet ilkesini (kaynaksız / saçma beyan riski artırılmaz) hafızaya ve STATE'e yazdırdı.

### Yapılanlar
- **Gerçekler resmi kaynaktan:** fiyat, önbellek ve Batch kuralları platform.claude.com pricing / prompt-caching / optimizing-for-cost sayfalarından (2026-10-09). Sonnet 5.5: girdi 2 $, çıktı 10 $, önbellek okuma 0,10 $ / MTok; en kısa önbelleklenebilir önek 512 token; Batch %50. Günde tek özet için önbellek ertesi güne kalmıyor (en çok 1 saat), Batch kullanıcı beklerken uygun değil, efor tasarrufu tavanı ~%10.
- **Token profili:** gerçek istekte girdinin ~%95'i kaynak özetleri (78'in 71'i); yönerge ve günün sayıları ~2,6 bin token.
- **Kaynak ayarları kodda:** `attentionMetrics` ([snapshot.ts](../../supabase/functions/_shared/coach/snapshot.ts)), `withoutAppNumbers` ([kb.ts](../../supabase/functions/_shared/coach/kb.ts)), `SourceOptions` / `coachSourceOptions` ([daily.ts](../../supabase/functions/_shared/coach/daily.ts)); testli.
- **Ölçüm** ([tools/coach-eval/run.ts](../../tools/coach-eval/run.ts)): 4 gün × 3 ayar × 2 deneme, Batch API, ~1,42 $ (kullanıcı onaylı bütçe ~1,5 $). Anahtar kullanıcının kendi PowerShell'inde gizli girişle gitignore'lu dosyaya yazıldı (3 saatlik `hooplab-eval`), ölçümden sonra dosya silindi. Sonuçlar ve yan yana metinler repo dışında (`private/data/coach-eval/`). Bütün ölçümler 0,143 $ / 6 geçti, dikkat isteyenler 0,113 $ / 5, tablosuz 0,098 $ / 6 (8'de; fark gürültü).
- **Retlerin hepsi gerçek kural ihlali** (alıntısız sayı cümlesi, alıntısız kopya + alıntılı asıl, dayanağın sonraki cümlede olması); ölçüm boyunca ~%25.
- **Kısmi kabul** ([0034](../decisions/0034-koc-kismi-kabul.md); `salvageAudit`, [audit.ts](../../supabase/functions/_shared/coach/audit.ts)): geçmeyen cümle atılır, gösterilen her cümle denetimden geçer; alıntısız kopya her yanıtta ayıklanır; durum cümlesi ve en az 3 cümle şartı; atılanlar `audit.shown` ile kayıtta, uygulamaya `omitted` sayısı; kart "Kaynak denetiminden geçmeyen N cümle gösterilmedi." yazar. Ölçümün zamandan bağımsız iki gününde 4 retten 3'ü artık gösteriliyor.
- **Kaynak seçimi** ([0035](../decisions/0035-koc-kaynak-secimi-dikkat.md)): üretimde yalnız dikkat isteyen ölçümlerin kaynakları (kullanıcı kararı, yan yana metinleri okuduktan sonra); demo testi üretimdeki isteği kurar.
- Uygulamanın test tsconfig'ine `npm:` SDK eşlemesi (testler `daily.ts`'i içe aktarıyor).
- Doğrulama: fonksiyon testleri 78, uygulama 126, `npm run check` yeşil; `coach-daily` iki kez dağıtıldı (kısmi kabul, sonra kaynak seçimi), oturumsuz istek 401.

### Kararlar
- [0034 Koç özetinde kısmi kabul](../decisions/0034-koc-kismi-kabul.md) — kullanıcı kararı (b seçeneği).
- [0035 Günlük özette yalnız dikkat isteyen ölçümlerin kaynakları](../decisions/0035-koc-kaynak-secimi-dikkat.md) — kullanıcı kararı ("yalnız A yeterli"); tablo çıkarma kapalı ayar olarak kaldı.
- Maliyet ilkesi hafızada (`maliyet-kaliteyi-bozmaz`): kalite ve doğruluk pazarlık konusu değil.

### Sorunlar ve hatalar
- Python ile yapılan düzenlemelerde dosyaların bir kısmı çalışma kopyasında CRLF'ydi; `
` ile arama eşleşmedi, bir alan eklenmedi (tip denetimi yakaladı). Çalışma kopyasındaki CRLF dosyalar LF'ye çevrildi; içerik aynı (blob karmaları eşit).
- İlk kopya ayıklama yalnız reddedilen yanıtta çalışıyordu; tam geçen yanıttaki kısa alıntısız kopya kartta iki kez görünürdü. Test yakaladı, her yanıtta çalışacak biçimde düzeltildi.
- Ölçümün ham yanıtları ilk koşuda saklanmadı; retleri incelemek için sonuçlar toplu istekten yeniden çekildi. Demo günleri saate bağlı (bölgenin son yüklenmeden bu yana saati); yeniden oynatmada farklı `now` sayı uyuşmazlığı üretti, bu satırlar sayılmadı.

### Öğrenilenler
- LESSONS "Claude API (koç)": özetlerin ~%25'i kural ihlaliyle reddediliyor, kısmi kabul ([ölçüldü]); Batch ile ölçüm ve demo günlerinin saate bağlılığı ([ölçüldü]).
- LESSONS "Git ve süreç": çalışma kopyasında CRLF kalmış dosyalar betikle düzenlenirken eşleşmeyi bozuyor ([ölçüldü]).

## Açık kalanlar
- Kısa cümle yönergesinin ve kısmi kabulün gerçek yanıttaki etkisi bir sonraki gerçek özette görülecek; atılan cümle oranı izlenir.
- "Bugün maç var" işareti yok; anlık değerlerde `matchDay` hep false.
- Özetteki kaynak tablosunu çıkarma seçeneği kodda kapalı; kaynaktan sayı alma retleri sürerse yeniden ölçülür.
- Token takibi: CLI tarafı (10 Ekim 01:17 sonrası) artık bakılabilir, uygulama tarafı 11 Ekim 17:18'den sonra; Apple onayı.

## Sıradaki adım
- Beslenme halkalarından doğrudan gram girişi (STATE 1. iş).
