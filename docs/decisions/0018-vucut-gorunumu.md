# 0018. Vücut görünümü: stilize 3D manken, ağrı haritası, aşamalı bölge raporu

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-04
- **İlgili:** [0015](0015-veritabani-tek-sahip-rls.md) (seans içerik etiketleri Faz 2'de), [0017](0017-sabah-check-in-olcegi.md) (ağrı haritası), [oturum raporu](../sessions/2026-10-04-1311-faz1-kaydirici.md) Blok 2

## Bağlam
Kullanıcı isteği: elle 360° döndürülen bir insan vücudu; kas grupları üzerinde ağrı ve yorgunluk; 1 gün / 3 gün / 1 hafta filtresi. Kullanıcı filtreyi şöyle tarif etti: 3 gün ve 1 haftada o dönemdeki aktivitelerin türü ve yoğunluğu, hangi bölgeleri ne kadar etkilemiş olabileceği, kullanıcının girdileri ve cihaz verisiyle birlikte değerlendirilsin; sistem bir rapor çıkarsın.

Kısıtlar: seans içeriği (sıçrama, yön değiştirme, sprint, temas) henüz kaydedilmiyor; hareket → bölge eşlemesi kaynaksız yazılamaz (CLAUDE.md §3, PRODUCT §10 "Faz 2 başı"); cihaz verisi senkronu yok; sayıları kod hesaplar, AI yalnız yorumlar. Uygulama Expo Go'da çalışmalı (özel derleme yok).

## Seçenekler
1. **Stilize 3D manken (three.js + expo-gl):** basit geometrik parçalardan, bölgelerimizle birebir eşleşen kas pedleri. Lisans sorunu yok, hafif, Expo Go'da ve web önizlemesinde aynı kod. Gerçek kas çizgisi yok.
2. **Anatomik 3D model:** en etkileyici; uygun lisanslı model gerekir (repo public olacak), dosya ağır, bölge eşlemesi uzun.
3. **2,5D (ön / yan / arka çizimler):** en hafif ve net; gerçek 360° değil.

Filtre için: (a) aşamalı: şimdi ağrı haritası, model Faz 2'de; (b) modeli öne çekmek (Google Health'ten önce); (c) filtreyi model gelene kadar koymamak.

## Karar
Seçenek 1 ve aşamalı yol (a); ikisi de kullanıcı seçimi. İlk sürüm yalnız ağrı haritasını gösterir: 1 gün = bugünün ağrısı, renk ölçeğiyle (1 soluk mercan → 10 koyu kırmızı); 3 gün / 1 hafta = değerler birleştirilmez (en yüksek, ortalama yok), ağrı girilen bölgeler işaretlenir ve gün gün yazılır; check-in yapılmayan gün "–", ağrısız check-in "0". Yeni "Vücut" sekmesi Bugün'ün yanında. Faz 2 başında seans içerik etiketleri ve kaynaklı hareket → bölge eşlemesi gelince aynı filtre, motorun (`packages/engine`) hesapladığı bölge yükü raporuna dönüşür; raporun metni Faz 3'te koçtan gelir.

## Sonuçlar
- Teknik: `three` 0.186.1 (tam sürüm), `expo-gl` ~57.0.2. Sahne yalnız değişince çizilir. Erişilebilirlik için 3D'nin altında bölge listesi; "Hareketi Azalt" açıkken süzülme ve dönüş animasyonu yok.
- expo-gl WebGL2 bağlamını WebGL1 sınıfından türettiği için three.js r163+ onu WebGL1 sanıp duruyor; `body-scene.ts` bu denetimi yalnız oluşturma anında atlatır (LESSONS). 3D açılamazsa ekran çökmez, liste çalışır.
- Kabul edilen eksik: manken stilize; gerçek kas anatomisi yok. Bölge listesi `@hooplab/engine` `bodyRegions` ile sınırlı; yeni bölge eklenince mankene parça eklenir (test zorunlu kılar).
- Yeniden değerlendirme: kas / tendon modeli bölge listesini değiştirirse; mankenin biçimi yetersiz kalırsa (anatomik model); three.js veya expo-gl sürüm yükseltmesinde WebGL2 denetimi değişirse.
