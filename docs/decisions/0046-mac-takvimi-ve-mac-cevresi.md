# 0046. Maç takvimi ve maç çevresi: MD-1 / MD / MD+1 notları, "maç çevresi" gün tipi (6-8 g/kg), maç sabahı hatırlatması

- **Durum:** Kabul edildi. Motor, uygulama ve fonksiyon testleri geçti; pgTAP yerelde geçti (politika gevşetilince kırıldı). Bulutta: migration, coach-daily v16, coach-ask v8. Web önizlemesinde (yerel Supabase, sentetik kullanıcı) MD-1 ve MD kartı, takvim, ekleme ve güncelleme doğrulandı.
- **Tarih:** 2026-10-15
- **İlgili:** [0036](0036-mac-gunu-isareti.md) (maç günü işareti), [0029](0029-beslenme-ve-hidrasyon.md) (gün tipi), [0045](0045-yerel-bildirimler.md) (bildirimler), [0032](0032-ai-koc-tasarimi.md) (koç), [0021](0021-toparlanma-kisisel-bant.md) (günün durumu)

## Bağlam
ROADMAP Faz 4'te "maç günü ve seyahat protokolleri" maddesi var. 0036 yalnız o güne konan "Bugün maç var" işaretini getirmişti; maç saati, ertesi gün ve önceki gün bilinmiyordu, 0045'te maç sabahı hatırlatması bu yüzden ertelenmişti. Kullanıcı kararları (2026-10-15):
- Takvim elle, hızlı bir formla girilir (tarih, saat, iç saha / deplasman).
- Uygulama maçtan önceki gün (MD-1), maç günü maç saatine göre ve maç gecesi / ertesi gün (MD+1) not gösterir; maç sabahı hatırlatması gelir.
- Seyahat: saat farkı olmayan ve 4 saat ve üstü farklı yolculuklar. Seyahat ve jet lag ayrı iş olarak aynı oturumda ele alınacak (bu karar yalnız maç çevresi).

Kaynak taraması (13 yeni kaynak, hepsi PubMed / Crossref'te doğrulandı; kullanılan sayılar ham metinde ya da özette birebir bulundu):
- **Beslenme:** UEFA uzman grubu bildirgesi (collins-2021, futbol; yazarların kabul edilmiş el yazması okundu): MD-1 en az 6-8 g/kg, maç günü ve MD+1 6-8 g/kg; maç öncesi öğün başlamadan 3-4 saat önce 1-3 g/kg; 2-4 saat önce 5-7 mL/kg sıvı; maç sonrası 4 saat saatte ~1 g/kg. Takım sporu derlemesi (williams-2015) ve basketbolda tek öğün RCT'si (gentle-2014). Basketbolda maç saatine göre zamanlamayı sınayan çalışma bulunamadı.
- **Uyku:** elit sporcularda meta-analiz (roberts-2019): akşam yarışması (≥ 18:00) gecesi ~80 dk, gündüz yarışması gecesi ~20 dk daha kısa uyku. Yarı profesyonel basketbolcularda maç gecesi geç uykuya dalış (fox-2020). Önemli yarışmadan önceki gece kötü uyku sık ve durumsal (juliff-2015, anket).
- **Şekerleme:** RCT meta-analizi (mesas-2023): yarar en çok 30-60 dk, 12:30-16:50 arası, uyanıştan sonra performansa 1 saatten fazla kaldığında.
- **MD+1:** basketbol sistematik derlemesi (pernigoni-2024): sıçrama ve sürat 24-48 saat düşük, kas ağrısı 24-48 saatte; uykuda belirgin etki bulunmamış (roberts ve fox ile çelişiyor).
- Seyahat kaynakları (janse-van-rensburg-2021, -2020, fowler-2017, leota-2022, roach-2019) seyahat işinde kullanılacak; konsensüsün şekerleme satırı burada farkı belirtmek için anılıyor.

## Seçenekler
Maç günü karbonhidratı (kullanıcıya soruldu):
1. **MD-1, MD, MD+1 = 6-8 g/kg (yeni "maç çevresi" gün tipi).** Takım sporu konsensüsü, mevcut 8-10'dan (ISSN'nin "günde 3-6 saat yoğun antrenman" değerinden aktarım) daha uygun kaynak.
2. MD 8-10 kalır, yalnız MD-1 / MD+1 6-8.
3. Gün tipi değişmez, yalnız not.

Saklama:
1. **`match_days`'i genişletmek** (saat ve yer sütunları; günde bir maç). İşaret ve takvim aynı tablo, eski okumalar çalışmaya devam eder.
2. Ayrı `matches` tablosu: işaretle iki kaynak olurdu.

