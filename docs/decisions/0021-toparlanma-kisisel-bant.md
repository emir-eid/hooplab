# 0021. Toparlanma: derin uyku HRV'si, 7 gün / 4 hafta kişisel bant (± 0,5 SD), HRV öncelikli günün durumu

- **Durum:** Kabul edildi; motor testleri, yerel web önizlemesi (sentetik veri, açık ve koyu, dört durum) ve iPhone'da (Expo Go, gerçek veri, "Bant oluşuyor") doğrulandı (2026-10-05); grafik seçimi web'de ve iPhone'da doğrulandı
- **Tarih:** 2026-10-05
- **İlgili:** [0004](0004-mimari-hesap-motoru-kanit-ai.md), [0010](0010-tasarim-yonu-hale.md), [0011](0011-hale-efekti-svg.md), [0019](0019-google-health-senkronu.md), ROADMAP Faz 1, `research/rules/toparlanma.json`

## Bağlam
Google Health senkronu gece HRV'sini (bütün gece ve derin uyku RMSSD), dinlenik nabzı, solunum hızını ve uyku oturumlarını buluta yazıyor. Bugün ekranındaki "Günün durumu" bunları kişisel banda göre yorumlamalı; her eşik kaynaklı olmalı (CLAUDE.md §3). Kütüphanede HRV veya dinlenik nabız kaynağı yoktu; 8 yeni kaynak eklendi ve Crossref'te doğrulandı. Gerçek hesapta 2026-10-04 itibarıyla yaklaşık 15 gece veri var (sayım; değerlere bakılmadı).

## Seçenekler
1. **HRV ölçüsü:** (a) bütün gece ortalaması (Fitbit uygulamasının gösterdiği); (b) derin uyku RMSSD. Kullanıcı (b)'yi seçti: bütün gecenin HRV'si uyku evrelerinden etkilenir, gece ölçümünde derin uyku daha kararlı (buchheit-2014). Bütün gece değeri saklanmaya devam eder.
2. **Bant yöntemi:** (a) tek gece, önceki 10 günün ortalaması − 1 SD (Kiviniemi tarzı); (b) 7 günlük ortalama, 3-4 haftalık başlangıcın ortalaması ± 0,5 SD. (b) seçildi: tek gece gürültülü (plews-2013); (b) HRV yönlendirmeli antrenman çalışmalarında yuvarlanan ortalamayla kullanılan yöntem (manresa-rocamora-2021; Vesterinen 2016, Javaloyes 2019 ve 2020).
3. **Başlangıç penceresi:** (a) sabit, dönem ortasında güncellenen (çalışmalardaki gibi); (b) her gün kayan, 7 günlük pencereyle çakışmayan 28 gün. (b) seçildi: sürekli kullanımda elle güncelleme yok; çakışmadığı için bu haftaki düşüş bandı aşağı çekmez.
4. **Günün durumu:** (a) HRV öncelikli; (b) işaret sayımı; (c) yalnız HRV. Kullanıcı (a)'yı seçti.

## Karar
- **HRV:** `health_daily.hrv_deep_rmssd_ms`, ortalama ve bant ln üzerinden, ekranda ms.
- **Bant:** son 7 günün ortalaması, ondan hemen önceki 28 günün günlük değerlerinin ortalaması ± 0,5 × örneklem SD'si ile karşılaştırılır: altında / içinde / üstünde. Aynı yöntem dinlenik nabıza (atım/dk, dönüşümsüz) uygulanır.
- **Veri yeterliliği:** 7 günde en az 3, 28 günde en az 12 değer (plews-2014). Yoksa sonuç üretilmez; ekran "Bant oluşuyor" der ve kaç gece olduğunu söyler. Eksik gün sıfır sayılmaz.
- **Uyku:** şekerleme dışı uyku dakikaları bitiş gününe göre toplanır; 7 gecelik ortalama 7 saatin altındaysa "kısa" (walsh-2021).
- **Günün durumu:** HRV bandın altında **ve** dinlenik nabız bandın üstünde → Toparlan (kırmızı). HRV bandın dışında (iki yönde), nabız bandın üstünde veya uyku kısa → Kontrollü (sarı). Hiçbiri yoksa → Hazır (yeşil). HRV bandı yoksa durum yok. Test edilmiş kural yalnız HRV'dir (vesterinen-2016); nabız ve uykuyla birleşim HoopLab'in sentezidir, ekranda ve yöntem sayfasında öyle söylenir.
- **Öneri:** Hazır → planlanan antrenman; Kontrollü → yüksek yoğunluğu azalt, düşük yoğunluk; Toparlan → hafif seans ya da dinlenme. Tanı dili yok; gece verisinin altında kırmızı bayrak uyarısı (doktora başvur).
- **Kod:** hesap `packages/engine/src/recovery.ts` (sabitler `rules-sync` testiyle kural dosyasına bağlı); satırdan görünüme `apps/mobile/src/data/recovery-view.ts`; metinler `copy/recovery.ts`; Bugün'de durum bloğu, `<Aura>` (karar 0011'in ilk uygulaması), HRV grafiği ve dört kart; **Nasıl hesaplanıyor?** ekranı (`/recovery-method`) yöntemi ve 8 kaynağı listeler.

## Sonuçlar
- Gerçek hesapta bant, 4 haftalık pencerede 12 gece birikince oluşur (2026-10-08 civarı; saat her gece takılırsa). O zamana kadar değerler gösterilir, renk yoktur, hale çizilmez.
- Kaynakların hepsi dayanıklılık sporcularından ve çoğu sabah kısa kayıttan; basketbola ve gece bileklik ölçümüne aktarım bir varsayım (kural notlarında yazılı).
- Solunum hızı yalnız gösterilir, bandı ve kuralı yok. Check-in henüz durumu etkilemiyor (kişisel baseline'ı Faz 2).
- Grafikte dokunma veya yatay sürükleme bir gün seçer: kart başlığı o gecenin değerini ve 7 günlük ortalamasını gösterir; sürükleme bırakılınca bugüne döner, aynı güne ikinci dokunuş seçimi kaldırır. Bunun için `Screen` Gesture Handler'ın ScrollView'una geçti (dikey hareket sayfaya kalır). Ölçüm kartlarına dokunma (ayrıntı ekranı) ileride.
- **Yeniden değerlendirme tetikleyicisi:** basketbola veya gece giyilebilir ölçüme özgü bir bant çalışması; derin uyku değeri sık eksik gelirse (bütün gece değerine geçiş); renk gerçek hissiyatla sürekli çelişirse (sabah check-in'le karşılaştırma); Faz 2'de check-in ve yük durum hesabına girerse.
