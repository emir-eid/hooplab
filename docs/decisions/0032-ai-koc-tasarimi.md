# 0032. AI koç: Claude Sonnet 5.5, vektör araması yok, citations ile kaynak zorunluluğu, sayıları kod denetler

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-08
- **İlgili:** [0004](0004-mimari-hesap-motoru-kanit-ai.md), [0009](0009-herkes-kendi-hesabiyla.md), [0015](0015-veritabani-tek-sahip-rls.md), [0021](0021-toparlanma-kisisel-bant.md), [0022](0022-demo-modu.md), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md), PRODUCT §3 (modül 7 ve 8), §10, ROADMAP Faz 3, [oturum raporu](../sessions/2026-10-08-1206-takip-bant-ve-token.md)

## Bağlam
Faz 3 koçu, motorun hesapladığı sayıları ve kanıt tabanını kullanarak bir günlük özet yazacak ve soru-cevap yapacak. 0004'ün koyduğu sınırlar geçerli: sayıları kod hesaplar, AI yalnız yorumlar, her iddia kaynaklıdır, kaynak yoksa "yeterli kanıt yok" denir. Kırmızı bayrakta yorum yapılmaz, takviyede doping uyarısı verilir.

Bu kararın cevaplaması gereken sorular: hangi model, kanıtlar modele nasıl seçilip verilir, kaynak zorunluluğu nasıl sağlanır, hangi veri gider, maliyet ne olur, uygulamada nerede görünür.

Ölçülenler (2026-10-08):
- Kanıt tabanı küçük: `research/sources` (79 dosya) ve `research/rules` (7 dosya, 33 kural) birlikte yaklaşık 150 KB. Tahminen 50 bin token civarı; Türkçe metinde tokenizer'a göre değişir, ilk çağrıda ölçülecek.
- Hesaplanmış değerler şu an saklanmıyor, cihazda hesaplanıyor (DATA-INVENTORY).

## Seçenekler

### Sağlayıcı ve model
Fiyatlar resmi sayfalardan alındı (2026-10-08). Aylık tahmin aynı senaryoyla hesaplandı: 30 günlük özet (~15 bin token girdi, ~2 bin çıktı, önbelleksiz) ve 10 oturumda 30 soru (her soruda ~50 bin tokenlık kanıt tabanı, oturumun ilk sorusu önbelleğe yazar, sonrakiler okur). Tokenizer farkı hesaba katılmadı; Anthropic'in yeni tokenizer'ı aynı metinde yaklaşık %30 fazla token üretiyor (Anthropic fiyat sayfası).

