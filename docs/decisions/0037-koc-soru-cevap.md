# 0037. Koçta soru-cevap: tek soru tek yanıt, bugünün sayılarıyla, Haiku sınıflandırması, kaynağın sayısı yalnız alıntıda

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-12
- **İlgili:** [0032](0032-ai-koc-tasarimi.md) (soru-cevap, soru sınıflandırma, tam taban önbellekte), [0034](0034-koc-kismi-kabul.md) (kısmi kabul), [0033](0033-koc-ozeti-check-in-sonrasi.md) (anlık değerler), [0015](0015-veritabani-tek-sahip-rls.md) (tek sahip), [0022](0022-demo-modu.md) (demo), oturum raporu (2026-10-12)

## Bağlam
0032 soru-cevabın ana hatlarını koydu: her soru önce Haiku'yla sınıflandırılır, kanıt tabanının tamamı önbellekli gider, kaynak yoksa sabit metin gösterilir, kırmızı bayrak ve takviye kodla yönlendirilir, kayıt `coach_messages`'a yazılır. Uygulamaya geçmeden önce cevaplanması gereken sorular:
- Soruyla bugünün sayıları da gitsin mi, yoksa koç yalnız genel bilgi mi versin?
- Sohbet (takip soruları) mu, tek soru tek yanıt mı?
- Günde kaç soru?
- Denetçi günlük özette kaynaktaki sayıyı yasaklıyor ("sayılar yalnız günün sayılarından"). Genel bir soruya ("maç günü ne kadar karbonhidrat?") yanıt ise kaynağın sayısıyla verilir.
- "Kaynak yok" nasıl anlaşılır?

## Seçenekler
Kişisel bağlam:
1. **Bugünün anlık değerleri de gider** (günlük özetle aynı şema). "Bugün antrenmanı hafifletmeli miyim?" kişisel yanıtlanır; ek ~2-4 bin token.
2. Yalnız kanıt tabanı. Daha basit; "benim için" sorularına genel yanıt.

Biçim:
1. **Tek soru tek yanıt**, geçmiş liste olarak görünür.
2. Sohbet: önceki turlar bağlam olarak gider. Her turda girdi büyür, denetim ve düşünme bloklarının geri gönderimi karmaşıklaşır.

Kaynak sayısı:
1. **Kaynağın sayısı yalnız alıntılanan metinde (`cited_text`) geçiyorsa kabul.** Citations alıntı metnini API'nin kendisi döndürür; model sayıyı uyduramaz, yalnız kaynakta yazanı aktarabilir.
2. Günlük özetteki gibi tamamen yasak. Genel sorulara sayısız, belirsiz yanıt çıkar.

## Karar
- **Bugünün sayıları gider** (kullanıcı kararı, 2026-10-12). Uygulama Bugün'ün kurduğu anlık değerleri kullanır; Bugün henüz yüklenmediyse aynı veriyi kendisi çeker (`data/coach-context.ts`). Değer yoksa soru genel gider ve kart bunu söyler. Demo ile gerçek hesabın değerleri karışmaz.
- **Tek soru tek yanıt** (kullanıcı kararı). Sohbet ileride eklenebilir.
- **Günde 10 soru** (kullanıcı kararı; `askDailyLimit`). Sınıflandırma, yönlendirme ve hata dahil her deneme sayılır. Ön ödemeli kredi yine kesin tavan.
- **Sınıflandırma** `claude-haiku-5-5`, yapılandırılmış çıktı (`in_scope`, `supplement`, `medical_red_flag`, `out_of_scope`), efor `low`. Kararsızlıkta güvenli yön: tıbbi olabilecek soru `medical_red_flag`, takviye geçen soru `supplement`. Soru `<soru>` etiketi içinde gider; içindeki talimatlara uyulmaz.
  - `medical_red_flag` ve `out_of_scope`: yanıt modeli çağrılmaz, uygulama sabit metin gösterir (doktora / sağlık ekibine yönlendirme; acil belirtilerde beklemeden yardım).
  - `supplement`: yanıt üretilir; uygulama altına her zaman sabit doping uyarısını ekler (WADA listesi, parti testli ürün, doktor / diyetisyen).
- **Yanıt isteği:** Sonnet 5.5, citations. Belgelerin sırası: bütün kaynaklar (kimlik sırasıyla) → varsa "Günün sayıları" → soru. Önbellek işareti yalnız son kaynakta. Böylece sistem metni ve taban sabit önektir; soru ve günün sayıları işaretten sonra gelir.
- **Denetçi soru-cevap kipinde** (`sourceNumbers`): kaynağın sayısı ancak alıntılanan metinde varsa kabul. Öbür kurallar günlük özetle aynı: öneri kaynak ister, alıntısız uzun cümle olmaz, tahmin anılır, "â" yok.
- **Sonuç:** hiçbir cümle kaynağa alıntı yapmıyorsa `no_source` (uygulama "kanıt tabanında kaynak yok" der). Varsa kısmi kabul (en az bir kaynaklı cümle, günün durumu şartı yok). Kaynaklı cümle kalmazsa `rejected`.
- **Süre:** sınıflandırma 15 sn, yanıt 55 sn; ikisinde de bir yeniden deneme. En kötü durumda 140 sn, ücretsiz plandaki 150 sn sınırının altında.
- **Saklama:** `coach_messages`: soru, sınıf, durum, anlık değerler, yanıt blokları, denetim, uygulamaya dönen yanıt (`answer`), model, token kullanımı (yanıt ve sınıflandırma ayrı). Sahibi okur (geçmiş listesi buradan), yazan yalnız `coach-ask` (service_role). Silme yok.
- **Demo:** dört örnek soruya önceden yazılmış sentetik yanıt (kaynaklı yanıt, takviyede "kaynak yok" ve uyarı, tıbbi yönlendirme). Serbest soru demoda yanıtlanmaz. Demo yanıtları testte denetçiden geçer.

## Sonuçlar
- Maliyet (resmi fiyat; ilk gerçek çağrılar 2026-10-12, iPhone): taban 66.276 token (tahmin ~55 bin). Oturumun ilk sorusu önbelleğe yazar: ~0,18 $. 5 dakika içindeki sonraki soru okur: ~0,009 $. Sınıflandırma ~0,0001 $. İlk yanıt denetimden tam geçti (5 cümle). Kreatin sorusu beklendiği gibi `no_source` oldu.
- Kanıt tabanında takviye kaynağı yok (yalnız protein, morton-2018). Kreatin, kafein gibi sorularda koç "kaynak yok" der, uyarı yine gösterilir. Takviye kaynakları ve doping uyarı metninin kaynağı ROADMAP Faz 3'teki "kırmızı bayrak ve doping" işinde.
- Sınıflandırıcı yanlış sınıflarsa: tıbbi bir soru `in_scope` olursa yanıt yine yalnız kaynaklıdır ve sistem metni teşhisi yasaklar. Kapsamdaki bir soru `medical_red_flag` olursa kullanıcı sabit metni görür. İlk gerçek sorularla izlenir.
- **Yeniden değerlendirme:** yanıtların çoğu `no_source` ya da `rejected` çıkarsa yönerge veya kaynak taraması. Sohbet istenirse turların denetimi ve önbellek düzeni yeniden tasarlanır. Soru başına maliyet tahminin belirgin üstündeyse önbellek süresi (1 saat) düşünülür.
