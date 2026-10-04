# 0022. Demo modu: uygulama içi, çevrimdışı sentetik sporcu, kayıtlar bellekte, durum seçici

- **Durum:** Kabul edildi; testler ve yerel web önizlemesiyle doğrulandı (2026-10-05); iPhone denemesi bekliyor
- **Tarih:** 2026-10-05
- **İlgili:** [0005](0005-repo-ve-gizlilik-ayrimi.md), [0009](0009-herkes-kendi-hesabiyla.md), [0021](0021-toparlanma-kisisel-bant.md), PRODUCT §2, ROADMAP Faz 1

## Bağlam
Repo public olacak; portfolyo, ekran görüntüleri ve demo yalnız sentetik "demo sporcu" verisiyle yapılır (0005, PRODUCT §2). Gerçek veri yalnız sahibinin Supabase projesinde. Demo, sahibinin verisine ve sunucusuna dokunmadan bütün ekranları (toparlanmanın üç durumu dahil) gösterebilmeli; repo'yu klonlayan biri de Supabase kurmadan gezebilmeli.

## Seçenekler
1. **Yer:** (a) uygulama içi, çevrimdışı: veri cihazda üretilir; (b) bulutta ayrı demo hesabı: şifre uygulama paketinde herkese açık olur, yabancılar sahibinin projesine yazabilir, ücretsiz plan kotasını kullanır; (c) yalnız yerel geliştirme (seed): tıklanabilir demo yok, Docker gerekir. Kullanıcı (a)'yı seçti.
2. **Kayıt:** (a) bellekte, uygulama kapanınca sıfırlanır; (b) salt okunur. Kullanıcı (a)'yı seçti: formların hissi gösterilir.
3. **Gün:** (a) durum seçici (Hazır / Kontrollü / Toparlan, maketteki gibi); (b) tek sabit senaryo. Kullanıcı (a)'yı seçti.

## Karar
- `apps/mobile/src/demo/`: `demo-data.ts` (saf, deterministik; tohumlu sayı üreteci, 42 günlük geçmiş, veritabanı satırlarıyla aynı biçim), `demo-store.ts` (veri fonksiyonlarıyla aynı imzalar, bellekte), `demo-mode.ts` (aç / senaryo / kapat; saklanmaz).
- Veri fonksiyonları (`daily-log`, `recovery`, `google-health`) demo açıksa depoya gider; ağ isteği yapılmaz. Google Health bağlan / senkron / kes demoda "kullanılamaz" der.
- Demo oturum gibi sayılır (kök düzenin kapısı). Giriş: giriş ekranında **Demoyu aç** (bağlantı değerleri olmasa da) ve Ben → **Demo sporcuyu göster**. Çıkış: Ben → **Demodan çık**; gerçek oturum varsa ona dönülür.
- Bugün'de **demo şeridi**: "Demo sporcu · sentetik veri" ve senaryo çipleri. Senaryo değişince demo verisi baştan üretilir, ekran yeniden kurulur (`key`).
- Senaryolar son 7 günü şekillendirir: Hazır (her şey bandında, uyku yeterli), Kontrollü (HRV düşük, uyku kısa), Toparlan (HRV düşük, nabız yüksek, uyku kısa). Test, her senaryonun motorda beklenen durumu verdiğini dört farklı tarihte (ay ve yıl sınırı, artık gün) denetler.

## Sonuçlar
- Ekran görüntüleri ve portfolyo için gerçek veri hiç gerekmez; görseller demo modundan alınır.
- Demo verisi motorla aynı yoldan geçer: motor veya eşik değişirse demo testi senaryo kaymasını yakalar.
- Herkese açık bir web demo (EAS Hosting vb.) bu kararın kapsamı dışı; yayımlanırsa ayrıca onay gerekir (CLAUDE.md §7).
- **Yeniden değerlendirme tetikleyicisi:** yeni bir veri türü veya ekran eklenirse demo deposu da genişletilir (aksi halde demoda boş kalır); herkese açık web demo istenirse.
