# 2026-10-09 14:41 — Koçun günlük özeti, uygulama tarafı ve ilk gerçek çağrı

- **Faz:** 3 (Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5
- **Commit'ler:** bu bloğun `/rep` commit'i

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

## Açık kalanlar
- Koç maliyeti 0032 tahmininin 4 katı; araştırma STATE'te 1. iş (kalite pazarlık konusu değil).
- Yeni yönergenin (kısa cümle) gerçek yanıttaki etkisi henüz görülmedi.
- "Bugün maç var" işareti henüz yok; anlık değerlerde `matchDay` şimdilik hep false.
- Token takibi (10 Ekim 01:17 ve 11 Ekim 17:18'den sonra); Apple onayı.

## Sıradaki adım
- Koç maliyetini düşürme araştırması (STATE 1. iş).
