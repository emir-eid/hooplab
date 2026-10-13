# 0038. Takviye ve doping: IOC ve ISSN kaynakları, koç yalnız kaynağı aktarır, doping uyarısı kaynağa bağlı

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-12
- **İlgili:** [0032](0032-ai-koc-tasarimi.md) (takviyede kodla doping uyarısı), [0037](0037-koc-soru-cevap.md) (soru-cevap, `supplement` sınıfı), PRODUCT §3 modül 7 (Takviye), CLAUDE.md §3, oturum raporu (2026-10-12)

## Bağlam
Soru-cevap çalıştı. Kanıt tabanında takviye kaynağı olmadığı için kreatin sorusu "kaynak yok" ile döndü (iPhone, 2026-10-12). PRODUCT modül 7 şunu istiyor: yalnız kanıtı güçlü takviyeler hakkında bilgi ve her zaman doping uyarısı. Doping uyarısının metni de 0037'de kaynaksız yazılmıştı.

Kapsam (kullanıcı kararı, 2026-10-12): takviye ve doping. Yeni fizyolojik kırmızı bayrak eşikleri (dinlenik nabız, SpO2, cilt sıcaklığı) bu işe girmedi. Google Health ritim uyarısı vermiyor. Belirtinin uygulamaya girebildiği tek yer koça yazılan soru; o da sınıflandırılıp doktora yönlendiriliyor (0037).

## Seçenekler
Kaynak kapsamı:
1. **Üst düzey bildirgeler ve basketbola özgü bir meta-analiz:** IOC takviye uzlaşısı, ISSN kreatin ve kafein tutum bildirgeleri, basketbolcularda kafein meta-analizi.
2. Her takviye için ayrı sistematik derleme (nitrat, bikarbonat, beta-alanin, D vitamini...). Daha geniş ama basketbol için öncelik değil; tarama gerektirir.

Koçun doz anlatımı:
1. **Kaynakta yazan dozu alıntıyla aktarır** (soru-cevap denetçisi zaten kaynağın sayısını yalnız alıntıda kabul ediyor). Uygulama kişiye özel doz hesaplamaz.
2. Kilo ile çarpıp kişisel doz verir. Koçun hesap yapması yasak (CLAUDE.md §3); motorda ayrı bir kural ve sorumluluk gerekir.

## Karar
- **Kaynaklar** (Crossref / PubMed çevrimiçi doğrulamasından geçti; tam metinler açık erişim, PMC'den okundu):
  - `maughan-2018`: IOC uzlaşı bildirgesi, kanıt düzeyi 1. Genel çerçeve: iyi kanıtı olanlar, deneme, risk analizi, kontaminasyon ve kesin sorumluluk, bağımsız denetim.
  - `kreider-2017`: ISSN kreatin tutum bildirgesi.
  - `guest-2021`: ISSN kafein tutum bildirgesi.
  - `liu-2026`: basketbolcularda kafein meta-analizi (18 çalışma, 288 oyuncu).
- **Kurallar** (`research/rules/takviye.json`): `takviye-kanit` (koç takviyeyi yalnız bu kaynaklarla anlatır, doz kaynakta yazdığı gibi, kişisel doz yok, kaynağı olmayan takviyede "kaynak yok") ve `takviye-doping-riski` (uyarının içeriği). İkisinde de uygulamanın kullandığı bir eşik yok.
- **Doping uyarısı** (`copy/coach-ask.ts` `dopingWarning`): metin IOC uzlaşısına göre yeniden yazıldı (etikette yazmayan yasaklı madde, bilmeden alınsa da ihlal, bağımsız test riski azaltır ama sıfırlamaz, başlamadan önce doktor ya da diyetisyen). Kural ve kaynak bağı testle denetleniyor; kartta kaynak satırı gösteriliyor.
- **Demo:** kreatin örneği artık kaynaklı yanıt veriyor (kreider-2017, maughan-2018) ve doping uyarısını gösteriyor.

## Sonuçlar
- Kreatin ve kafein soruları kaynaklı yanıt alır. Nitrat, bikarbonat ve beta-alanin yalnız IOC özetinin söylediği kadar anlatılır; ayrıntı istenirse koç "kaynak yok" der.
- Koç kaynaktaki dozu (ör. kreatin için 3-5 g/gün sürdürme) aktarabilir. Bu genel bir aktarımdır, kişisel reçete değildir. Doping uyarısı ve uzman yönlendirmesi her takviye yanıtında koddan gelir.
- Tam taban 80'den 84 kaynağa çıktı (`kb-data.ts` ~175 KB). Önbelleğe yazılan taban 66.276 token'dan 71.476 token'a çıktı. İlk gerçek kreatin sorusu (iPhone, 2026-10-13) `supplement` sınıfında kaynaklı yanıt aldı: 6 cümlenin hepsi denetimden geçti (kreider-2017, maughan-2018), doping uyarısı ve kaynak satırı göründü; önbelleğe yazan ilk soru olarak ~0,19 $.
- **Yeniden değerlendirme:** takviye soruları sık "kaynak yok" dönerse ilgili takviye için sistematik derleme taraması yapılır. WADA listesi ya da IOC uzlaşısı güncellenirse metin ve kaynak gözden geçirilir. Fizyolojik kırmızı bayrak eşikleri ayrı bir iş olarak açıldığında kaynaklı eşik aranır.