## Karar
- **Gün tipi** (kullanıcı kararı, seçenek 1): yeni `match` ("Maç çevresi", 6-8 g/kg). Sıra: bugün maç (takvim, işaret ya da maç seansı kaydı) → maç çevresi; seansların toplamı ≥ 180 dk → yoğun; dün ya da yarın maç (ya da dün maç seansı) → maç çevresi; seans → antrenman; yoksa dinlenme. Maç seansı kaydı artık yoğun değil maç çevresi. `day_types` CHECK'ine `match` eklendi; kullanıcı elle seçebilir.
- **Takvim:** `match_days` + `start_time` (maçın oynandığı yerin saati) ve `venue` (`home` / `away`), ikisi isteğe bağlı. Tarih değişmez (silinip yeniden eklenir); güncelleme yetkisi yalnız bu iki sütunda (sütun düzeyinde `grant`), politika sahibine. "Bugün maç var" işareti saatsiz bir maç ekler. Ekranlar: Bugün → "Maç takvimi" satırı → `/matches` (dünden 120 gün ileriye), `/match-edit` (+ menüsünde "Maç").
- **Bugün'de maç çevresi kartı** (nötr, durum rengi yok, "Maç çevresi" açıklama sayfası):
  - MD-1: karbonhidrat (maç çevresi) ve maçtan önceki gece uykusu.
  - MD: maç saati biliniyorsa öğün (4-3 saat önce, 1-3 g/kg), sıvı (4-2 saat önce, 5-7 mL/kg), şekerleme penceresi (12:30'dan en geç 16:50'ye ve maçtan 1 saat öncesine; 30 dk sığmıyorsa yok), maç sonrası karbonhidrat ve maç gecesi uykusu; saat yoksa "saatini gir" satırı. Gram ve mL son 7 günün sabah kilosuyla (beslenme hedefiyle aynı); kilo yoksa g/kg.
  - MD+1: dünkü maçın gecesi uykuda beklenen kısalma (saatine göre akşam ~80 / gündüz ~20 dk, grup ortalaması, eşik değil), düşük HRV ve kısa uykunun maçtan olabileceği, toparlanma süreleri. **Günün durumu değişmez**; maç için ayrı eşik yok.
- **Kurallar:** `rules/mac.json`'a `mac-oncesi-gun`, `mac-oncesi-ogun`, `mac-gunu-sekerleme`, `mac-sonrasi`; `mac-gunu`'nun gün tipi `match`, kaynaklarına collins-2021; `karbonhidrat-gun-tipi`'ne `match: [6, 8]`, `match_when_kind`, `match_day_offsets`. Motor sabitleri `packages/engine/src/match.ts` ve `nutrition.ts`'te, kurallarla testle bağlı (`rules-sync`).
- **Maç sabahı hatırlatması:** Ben → Bildirimler → "Maç sabahı", seçilen saatte (05:00-12:00, varsayılan 09:00), takvimdeki önümüzdeki 7 günün maçları için. Metinde yalnız maç saati ("Maç 19:00. Öğün ve sıvı saatleri Bugün'de."); sağlık değeri yok. Dokununca Bugün açılır. Plan maç kaydedilince, silinince ve işaret değişince yenilenir.
- **Koç:** anlık değerlere isteğe bağlı `match` alanı (dün / bugün / yarın: saat ve yer; bugünün zamanlaması ve gramları motordan). Sürüm aynı (alan yoksa eski istemci geçerli); bugünkü maç `matchDay` ile tutarlı olmalı, değilse ret. Rakip ve şehir gitmez. "Günün sayıları"nın ilk bloğu maç çevresini yazar; uyku kısalması kural değerinden. Kurallar `matchRuleIds`: bugün maç → `mac-gunu`, saat varsa `mac-oncesi-ogun`, şekerleme penceresi varsa `mac-gunu-sekerleme`, `mac-sonrasi`; yarın → `mac-oncesi-gun`; dün → `mac-sonrasi`. Yönergeye MD-1 ve MD+1 satırı eklendi. Kartta yalnız maç çevresi kurallarına bağlı kaynaklara alıntı yapan cümle "Maç" konusunda.

## Sonuçlar
- Maç günü karbonhidrat hedefi 8-10'dan 6-8 g/kg'a indi; maçtan önceki ve sonraki gün hedef yükseldi (dinlenme / antrenman yerine 6-8). Futboldan aktarım; basketbolda doğrulanmadı.
- Maç günü haftalık raporda maç çevresi sayılır; geçmiş günler de yeni kuralla okunur (gün tipi saklanmaz, yalnız elle düzeltme saklanır).
- Kanıt tabanı 118 kaynak, 47 kural. Soru-cevaptaki tam taban büyüdü (önceki ölçüm 84 kaynakta 71.476 token); önbelleğe yazan ilk soru biraz daha pahalı, ilk gerçek soruda ölçülür. Maç çevresi günlerinde günlük özete giden kaynak sayısı artar.
- Uyku kayıpları ve toparlanma süreleri grup ortalaması; kişinin kendi maç gecesi uykusu yine kendi aralığıyla okunur. Kaynaklar maçın uykuya etkisinde çelişiyor (pernigoni-2024 etki bulmadı).
- Maç saati maçın oynandığı yerin saati; saat farkı olan seyahatte telefonun saati farklıysa zamanlama yanlış görünebilir. Seyahat işinde ele alınacak.
- Yeniden değerlendirme: kart gerçek maç günlerinde kalabalık bulunursa; 6-8 g/kg maç gününde yetersiz hissedilirse (elle "Yoğun" seçilebilir); basketbola özgü maç günü beslenme çalışması bulunursa.
