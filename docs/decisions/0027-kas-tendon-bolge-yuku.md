# 0027. Kas ve tendon bölge yükü: içerik etiketleri, katsayısız eşleme, toparlanma penceresi, ağrı izleme

- **Durum:** Kabul edildi; yöntem ve kaynaklar 2026-10-07, motor ve arayüz 2026-10-07 (aşağıda Uygulama)
- **Tarih:** 2026-10-07
- **İlgili:** [0017](0017-sabah-check-in-olcegi.md), [0018](0018-vucut-gorunumu.md), [0025](0025-antrenman-yuku.md), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md), PRODUCT modül 3 ve Vücut görünümü, ROADMAP Faz 2, `research/rules/bolge.json`

## Bağlam
PRODUCT modül 3 seans içeriğinden (sıçrama, yön değiştirme, sprint, temas, kuvvet) ve ağrı haritasından bölge bazında tahmini yük ve toparlanma durumu istiyor. Vücut görünümünün hedefi de 3 gün / 1 hafta içinde hangi bölgelerin ne kadar çalıştığını göstermek. Seans formunda içerik etiketi henüz yok. Önce kaynak taraması yapıldı: 17 yeni kaynak PubMed'de doğrulandı; `research:check:online` temiz (52 kaynak, 20 kural).

Kanıtın özeti:
- **Doku yükü ölçülemiyor:** fizyolojik ve biyomekanik yük ayrı yollardır (vanrenterghem-2017); mevcut yük ölçüleri doku düzeyindeki mekanik yükle doğrulanmadı, seans RPE'si doku hasarından fazla uzak (kalkhoven-2021).
- **Toparlanma süreleri:** çok sıçramalı yüklenme sonrası tendonda benzer bir dozdan önce yaklaşık 48 saat, eksantrik kas hasarında 72 saat veya daha uzun (gabbett-2025). Tendonda kollajen yapımı 24 saatte zirve yapıp yaklaşık 3 gün yüksek kalır (magnusson-2010, miller-2005); maç sonrası kreatin kinaz 72 saate kadar normale döner (doeven-2018).
- **Hareket → bölge:** sıçrama → patellar tendon (basketbolda yaygınlık yaklaşık yüzde 32, lian-2005; bahr-2014), sıçrama ve koşu → Aşil (silbernagel-2007), ani duruş → quadriceps (harper-2022), yön değiştirme → adduktor (serner-2019, finnern-2026), sprint → hamstring ve baldır (danielsson-2020, finnern-2026). Ayak bileği burkulması basketbolda çoğunlukla anlık travma (panagiotakis-2017).
- **Ama maruziyet risk değil:** sıçrama yükünün diz şikayetine nedensel etkisi bulunamadı (bache-mathiesen-2024); patellar tendinopati için güçlü bir değiştirilebilir risk etkeni yok (sprague-2018).
- **Ağrı:** tendinopati rehabilitasyonundaki ağrı izleme modeline göre etkinlik sırası ve sonrası ağrı 10 üzerinden 5'e kadar çıkabilir, ertesi sabah azalmış olmalı (silbernagel-2007; seidler-2025, elit sporcular, tam metin).

## Seçenekler
Yöntem:
- **A. Maruziyet + toparlanma penceresi:** etiketler bölgelere katsayısız eşlenir; her bölge için pencere içindeki eşlenen seansların sayısı ve yükü (AU), son yüklenmeden geçen süre; kendi 28 günlük geçmişiyle eşiksiz kıyas; tahmin etiketli.
- **B. Ağırlıklı model:** etiket × bölge katsayısı × yük × üstel sönüm, tek bir bölge yorgunluğu skoru. Katsayıların ve sönüm eğrisinin kaynağı yok.
- **C.** Yalnız maruziyet sayıları ve ağrı; yük sayısı yok.

