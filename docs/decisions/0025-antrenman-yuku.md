# 0025. Antrenman yükü: bileşenler ayrı, EWMA oranı yalnız bağlam, 1,5 üstünde bilgi notu, monotonluk eşiksiz

- **Durum:** Kabul edildi (yöntem ve kurallar); motor ve arayüz sürüyor
- **Tarih:** 2026-10-05
- **İlgili:** [0004](0004-mimari-hesap-motoru-kanit-ai.md), [0017](0017-sabah-check-in-olcegi.md), [0020](0020-seans-etiketleme.md), [0021](0021-toparlanma-kisisel-bant.md), ROADMAP Faz 2, PRODUCT modül 2, `research/rules/yuk.json`

## Bağlam
Seans kaydı (tür, süre, RPE) ve saat oturumu etiketleme Faz 1'de geldi; seans yükü (RPE × dakika) motorda var. PRODUCT modül 2 akut / kronik yük, monotonluk ve "yük artışı uyarısı" istiyor. Akut / kronik yük oranı (ACWR) sahada yaygın ama literatürde tartışmalı. Bu yüzden önce kaynak taraması yapıldı: 17 yeni kaynak Crossref ve PubMed'de doğrulandı, `research:check:online` temiz (35 kaynak, 15 kural).

Kanıtın özeti:
- **Uzlaşı:** yük izlemek değerli; ani yük artışları ve sıkışık takvim risk etkeni (soligard-2016, bourdon-2017).
- **Oranı savunanlar:** 0,8-1,3 "güvenli", 1,5 ve üstü "tehlikeli" bölge (gabbett-2016; kriket, ragbi, Avustralya futbolu). Sistematik derlemeler yüksek oranla daha yüksek risk buluyor ama aralık sınıflamalarında uzlaşı yok (andrade-2020, maupin-2020); EWMA daha duyarlı (murray-2017, griffin-2019).
- **Eleştirenler:** bağlı hesap yapay ilişki üretir (lolli-2017); nedensel kanıt yok, oranın istatistik sorunları var (impellizzeri-2020); rastgele kronik yükle de aynı "etki" çıkıyor, yöntem bırakılmalı (impellizzeri-2021).
- **En güncel meta-analiz:** küçük-orta ilişki, çok yüksek heterojenlik; oran tek başına tahmin aracı değil, bağlam göstergesi (ding-2026).
- **Basketbol:** genel olarak yük ile sakatlık ilişkili, ama oran eşikleri doğrulanmadı (chan-2024); tek takım çalışmasında farklar belirsiz (weiss-2017); 35 oyuncuda hiçbir yük göstergesi ilişkili ya da tahmin edici değil (ferioli-2020).
- **Monotonluk ve gerilim:** tanımlar net (foster-1998, haddad-2017); eşikler sporcuya özgü, evrensel değer yok.

## Seçenekler
- **A.** Klasik oran ve renk bölgeleri (0,8-1,3 yeşil, 1,5 ve üstü kırmızı), "sakatlık riski" dili. Eşikler başka sporlardan, basketbolda desteklenmiyor, eleştiriler güçlü; "önce kişisel baseline" ilkesine ters.
- **B.** Bileşenler ayrı ayrı ve eşiksiz; oran yalnız bağlam; oran 1,5 ve üstündeyse tahmin etiketli bir bilgi notu.
- **C.** Yalnız sayılar, hiç not yok. En temkinli, ama PRODUCT'taki yük artışı hedefini karşılamaz.

Kullanıcı **B**'yi seçti.

## Karar
- **Günlük yük:** günün seans yüklerinin toplamı; seans olmayan gün 0. İlk seans kaydından önceki günler bilinmiyor sayılır (0 sayılmaz).
- **Haftalık:** son 7 günün toplamı, önceki 7 günün toplamı, haftadan haftaya değişim, son 28 günün haftalık ortalaması (toplam / 4). Pencerenin tamamı ilk kayıttan sonra değilse o değer üretilmez. Eşik ve renk yok.
- **EWMA:** λ = 2 / (N + 1), akut N = 7, kronik N = 28 (williams-2017). Başlangıç değeri kaynaklarda tanımlı değil; HoopLab ağırlıkları ilk kayıt gününden itibaren normalleştirir (ağırlıklar toplamı 1). Kayıt öncesi günler 0 sayılmaz; uzun geçmişte sonuç özyinelemeli formülle aynıdır.
- **Oran:** akut EWMA / kronik EWMA. İlk kayıttan bu yana en az 28 gün geçmeden veya kronik yük 0 iken üretilmez. Ekranda "bu hafta alıştığın seviyenin 1,4 katı" gibi bağlam olarak; renk ve risk dili yok.
- **Bilgi notu:** oran ≥ 1,5 ise "Bu hafta yük alıştığın seviyenin belirgin üstünde", "tahmin" etiketiyle. Sakatlık tahmini olarak sunulmaz. Düşük oran için not yok.
- **Monotonluk ve gerilim:** son 7 gün; monotonluk = ortalama / örneklem SD'si (0 yüklü günler dahil), gerilim = 7 günlük toplam × monotonluk. SD 0 ise üretilmez. Eşik yok; "2'nin üstü" eşiği doğrulanmış bir kaynakta bulunamadı.
- **Maç süresi:** tam seans süresi korunur (seans RPE ile basketbol çalışmaları da öyle yapıyor); oynanan dakika ayrı tutulur.
- **Kod:** hesap `packages/engine` içinde, sabitler `rules-sync` testiyle `yuk.json`'a bağlı.

## Sonuçlar
- Gerçek hesapta oran ve not ilk seans kaydından 28 gün sonra görünür; o zamana kadar günlük ve haftalık değerler gösterilir.
- Uygulama kaydedilmemiş bir seansı dinlenme gününden ayıramaz: unutulan kayıt o günü 0 yapar, oranı ve monotonluğu çarpıtır. Etiketlenmemiş saat oturumlarının yük ekranında nasıl belirtileceği arayüz adımında kararlaştırılır.
- Monotonluk ve gerilim için kişisel bant (haftalar biriktikçe) ileride; şimdilik yalnız sayı.
- Kas / tendon bölge yükü (modül 3) ve beslenmenin gün tipi bu günlük yükü kullanacak.
- **Yeniden değerlendirme tetikleyicisi:** basketbolda iç yükle oran ya da ani artış eşiğini doğrulayan bir çalışma veya uzlaşı metni; oranın uzlaşı metinlerinden çıkarılması (impellizzeri-2021'in önerisi); not gerçek hissiyatla sürekli çelişirse.