| Model | Giriş / çıkış $ (milyon token) | Aylık tahmin |
|---|---|---|
| Claude Opus 5.5 | 4 / 20 | ~6,8 $ |
| **Claude Sonnet 5.5** | 2 / 10 (önbellek okuma 0,10) | **~3,4 $** |
| Claude Haiku 5.5 | 0,10 / 0,50 | ~0,2 $ |
| Gemini 3.1 Pro Preview | 2 / 12 | ~3,5 $ |
| Gemini 3.8 Flash | 0,75 / 3,75 (2027'den itibaren 1,50 / 7,50) | ~1,2 $ → ~2,5 $ |
| OpenAI GPT-5.6 sol | 4 / 20 | ~6,5 $ |
| OpenAI GPT-5.6 terra | 2 / 12 | ~3,5 $ |
| Kimi K3 | 3 / 15 | ~4,9 $ |
| Kimi K2.6 | 0,95 / 4 | ~1,5 $ |

Veri politikaları (resmi sayfalar, 2026-10-08):
- **Anthropic API:** girdiler ve çıktılar varsayılan olarak eğitimde kullanılmaz; 30 gün içinde silinir (istisna: kullanım politikası ihlali işaretlenirse daha uzun).
- **OpenAI API:** eğitimde kullanılmaz; kayıtlar 30 güne kadar tutulur; AB'de veri tutma onayla mümkün.
- **Gemini API (ücretli):** eğitimde kullanılmaz; kayıtlar "sınırlı süre" tutulur (süre yazmıyor). Şartlar hizmetin tıbbi tavsiye vermek için kullanılmasını yasaklıyor; bu sınırda bir durum.
- **Kimi:** veri Singapur'da, hesap açık oldukça tutuluyor; gizlilik politikası girdilerin modelleri eğitmekte kullanılabileceğini söylüyor, kapatma seçeneği anmıyor. Sağlık verisi için elendi.

### Kanıtların modele verilmesi
1. **pgvector ve gömme araması** (ROADMAP'in ilk planı): her kaynak parçalara bölünür, sorunun gömmesine en yakın parçalar gönderilir. Ek bir gömme servisi gerekir (Anthropic'in gömme API'si yok); bu da yeni bir üçüncü taraf ve yeni bir sır demek. Ayrıca arama, kaynağı kaçırabilir.
2. **Kural grafiğiyle seçim + tam taban:** günlük özette motorun o gün kullandığı kuralların kaynakları gönderilir; seçimi kod yapar, deterministik ve testlidir. Soru-cevapta tabanın tamamı gönderilir ve önbelleğe alınır.

### Kaynak zorunluluğu
1. **Yapılandırılmış çıktı:** yanıt JSON şemasıyla gelir, her iddianın yanında kaynak kimliği vardır. Bu yalnız bir beyan; kaynağın iddiayı desteklediğini göstermez.
2. **Citations:** kaynaklar ve günün sayıları `document` bloğu olarak gider; yanıtın her parçası alıntıladığı belgeyi ve metni (`cited_text`) taşır. Alıntılanan metin çıkış tokenı sayılmaz. Yapılandırılmış çıktıyla birlikte kullanılamaz (API 400 döner).

## Karar

### Model ve sağlayıcı
- **Anthropic API, `claude-sonnet-5-5`** (kullanıcı kararı, 2026-10-08). Gerekçe: Sonnet sınıfında fiyat Gemini Pro ve GPT-5.6 terra ile hemen hemen aynı; kaynak alıntısı API'de hazır; veri politikası net; proje zaten Anthropic üzerine kurulu (0004).
- Düşünme uyarlamalı (`thinking: {type: "adaptive"}`, model varsayılanı). Efor başlangıçta `medium`, ilk ölçümle ayarlanır.
- Ret durumunda sunucu taraflı yedek (`fallbacks: "default"`) açık. Yedek başka bir modelde çalışır ve o modelin fiyatıyla faturalanır; kaç kez devreye girdiği kayıtta tutulur.
- Soru sınıflandırma (aşağıda) için `claude-haiku-5-5`, yapılandırılmış çıktıyla. Maliyeti ihmal edilebilir (soru başına bir sentin çok altında).

### Kanıt seçimi: vektör araması yok
- **Günlük özet:** motorun o gün ürettiği her değer, kullandığı kural kimliklerini taşır. Bu kuralların `sources` listesindeki kaynaklar gönderilir. Seçim saf bir fonksiyondur ve testlidir.
- **Soru-cevap:** kanıt tabanının tamamı gönderilir (her kaynak ayrı belge), önbelleğe alınır (5 dakikalık önbellek; oturum içindeki sorular art arda gelir).
- **Taban paketi:** `research/` içeriği bir betikle Edge Function'ın okuyacağı tek dosyaya paketlenir. Test, paketin `research/` ile aynı olduğunu denetler (rules-sync gibi). Telif kuralı değişmez: paket yalnız kendi özetlerimizi içerir.
- **Yeniden değerlendirme:** taban 200 bin tokenı geçerse ya da soru başına maliyet hedefi aşarsa arama katmanı yeniden düşünülür.

### Kaynak zorunluluğu: citations ve kod denetimi
- Modele iki tür belge gider:
  - **Günün sayıları:** özel içerikli belge; her ölçüm ayrı blok (ad, değer, birim, kişisel bant veya hedef aralığı, kural kimlikleri, "tahmin" etiketi).
  - **Kaynak özetleri:** her kaynak ayrı düz metin belge; başlık kaynak kimliği.
- **Sunucudaki denetçi** (saf fonksiyon, testli) yanıtı kabul etmeden önce şunlara bakar:
  - Rakam içeren her cümle "günün sayıları" belgesinden alıntı yapmalı ve içindeki sayılar alıntılanan blokta bulunmalı. Sayı uydurulamaz.
  - Öneri veya yorum cümlesi en az bir kaynak belgesine alıntı yapmalı.
  - Alıntısız cümleye yalnız bağlaç ya da geçiş cümlesi olarak izin verilir (sayı yok, öneri fiili yok).
- **Denetimden geçmezse** model yanıtı gösterilmez; yerine motorun kendi açıklama metinleri (0026) çıkar ve olay kayda geçer.
- **Soru-cevapta kaynak bulunamazsa** sabit metin gösterilir: "Kanıt tabanında bu soruyu yanıtlayacak kaynak yok."
- Uygulamada her alıntı dokunulabilir: kaynak açıklama sayfasına (`copy/sources.ts`) ya da ilgili ölçümün açıklamasına gider.

### Güvenlik: kodla yönlendirme
- **Soru sınıflandırma:** her soru önce Haiku'ya gider ve yapılandırılmış çıktıyla tek bir sınıf alır: `kapsamda`, `takviye`, `tıbbi-kırmızı-bayrak`, `kapsam-dışı`.
  - `tıbbi-kırmızı-bayrak` (göğüs ağrısı, çarpıntı, bayılma, ani şişlik gibi): koç yanıt üretmez. Sabit metin doktora yönlendirir.
  - `takviye`: yanıtın sonuna kod sabit doping uyarısını ekler (WADA listesi, parti testli ürün). Uyarı modelin hatırlamasına bırakılmaz.
  - `kapsam-dışı`: sabit metin.
- **Günlük özette** motorun tanı koymayan notları (solunum, ağrı izleme) varsa yönlendirme cümlesi kodla eklenir.
- Model yönergesi (sistem metni) de aynı sınırları söyler: teşhis yok, ölçülmeyen şey ölçülmüş gibi sunulmaz, tahmin "tahmin" diye anılır, Türkçe, "â" yok. Ama bu sınırların ana güvencesi yönerge değil kod.

### Veri akışı
- **Günlük özet uygulama açılınca üretilir** (kullanıcı kararı): günün ilk açılışında uygulama, motorun hesapladığı anlık değerleri (snapshot) sunucuya gönderir. Fonksiyon şemayı doğrular (aralık ve birim denetimi), kaydeder, Claude'u çağırır, sonucu saklar. Aynı gün yeniden açılınca saklanan özet gösterilir. Yeniden üretme yalnız elle ve günde sınırlı sayıda yapılır.
- **Neden uygulamada hesaplanıyor:** bütün hesaplar zaten cihazda (0021, 0025). Motoru Edge Function'a taşımak, Deno'nun `packages/engine`'i paketleyebildiğinin doğrulanmasını gerektirir; bu ileride sabah otomatik özet veya bildirim (Faz 4) istenirse yapılır.
- **Gidenler:** anlık değerler (bant, yük, hedefler, notlar, kural kimlikleri), maç günü işareti, kaynak özetleri, kullanıcının sorusu.
- **Gitmeyenler:** ad, e-posta, doğum tarihi, boy, sakatlık geçmişi, ham zaman serileri, Google verisinin kendisi. Kilo, g/kg hedeflerinin içinde dolaylı olarak bulunur. Soru metnine kullanıcı ne yazarsa o gider.
- **Saklama:** yeni tablolar `coach_summaries` (tarih, snapshot, alıntılı yanıt blokları, model, token kullanımı, denetim sonucu) ve `coach_messages` (soru, sınıf, yanıt, alıntılar, kullanım). Tek sahip RLS (0015); yazan yalnız Edge Function.
- **Sır:** `ANTHROPIC_API_KEY` yalnız Supabase secrets. Uygulamaya ve repoya girmez. Kurulum sihirbazı (`tools/setup/setup-lib.mjs`) bu sırrı listesine alır.

### Maç günü
- Bugün'e tek dokunuşluk **"Bugün maç var"** işareti eklenir (kullanıcı kararı; PRODUCT §10). Günün sayılarıyla koça gider.
- Maç günü koç "Toparlan" dilini değil maça hazırlık dilini kullanır: ısınma, karbonhidrat ve sıvı, maç sonrası toparlanma, her biri kaynaklı. Günün durumunun kendisi (0021) değişmez.
- İşaretin beslenme gün tipine (0029) etkisi, uygulamada kaynağıyla birlikte ayrıca kararlaştırılır.

### Demo modu
Demo sporcu API'yi çağırmaz. Her durum için (Hazır / Kontrollü / Toparlan, maç günü) önceden yazılmış, gerçek alıntı yapısında sentetik özetler gösterilir (0022). Portfolyo gösterimi ücretsiz ve çevrimdışı kalır.

### Maliyet koruması
- Anthropic Console ön ödemeli: **10 $** kredi, otomatik yükleme kapalı (2026-10-09). Kredi bitince API durur; bu, ayrı bir aylık sınırdan daha kesin bir tavan. Kredi yeniden yüklenirse tavan yüklenen tutardır.
- API anahtarı yalnız HoopLab çalışma alanında geçerli, Admin API'siz, bitişi 2027-10-09. Süresi dolan anahtar koçta anlaşılır bir hata olarak görünür.
- Fonksiyonda günlük sınırlar: özet yeniden üretimi ve soru sayısı. Aşılınca sabit metin gösterilir.
- Her çağrının token kullanımı (`usage`) saklanır. Aylık toplam bir betikle raporlanır ve COSTS'taki tahminle karşılaştırılır.

## Sonuçlar
- Gömme servisi, pgvector ve ek sır yok. ROADMAP Faz 3'ün ilk maddesi "kanıt tabanı paketi ve kural grafiğiyle seçim" olarak değişti.
- Citations ile yapılandırılmış çıktı birlikte kullanılamadığı için özetin biçimi (kaç cümle, hangi sıra) yönergeyle sağlanır, şemayla değil. Biçim bozulursa denetçi yine sayı ve kaynak kuralını uygular; biçim sorunu görünür kalır.
- Denetçinin "öneri cümlesi" ayrımı dil kurallarına dayanır; ilk sürümde katı başlar (şüpheli cümle reddedilir), gerçek yanıtlarla gevşetilir.
- Soru metni kullanıcının yazdığı haliyle Anthropic'e gider; DATA-INVENTORY bunu yazar.
- Özetin kalitesi Sonnet 5.5'le ölçülür. Opus 5.5 ayda yaklaşık 3,5 $ fazlasına mal olur; gerekirse sentetik günlerde ikisi aynı girdiyle karşılaştırılır.
- **Yeniden değerlendirme tetikleyicisi:**
  - Aylık API harcaması 10 $'a yaklaşırsa ya da iki ay üst üste tahminin iki katını geçerse (kullanıcı: "masraf çok artarsa tekrar tartışırız"). Sağlayıcı ve model sorusu yeniden açılır.
  - Denetçinin reddettiği yanıt oranı yüksek kalırsa: yönerge, efor ya da model.
  - Kanıt tabanının kapsamadığı soruların oranı yüksek kalırsa (0004'ün tetikleyicisi): kaynak taraması.
  - Taban 200 bin tokenı geçerse: arama katmanı.
  - Sabah otomatik özet veya bildirim istenirse: motor sunucuya taşınır.