Ağrı: **ağrı izleme modeli** (sabah ağrısı 5'in üstünde ya da yüklü günün ertesi sabahı azalmadıysa not) ya da yalnız gösterme.

Etiket girişi: **türe göre hazır seçili** ya da boş başlama.

Kullanıcı üçünde de önerileni seçti: **A**, ağrı izleme modeli, türe göre hazır seçili.

## Karar
- **İçerik etiketleri** (`bolge-icerik-etiketleri`): sıçrama / iniş, yön değiştirme / ani duruş, sprint, alt vücut kuvvet, üst vücut kuvvet. Hazır seçim: takım antrenmanı ve maç → sıçrama, yön değiştirme, sprint; şut → sıçrama; kondisyon → sprint; kuvvet → alt vücut; mobilite ve rehabilitasyon → yok. Etiketsiz eski seanslar türün hazır seçimiyle sayılır ve bu ekranda söylenir. **Temas** alınmadı: kaynaklı bir bölge eşlemesi yok.
- **Eşleme** (`bolge-esleme`): sıçrama → patellar tendon, Aşil; yön değiştirme → quadriceps, adduktor; sprint → hamstring, baldır, Aşil; alt vücut kuvvet → quadriceps, hamstring, kalça; üst vücut kuvvet → omuz. **Ayak bileği ve bel modelde yok**, yalnız ağrı haritasında.
- **Toparlanma penceresi** (`bolge-toparlanma-penceresi`): tendon bölgeleri 48 saat, kas bölgeleri 72 saat. Pencere içinde yüklenmiş bölge "toparlanıyor". Elle girilen seansların saati olmadığı için takvim günüyle uygulanır (48 saat = bugün ve dün, 72 saat = bugün ve önceki iki gün); saat bilinen seansta geçen süre saat olarak gösterilir.
- **Bölge yükü** (`bolge-yuku`): pencere içindeki, bölgeye eşlenen etiketlerden en az birini taşıyan seansların yükleri toplamı (AU). Seans yükü bölünmez; bu dokuya binen yük değil, o bölgeyi çalıştıran seansların yüküdür. Kıyas: kendi son 28 günündeki aynı uzunlukta pencerelerin ortalaması; eşik, renk ve risk dili yok.
- **Ağrı izleme** (`bolge-agri-izleme`): sabah ağrısı 5'in üstündeyse ya da bölge dün yüklendiyse ve bugünkü sabah ağrısı dünkünden azalmadıysa (dün ağrı vardı) bölgeye tahmin etiketli not. Tanı değil; şiddetli, ani veya şişlikle gelen ağrıda doktora yönlendirme.
- **Her şey "tahmin" etiketli** ve açıklama sayfalarına (0026) bağlanır.

## Sonuçlar
- Model bir doku yükü ölçümü değil; "bu bölge son 2-3 günde hangi seanslarla, ne yoğunlukta çalıştı" sorusunun cevabıdır. Seçenek B'nin "akıllı" görünen tek skoru, kaynağı olmayan katsayılar gerektireceği için reddedildi.
- Etiketler hazır seçili geldiği için kullanıcı düzeltmezse eşleme türün varsayılanıyla aynı olur; maç ve antrenman içeriği gün gün değişir, düzeltme doğruluğu artırır.
- Pencereler derleme düzeyinde kanıta (düzey 4) dayanır ve bireysel farklar büyüktür; sabah ağrısına uyarlanmış ağrı izleme kuralı doğrulanmadı.
- Futbol ve voleybol kaynaklarının basketbola aktarımı varsayımdır.
- Sonraki blok: migration (`training_sessions.content_tags`), motor (`packages/engine`), seans formunda etiket çipleri, Vücut görünümünde bölge yükü, açıklama sayfaları.
- **Yeniden değerlendirme tetikleyicisi:** basketbolda bölgeye özgü yük ölçümünü (ör. sıçrama sayısı, ivmeölçer) sakatlık veya ağrıyla ilişkilendiren doğrulanmış bir çalışma; HoopLab'e sıçrama sayısı gibi doğrudan bir ölçüm girerse; not gerçek hissiyatla sürekli çelişirse.

## Uygulama (2026-10-07)
- **Veri:** `training_sessions.content_tags text[]`, izinli değerler CHECK ile (migration `seans_icerik_etiketleri`). `null` = girilmemiş (sütundan önceki kayıtlar), türün hazır etiketleri sayılır; boş dizi = "bu içeriklerin hiçbiri yoktu". pgTAP: `seans_icerik_etiketleri.test.sql`.
- **Motor:** `packages/engine/src/region-load.ts` (`readRegionLoad`, `painNotes`); sabitler `rules/bolge.json` ile ve veritabanı CHECK'iyle `rules-sync` testinde eşleşir. Seans türleri motora taşındı (`sessionKinds`).
- **Kıyas tanımı:** pencereden önceki 28 gün içinde kalan, aynı uzunluktaki bütün kayan pencerelerin ortalaması. Bu 28 günün hepsi kayıt geçmişinde değilse (ilk seans kaydından önceki günler bilinmiyor sayılır) "olağan" gösterilmez.
- **Son yüklenme:** o günün bölgeyi çalıştıran seanslarının hepsinin saati biliniyorsa saat (bitişten bu yana), değilse gün.
- **Ağrı izleme:** yalnız bugünkü check-in'den; ayak bileği ve bel için de 5 üstü kuralı geçerli, "dün yüklendi" kuralı yalnız modeldeki bölgelerde.
- **Arayüz:** seans formunda "İçerik" çipleri (türe göre seçili). Vücut sekmesinde "Ağrı / Bölge yükü" anahtarı; bölge yükünde son 48-72 saatte çalışan bölgeler nötr gri tonla işaretlenir (kırmızı ölçekten ayrı, `bodyColors.worked`), listede yük, seans sayısı, son yüklenme ve olağan değer. Ağrı görünümünde not varsa "Ağrı izleme" kartı. Üç açıklama sayfası: bölge yükü, toparlanma penceresi, ağrı izleme (hepsi "Tahmin").
