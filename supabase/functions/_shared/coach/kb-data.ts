// OTOMATİK ÜRETİLDİ: node tools/research/coach-kb.mjs. Elle değiştirme; kaynak research/sources ve
// research/rules (kendi özetlerimiz, telifli metin yok). Karar 0032.

import type { KbRule, KbSource } from './kb.ts';

export const kbSources: readonly KbSource[] = [
  {
    "id": "ackerman-2023",
    "title": "Methodology for studying Relative Energy Deficiency in Sport (REDs): a narrative review by a subgroup of the International Olympic Committee (IOC) consensus on REDs",
    "authors": [
      "Ackerman KE",
      "Rogers MA",
      "Heikura IA",
      "Burke LM",
      "Stellingwerff T",
      "Hackney AC",
      "Verhagen E",
      "Schley S",
      "Saville GH",
      "Mountjoy M",
      "Holtzman B"
    ],
    "year": 2023,
    "type": "narrative-review",
    "doi": "10.1136/bjsports-2023-107359",
    "pmid": "37752010",
    "journal": "British Journal of Sports Medicine",
    "population": "REDs araştırmaları (IOC REDs konsensüsünün alt grubu)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- REDs üzerine bilginin çoğu sınırlı çalışmalardan çıkarılmış ya da aktarılmış; standart ölçüm protokolü olmadığı için çalışmalar karşılaştırılamıyor.\n- Temel terimlerin tanımı, çalışma tasarımları, kan ölçümleri ve REDs sonuçlarının nasıl ölçüleceği \"tercih edilen\", \"kullanılan ve önerilen\" ve \"olası\" yöntemler diye sınıflanıyor.\n- Amaç, araştırma yöntemini standartlaştırıp önleme, tanı ve tedaviyi güçlendirmek.\n\n## Uygulamada kullanılan sayılar\n\nSayı kullanılmıyor. Enerji yeterliliği öğün kaydıyla da hesaplanmıyor: alımın yanında egzersiz harcaması ve yağsız kütle gerekir, bunların ölçümü araştırmada bile standart değil (karar 0030).\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| — | — | — |\n\n## Sınırlılıklar\n\n- Anlatı derlemesi; araştırma yöntemi rehberi, sahada kullanım için bir eşik vermiyor.\n- BMJ sayfası otomatik erişime kapalı (LESSONS, Literatür); yalnız özet okundu."
  },
  {
    "id": "amoutzopoulos-2020",
    "title": "Portion size estimation in dietary assessment: a systematic review of existing tools, their strengths and limitations",
    "authors": [
      "Amoutzopoulos B",
      "Page P",
      "Roberts C",
      "Roe M",
      "Cade J",
      "Steer T",
      "Baker R",
      "Hawes T",
      "Galloway C",
      "Yu D",
      "Almiron-Roig E"
    ],
    "year": 2020,
    "type": "systematic-review",
    "doi": "10.1093/nutrit/nuz107",
    "pmid": "31999347",
    "journal": "Nutrition Reviews",
    "population": "Porsiyon tahmin araçları (334 çalışma, 542 araç; 21 doğrulama çalışması); genel nüfus",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Porsiyonu fazla ya da az tahmin etmek, beslenme kaydındaki ölçüm hatasının ana kaynaklarından.\n- Araçların yaklaşık yarısı üç boyutlu (mutfak ölçüleri gibi), yarısı iki boyutlu (fotoğraf atlası gibi); doğrulama çalışmalarının azı yüksek kaliteli.\n- Görsele dayanan araçlar besin modellerinden ve mutfak ölçülerinden daha isabetli bulundu. Araç seçilirken pratiklik ve kullanılacak ortama uygunluk da gözetilmeli.\n\n## Uygulamada kullanılan sayılar\n\nSayı kullanılmıyor. Ev ölçüsünün yanında gram karşılığının yazılması ve hatanın açıklamada anlatılması bu derlemeye dayanıyor (karar 0030).\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| — | — | — |\n\n## Sınırlılıklar\n\n- Genel nüfus; sporcuya özgü değil. Çalışmaların kalitesi düşük.\n- Yalnız özet okundu."
  },
  {
    "id": "andrade-2020",
    "title": "Is the Acute: Chronic Workload Ratio (ACWR) Associated with Risk of Time-Loss Injury in Professional Team Sports? A Systematic Review of Methodology, Variables and Injury Risk in Practical Situations",
    "authors": [
      "Andrade R",
      "Wik EH",
      "Rebelo-Marques A",
      "Blanch P",
      "Whiteley R",
      "Espregueira-Mendes J",
      "Gabbett TJ"
    ],
    "year": 2020,
    "type": "systematic-review",
    "doi": "10.1007/s40279-020-01308-6",
    "pmid": "32572824",
    "journal": "Sports Medicine",
    "population": "Profesyonel / elit yetişkin takım sporcuları; 20 çalışma, 1234 sporcu (hepsi erkek, ortalama yaş 24)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Çalışmaların çoğu, oranın görece yüksek olduğu dönemlerde sakatlık riskinin düşük veya orta orana göre daha yüksek olduğunu buluyor.\n- Yöntemler çok dağınık: çalışmaların hemen hepsi bağlı (coupled) hesap ve 1 haftaya 4 haftalık pencere kullanıyor, ama 14 farklı aralık sınıflaması var ve neredeyse hiçbiri aynı değil. Bu, önerilerin gücünü sınırlıyor.\n- Seans RPE ve toplam mesafe en sık kullanılan yük ölçüleri.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan eşik alınmadı. 7 / 28 günlük pencerenin yaygın olduğunun ve aralık sınırlarında uzlaşı olmadığının dayanağı.\n\n## Sınırlılıklar\n\n- Yalnız erkek sporcular; basketbol az temsil ediliyor.\n- Yalnız özet okundu."
  },
  {
    "id": "bache-mathiesen-2024",
    "title": "Causal inference did not detect any effect of jump load on knee complaints in elite men's volleyball",
    "authors": [
      "Bache-Mathiesen LK",
      "Bahr R",
      "Sattler T",
      "Fagerland MW",
      "Whiteley R",
      "Skazalski C"
    ],
    "year": 2024,
    "type": "cohort",
    "doi": "10.1111/sms.14635",
    "pmid": "38671558",
    "journal": "Scandinavian journal of medicine & science in sports",
    "population": "Elit erkek voleybolcular, n=65 (102 oyuncu-sezon), 3 sezon",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Giyilebilir ölçerle sıçrama sayısı ve yüksekliği kaydedildi, diz şikayetleri haftalık anketle izlendi.\n- Haftalık sıçrama yükünün diz şikayeti başlaması, kötüleşmesi veya düzelmesi üzerine kesin bir etkisi bulunamadı.\n- Sıçrama yükü ile diz sorunu arasındaki ilişki basit değil; tek başına sıçrama sayısı risk göstergesi sayılmamalı.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Voleybol; nedensel çıkarım modelin varsayımlarına bağlı."
  },
  {
    "id": "bahr-2014",
    "title": "Jump frequency may contribute to risk of jumper's knee: a study of interindividual and sex differences in a total of 11,943 jumps video recorded during training and matches in young elite volleyball players",
    "authors": [
      "Bahr MA",
      "Bahr R"
    ],
    "year": 2014,
    "type": "cross-sectional",
    "doi": "10.1136/bjsports-2014-093593",
    "pmid": "24782482",
    "journal": "British journal of sports medicine",
    "population": "Genç elit voleybolcular, 16-18 yaş, n=44 (26 erkek, 18 kadın); 1 haftalık antrenman ve 10 maç videosu",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Bir haftalık antrenman ve maçlarda oyuncu başına sıçrama sayısı videodan sayıldı; toplam 11.943 sıçrama.\n- Aynı takımda oyuncular arasında sıçrama sayısı çok farklı; sıçrama sıklığı, patellar tendinopatinin (jumper's knee) risk etkenlerinden biri olabilir.\n- Sıçramaların çoğu antrenmanda; maç, toplam maruziyetin daha küçük kısmı.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Voleybol, basketbol değil; sakatlık sonucu ölçülmedi, yalnız maruziyet."
  },
  {
    "id": "baker-2007",
    "title": "Progressive dehydration causes a progressive decline in basketball skill performance",
    "authors": [
      "Baker LB",
      "Dougherty KA",
      "Chow M",
      "Kenney WL"
    ],
    "year": 2007,
    "type": "rct",
    "doi": "10.1249/mss.0b013e3180574b02",
    "pmid": "17596779",
    "journal": "Medicine and Science in Sports and Exercise",
    "population": "17-28 yaş erkek basketbolcular, n=17; randomize çapraz desen",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Oyuncular sıcak ortamda %1, 2, 3 ve 4 su kaybına getirildi ya da sıvı alarak kayıpsız kaldı; ardından maçı taklit eden 80 dakikalık bir beceri dizisi yaptı.\n- Koşu, savunma kayması, sıçrama ve şut performansı su kaybı arttıkça kademeli düştü.\n- Düşüşün istatistiksel olarak anlamlı olduğu ilk düzey %2 kayıptı.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| %2 | vücut ağırlığı | Basketbolda becerinin anlamlı düştüğü kayıp; kayıp notunun basketbola özgü dayanağı |\n\n## Sınırlılıklar\n\n- Su kaybı maçtan önce sıcak ortamda yürüyüşle oluşturuldu; maç içinde oluşan kayıpla birebir aynı değil.\n- Küçük örneklem. Çalışma NIH destekli; ilk yazar 2009'da Gatorade Sports Science Institute çalışanı olarak görünüyor (osterberg-2009), 2007'deki bağlantısı özetten belli değil.\n- Yalnız özet okundu."
  },
  {
    "id": "bellenger-2016",
    "title": "Monitoring Athletic Training Status Through Autonomic Heart Rate Regulation: A Systematic Review and Meta-Analysis",
    "authors": [
      "Bellenger CR",
      "Fuller JT",
      "Thomson RL",
      "Davison K",
      "Robertson EY",
      "Buckley JD"
    ],
    "year": 2016,
    "type": "meta-analysis",
    "doi": "10.1007/s40279-016-0484-2",
    "pmid": "26888648",
    "journal": "Sports Medicine",
    "population": "Dayanıklılık sporcuları; 27 çalışma derlemede, 24'ü meta-analizde",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Performansı artıran antrenman dönemlerinde dinlenik vagal HRV (rMSSD) küçük ölçüde arttı.\n- Aşırı yüklenme (performansın düştüğü dönem) dinlenik HRV'yi pek değiştirmedi; egzersiz sonrası HRV ve nabız toparlanması ise hem olumlu uyumda hem aşırı yüklenmede arttı.\n- Sonuç: HRV tek başına olumlu ve olumsuz uyumu ayırt etmeye yetmeyebilir; ek göstergeler gerekir.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| HRV tek başına karar vermez | ilke | Günün durumu HRV, dinlenik nabız ve uykuyla birlikte okunur; arayüz \"teşhis\" değil \"izleme\" dili kullanır |\n\n## Sınırlılıklar\n\n- Dayanıklılık sporcuları; ölçüm protokolleri farklı. Basketbol yok.\n- Yalnız özet okundu."
  },
  {
    "id": "bourdon-2017",
    "title": "Monitoring Athlete Training Loads: Consensus Statement",
    "authors": [
      "Bourdon PC",
      "Cardinale M",
      "Murray A",
      "Gastin P",
      "Kellmann M",
      "Varley MC",
      "Gabbett TJ",
      "Coutts AJ",
      "Burgess DJ",
      "Gregson W",
      "Cable NT"
    ],
    "year": 2017,
    "type": "consensus",
    "doi": "10.1123/IJSPP.2017-0208",
    "pmid": "28463642",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "Sporcular (2016 Doha uzman konferansı, çeşitli sporlar)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Antrenman ve maç yükünü izlemenin ne olduğunu, neden yapıldığını ve uygulamada nasıl kullanıldığını ortak bir çerçevede topluyor.\n- İzlemenin amacını sakatlık ve hastalık riskini azaltmak ve sporcunun hazırlığını yönetmek olarak tanımlıyor; bunun için hem sporcunun algıladığı zorlanmayı (iç yük, ör. seans RPE) hem yapılan işi (dış yük) kullanan çok yönlü yaklaşımları ele alıyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Seans yüklerinden günlük ve haftalık yük izlemenin çerçevesi.\n\n## Sınırlılıklar\n\n- Konferans uzlaşısı; belirli eşikler için kanıt düzeyini tek tek değerlendirmiyor.\n- Yalnız özet okundu."
  },
  {
    "id": "buchheit-2014",
    "title": "Monitoring training status with HR measures: do all roads lead to Rome?",
    "authors": [
      "Buchheit M"
    ],
    "year": 2014,
    "type": "narrative-review",
    "doi": "10.3389/fphys.2014.00073",
    "pmid": "24578692",
    "journal": "Frontiers in Physiology",
    "population": "Dayanıklılık ve takım sporu sporcuları üzerine yayınlanmış çalışmalar (derleme)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Dinlenik nabız, dinlenik HRV, egzersiz ve egzersiz sonrası nabız farklı şeyleri gösterir; her birinin gürültüsü (günden güne oynama) ve anlamlı değişim eşiği farklıdır.\n- Anlamlı değişim eşiği sporcunun kendi günden güne oynamasının bir kesri olarak tanımlanabilir (bazı yazarlar 0,5 × CV, bazıları 1 × CV kullanmış).\n- Gece kaydı en standart koşul gibi görünür, ama bütün gecenin HRV'si uyku evrelerinin dağılımından ve uyanmalardan etkilenir; yorumlaması zordur. Gece ölçülecekse derin uyku (yavaş dalga uykusu) dönemleri daha kararlı bir sinyal verir.\n- HRV'nin düşmesi her zaman yorgunluk değildir (doyum); HRV'yi nabızla birlikte okumak yorumu güçlendirir. Önceki günün yükü gece HRV'sini etkiler.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Gece HRV'si olarak derin uyku RMSSD | ilke | Bütün gece ortalaması yerine (Google Health `deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds`) |\n| Anlamlı değişim = kişisel oynamanın kesri | ilke | Bant ± 0,5 SD; aynı yöntem dinlenik nabıza da uygulanır |\n\n## Sınırlılıklar\n\n- Tek yazarlı anlatı derlemesi (kanıt düzeyi 4). Sayısal tablolar başka çalışmalardan derlenmiş.\n- Açık erişimli tam metin okundu (PMC3936188)."
  },
  {
    "id": "buck-2022",
    "title": "Evaluation of Meal Carbohydrate Counting Errors in Patients with Type 1 Diabetes",
    "authors": [
      "Buck S",
      "Krauss C",
      "Waldenmaier D",
      "Liebing C",
      "Jendrike N",
      "Högel J",
      "Pfeiffer BM",
      "Haug C",
      "Freckmann G"
    ],
    "year": 2022,
    "type": "cross-sectional",
    "doi": "10.1055/a-1493-2324",
    "pmid": "34034353",
    "journal": "Experimental and Clinical Endocrinology & Diabetes",
    "population": "Tip 1 diyabetli yetişkinler (n=74), karbonhidrat sayımı eğitimi almış; sporcu değil",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Katılımcılar 24 standart öğünün karbonhidratını tahmin etti; gerçek değer tartıyla hesaplandı.\n- Karbonhidrat ortanca %28 eksik tahmin edildi; karbonhidratı yüksek öğünlerde eksik tahmin daha büyüktü (%34).\n- Tahmin tekrarlandıkça hata belirgin azaldı; yazarlar düzenli alıştırma öneriyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| ≈ %28 | eksik tahmin (karbonhidrat) | Açıklamada: göz kararı tahmin eğitimli kişide bile belirgin eksik kalıyor; eşik olarak kullanılmaz |\n\n## Sınırlılıklar\n\n- Diyabet popülasyonu, sporcuya aktarım varsayım; laboratuvar öğünleri.\n- Yazarların bir kısmı diyabet teknolojisi şirketleriyle çalışıyor (çıkar beyanı var).\n- Yalnız özet okundu."
  },
  {
    "id": "burger-2024",
    "title": "Athlete Monitoring Systems in Elite Men's Basketball: Challenges, Recommendations, and Future Perspectives",
    "authors": [
      "Burger J",
      "Henze AS",
      "Voit T",
      "Latzel R",
      "Moser O"
    ],
    "year": 2024,
    "type": "narrative-review",
    "doi": "10.1155/2024/6326566",
    "pmid": "39464392",
    "journal": "Translational Sports Medicine",
    "population": "Elit erkek basketbol üzerine yayınlanmış çalışmalar (derleme)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Seans RPE yöntemi profesyonel basketbolda iyi çalışılmış ve kolay uygulanan bir iç yük ölçüsü. Öznel olduğu için sporcunun bilerek ya da bilmeyerek çarpıtabileceği de hatırlatılıyor.\n- İyi oluş için bilimsel altın standart çok boyutlu anketler. Pratikte ise sporcular ve antrenörler kısa, uyarlanmış anketleri tercih ediyor; bunların çoğu doğrulanmamış.\n- Profesyonel erkek basketbolcuların iyi oluşunu inceleyen az sayıdaki çalışma çoğunlukla Hooper ve Mackinnon'un önerilerine dayanan puanlamalar kullanıyor. \"Hooper indeksi\" genellikle yorgunluk, stres, uyku ve kas ağrısı puanlarının toplamı.\n- Uyku kalitesi için basit bir Likert maddesi, uyku süresine ek olarak düşük maliyetli bir seçenek.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Bu kaynak iki şeye dayanak: kısa, beş maddelik bir sabah anketi basketboldaki yaygın uygulamayla uyumlu, ama doğrulanmış bir ölçek değil.\n\n## Sınırlılıklar\n\n- Anlatı derlemesi (düzey 4); sistematik arama yok.\n- Kısa anketlerin doğrulanmamış olduğunu kendisi vurguluyor. HoopLab'deki check-in bir izleme aracıdır, tanı aracı değildir.\n- Açık erişimli tam metin okundu (PMC11511587)."
  },
  {
    "id": "capling-2017",
    "title": "Validity of Dietary Assessment in Athletes: A Systematic Review",
    "authors": [
      "Capling L",
      "Beck KL",
      "Gifford JA",
      "Slater G",
      "Flood VM",
      "O'Connor H"
    ],
    "year": 2017,
    "type": "systematic-review",
    "doi": "10.3390/nu9121313",
    "pmid": "29207495",
    "journal": "Nutrients",
    "population": "Sporcular (18 çalışma; 11'inde kendi bildirdikleri enerji alımı çift işaretli suyla ölçülen harcamayla karşılaştırıldı)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Genel nüfus için geliştirilen beslenme kayıt yöntemleri sporculara da aynı biçimde uygulanıyor, ama sporcuya özgü durumlar doğruluğu etkiliyor.\n- Kendi bildirilen enerji alımı, çift işaretli suyla ölçülen harcamaya göre ortalama %19 eksik çıktı (meta-analizde büyük etki).\n- Yöntemler arasında fark büyük; eksik ya da yanlış bildirim sık. Sporcuda sağlam doğrulama çalışması az.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| ≈ %19 | eksik bildirim (enerji) | Açıklamada: kaydın gerçek alımın altında kalabileceği; eşik olarak kullanılmaz |\n\n## Sınırlılıklar\n\n- Çalışmaların çoğu küçük; sporcu türleri karışık, basketbola özgü değil.\n- Enerji için; karbonhidrat ve protein için ayrı bir eksik bildirim oranı verilmiyor.\n- Yalnız özet okundu."
  },
  {
    "id": "chan-2024",
    "title": "The Relationship between Training Load and Injury Risk in Basketball: A Systematic Review",
    "authors": [
      "Chan CC",
      "Yung PS",
      "Mok KM"
    ],
    "year": 2024,
    "type": "systematic-review",
    "doi": "10.3390/healthcare12181829",
    "pmid": "39337170",
    "journal": "Healthcare (Basel)",
    "population": "Basketbolda yük ve sakatlık çalışmaları; 14 çalışma (profesyonel, kolej ve genç oyuncular)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- 14 çalışmanın 11'i yük ile sakatlık arasında en azından kısmen anlamlı bir ilişki buluyor; yük iç, dış veya ikisiyle ölçülmüş, çoğu mutlak yük kullanıyor.\n- Düşük kronik yük ve ani yük değişimleri riski artırıyor görünüyor; maç başına oynanan dakikadaki ani artış da sakatlıkla ilişkili.\n- Basketbolda oranı yalnız iki çalışma incelemiş ve sonuçları çelişiyor (weiss-2017, ferioli-2020); \"oranı 1-1,5 arasında tutmak sakatlığı azaltır\" diyen bir kanıt yok. Yazarlar oranın sahada temkinli kullanılmasını istiyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan eşik alınmadı. Basketbolda ani yük artışının izlenmeye değer olduğunun, ama oran eşiklerinin bu sporda doğrulanmadığının dayanağı.\n\n## Sınırlılıklar\n\n- Çalışmaların kalitesi karışık (dördü \"zayıf\"); sakatlık tanımları farklı; anlatı sentezi, meta-analiz yok.\n- Açık erişimli tam metnin ilgili bölümleri okundu (PMC11431307)."
  },
  {
    "id": "conte-2018",
    "title": "Monitoring Training Load and Well-Being During the In-Season Phase in National Collegiate Athletic Association Division I Men's Basketball",
    "authors": [
      "Conte D",
      "Kolb N",
      "Scanlan AT",
      "Santolamazza F"
    ],
    "year": 2018,
    "type": "cohort",
    "doi": "10.1123/ijspp.2017-0689",
    "pmid": "29431544",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "NCAA Division I erkek basketbolcular, n=10 (6 guard, 4 forvet), sezon içi",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Antrenman ve maç yükü her seansın sonunda seans RPE yöntemiyle, iyi oluş her seanstan önce kaydedildi.\n- Haftalık toplam yük haftadan haftaya çok dalgalandı (ani artışlar). İyi oluş ise ilk 11'ler ile yedekler arasında ve tek maçlı ile iki maçlı haftalar arasında belirgin farklılaşmadı.\n- Basketbolda seans RPE'yi ve seans öncesi iyi oluşu birlikte, her gün toplamanın uygulanabilir olduğunu gösteriyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. `zhang-2026` iyi oluş anketini bu çalışmaya dayandırıyor.\n\n## Sınırlılıklar\n\n- Küçük örneklem (n=10), tek takım, kolej düzeyi.\n- Yalnız özet okundu; anketin maddeleri ve aralığı bu çalışmanın tam metninden doğrulanmadı."
  },
  {
    "id": "danielsson-2020",
    "title": "The mechanism of hamstring injuries - a systematic review",
    "authors": [
      "Danielsson A",
      "Horvath A",
      "Senorski C",
      "Alentorn-Geli E",
      "Garrett WE",
      "Cugat R",
      "Samuelsson K",
      "Hamrin Senorski E"
    ],
    "year": 2020,
    "type": "systematic-review",
    "doi": "10.1186/s12891-020-03658-8",
    "pmid": "32993700",
    "journal": "BMC musculoskeletal disorders",
    "population": "Hamstring yaralanması mekanizmasını inceleyen 26 özgün çalışma",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Hamstring yaralanmalarını gerilme tipi ve sprint tipi mekanizmalar olarak sınıflıyor.\n- Sprint tipi yaralanmalar yüksek hızda koşuda, salınım fazının sonunda kas uzarken kasıldığı anda oluyor.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Çalışmaların çoğu futbol ve atletizmden; basketbola aktarım varsayım."
  },
  {
    "id": "davis-2022",
    "title": "In-Season Nutrition Strategies and Recovery Modalities to Enhance Recovery for Basketball Players: A Narrative Review",
    "authors": [
      "Davis JK",
      "Oikawa SY",
      "Halson S",
      "Stephens J",
      "O'Riordan S",
      "Luhrs K",
      "Sopena B",
      "Baker LB"
    ],
    "year": 2022,
    "type": "narrative-review",
    "doi": "10.1007/s40279-021-01606-7",
    "pmid": "34905181",
    "journal": "Sports Medicine",
    "population": "Basketbolcular, sezon içi (derleme; çoğu çalışma basketbol ve takım sporları)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Sezon içinde toparlanmanın en çok kanıta dayanan dört bileşeni uyku, karbonhidrat, protein ve sıvı.\n- Basketbolcu için günde 5-7 g/kg karbonhidrat öneriliyor. Takım sporlarında orta ile çok yüksek yükte aralık 5-12 g/kg; alt uç orta yük ve az süre alan oyuncu, üst uç çok yoğun yük ve çok dakika oynayan oyuncu için.\n- İki maç arasında 8 saatten az varsa 4 saat boyunca saatte 1,0-1,2 g/kg karbonhidrat öneriliyor.\n- Protein günde 1,2-2,0 g/kg; her 4-5 saatte bir, öğün başına yaklaşık 0,31 g/kg.\n- Ter kaybı biliniyorsa ve iki seans arası kısaysa, kaybedilen her 1 kg için 1,0-1,5 L sıvı; 24 saat veya daha uzun ara varsa öğünlerle birlikte istendiği kadar içmek yeterli.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 5-7 | g/kg/gün karbonhidrat | Antrenman günü (basketbol) |\n| 1,2-2,0 | g/kg/gün protein | Her gün |\n| 0,31 (≈ 0,3) | g/kg öğün başına protein | 4-5 saatte bir |\n| 1,0-1,5 | L sıvı / kg kayıp | Ter testinden sonra, sonraki seansa kısa süre varsa |\n\n## Sınırlılıklar\n\n- Anlatı derlemesi (kanıt düzeyi 4). Sayılar ortak bildirgeye (thomas-2016) ve takım sporu çalışmalarına dayanıyor.\n- Sekiz yazardan beşi Gatorade Sports Science Institute (PepsiCo) çalışanı; sıvı ve karbonhidrat konusunda çıkar çatışması olabilir.\n- Tam metin okundu (açık erişim, CC BY)."
  },
  {
    "id": "ding-2026",
    "title": "Acute:chronic workload ratio and load management for team sports: a multilevel meta-analysis",
    "authors": [
      "Ding L",
      "Weldon A",
      "Xu J",
      "Malone S",
      "Sampaio J",
      "Zhang Z",
      "Zhou Z",
      "Liu X",
      "Han S",
      "Xu K",
      "Wang Y",
      "Yuan P"
    ],
    "year": 2026,
    "type": "meta-analysis",
    "doi": "10.3389/fpubh.2026.1896651",
    "pmid": "42662491",
    "journal": "Frontiers in Public Health",
    "population": "Takım sporcuları; 41 ileriye dönük çalışma, 16'sı meta-analizde (797 sporcu)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Yüksek oran, sakatlık riskindeki artışla küçük-orta düzeyde ilişkili; ancak çalışmalar arasındaki fark çok büyük (I² yaklaşık yüzde 96).\n- İlişki temaslı ve temassız sakatlıklarda daha belirgin; zaman kaybettiren sakatlıklarda ve diğer alt gruplarda anlamlı değil.\n- Sonuç: oran tek başına nedensel ya da tahmin edici bir model olarak kullanılmamalı; bireyselleştirilmiş, çok göstergeli bir yük yönetiminin içinde bağlam veren bir izleme göstergesi olarak okunmalı.\n- Dahil edilen çalışmalarda kayan ortalama ve EWMA, bağlı ve bağsız hesapların hepsi var.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan eşik alınmadı. Oranın HoopLab'de \"bağlam göstergesi\" olarak sunulmasının en güncel ve en yüksek düzeydeki dayanağı.\n\n## Sınırlılıklar\n\n- Yüksek heterojenlik; basketbol çalışması az.\n- Açık erişimli tam metnin ilgili bölümleri okundu (PMC13520966)."
  },
  {
    "id": "doeven-2018",
    "title": "Postmatch recovery of physical performance and biochemical markers in team ball sports: a systematic review",
    "authors": [
      "Doeven SH",
      "Brink MS",
      "Kosse SJ",
      "Lemmink KAPM"
    ],
    "year": 2018,
    "type": "systematic-review",
    "doi": "10.1136/bmjsem-2017-000264",
    "pmid": "29527320",
    "journal": "BMJ open sport & exercise medicine",
    "population": "Takım top sporları oyuncuları; 28 çalışma",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Maç sonrası toparlanmayı sıçrama ve sprint testleri ile kan göstergeleri (kreatin kinaz, kortizol, testosteron) üzerinden derliyor.\n- Performans testleri toparlandığında kas hasarı göstergeleri hala toparlanmamış olabiliyor.\n- Kreatin kinazın başlangıca dönmesi 72 saate kadar veya daha uzun sürebiliyor; futbol ve ragbi diğer top sporlarından daha uzun toparlanma gerektiriyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Kreatin kinaz toparlanması | ≤ 72 saat veya daha uzun | maç sonrası, takım top sporları |\n\n## Sınırlılıklar\n\n- Çalışmalar arasında yöntem farkı büyük; basketbol verisi sınırlı."
  },
  {
    "id": "duking-2021",
    "title": "Monitoring and adapting endurance training on the basis of heart rate variability monitored by wearable technologies: A systematic review with meta-analysis",
    "authors": [
      "Düking P",
      "Zinner C",
      "Trabelsi K",
      "Reed JL",
      "Holmberg HC",
      "Kunz P",
      "Sperlich B"
    ],
    "year": 2021,
    "type": "meta-analysis",
    "doi": "10.1016/j.jsams.2021.04.012",
    "pmid": "34489178",
    "journal": "Journal of Science and Medicine in Sport",
    "population": "8 çalışma, 9 müdahale, 198 katılımcı; HRV'si giyilebilir cihazla ölçülen dayanıklılık sporcuları",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Giyilebilir cihazla ölçülen HRV'ye göre ayarlanan antrenman, sabit programa göre submaksimal fizyolojik göstergelerde orta düzeyde daha iyi sonuç verdi.\n- Performans ve VO2peak üzerindeki fark küçük ve anlamlı değil; HRV yönlendirmesinde performansta yanıt vermeyen kişi sayısı daha az.\n- HRV grubunda genellikle daha az orta ve yüksek yoğunluklu seans yapıldı.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Giyilebilir cihaz HRV'si karar için kullanılabilir | ilke | Bileklik ölçümüyle bant yaklaşımı; etki küçük, arayüz kesinlik iddia etmez |\n\n## Sınırlılıklar\n\n- Dayanıklılık sporcuları, az sayıda çalışma, farklı protokoller.\n- Yalnız özet okundu."
  },
  {
    "id": "ferioli-2020",
    "title": "Determining the relationship between load markers and non-contact injuries during the competitive season among professional and semi-professional basketball players",
    "authors": [
      "Ferioli D",
      "La Torre A",
      "Tibiletti E",
      "Dotto A",
      "Rampinini E"
    ],
    "year": 2020,
    "type": "cohort",
    "doi": "10.1080/15438627.2020.1808980",
    "pmid": "32812787",
    "journal": "Research in Sports Medicine",
    "population": "Profesyonel ve yarı profesyonel erkek basketbolcular, n=35 (yaş 24 ± 6), 1-2 sezon; seans RPE iç yükü",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Haftalık ortalama RPE, haftalık yük, maruziyet, haftadan haftaya yük değişimi ve 1:2, 1:3, 1:4 haftalık akut / kronik oranlar incelendi; sonraki haftadaki temassız sakatlıkla ilişki arandı.\n- Hiçbir yük göstergesi temassız sakatlıkla ilişkili çıkmadı ve hiçbiri sakatlığı tahmin edemedi (eğri altındaki alan yaklaşık 0,5, yani şans düzeyi).\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Haftadan haftaya yük değişimi | AU | Basketbolda kullanılan bir gösterge; HoopLab'de eşiksiz, yalnız gösterilir |\n\n## Sınırlılıklar\n\n- Küçük örneklem; yalnız temassız sakatlıklar.\n- Yalnız özet okundu. Çevrimiçi yayını 2020, basılı sayısı 2021."
  },
  {
    "id": "finnern-2026",
    "title": "Qualitative and quantitative situational characteristics of muscle strains in sports: a systematic review and meta-analysis",
    "authors": [
      "Finnern LS",
      "Wilke J",
      "Willwacher S",
      "Pasanen K",
      "Hollander K",
      "Dalos D",
      "Welsch GH",
      "Krosshaug T",
      "Edouard P",
      "Gronwald T",
      "Hoenig T"
    ],
    "year": 2026,
    "type": "meta-analysis",
    "doi": "10.1136/bjsports-2025-110327",
    "pmid": "41558842",
    "journal": "British journal of sports medicine",
    "population": "21 video analizi çalışması, 728 temassız veya dolaylı kas zorlanması, çeşitli sporlar",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Kas zorlanmalarının çoğu koşuyla ilgili ya da kasın aktifken boyunun değiştiği spora özgü hareketlerde oluyor.\n- Hamstringde dizin tam açılmaya yakın olduğu an, adduktorlarda kalçanın açılıp dışa dönmesiyle hızlı uzama, baldırda diz düzken ayak bileğinin bükülmesi tipik örüntüler.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Yalnız özet okundu; çalışmaların çoğu futbol."
  },
  {
    "id": "foster-1998",
    "title": "Monitoring training in athletes with reference to overtraining syndrome",
    "authors": [
      "Foster C"
    ],
    "year": 1998,
    "type": "cohort",
    "doi": "10.1097/00005768-199807000-00023",
    "pmid": "9662690",
    "journal": "Medicine & Science in Sports & Exercise",
    "population": "Deneyimli sporcular, n=25",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Sporcular antrenmanlarını seans RPE × süre yöntemiyle kaydetti; basit hastalıklar (aşırı antrenmanın sık anılan bir belirtisi) yük, monotonluk ve gerilimle karşılaştırıldı.\n- Monotonluk: haftanın günlük yük ortalamasının, aynı günlük yüklerin standart sapmasına bölümü (gün gün az değişen, tekdüze antrenman yüksek monotonluk verir). Gerilim: haftalık yük × monotonluk.\n- Hastalıkların büyük kısmı, sporcular kendilerine özgü eşikleri aştığında, en çok da gerilimle ilişkili olarak ortaya çıktı. Eşikler sporcuya özgü; evrensel bir değer verilmiyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Monotonluk = 7 günün günlük yük ortalaması / standart sapması | - | Dinlenme günü 0 yükle dahil |\n| Gerilim = 7 günlük toplam yük × monotonluk | AU | |\n\nEşik kullanılmaz; sık anılan \"monotonluk 2'nin üstü\" eşiği doğrulanmış bir kaynakta bulunamadı.\n\n## Sınırlılıklar\n\n- Küçük örneklem, sonuç ölçüsü sakatlık değil basit hastalık.\n- Yalnız özet okundu; tanımlar açık erişimli haddad-2017 tam metninden de doğrulandı. Standart sapmanın örneklem mi popülasyon mu olduğu iki kaynakta da yazmıyor; HoopLab örneklem SD'si (n − 1) kullanır."
  },
  {
    "id": "foster-2001",
    "title": "A new approach to monitoring exercise training",
    "authors": [
      "Foster C",
      "Florhaug JA",
      "Franklin J",
      "Gottschall L",
      "Hrovatin LA",
      "Parker S",
      "Doleshal P",
      "Dodge C"
    ],
    "year": 2001,
    "type": "cross-sectional",
    "doi": "10.1519/00124278-200102000-00019",
    "pmid": "11708692",
    "journal": "Journal of Strength and Conditioning Research",
    "population": "Sağlıklı yetişkinler (bisiklet egzersizi) ve basketbol antrenmanı yapan erkekler",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Seans RPE yöntemi, kalp atım hızına dayalı nesnel bir yükle karşılaştırıldı. Hem sabit ve aralıklı bisiklet egzersizinde hem basketbol antrenmanında iki yöntem arasında tutarlı bir ilişki bulundu.\n- Seans RPE ile hesaplanan mutlak değer, kalp atımı yöntemininkinden yüksek çıktı; iki bölümdeki ilişki ise neredeyse aynıydı.\n- Yazarların sonucu: seans RPE, egzersiz türünden bağımsız olarak antrenmanı sayısallaştırmanın geçerli bir yolu.\n\n## Uygulamada kullanılan sayılar\n\nÖlçek ve hesap bu çalışmanın yöntemi; ayrıntılar açık erişimli `haddad-2017` derlemesinden doğrulandı.\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 0-10 | RPE (değiştirilmiş CR-10) | Seans bittikten sonra, tüm seans için tek puan |\n| RPE × süre | AU (keyfi birim) | Seans yükü |\n\n## Sınırlılıklar\n\n- Küçük örneklemler; basketbol bölümü kolej düzeyinde.\n- Yalnız özet okundu."
  },
  {
    "id": "fukagawa-2022",
    "title": "USDA's FoodData Central: what is it and why is it needed today?",
    "authors": [
      "Fukagawa NK",
      "McKillop K",
      "Pehrsson PR",
      "Moshfegh A",
      "Harnly J",
      "Finley J"
    ],
    "year": 2022,
    "type": "expert-opinion",
    "doi": "10.1093/ajcn/nqab397",
    "pmid": "34893796",
    "journal": "The American Journal of Clinical Nutrition",
    "population": "Yok (besin bileşimi veritabanının tanıtımı; USDA Tarımsal Araştırma Servisi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- FoodData Central (FDC), USDA'nın besin bileşimi verisini tek yerde toplayan sistem. Beş veri türü var: Foundation Foods, Experimental Foods, SR Legacy, FNDDS ve markalı ürünler.\n- SR Legacy, uzun yıllar kullanılan standart referans veritabanının son, artık güncellenmeyen sürümü; ev ölçülerinin gram karşılıklarını da içeriyor.\n- Amaç, besin değerlerini şeffaf, belgeli ve web üzerinden kolay erişilir kılmak.\n\n## Uygulamada kullanılan sayılar\n\nBu makaleden sayı alınmıyor. Öğün kaydındaki besin listesinin değerleri (100 g'daki karbonhidrat ve protein, ev ölçüsünün gram karşılığı) doğrudan FDC'den, her besinin FDC kimliğiyle alınır: `research/foods/foods.json`.\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| FDC kimliği | — | Her besin satırında; değer FDC API'siyle yeniden doğrulanabilir |\n\n## Sınırlılıklar\n\n- Veritabanı tanıtımı, kanıt düzeyi yok (yöntemsel kaynak). Veri ABD besinlerinden; Türk yemekleri birebir karşılanmıyor, eşleme yaklaşık.\n- Veri kamu malı (CC0 1.0; FDC API kılavuzunda yazıyor). Önerilen atıf: U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2019. fdc.nal.usda.gov.\n- Yalnız özet okundu."
  },
  {
    "id": "gabbett-2016",
    "title": "The training—injury prevention paradox: should athletes be training smarter and harder?",
    "authors": [
      "Gabbett TJ"
    ],
    "year": 2016,
    "type": "narrative-review",
    "doi": "10.1136/bjsports-2015-095788",
    "pmid": "26758673",
    "journal": "British Journal of Sports Medicine",
    "population": "Takım sporları çalışmalarının derlemesi (kriket, ragbi ligi, Avustralya futbolu ağırlıklı)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Yüksek yükün kendisinden çok, sporcunun hazır olmadığı ani yük artışlarının sakatlıkla ilişkili olduğunu savunuyor; yüksek kronik yükün koruyucu olabileceğini öne sürüyor.\n- Akut / kronik yük oranını (son haftanın yükü / son haftaların ortalaması) bu fikrin ölçüsü olarak öneriyor.\n- Oranın yaklaşık 0,8-1,3 arasını düşük riskli bölge, 1,5 ve üstünü yüksek riskli bölge olarak tarif ediyor; önerinin bireysel sporlara aktarılmasında temkin istiyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| ≥ 1,5 | oran | Akut / kronik yük; \"belirgin artış\" notunun eşiği. Sakatlık tahmini olarak kullanılmaz |\n\n0,8-1,3 aralığı HoopLab'de kullanılmaz ([0025](../../docs/decisions/0025-antrenman-yuku.md)): \"güvenli bölge\" rengi gösterilmez.\n\n## Sınırlılıklar\n\n- Anlatı derlemesi; bölgeler başka takım sporlarından geliyor, basketbolda doğrulanmadı (chan-2024, ferioli-2020).\n- Oranın kendisi sonradan güçlü yöntem eleştirileri aldı (lolli-2017, impellizzeri-2020, impellizzeri-2021).\n- Açık erişimli tam metnin ilgili bölümleri okundu (PMC4789704)."
  },
  {
    "id": "gabbett-2025",
    "title": "From Tissue to System: What Constitutes an Appropriate Response to Loading?",
    "authors": [
      "Gabbett TJ",
      "Oetter E"
    ],
    "year": 2025,
    "type": "narrative-review",
    "doi": "10.1007/s40279-024-02126-w",
    "pmid": "39527327",
    "journal": "Sports medicine (Auckland, N.Z.)",
    "population": "Derleme; sağlıklı sporcular ve rehabilitasyondaki hastalar",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Dokuların yüke verdiği yanıt ve toparlanma süresi birbirinden çok farklıdır; toparlanma burada benzer bir uyarıyı zarar görmeden yeniden alabilmeye hazır olmak diye tanımlanıyor.\n- Çok sıçrama ve sekme (gerilme-kısalma döngüsü) yüklenmesi almış tendonlar için benzer bir dozdan önce yaklaşık 48 saatlik ara öneriliyor.\n- Eksantrik egzersizin yol açtığı kas hasarında benzer büyüklükte iki yük arasında 72 saat veya daha uzun süre gerekebiliyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Tendon: benzer yük öncesi ara | 48 saat | çok sıçramalı / gerilme-kısalma döngüsü yüklenmesi sonrası |\n| Kas: benzer yük öncesi ara | ≥ 72 saat | eksantrik egzersize bağlı kas hasarı sonrası |\n\n## Sınırlılıklar\n\n- Derleme; süreler farklı çalışmalardan derlenmiş, bireysel farklar büyük.\n- Yalnız özet okundu (açık erişimde değil); kullanılan iki süre özette açıkça yazıyor."
  },
  {
    "id": "gallo-2016",
    "title": "Pre-training perceived wellness impacts training output in Australian football players",
    "authors": [
      "Gallo TF",
      "Cormack SJ",
      "Gabbett TJ",
      "Lorenzen CH"
    ],
    "year": 2016,
    "type": "cohort",
    "doi": "10.1080/02640414.2015.1119295",
    "pmid": "26637525",
    "journal": "Journal of Sports Sciences",
    "population": "Profesyonel Avustralya futbolcuları, n=36, 15 beceri antrenmanı",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Oyuncular her sabah antrenmandan önce beş maddelik bir iyi oluş anketi doldurdu (uyku kalitesi, yorgunluk, stres, ruh hali, kas ağrısı); sonuç oyuncunun kendi değerlerine göre z-skoru olarak ifade edildi.\n- Sabah iyi oluş z-skoru −1 olan oyuncuların o günkü antrenmandaki dış yükü (ivmeölçer yükü) küçük ama anlamlı ölçüde düşüktü.\n- Sabah iyi oluşunun, o gün oyuncudan beklenebilecek antrenman yoğunluğu hakkında bilgi verdiği sonucuna varıldı.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| z = −1 | kişisel SD | Check-in notu: bugünkü toplam, kendi önceki 4 haftanın ortalamasının 1 SD altındaysa \"alıştığından belirgin düşük\" |\n\n## Sınırlılıklar\n\n- Avustralya futbolu, tek takım, 15 seans; basketbola aktarım varsayım.\n- −1 z-skoru çalışmada bir etki büyüklüğü birimi, doğrulanmış bir uyarı eşiği değil.\n- z-skorunun hangi dönemin ortalaması ve SD'siyle hesaplandığı özetten belli değil; HoopLab kişisel bant penceresini (önceki 4 hafta) kullanıyor.\n- Yalnız özet okundu."
  },
  {
    "id": "gallo-2017",
    "title": "Self-Reported Wellness Profiles of Professional Australian Football Players During the Competition Phase of the Season",
    "authors": [
      "Gallo TF",
      "Cormack SJ",
      "Gabbett TJ",
      "Lorenzen CH"
    ],
    "year": 2017,
    "type": "cohort",
    "doi": "10.1519/JSC.0000000000001515",
    "pmid": "27243912",
    "journal": "Journal of Strength and Conditioning Research",
    "population": "Profesyonel Avustralya futbolcuları, bir takım, yarışma dönemi (1835 kayıt)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Sabah iyi oluş z-skoru maçtan sonraki gün belirgin düşüyor; maçtan maça süre (6, 7, 8 gün) ve sezonun dönemi bu düşüşü değiştiriyor.\n- Maç ve maç dışındaki koşullar hesaba katılınca antrenman yükünün haftalık iyi oluş profiline ayrıca etkisi bulunmadı.\n- Yazarlar iyi oluştaki \"kırmızı bayrakların\" sporcunun kendi tipik haftalık profiline göre konmasını öneriyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Check-in'in popülasyon eşiğiyle değil sporcunun kendi geçmişine göre okunmasının ve maç ertesi düşüşün olağan sayılmasının dayanağı.\n\n## Sınırlılıklar\n\n- Avustralya futbolu, tek takım; basketbola aktarım varsayım.\n- HoopLab şimdilik haftanın gününe veya maçtan geçen süreye göre ayrı bir profil kurmuyor; maç ertesi düşüş bu yüzden açıklama metninde anlatılıyor.\n- Yalnız özet okundu."
  },
  {
    "id": "gibson-2016",
    "title": "Accuracy of hands v. household measures as portion size estimation aids",
    "authors": [
      "Gibson AA",
      "Hsu MS",
      "Rangan AM",
      "Seimon RV",
      "Lee CM",
      "Das A",
      "Finch CH",
      "Sainsbury A"
    ],
    "year": 2016,
    "type": "cross-sectional",
    "doi": "10.1017/jns.2016.22",
    "pmid": "27547392",
    "journal": "Journal of Nutritional Science",
    "population": "Sağlıklı yetişkinler (n=67, %70 kadın, ortalama yaş 33); sporcu değil",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Katılımcılar önceden tartılmış 42 besinin miktarını el ölçüleriyle (parmak genişliği, yumruk, başparmak ucu) ve mutfak ölçüleriyle (bardak, kaşık) tahmin etti.\n- Geometrik şekilli besinlerde parmak genişliği yöntemi daha isabetliydi: tahminlerin %80'i gerçek ağırlığın ±%25'i içinde kaldı, mutfak ölçüsünde bu oran %29'du.\n- Şekilsiz besinlerde (pilav, püre, mısır gevreği) yumruk yöntemi de bardak yöntemi de çoğunlukla fazla tahmin etti.\n- Yumruk ortalama yaklaşık 1 bardak (250 mL) geldi, ama erkeklerin yumruğu kadınlarınkinden yaklaşık 100 mL büyüktü; el ölçüsü kişiye göre değişiyor.\n\n## Uygulamada kullanılan sayılar\n\nSayı kullanılmıyor. El ölçüsü yöntemini seçmeme gerekçesi (karar 0030).\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| — | — | — |\n\n## Sınırlılıklar\n\n- Tek çalışma, laboratuvar ortamı, sporcu değil; tahminler hacimden yoğunluk katsayısıyla ağırlığa çevrildi.\n- Tam metin okundu (Europe PMC, PMC4976119)."
  },
  {
    "id": "goncalves-2026",
    "title": "Chat, Gemini and Claude at the dinner table: assessing general-purpose AI tools for carbohydrate counting in the context of type 1 diabetes",
    "authors": [
      "Goncalves S",
      "Coelho C",
      "Pretre L",
      "Roussillon C",
      "Jarlot M",
      "Ducloux C",
      "Penfornis A",
      "Amadou C"
    ],
    "year": 2026,
    "type": "cross-sectional",
    "doi": "10.1016/j.diabres.2025.113031",
    "pmid": "41314475",
    "journal": "Diabetes Research and Clinical Practice",
    "population": "30 öğün; altı diyetisyen ile üç genel amaçlı yapay zeka aracının (fotoğraftan) karbonhidrat tahmini",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Öğün başına ortalama mutlak hata diyetisyenlerde yaklaşık 13 g, yapay zeka araçlarında 20-28 g arasındaydı.\n- 20 g ve üstü fazla tahminler diyetisyenlerde nadirdi, yapay zeka araçlarında belirgin daha sıktı.\n- Yazarlar bu araçların eğitimin yerini tutamayacağı, ancak tamamlayıcı olabileceği sonucuna varıyor.\n\n## Uygulamada kullanılan sayılar\n\nSayı kullanılmıyor. Öğün gramını fotoğraftan yapay zekaya tahmin ettirmeme gerekçesi (karar 0030; CLAUDE.md §3: sayıları kod hesaplar).\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| — | — | — |\n\n## Sınırlılıklar\n\n- Diyabet bağlamı, küçük öğün örneklemi; araçların sürümleri hızla değişiyor.\n- Çevrimiçi yayın 2025 sonu, dergi sayısı 2026.\n- Yalnız özet okundu."
  },
  {
    "id": "griffin-2019",
    "title": "The Association Between the Acute:Chronic Workload Ratio and Injury and its Application in Team Sports: A Systematic Review",
    "authors": [
      "Griffin A",
      "Kenny IC",
      "Comyns TM",
      "Lyons M"
    ],
    "year": 2019,
    "type": "systematic-review",
    "doi": "10.1007/s40279-019-01218-2",
    "pmid": "31691167",
    "journal": "Sports Medicine",
    "population": "Takım sporlarında akut / kronik oran ve sakatlık çalışmaları (22 makale)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Oranın temassız sakatlıklarla ilişkili olduğunu ve tek başına değil, başka yöntemlerle birlikte çok yönlü bir izleme sisteminin parçası olarak kullanılabileceğini söylüyor.\n- Kayan ortalama ve EWMA yöntemlerinin ikisini de destekleyen çalışmalar var; yazarlar daha duyarlı olduğu için EWMA'yı daha uygun buluyor.\n- En uygun pencere uzunluğu ve yük ölçüsü spora göre değişebilir.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan eşik alınmadı. EWMA seçiminin sistematik derleme düzeyindeki dayanağı.\n\n## Sınırlılıklar\n\n- Çalışmalar arası yöntem farkı büyük; basketbol çalışması az.\n- Yalnız özet okundu."
  },
  {
    "id": "haddad-2017",
    "title": "Session-RPE Method for Training Load Monitoring: Validity, Ecological Usefulness, and Influencing Factors",
    "authors": [
      "Haddad M",
      "Stylianides G",
      "Djaoui L",
      "Dellal A",
      "Chamari K"
    ],
    "year": 2017,
    "type": "narrative-review",
    "doi": "10.3389/fnins.2017.00612",
    "pmid": "29163016",
    "journal": "Frontiers in Neuroscience",
    "population": "Seans RPE geçerlik ve güvenirlik çalışmaları (çeşitli sporlar, basketbol dahil)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Foster ve arkadaşlarının (2001) değiştirilmiş CR-10 ölçeğini tablo olarak veriyor. Sözel çapalar: 0 dinlenme, 1 çok çok kolay, 2 kolay, 3 orta, 4 biraz zor, 5 zor, 7 çok zor, 10 maksimal. 6, 8 ve 9'un sözel karşılığı yok.\n- Seans yükü, seansın şiddet puanı ile süresinin çarpımıyla tek bir keyfi birim (AU) olarak hesaplanıyor.\n- Yöntemin farklı sporlarda geçerliğini ve güvenirliğini gösteren çalışmaları derliyor; sporcunun ölçeğe önce alışması gerektiğini not ediyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 0-10, sözel çapalar 0, 1, 2, 3, 4, 5, 7, 10'da | RPE | Seans kaydı formundaki ölçek |\n| RPE × dakika | AU | Seans yükü (`packages/engine` → `sessionLoad`) |\n\n## Sınırlılıklar\n\n- Anlatı derlemesi (düzey 4); ölçeğin birincil kaynağı `foster-2001`.\n- Açık erişimli tam metin okundu (PMC5673663)."
  },
  {
    "id": "harper-2022",
    "title": "Biomechanical and Neuromuscular Performance Requirements of Horizontal Deceleration: A Review with Implications for Random Intermittent Multi-Directional Sports",
    "authors": [
      "Harper DJ",
      "McBurnie AJ",
      "Santos TD",
      "Eriksrud O",
      "Evans M",
      "Cohen DD",
      "Rhodes D",
      "Carling C",
      "Kiely J"
    ],
    "year": 2022,
    "type": "narrative-review",
    "doi": "10.1007/s40279-022-01693-0",
    "pmid": "35643876",
    "journal": "Sports medicine (Auckland, N.Z.)",
    "population": "Derleme; çok yönlü, kesintili takım sporları",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Yatay yavaşlama (ani duruş) yüksek darbe kuvvetleri ve yükleme hızlarıyla karakterize; en büyük kuvvetler temasın ilk 50 milisaniyesinde.\n- Bu kuvvetler maksimal hızlanmanın ilk adımlarındakinin 2,7 katına kadar çıkabiliyor.\n- Duruşun son adımında quadriceps aktivasyonu maksimal izometrik kasılmanın üstüne çıkıyor ve iş büyük ölçüde eksantrik; kas hasarı ve yaralanma riskiyle ilişkilendiriliyor.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Derleme; derlenen çalışmaların çoğu laboratuvar koşulunda, küçük örneklemli. Tam metin (açık erişim) okundu."
  },
  {
    "id": "hawker-2011",
    "title": "Measures of adult pain: Visual Analog Scale for Pain (VAS Pain), Numeric Rating Scale for Pain (NRS Pain), McGill Pain Questionnaire (MPQ), Short-Form McGill Pain Questionnaire (SF-MPQ), Chronic Pain Grade Scale (CPGS), Short Form-36 Bodily Pain Scale (SF-36 BPS), and Measure of Intermittent and Constant Osteoarthritis Pain (ICOAP)",
    "authors": [
      "Hawker GA",
      "Mian S",
      "Kendzerska T",
      "French M"
    ],
    "year": 2011,
    "type": "narrative-review",
    "doi": "10.1002/acr.20543",
    "pmid": "22588748",
    "journal": "Arthritis Care & Research",
    "population": "Yetişkinlerde ağrı ölçüm araçları (romatoloji odaklı derleme)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Yetişkinlerde ağrı şiddetini ölçen yaygın araçları (görsel analog ölçek, sayısal derecelendirme ölçeği ve diğerleri) ölçüm özellikleriyle birlikte derliyor.\n- Sayısal derecelendirme ölçeği (NRS), ağrı şiddeti için yerleşik araçlardan biri olarak ele alınıyor.\n\n## Uygulamada kullanılan sayılar\n\nBu kayıttan doğrudan sayı alınmadı. Tam metne erişilemedi; yalnız künye ve başlık doğrulandı. NRS'nin 0-10 aralığı ve uç ifadeleri `todri-2025`'ten.\n\n## Sınırlılıklar\n\n- Klinik (romatoloji) popülasyon; sporcuya özgü değil.\n- Tam metin okunmadı."
  },
  {
    "id": "hooper-1995",
    "title": "Markers for monitoring overtraining and recovery",
    "authors": [
      "Hooper SL",
      "Mackinnon LT",
      "Howard A",
      "Gordon RD",
      "Bachmann AW"
    ],
    "year": 1995,
    "type": "cohort",
    "doi": "10.1249/00005768-199501000-00019",
    "pmid": "7898325",
    "journal": "Medicine & Science in Sports & Exercise",
    "population": "Elit yüzücüler (kadın ve erkek), n=14, 6 aylık sezon",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Sporcuların her gün kendi tuttuğu öznel iyi oluş puanları, sezon sonunda performansı düşen ve uzun süre yüksek yorgunluk bildiren (\"bayatlamış\") sporcuları istatistiksel olarak öngördü.\n- Yarış öncesi yükün azaltıldığı dönemde (taper) iyi oluş puanları, yarış derecesindeki iyileşmeyi de öngördü.\n- Yazarların sonucu: öznel iyi oluş puanları aşırı yüklenmeyi ve toparlanmayı izlemenin verimli bir yolu olabilir.\n- Günlük öznel iyi oluş takibi (\"Hooper\" tipi ölçek) bu çizgiden yaygınlaştı. Basketbolda kullanılan dört maddeli biçim (yorgunluk, stres, uyku, kas ağrısı) için bkz. `burger-2024`.\n\n## Uygulamada kullanılan sayılar\n\nBu çalışmadan doğrudan sayı alınmadı. Yalnız özet okunduğu için ölçek aralığı ve madde sayısı bu çalışmadan doğrulanamadı; onlar `zhang-2026`'dan.\n\n## Sınırlılıklar\n\n- Küçük örneklem (n=14), yüzme; basketbola aktarım dolaylı.\n- Yalnız özet okundu; ölçeğin aralığı ve madde ifadeleri tam metinden doğrulanmadı."
  },
  {
    "id": "impellizzeri-2020",
    "title": "Acute:Chronic Workload Ratio: Conceptual Issues and Fundamental Pitfalls",
    "authors": [
      "Impellizzeri FM",
      "Tenan MS",
      "Kempton T",
      "Novak A",
      "Coutts AJ"
    ],
    "year": 2020,
    "type": "expert-opinion",
    "doi": "10.1123/ijspp.2019-0864",
    "pmid": "32502973",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "Yöntem ve kavram yazısı (popülasyon yok)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Bir göstergeyi değiştirerek sakatlığı azaltmayı önermek, nedensel bir etki varsaymak demek; oran için bu etkiyi doğru biçimde tahmin etmeye çalışan çalışma yok.\n- Oran verisinin bilinen istatistik sorunları var: payı paydaya göre gerçekten normalleştirmiyor (bağsız hesapta bile), belirsiz, gürültü ekliyor ve sakatlıkla ilişkisi tutarlı tek bir yönde değil.\n- Sonuç: oranın yük yönetiminde veya sakatlık riskini azaltma amaçlı antrenman önerilerinde kullanılmasını destekleyen kanıt yok.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı. HoopLab'de oranın renkli \"güvenli / tehlikeli bölge\" veya sakatlık riski olarak sunulmamasının ana gerekçesi ([0025](../../docs/decisions/0025-antrenman-yuku.md)).\n\n## Sınırlılıklar\n\n- Kavramsal yazı; yeni veri yok (ampirik gösterim impellizzeri-2021'de).\n- Yalnız özet okundu."
  },
  {
    "id": "impellizzeri-2021",
    "title": "What Role Do Chronic Workloads Play in the Acute to Chronic Workload Ratio? Time to Dismiss ACWR and Its Underlying Theory",
    "authors": [
      "Impellizzeri FM",
      "Woodcock S",
      "Coutts AJ",
      "Fanchini M",
      "McCall A",
      "Vigotsky AD"
    ],
    "year": 2021,
    "type": "cohort",
    "doi": "10.1007/s40279-020-01378-6",
    "pmid": "33332011",
    "journal": "Sports Medicine",
    "population": "Daha önce yayımlanmış bir takım sporu veri setinin yeniden analizi",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Akut yükü gerçek kronik yük yerine sabit veya rastgele üretilmiş \"kronik\" değerlere bölünce de oranla sakatlık arasında benzer büyüklükte ilişkiler çıkıyor. Yani bulunan ilişkinin çoğu kronik yükten değil, akut yükün yeniden ölçeklenmesinden geliyor.\n- Ne oran ne akut yük tek başına, hiçbir değişken kullanmayan bir modele göre anlamlı bir tahmin üstünlüğü sağlıyor.\n- Yazarlar oranın ve arkasındaki kuramın bırakılmasını, önerilerin ve uzlaşı metinlerinin buna göre güncellenmesini öneriyor.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı. Oranın HoopLab'de sakatlık tahmini olarak kullanılmamasının, yalnız \"alıştığın seviyeye göre\" bağlam olarak gösterilmesinin gerekçesi.\n\n## Sınırlılıklar\n\n- Tek bir yayımlanmış veri setinin yeniden analizi; tür alanı bu yüzden `cohort`.\n- Çevrimiçi yayını 2020, basılı sayısı 2021.\n- Yalnız özet okundu."
  },
  {
    "id": "jager-2017",
    "title": "International Society of Sports Nutrition Position Stand: protein and exercise",
    "authors": [
      "Jäger R",
      "Kerksick CM",
      "Campbell BI",
      "Cribb PJ",
      "Wells SD",
      "Skwiat TM",
      "Purpura M",
      "Ziegenfuss TN",
      "Ferrando AA",
      "Arent SM",
      "Smith-Ryan AE",
      "Stout JR",
      "Arciero PJ",
      "Ormsbee MJ",
      "Taylor LW",
      "Wilborn CD",
      "Kalman DS",
      "Kreider RB",
      "Willoughby DS",
      "Hoffman JR",
      "Krzykowski JL",
      "Antonio J"
    ],
    "year": 2017,
    "type": "position-stand",
    "doi": "10.1186/s12970-017-0177-8",
    "pmid": "28642676",
    "journal": "Journal of the International Society of Sports Nutrition",
    "population": "Sağlıklı, egzersiz yapan bireyler (ISSN tutum bildirgesi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Direnç egzersizi ve protein alımı kas protein sentezini birlikte uyarır; protein egzersizden önce ya da sonra alındığında etki artar.\n- Kas kütlesini kazanmak ve korumak için egzersiz yapan çoğu kişide günde 1,4-2,0 g/kg protein yeterli.\n- Kalori açığındaki dönemlerde yağsız kütleyi korumak için daha yüksek alım (2,3-3,1 g/kg/gün) gerekebilir.\n- Öğün başına doz ve dağılım önerileri yaşa ve son egzersize göre değişiyor; dozların gün içine dağıtılması öneriliyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Günlük protein aralığının (1,2-2,0 g/kg, davis-2022) bağımsız bir tutum bildirgesiyle örtüştüğünün dayanağı (1,4-2,0).\n\n## Sınırlılıklar\n\n- Kas kütlesi odaklı; takım sporu toparlanmasına özgü değil.\n- Yalnız özet okundu."
  },
  {
    "id": "kalkhoven-2021",
    "title": "Training Load and Injury: Causal Pathways and Future Directions",
    "authors": [
      "Kalkhoven JT",
      "Watsford ML",
      "Coutts AJ",
      "Edwards WB",
      "Impellizzeri FM"
    ],
    "year": 2021,
    "type": "narrative-review",
    "doi": "10.1007/s40279-020-01413-6",
    "pmid": "33400216",
    "journal": "Sports medicine (Auckland, N.Z.)",
    "population": "Derleme; sporcularda yük ve sakatlık ilişkisi",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Yük ölçüleri sakatlığa iki yoldan bağlanabilir: mekanik yük-yanıt yolu ve psiko-fizyolojik yük-yanıt yolu.\n- Mevcut yük ölçüleri ile doku düzeyindeki mekanik yük arasında doğrulama yok; doku hasarını yük ölçülerinden tahmin etmek bu yüzden zayıf.\n- Seans RPE gibi iç yük ölçüleri sakatlık nedenselliğinden muhtemelen fazla uzaktır.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Derleme; yeni veri yok. Yazarlardan biri ACWR eleştirisinin de yazarı (impellizzeri-2020)."
  },
  {
    "id": "kerksick-2018",
    "title": "ISSN exercise & sports nutrition review update: research & recommendations",
    "authors": [
      "Kerksick CM",
      "Wilborn CD",
      "Roberts MD",
      "Smith-Ryan A",
      "Kleiner SM",
      "Jäger R",
      "Collins R",
      "Cooke M",
      "Davis JN",
      "Galvan E",
      "Greenwood M",
      "Lowery LM",
      "Wildman R",
      "Antonio J",
      "Kreider RB"
    ],
    "year": 2018,
    "type": "narrative-review",
    "doi": "10.1186/s12970-018-0242-y",
    "pmid": "30068354",
    "journal": "Journal of the International Society of Sports Nutrition",
    "population": "Egzersiz yapan bireyler ve sporcular (ISSN'nin derleme güncellemesi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Belirli bir performans hedefi olmadan genel fitness yapan biri karbonhidrat ihtiyacını normal bir beslenmeyle (yaklaşık 3-5 g/kg/gün) karşılayabilir.\n- Günde 2-3 saat yoğun antrenman yapan sporcunun karbonhidrat ihtiyacı yaklaşık 5-8 g/kg/gün.\n- Günde 3-6 saat, bir ya da iki seansta yoğun antrenman yapan sporcunun karbonhidrat ihtiyacı yaklaşık 8-10 g/kg/gün (metinde birim \"g/day\" yazılmış; bağlam ve verilen gram aralığı g/kg/gün olduğunu gösteriyor).\n- Protein için orta yoğun antrenmanda 1,2-2,0 g/kg/gün, yüksek hacimli yoğun antrenmanda 1,7-2,2 g/kg/gün; günün içine 3-4 saatte bir dağıtılması öneriliyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 3-5 | g/kg/gün karbonhidrat | Dinlenme günü (genel düzey) |\n| 8-10 | g/kg/gün karbonhidrat | Yoğun gün: maç ya da toplam 3 saat ve üstü seans |\n\n## Sınırlılıklar\n\n- Derneğin derleme güncellemesi (kanıt düzeyi 4); öneriler alıntılanan çalışmalara ve uzman görüşüne dayanıyor.\n- Dinlenme günü için doğrudan bir sayı vermiyor; 3-5 g/kg genel fitness için verilmiş, sporcunun dinlenme gününe aktarım bir varsayım.\n- Tam metin okundu (açık erişim)."
  },
  {
    "id": "lian-2005",
    "title": "Prevalence of jumper's knee among elite athletes from different sports: a cross-sectional study",
    "authors": [
      "Lian OB",
      "Engebretsen L",
      "Bahr R"
    ],
    "year": 2005,
    "type": "cross-sectional",
    "doi": "10.1177/0363546504270454",
    "pmid": "15722279",
    "journal": "The American journal of sports medicine",
    "population": "Norveç ulusal düzey elit sporcular, 9 spor, n=613 (basketbol: erkek)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Dokuz sporda patellar tendinopati (jumper's knee) yaygınlığı muayene ve anketle ölçüldü.\n- Yaygınlık sıçrama ve güç gerektiren sporlarda en yüksek: voleybolda yaklaşık yüzde 45, basketbolda yaklaşık yüzde 32; bisiklet ve oryantiringde vaka yok.\n- Sonuç, diz ekstansör mekanizmasına binen sıçrama yükünün patellar tendonla ilişkisini destekliyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Basketbolda patellar tendinopati yaygınlığı | ~%32 | elit erkek basketbolcular, kesitsel |\n\n## Sınırlılıklar\n\n- Kesitsel; yük ölçülmedi, ilişki spor türü üzerinden kuruluyor."
  },
  {
    "id": "lolli-2017",
    "title": "Mathematical coupling causes spurious correlation within the conventional acute-to-chronic workload ratio calculations",
    "authors": [
      "Lolli L",
      "Batterham AM",
      "Hawkins R",
      "Kelly DM",
      "Strudwick AJ",
      "Thorpe R",
      "Gregson W",
      "Atkinson G"
    ],
    "year": 2017,
    "type": "expert-opinion",
    "doi": "10.1136/bjsports-2017-098110",
    "pmid": "29101104",
    "journal": "British Journal of Sports Medicine",
    "population": "Yöntem yazısı (popülasyon yok)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Yaygın hesapta akut hafta, kronik ortalamanın içinde de yer alıyor (bağlı, \"coupled\" hesap). Pay ile payda aynı veriyi paylaştığı için ikisi arasında matematiksel bir bağ oluşuyor ve bu, gerçekte olmayan bir ilişki üretebiliyor.\n- Başlık ve yayın türü (başyazı) bu eleştiriyi özetliyor; PubMed'de özet yok.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı. Oranın HoopLab'de sakatlık tahmini olarak değil, yalnız bağlam olarak gösterilmesinin gerekçelerinden biri.\n\n## Sınırlılıklar\n\n- Kısa yöntem yazısı; tam metin okunmadı, içerik başlık ve sonraki atıflardan (impellizzeri-2020, ding-2026) çıkarıldı.\n- Çevrimiçi yayını 2017, basılı sayısı 2019."
  },
  {
    "id": "magnusson-2010",
    "title": "The pathogenesis of tendinopathy: balancing the response to loading",
    "authors": [
      "Magnusson SP",
      "Langberg H",
      "Kjaer M"
    ],
    "year": 2010,
    "type": "narrative-review",
    "doi": "10.1038/nrrheum.2010.43",
    "pmid": "20308995",
    "journal": "Nature reviews. Rheumatology",
    "population": "Derleme; insan ve hayvan tendon çalışmaları",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Mekanik yük tendonda kollajen yapımını artırır; bu artış egzersizden yaklaşık 24 saat sonra zirve yapar ve yaklaşık 3 gün yüksek kalır.\n- Kollajen yıkımı da artar ama yapımdan önce zirve yapar; yüklenmenin hemen ardından net denge geçici olarak yıkım yönündedir.\n- Tendon uyum sağlayabilse de tekrarlayan kullanım tendinopatiye yol açabilir.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Kollajen yapımı zirvesi | ~24 saat | egzersiz sonrası |\n| Kollajen yapımının yüksek kaldığı süre | ~3 gün | egzersiz sonrası |\n\n## Sınırlılıklar\n\n- Derleme; zaman çizelgesi sınırlı sayıda deneysel çalışmadan."
  },
  {
    "id": "manresa-rocamora-2021",
    "title": "Heart Rate Variability-Guided Training for Enhancing Cardiac-Vagal Modulation, Aerobic Fitness, and Endurance Performance: A Methodological Systematic Review with Meta-Analysis",
    "authors": [
      "Manresa-Rocamora A",
      "Sarabia JM",
      "Javaloyes A",
      "Flatt AA",
      "Moya-Ramón M"
    ],
    "year": 2021,
    "type": "meta-analysis",
    "doi": "10.3390/ijerph181910299",
    "pmid": "34639599",
    "journal": "International Journal of Environmental Research and Public Health",
    "population": "8 kontrollü çalışma; sedanter, fiziksel olarak aktif ve dayanıklılık sporcusu yetişkinler",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- HRV'ye göre yönlendirilen antrenman, önceden sabitlenmiş programa göre vagal HRV'yi daha çok artırdı; dinlenik nabızda fark yoktu. Aerobik kapasite ve performansta HRV yönlendirmesi lehine küçük ama anlamlı olmayan farklar bulundu.\n- Derleme yöntem odaklı: çalışmaların yarısı tek günlük HRV değerini hareketli bir referansla, diğer yarısı yuvarlanan ortalamayı (üçü 7 gün, biri 3 gün) sabit bir başlangıç döneminden hesaplanan referansla karşılaştırdı.\n- Yuvarlanan ortalama kullanan çalışmaların hepsi referansı 3-4 haftalık bir başlangıç döneminden hesapladı; üçü referansı müdahalenin ortasında bir kez güncelledi.\n- Referans sınırı üç çalışmada ortalama ± 0,5 SD (en küçük anlamlı değişim), üç çalışmada ortalama − 1 SD olarak tanımlandı. Yazarlar en iyi yöntemin (indeks, kayıt pozisyonu, referans) henüz belli olmadığını vurguluyor.\n- Gece (uyku sırasında) HRV ölçümü kullanan çalışma az; çoğu sabah ayakta veya yatarak kısa kayıt kullandı.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 7 günlük yuvarlanan ortalama | gün | HRV değeri; tek gece yerine (3 çalışma: Javaloyes 2019 ve 2020, Vesterinen 2016) |\n| Başlangıç dönemi 3-4 hafta | hafta | Kişisel referansın hesaplandığı dönem |\n| Bant = ortalama ± 0,5 SD | SD | Aynı üç çalışmada en küçük anlamlı değişim; bant dışı \"olağan değil\" |\n\n## Sınırlılıklar\n\n- Çalışmalar dayanıklılık sporlarından; takım sporu veya basketbol yok. Yöntem basketbola aktarılıyor (kural notunda belirtildi).\n- Örneklemler küçük, protokoller farklı. Yazarlardan biri HRV ürünlerinden bir kerelik ücret almış.\n- Açık erişimli tam metin okundu (PMC8507742)."
  },
  {
    "id": "maupin-2020",
    "title": "The Relationship Between Acute: Chronic Workload Ratios and Injury Risk in Sports: A Systematic Review",
    "authors": [
      "Maupin D",
      "Schram B",
      "Canetti E",
      "Orr R"
    ],
    "year": 2020,
    "type": "systematic-review",
    "doi": "10.2147/OAJSM.S231405",
    "pmid": "32158285",
    "journal": "Open Access Journal of Sports Medicine",
    "population": "Akut / kronik oran ve sakatlık çalışmaları; 27 çalışma, çeşitli sporlar",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Çalışmalar arasında büyük fark var: farklı yük ölçüleri, farklı \"yüksek oran\" tanımları (ör. 1,50-1,80 ya da 1,50 ve üstü) ve farklı karşılaştırma grupları.\n- Yine de oranın hem iç hem dış yük için sakatlık riskiyle ilişkili olabileceği, en düşük riskin yaklaşık 0,80-1,30 aralığında göründüğü ve EWMA'nın daha duyarlı olabileceği sonucuna varıyor.\n- Yöntemin güvenle kullanılmasından önce çözülmesi gereken sorunlar olduğunu kabul ediyor.\n- En yaygın pencere 1 haftalık akut, 4 haftalık kronik yük.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 1,5 | oran | Çalışmaların \"yüksek oran\" alt sınırı olarak en sık kullandığı değer; \"belirgin artış\" notunun eşiği |\n\n## Sınırlılıklar\n\n- Dahil edilen çalışmaların kalite puanları orta (yüzde 48-64).\n- Açık erişimli tam metnin ilgili bölümleri okundu (PMC7047972)."
  },
  {
    "id": "mcdermott-2017",
    "title": "National Athletic Trainers' Association Position Statement: Fluid Replacement for the Physically Active",
    "authors": [
      "McDermott BP",
      "Anderson SA",
      "Armstrong LE",
      "Casa DJ",
      "Cheuvront SN",
      "Cooper L",
      "Kenney WL",
      "O'Connor FG",
      "Roberts WO"
    ],
    "year": 2017,
    "type": "position-stand",
    "doi": "10.4085/1062-6050-52.9.02",
    "pmid": "28985128",
    "journal": "Journal of Athletic Training",
    "population": "Fiziksel aktivite yapan bireyler ve sporcular (NATA tutum bildirgesi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Ter kaybı = egzersiz öncesi kilo − egzersiz sonrası kilo + egzersizde içilen sıvı − (varsa) idrar; ter oranı bunun egzersiz süresine bölümü (L/saat).\n- Egzersiz sonunda vücut ağırlığı kaybı %2'nin altında tutulmalı (öneri gücü A); en iyi performans için ±%1 aralığı öneriliyor (B).\n- Egzersiz sırasında kilo artmamalı; fazla içmek fizyolojik ya da performans yararı sağlamaz ve hiponatremiye yol açabilir (A).\n- 4 saatten kısa toparlanmada kaybın %100-150'si kadar sıvı alınması gerekebilir. Ter oranını bilmeyen biri için egzersiz sırasında susadıkça içmek, fazla içmeyi önleyen güvenli bir yol.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Ter kaybı formülü (idrar dahil, girilmezse 0) | L | Ter testi |\n| %2 | vücut ağırlığı | Kayıp notu |\n| Kilo artışı > 0 | kg | Fazla içme notu (hiponatremi riski; tanı değil) |\n| %100-150 | kayıp | Sonraki seansa 4 saatten az varsa sıvı hedefi |\n\n## Sınırlılıklar\n\n- Genel aktif bireyler için; basketbola özgü değil (bkz. baker-2007, osterberg-2009).\n- Tam metin okundu (PMC)."
  },
  {
    "id": "mclean-2010",
    "title": "Neuromuscular, endocrine, and perceptual fatigue responses during different length between-match microcycles in professional rugby league players",
    "authors": [
      "McLean BD",
      "Coutts AJ",
      "Kelly V",
      "McGuigan MR",
      "Cormack SJ"
    ],
    "year": 2010,
    "type": "cohort",
    "doi": "10.1123/ijspp.5.3.367",
    "pmid": "20861526",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "Profesyonel rugby ligi oyuncuları (erkek), n=12, aynı takım",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Maçlar arası 5, 7 ve 9 günlük döngülerde sıçrama performansı, algılanan yorgunluk, genel iyi oluş ve kas ağrısı izlendi; antrenman yükü seans RPE yöntemiyle ölçüldü.\n- Maçtan sonraki 48 saatte sıçrama değerleri, yorgunluk algısı, iyi oluş ve kas ağrısı belirgin biçimde kötüleşti.\n- Sıçrama değişkenlerinin çoğu yaklaşık 4 günde başlangıç düzeyine döndü; uygun antrenmanla algısal ölçümlerin de 4 gün içinde toparlanabildiği görüldü.\n- Öznel iyi oluş maddeleri maç yüküne günler içinde tepki veriyor; yani günlük takipte anlamlı sinyal taşıyor.\n\n## Uygulamada kullanılan sayılar\n\nBu çalışmadan doğrudan sayı alınmadı (ölçek aralığı `zhang-2026`'dan). \"Maçtan sonra yaklaşık 48 saat bozulma, yaklaşık 4 günde toparlanma\" gözlemi Faz 2'deki toparlanma yorumları için aday; kural yazılmadan önce tam metin ve basketbol kaynaklarıyla karşılaştırılacak.\n\n## Sınırlılıklar\n\n- Rugby ligi (temaslı); basketbolun yük profili farklı.\n- Küçük örneklem (n=12), tek takım.\n- Yalnız özet okundu."
  },
  {
    "id": "miller-2005",
    "title": "Coordinated collagen and muscle protein synthesis in human patella tendon and quadriceps muscle after exercise",
    "authors": [
      "Miller BF",
      "Olesen JL",
      "Hansen M",
      "Døssing S",
      "Crameri RM",
      "Welling RJ",
      "Langberg H",
      "Flyvbjerg A",
      "Kjaer M",
      "Babraj JA",
      "Smith K",
      "Rennie MJ"
    ],
    "year": 2005,
    "type": "cohort",
    "doi": "10.1113/jphysiol.2005.093690",
    "pmid": "16002437",
    "journal": "The Journal of physiology",
    "population": "Sağlıklı genç erkekler, n=14 (8 + 6); 1 saatlik tek bacak diz ekstansiyonu egzersizi",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Ağır ama hasar yapmayan bir egzersizden sonra patellar tendonda ve quadricepste kollajen ve kas proteini yapımı 6. saatte artmış, 24. saatte zirve yapmış.\n- Yapım hızları 72. saate doğru başlangıca yaklaşmış; tendon kollajeni ve kas lif proteini yapımı 72. saatte hala yüksek kalmış.\n- Kas ve tendonda benzer zaman seyri, kas-tendon biriminin birlikte uyum sağladığını düşündürüyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Yapım zirvesi | 24 saat | tendon ve kas, egzersiz sonrası |\n| Gözlem süresi | 72 saat | tendon kollajeni hala yüksek |\n\n## Sınırlılıklar\n\n- Küçük örneklem, sporcu değil; laboratuvar egzersizi (basketbol değil). Randomize değil: egzersiz yapan ve dinlenen bacak karşılaştırması."
  },
  {
    "id": "miller-2020",
    "title": "Analyzing changes in respiratory rate to predict the risk of COVID-19 infection",
    "authors": [
      "Miller DJ",
      "Capodilupo JV",
      "Lastella M",
      "Sargent C",
      "Roach GD",
      "Lee VH",
      "Capodilupo ER"
    ],
    "year": 2020,
    "type": "cohort",
    "doi": "10.1371/journal.pone.0243693",
    "pmid": "33301493",
    "journal": "PLoS ONE",
    "population": "COVID-19 benzeri belirtileri olan 271 yetişkin WHOOP kullanıcısı (81 test pozitif, 190 negatif)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Bileklikten ölçülen gece uykusundaki solunum hızının kişinin kendi olağanından sapması, enfeksiyonun erken işareti olarak modellendi.\n- Model, testi pozitif olanların bir kısmını belirtilerden önceki iki günde, çoğunu belirtilerin üçüncü gününe kadar yakaladı; benzer belirtileri olan negatif kişilere karşı da sınandı.\n- Gece solunumunun kişi içindeki değişimi küçük olduğu için olağandan sapma anlamlı bir sinyal olabiliyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Kaynak, gece solunumunun kişinin kendi geçmişiyle kıyaslanmasının ve tek gecelik belirgin artışın ayrıca söylenmesinin dayanaklarından biri.\n\n## Sınırlılıklar\n\n- Üç yazar WHOOP çalışanı veya hissedarı; ilk yazarın pozisyonu WHOOP destekli.\n- COVID-19'a özgü; başka enfeksiyonlar, sıcak, alkol veya yükseklik gibi etkenler ayrıca incelenmedi.\n- Yalnız özet okundu."
  },
  {
    "id": "morello-2025",
    "title": "Reliability and Validity of Nutrient Assessment Applications for Canadian Endurance Athletes: MyFitnessPal and Cronometer",
    "authors": [
      "Morello O",
      "McPhee L",
      "Kucab M",
      "Bellissimo N",
      "Totosy de Zepetnek JO"
    ],
    "year": 2025,
    "type": "cross-sectional",
    "doi": "10.1111/jhn.70148",
    "pmid": "41133373",
    "journal": "Journal of Human Nutrition and Dietetics",
    "population": "Kanadalı dayanıklılık sporcuları (43 adet 3 günlük besin kaydı); basketbol değil",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Aynı besin kayıtları iki uygulamaya iki ayrı kişi tarafından girildi ve referans bir veritabanıyla karşılaştırıldı.\n- Kullanıcıların eklediği, doğrulanmamış kayıtların çok olduğu uygulamada (MyFitnessPal) enerji, karbonhidrat ve protein geçerliliği zayıftı.\n- Doğrulanmış veritabanına dayanan uygulamada (Cronometer) karbonhidrat ve protein dahil çoğu besin ögesinde geçerlilik iyiydi, girenler arası tutarlılık yüksekti.\n\n## Uygulamada kullanılan sayılar\n\nSayı kullanılmıyor. Besin listesinin tek, belgeli bir veritabanından (FDC) gelmesi ve serbest besin girişi yerine sabit liste verilmesi bu bulguya dayanıyor (karar 0030).\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| — | — | — |\n\n## Sınırlılıklar\n\n- Gözlemsel; kayıtlar uygulamaya araştırmacılar tarafından girildi (sporcunun kendi kullanımı değil).\n- Yalnız özet okundu."
  },
  {
    "id": "morton-2018",
    "title": "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
    "authors": [
      "Morton RW",
      "Murphy KT",
      "McKellar SR",
      "Schoenfeld BJ",
      "Henselmans M",
      "Helms E",
      "Aragon AA",
      "Devries MC",
      "Banfield L",
      "Krieger JW",
      "Phillips SM"
    ],
    "year": 2018,
    "type": "meta-analysis",
    "doi": "10.1136/bjsports-2017-097608",
    "pmid": "28698222",
    "journal": "British Journal of Sports Medicine",
    "population": "Direnç antrenmanı yapan sağlıklı yetişkinler; 49 randomize çalışma",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Direnç antrenmanı sırasında protein takviyesi kas kütlesi ve kuvvet kazanımını küçük ama anlamlı ölçüde artırdı.\n- Günlük toplam protein yaklaşık 1,6 g/kg'ı geçtikten sonra yağsız kütle kazanımında ek artış görülmedi (kırılma noktası 1,62 g/kg/gün; güven aralığı geniş, 1,03-2,20).\n- Etki yaşla azalıyor, antrenmanlı kişilerde daha belirgin.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| ≈ 1,6 | g/kg/gün protein | Açıklama metni: aralığın ortası; üstü ek kas kazanımı getirmedi (tavan değil) |\n\n## Sınırlılıklar\n\n- Direnç antrenmanı ve kas kütlesi odaklı; basketbol toparlanmasına özgü değil.\n- Kırılma noktasının güven aralığı geniş; bir alt sınır ya da tavan olarak değil, rehber olarak okunur.\n- Tam metin okundu (açık erişim)."
  },
  {
    "id": "mountjoy-2023",
    "title": "2023 International Olympic Committee's (IOC) consensus statement on Relative Energy Deficiency in Sport (REDs)",
    "authors": [
      "Mountjoy M",
      "Ackerman KE",
      "Bailey DM",
      "Burke LM",
      "Constantini N",
      "Hackney AC",
      "Heikura IA",
      "Melin A",
      "Pensgaard AM",
      "Stellingwerff T",
      "Sundgot-Borgen JK",
      "Torstveit MK",
      "Jacobsen AU",
      "Verhagen E",
      "Budgett R",
      "Engebretsen L",
      "Erdener U"
    ],
    "year": 2023,
    "type": "consensus",
    "doi": "10.1136/bjsports-2023-106994",
    "pmid": "37752011",
    "journal": "British Journal of Sports Medicine",
    "population": "Kadın ve erkek sporcular (IOC uzman paneli)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- REDs, düşük enerji yeterliliğine (egzersiz harcamasına göre yetersiz enerji alımı) maruz kalan kadın ve erkek sporcularda görülen sağlık ve performans sonuçlarının toplamı.\n- 2018'den bu yana düşük karbonhidrat alımının rolü, ruh sağlığıyla etkileşim ve erkeklerdeki etkiler üzerine kanıt arttı.\n- Tanı ve risk sınıflaması için klinik bir değerlendirme aracı (REDs CAT2) tanıtılıyor; tanı klinisyen işidir.\n- Vücut kompozisyonu ölçümünün güvenli yapılması ve önleme / tedavi ilkeleri ayrıca ele alınıyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. HoopLab enerji yeterliliğini hesaplamaz (kalori ve yağsız kütle yok); kaynak, uyarı yerine bilgilendirme ve sağlık ekibine yönlendirmenin dayanağı (karar 0029).\n\n## Sınırlılıklar\n\n- Tam metne erişilemedi (yayıncı sayfası otomatik erişime kapalı); yalnız özet okundu. Eşik değerleri bu yüzden kullanılmadı.\n- 2024'te bir düzeltme yayımlandı."
  },
  {
    "id": "murray-2017",
    "title": "Calculating acute:chronic workload ratios using exponentially weighted moving averages provides a more sensitive indicator of injury likelihood than rolling averages",
    "authors": [
      "Murray NB",
      "Gabbett TJ",
      "Townshend AD",
      "Blanch P"
    ],
    "year": 2017,
    "type": "cohort",
    "doi": "10.1136/bjsports-2016-097152",
    "pmid": "28003238",
    "journal": "British Journal of Sports Medicine",
    "population": "Elit Avustralya futbolu oyuncuları, tek kulüp, n=59, 2 yıl; GPS dış yükü",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Aynı veride akut / kronik oran iki yolla hesaplandı: kayan ortalama ve üstel ağırlıklı ortalama (EWMA). İki yöntemin oranları özellikle orta ve yüksek aralıklarda belirgin biçimde ayrıştı.\n- İki yöntemde de çok yüksek oran (2'nin üstü) temassız sakatlık riskindeki artışla ilişkiliydi; EWMA bu artışı daha duyarlı yakaladı ve sakatlıktaki değişkenliğin daha fazlasını açıkladı.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan eşik alınmadı. EWMA'nın kayan ortalamaya tercih edilmesinin dayanağı.\n\n## Sınırlılıklar\n\n- Tek kulüp, başka spor, dış yük (GPS); HoopLab iç yük (seans RPE) kullanıyor.\n- Oranla ilgili genel yöntem eleştirileri bu çalışma için de geçerli (impellizzeri-2021).\n- Yalnız özet okundu."
  },
  {
    "id": "natarajan-2021",
    "title": "Measurement of respiratory rate using wearable devices and applications to COVID-19 detection",
    "authors": [
      "Natarajan A",
      "Su HW",
      "Heneghan C",
      "Blunt L",
      "O'Connor C",
      "Niehaus L"
    ],
    "year": 2021,
    "type": "cross-sectional",
    "doi": "10.1038/s41746-021-00493-6",
    "pmid": "34526602",
    "journal": "npj Digital Medicine",
    "population": "Fitbit kullanıcıları (sağlıklı yetişkinler, büyük örneklem); doğrulama için uyku laboratuvarı kayıtları; COVID-19 tanılı semptomlu ve semptomsuz kullanıcılar",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Fitbit, solunum hızını uykudaki kalp atımı aralıklarından (solunumun nabzı dalgalandırmasından) hesaplıyor; uyku laboratuvarı ölçümüyle ortalama mutlak hata yaklaşık 0,5 nefes/dk.\n- Sağlıklı yetişkinlerde gece solunum hızının ortalaması yaklaşık 15 nefes/dk; kişiler arası fark büyük (yaş, cinsiyet, beden kitle indeksi ve gece nabzıyla değişiyor). Bu yüzden popülasyon aralığı kişisel değerlendirmeye uygun değil.\n- Kişi içinde ise çok kararlı: 20-24 yaşta 14 günlük değişim katsayısının %90 aralığı yaklaşık %2-9,5 (60 yaş altında ortalama %4-6).\n- COVID-19'da gece solunumu sık sık yükseliyor: belirtilerin başladığı günün çevresindeki bir haftada semptomlu kişilerin yaklaşık üçte birinde en az bir gece olağan değerin 3 nefes/dk üstünde ölçüm görüldü. Tam metindeki ikinci analiz kişinin kendi ortalaması ve SD'sine göre z-skoru kullanıyor (referans, belirtilerden 30-90 gün önceki dönem).\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Kişi içi kararlılık (14 günde CV %2-9,5, 20-24 yaş) | % | Kişisel bant yaklaşımının dayanağı; popülasyon aralığı kullanılmaz |\n| Olağanın 3 nefes/dk üstü | nefes/dk | Tek gece notu: son gece kişisel 4 haftalık ortalamanın bu kadar üstündeyse (tanı değil) |\n\n## Sınırlılıklar\n\n- Yazarların hepsi Fitbit çalışanı; çalışma Fitbit tarafından finanse edildi.\n- Popülasyon sporcu değil. Hastalık analizi COVID-19'a özgü; 3 nefes/dk tanımlayıcı bir sayı, doğrulanmış bir uyarı eşiği değil ve özgüllüğü (yanlış alarm oranı) verilmedi.\n- HoopLab'in kullandığı Google Health solunum değeri bu algoritmanın ürün sürümü olabilir, ama sürüm farkı bilinmiyor."
  },
  {
    "id": "nicolo-2020",
    "title": "The Importance of Respiratory Rate Monitoring: From Healthcare to Sport and Exercise",
    "authors": [
      "Nicolò A",
      "Massaroni C",
      "Schena E",
      "Sacchetti M"
    ],
    "year": 2020,
    "type": "narrative-review",
    "doi": "10.3390/s20216396",
    "pmid": "33182463",
    "journal": "Sensors",
    "population": "Sağlık, iş ve spor alanlarında solunum hızı izleme üzerine literatür (derleme)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Solunum hızı temel bir yaşamsal bulgu; hastalıkların yanı sıra duygusal stres, bilişsel yük, sıcak, soğuk, fiziksel efor ve egzersize bağlı yorgunluk gibi pek çok etkene duyarlı.\n- Bu etkenlere duyarlılığı diğer yaşamsal bulguların çoğundan yüksek, ama sporda hala rutin izlenmiyor.\n- Derleme, sporda ve sağlıkta solunum izlemenin amaçlarını ve uygun ölçüm yöntemlerini topluyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Kaynak, solunumdaki bir artışın tek bir nedene (ör. hastalık) bağlanamayacağının dayanağı: not, olası nedenleri sayar ve tanı koymaz.\n\n## Sınırlılıklar\n\n- Anlatı derlemesi (kanıt düzeyi 4); sistematik bir tarama değil.\n- Gece bileklik ölçümüne özgü değil; çoğunlukla egzersiz sırasındaki solunumu ele alıyor.\n- Yalnız özet okundu."
  },
  {
    "id": "osterberg-2009",
    "title": "Pregame urine specific gravity and fluid intake by National Basketball Association players during competition",
    "authors": [
      "Osterberg KL",
      "Horswill CA",
      "Baker LB"
    ],
    "year": 2009,
    "type": "cross-sectional",
    "doi": "10.4085/1062-6050-44.1.53",
    "pmid": "19180219",
    "journal": "Journal of Athletic Training",
    "population": "NBA Yaz Ligi oyuncuları, 5 takım, n=29; her biri iki maçta",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Maç öncesi ve sonrası tartıyla ölçülen ter kaybı maç başına 1,0 ile 4,6 L arasındaydı (ortalama yaklaşık 2,2 L); yaklaşık 20 dakika oynayan oyuncularda 2 L'yi aştı.\n- Maç sırasında içilen sıvı ortalama yaklaşık 1 L'ydi; kaybın ancak yarısı kadar.\n- Oyuncuların yaklaşık yarısı maça idrar yoğunluğuna göre sıvı açığıyla başladı ve maç içindeki içme bunu kapatmadı.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Basketbolda ter kaybının kişiden kişiye ve maçtan maça çok değiştiğinin, bu yüzden kişisel ter testinin dayanağı.\n\n## Sınırlılıklar\n\n- Yaz Ligi; normal sezon maçlarından farklı olabilir. Yazarlar Gatorade Sports Science Institute çalışanı.\n- Yalnız özet okundu."
  },
  {
    "id": "panagiotakis-2017",
    "title": "Biomechanical analysis of ankle ligamentous sprain injury cases from televised basketball games: Understanding when, how and why ligament failure occurs",
    "authors": [
      "Panagiotakis E",
      "Mok KM",
      "Fong DT",
      "Bull AMJ"
    ],
    "year": 2017,
    "type": "cross-sectional",
    "doi": "10.1016/j.jsams.2017.05.006",
    "pmid": "28587794",
    "journal": "Journal of science and medicine in sport",
    "population": "NBA maçlarında 4 ayak bileği burkulması vakası (televizyon görüntüsü, model tabanlı görüntü eşleme)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Basketbolda ayak bileği burkulmaları sık olarak rakibin ayağına basarak inişte oluyor.\n- Ani içe dönme bağlarda yüksek gerinim yaratıyor; mekanizma birikmiş yükten çok anlık travma.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Dört vaka; yalnız mekanizma tanımı."
  },
  {
    "id": "plews-2013",
    "title": "Training Adaptation and Heart Rate Variability in Elite Endurance Athletes: Opening the Door to Effective Monitoring",
    "authors": [
      "Plews DJ",
      "Laursen PB",
      "Stanley J",
      "Kilding AE",
      "Buchheit M"
    ],
    "year": 2013,
    "type": "narrative-review",
    "doi": "10.1007/s40279-013-0071-8",
    "pmid": "23852425",
    "journal": "Sports Medicine",
    "population": "Elit dayanıklılık sporcuları (derleme ve olimpik sporcu örnekleri)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- HRV düşüşü olumsuz, artışı olumlu uyum diye okunur; ama elit sporcularda iki yön de olumsuz uyumla birlikte görülebiliyor.\n- Günlük HRV gürültülüdür; tek gün yerine ortalama (yuvarlanan ortalama) kullanılmalı.\n- \"Doyum\" (saturation): çok yüksek vagal aktivitede nabız düşerken HRV de düşebilir; bu yorgunluk değildir. Bu yüzden HRV nabızla birlikte okunur.\n- Her sporcunun kendine özgü bir HRV deseni vardır; anlamlı yorum uzun süreli kişisel izlemeyle mümkün.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Ortalama ile okuma, tek gece değil | ilke | \"Bu gece HRV\" ekranda \"tek gece\" diye etiketlenir; durum 7 günlük ortalamadan |\n| HRV düşüşü nabızla birlikte okunur | ilke | En ağır durum yalnız HRV düşük ve dinlenik nabız yüksekken |\n\n## Sınırlılıklar\n\n- Anlatı derlemesi (kanıt düzeyi 4); örnekler az sayıda elit dayanıklılık sporcusundan. Basketbol yok.\n- Yalnız özet okundu."
  },
  {
    "id": "plews-2014",
    "title": "Monitoring Training With Heart-Rate Variability: How Much Compliance Is Needed for Valid Assessment?",
    "authors": [
      "Plews DJ",
      "Laursen PB",
      "Le Meur Y",
      "Hausswirth C",
      "Kilding AE",
      "Buchheit M"
    ],
    "year": 2014,
    "type": "cohort",
    "doi": "10.1123/ijspp.2013-0455",
    "pmid": "24334285",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "Antrenmanlı triatlonlular (normal antrenman, fonksiyonel aşırı yüklenme, toparlanma dönemleri)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Haftalık ln rMSSD ortalaması haftanın 1 ila 7 rastgele gününden hesaplandığında ne kadar bilgi kaybedildiği karşılaştırıldı.\n- Aşırı yüklenmeyi yakalama gücü ve performansla ilişki 3-4 günden sonra neredeyse değişmiyor; 1-2 günlük ortalama zayıf kalıyor.\n- Öneri: haftalık değerlendirme için en az 3 geçerli ölçüm.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Haftada en az 3 geçerli ölçüm | gün / 7 gün | 7 günlük ortalama ancak bu kadar değer varsa hesaplanır; 4 haftalık başlangıç bandı için en az 12 |\n\n## Sınırlılıklar\n\n- Triatlonlular, sabah ölçümü. Sayı basketbolcuya ve gece bileklik ölçümüne aktarılıyor.\n- Yalnız özet okundu."
  },
  {
    "id": "ren-2024",
    "title": "Assessing pre-season workload variation in professional rugby union players by comparing three acute:Chronic workload ratio models based on playing positions",
    "authors": [
      "Ren X",
      "Boisbluche S",
      "Philippe K",
      "Demy M",
      "Hu X",
      "Ding S",
      "Prioux J"
    ],
    "year": 2024,
    "type": "cohort",
    "doi": "10.1016/j.heliyon.2024.e37176",
    "pmid": "39286196",
    "journal": "Heliyon",
    "population": "Profesyonel ragbi birliği oyuncuları, sezon öncesi; GPS dış yükü",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Sezon öncesinde oyuncu mevkilerine göre üç farklı akut / kronik oran modelini (kayan ortalama ve EWMA türevleri) karşılaştırıyor; modeller aynı veriden farklı oranlar üretiyor.\n- Yöntem bölümünde EWMA'yı williams-2017'ye atıfla açıkça yazıyor: bugünkü EWMA = bugünkü yük × λ + (1 − λ) × dünkü EWMA, λ = 2 / (N + 1), akut için N = 7, kronik için N = 28.\n\n## Uygulamada kullanılan sayılar\n\nBu kaynak yalnız williams-2017'deki formülün ve N değerlerinin açık erişimli doğrulamasıdır; kendi bulguları kullanılmıyor.\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| λ = 2 / (N + 1); N = 7 ve 28 | gün | EWMA akut ve kronik yük |\n\n## Sınırlılıklar\n\n- Başka spor, dış yük, sezon öncesi.\n- Açık erişimli tam metnin yöntem bölümü okundu (PMC11402767)."
  },
  {
    "id": "renteria-2024",
    "title": "Early Detection of COVID-19 in Female Athletes Using Wearable Technology",
    "authors": [
      "Rentería LI",
      "Greenwalt CE",
      "Johnson S",
      "Kviatkovsky SA",
      "Dupuit M",
      "Angeles E",
      "Narayanan S",
      "Zeleny T",
      "Ormsbee MJ"
    ],
    "year": 2024,
    "type": "cohort",
    "doi": "10.1177/19417381231183709",
    "pmid": "37401442",
    "journal": "Sports Health",
    "population": "NCAA Division I kadın sporcular; COVID-19 pozitif 33 sporcudan yeterli verisi olan 14'ü (WHOOP, 2020-2021 sezonu)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Sporcuların yaklaşık iki haftalık enfeksiyonsuz günleri kişisel başlangıç düzeyi olarak alındı; pozitif testten önceki günler bununla karşılaştırıldı.\n- Gece solunum hızı pozitif testten üç gün önce yükselmeye başladı; dinlenik nabız yükselmesi ve HRV düşüşü testten bir gün önce görüldü.\n- Bileklik verisinin, takım sağlığını izleyen çok yönlü bir yaklaşımın parçası olarak kullanılabileceği sonucuna varıldı.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Sporcularda da gece solunumunun kişisel başlangıç düzeyine göre okunmasının ve diğer ölçümlerden önce değişebileceğinin dayanağı.\n\n## Sınırlılıklar\n\n- Çok küçük örneklem (n=14), yalnız kadın sporcular, tek takım ve tek hastalık.\n- Grup ortalaması düzeyinde anlamlılık; kişi düzeyinde doğruluk verilmedi.\n- Yalnız özet okundu."
  },
  {
    "id": "saw-2016",
    "title": "Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review",
    "authors": [
      "Saw AE",
      "Main LC",
      "Gastin PB"
    ],
    "year": 2016,
    "type": "systematic-review",
    "doi": "10.1136/bjsports-2015-094758",
    "pmid": "26423706",
    "journal": "British Journal of Sports Medicine",
    "population": "56 özgün çalışma; çeşitli sporlardan sporcular",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Öznel (sporcunun kendi bildirdiği) ve nesnel (kan, nabız vb.) iyi oluş ölçümleri genellikle birbiriyle örtüşmüyor.\n- Öznel ölçümler akut ve kronik antrenman yükündeki değişime nesnel ölçümlerden daha duyarlı ve tutarlı tepki verdi: yük artınca iyi oluş bozuldu, yük azalınca düzeldi.\n- Öznel ölçümler tek başına ya da karma bir izleme sisteminin parçası olarak kullanılabilir.\n- Tam metindeki uygulama notu: puanların anlamlı okunması için sporcunun kendi tekrarlı ölçümlerinden bir başlangıç düzeyi (baseline) gerekir. Sporcu programları çoğunlukla yerleşik ölçeklerden seçilmiş birkaç maddelik kısa, kendi ölçeklerini kullanır; az madde, ölçümün sürdürülebilirliği için önemlidir.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Kişisel baseline'a göre okuma | ilke | Check-in puanları popülasyon eşiğiyle değil, sporcunun kendi geçmişiyle kıyaslanır (Faz 2, `packages/engine`). |\n\n## Sınırlılıklar\n\n- Derlemedeki çalışmalar farklı ölçekler ve sporlar kullanıyor; tek bir ölçek önermiyor.\n- 2014'e kadarki literatür.\n- Açık erişimli tam metin okundu (PMC4789708)."
  },
  {
    "id": "sawka-2007",
    "title": "American College of Sports Medicine position stand. Exercise and fluid replacement",
    "authors": [
      "Sawka MN",
      "Burke LM",
      "Eichner ER",
      "Maughan RJ",
      "Montain SJ",
      "Stachenfeld NS"
    ],
    "year": 2007,
    "type": "position-stand",
    "doi": "10.1249/mss.0b013e31802ca597",
    "pmid": "17277604",
    "journal": "Medicine and Science in Sports and Exercise",
    "population": "Fiziksel aktivite yapan bireyler ve sporcular (ACSM tutum bildirgesi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Egzersiz sırasında içmenin amacı, su kaybına bağlı vücut ağırlığı kaybının %2'yi geçmesini ve elektrolit dengesinin aşırı bozulmasını önlemek; bu düzeyin üstünde performans bozulabilir.\n- Ter oranı ve terdeki elektrolit kişiden kişiye çok değiştiği için kişiye göre bir sıvı planı öneriliyor.\n- Kişisel ter oranı egzersiz öncesi ve sonrası tartıyla tahmin edilebilir.\n- Egzersizden sonra amaç sıvı ve elektrolit açığını kapatmak; ne kadar hızlı gerektiği sonraki seansa kalan süreye bağlı.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| %2 | vücut ağırlığı | Ter testinde seans boyunca kayıp bunu aşarsa not |\n\n## Sınırlılıklar\n\n- 2007 tarihli; güncel NATA bildirgesi (mcdermott-2017) aynı sınırı koruyor.\n- Yalnız özet okundu."
  },
  {
    "id": "seidler-2025",
    "title": "One-Year Follow-Up of Clinical and Morphological Outcomes in Elite Athletes With Early-Stage Lower Extremity Tendinopathy",
    "authors": [
      "Seidler M",
      "Svensson RB",
      "Meulengracht C",
      "Christensen KØ",
      "Brushøj C",
      "Kracht M",
      "Hjortshoej MH",
      "Magnusson SP",
      "Bahr R",
      "Kjær M",
      "Couppé C"
    ],
    "year": 2025,
    "type": "cohort",
    "doi": "10.1002/ejsc.12303",
    "pmid": "40261829",
    "journal": "European journal of sport science",
    "population": "Erken evre Aşil veya patellar tendinopatili elit sporcular, n=62, 24 ± 5 yaş",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Erken evre tendinopatili elit sporcular bir yıl izlendi; tek müdahale ağrıya göre etkinlik ayarıydı.\n- Tam metne göre sporculara ağrı izleme modeli verildi: 0-10 ölçekte antrenman sırası ve sonrası ağrı 5'e kadar çıkabilir, ama ertesi sabah azalmış olmalı.\n- Bir yılda işlev ve ağrı puanları belirgin düzeldi.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Antrenman sırası / sonrası ağrı sınırı | NRS 5 | 0-10 sayısal ölçek |\n| Ertesi sabah | azalmış olmalı |  |\n\n## Sınırlılıklar\n\n- Kontrol grubu yok; tendinopatisi olan sporcular. HoopLab yalnız sabah ağrısını kaydettiği için model sabah değerine uyarlanır. Tam metin (açık erişim) okundu."
  },
  {
    "id": "serner-2019",
    "title": "Mechanisms of acute adductor longus injuries in male football players: a systematic visual video analysis",
    "authors": [
      "Serner A",
      "Mosler AB",
      "Tol JL",
      "Bahr R",
      "Weir A"
    ],
    "year": 2019,
    "type": "cross-sectional",
    "doi": "10.1136/bjsports-2018-099246",
    "pmid": "30006458",
    "journal": "British journal of sports medicine",
    "population": "Profesyonel erkek futbolcular, n=17 akut adduktor longus yaralanması (video analizi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Akut adduktor longus yaralanmalarının çoğu temassız ve oyundaki ani bir değişikliğe hızlı tepki sırasında oldu.\n- Yaralanma anındaki hareketler: yön değiştirme (yüzde 35), şut (yüzde 29), uzanma (yüzde 24), sıçrama (yüzde 12).\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Futbol, küçük örneklem; basketbola aktarım varsayım."
  },
  {
    "id": "silbernagel-2007",
    "title": "Continued sports activity, using a pain-monitoring model, during rehabilitation in patients with Achilles tendinopathy: a randomized controlled study",
    "authors": [
      "Silbernagel KG",
      "Thomeé R",
      "Eriksson BI",
      "Karlsson J"
    ],
    "year": 2007,
    "type": "rct",
    "doi": "10.1177/0363546506298279",
    "pmid": "17307888",
    "journal": "The American journal of sports medicine",
    "population": "Aşil tendinopatili hastalar, n=38",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Aşil tendinopatisinde koşu ve sıçramaya ağrı izleme modeliyle devam eden grup ile 6 hafta aktif dinlenen grup karşılaştırıldı.\n- İki grup da 12 ayda belirgin düzeldi; devam eden grupta olumsuz etki görülmedi.\n- Aşil tendinopatisi koşu ve sıçrama içeren sporlarda sık görülen bir aşırı kullanım yaralanması.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Ağrı izleme modeli | NRS ≤ 5 | etkinlik sırası ve sonrası; ertesi sabah azalmış olmalı (ayrıntı seidler-2025 tam metninden) |\n\n## Sınırlılıklar\n\n- Hasta grubu, sağlıklı sporcu değil; yalnız özet okundu. Modelin sayısal ayrıntısı açık erişimli seidler-2025 tam metninden doğrulandı."
  },
  {
    "id": "soligard-2016",
    "title": "How much is too much? (Part 1) International Olympic Committee consensus statement on load in sport and risk of injury",
    "authors": [
      "Soligard T",
      "Schwellnus M",
      "Alonso JM",
      "Bahr R",
      "Clarsen B",
      "Dijkstra HP",
      "Gabbett T",
      "Gleeson M",
      "Hägglund M",
      "Hutchinson MR",
      "Janse van Rensburg C",
      "Khan KM",
      "Meeusen R",
      "Orchard JW",
      "Pluim BM",
      "Raftery M",
      "Budgett R",
      "Engebretsen L"
    ],
    "year": 2016,
    "type": "consensus",
    "doi": "10.1136/bjsports-2016-096581",
    "pmid": "27535989",
    "journal": "British Journal of Sports Medicine",
    "population": "Elit sporcular (uzman grubu derlemesi, çeşitli sporlar)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Uluslararası Olimpiyat Komitesi'nin topladığı uzman grubu, yük ile sakatlık arasındaki kanıtı derledi. Yükü geniş tanımlıyor: antrenman ve maç yükündeki ani değişimler, sıkışık maç takvimi, psikolojik yük ve seyahat.\n- Kötü yük yönetimini sakatlık için önemli bir risk etkeni olarak görüyor; sporcu, antrenör ve destek ekibi için yük yönetimi ilkeleri veriyor.\n- Yükün, sporcunun iyi oluşu ve sakatlık kayıtlarıyla birlikte izlenmesini öneriyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Yükü izlemenin ve ani yük artışlarını görünür kılmanın en üst düzeydeki gerekçesi.\n\n## Sınırlılıklar\n\n- 2016 tarihli; akut / kronik oranına yönelik sonraki eleştirilerden (lolli-2017, impellizzeri-2020, impellizzeri-2021) önce yazıldı.\n- Yalnız özet okundu. 2017'de yayımlanmış bir düzeltmesi var (10.1136/bjsports-2016-097153); geri çekme değil."
  },
  {
    "id": "sprague-2018",
    "title": "Modifiable risk factors for patellar tendinopathy in athletes: a systematic review and meta-analysis",
    "authors": [
      "Sprague AL",
      "Smith AH",
      "Knox P",
      "Pohlig RT",
      "Grävare Silbernagel K"
    ],
    "year": 2018,
    "type": "meta-analysis",
    "doi": "10.1136/bjsports-2017-099000",
    "pmid": "30054341",
    "journal": "British journal of sports medicine",
    "population": "Patellar tendinopatili ve tendinopatisiz sporcular; 31 çalışma (6 ileriye dönük)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Patellar tendinopati için değiştirilebilir risk etkenlerini derliyor.\n- Hiçbir etken için güçlü kanıt bulunamadı; ayak bileği hareket açıklığı gibi etkenler için kanıt sınırlı ya da çelişkili.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Çalışmaların çoğu kesitsel; neden-sonuç kurulamıyor."
  },
  {
    "id": "thomas-2016",
    "title": "American College of Sports Medicine Joint Position Statement. Nutrition and Athletic Performance",
    "authors": [
      "Thomas DT",
      "Erdman KA",
      "Burke LM"
    ],
    "year": 2016,
    "type": "position-stand",
    "doi": "10.1249/MSS.0000000000000852",
    "pmid": "26891166",
    "journal": "Medicine and Science in Sports and Exercise",
    "population": "Sporcular (ACSM, Academy of Nutrition and Dietetics ve Dietitians of Canada ortak bildirgesi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Performans ve toparlanma iyi seçilmiş beslenme stratejileriyle desteklenir; besin, sıvı ve takviyenin türü, miktarı ve zamanlaması antrenman ve yarışma koşuluna göre ayarlanır.\n- Sporcunun kişisel bir beslenme planı için spor diyetisyenine yönlendirilmesi öneriliyor.\n- Basketbol derlemesi (davis-2022) bu bildirgeye dayanarak sporcular için 1,2-2,0 g/kg/gün protein aktarıyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı (tam metne erişilemedi). Hedeflerin sporcuya özgü olmasının ve kişisel plan için spor diyetisyenine yönlendirmenin dayanağı.\n\n## Sınırlılıklar\n\n- Tam metin ücretli; yalnız özet ve davis-2022'deki aktarımı okundu. Bildirgenin karbonhidrat aralıkları bu yüzden doğrudan bu kaynaktan alınmadı (davis-2022, kerksick-2018).\n- 2017'de bir düzeltme yayımlandı (Med Sci Sports Exerc 2017;49(1):222)."
  },
  {
    "id": "thorpe-2015",
    "title": "Monitoring Fatigue During the In-Season Competitive Phase in Elite Soccer Players",
    "authors": [
      "Thorpe RT",
      "Strudwick AJ",
      "Buchheit M",
      "Atkinson G",
      "Drust B",
      "Gregson W"
    ],
    "year": 2015,
    "type": "cohort",
    "doi": "10.1123/ijspp.2015-0004",
    "pmid": "25710257",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "Elit futbolcular, sezon içi 17 günlük yarışma dönemi",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Günlük yüksek şiddetli koşu mesafesindeki dalgalanma ile sabah ölçülen yorgunluk göstergeleri karşılaştırıldı.\n- Sabah yorgunluk puanındaki günlük dalgalanma yükle güçlü ilişkiliydi; HRV ve sıçrama yüksekliğiyle ilişki küçüktü. Kas ağrısı ve uyku kalitesi puanları yükle anlamlı ilişki göstermedi.\n- Yorgunluk puanı ve HRV basit, girişimsiz günlük göstergeler olarak öneriliyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan sayı alınmadı. Check-in notunun toplamla birlikte en çok düşen maddeyi göstermesinin dayanağı: maddeler yüke aynı duyarlılıkta değil.\n\n## Sınırlılıklar\n\n- Futbol, küçük örneklem, kısa (17 gün) dönem; basketbola aktarım varsayım.\n- Dış yük GPS mesafesiyle ölçüldü, seans RPE'siyle değil.\n- Yalnız özet okundu."
  },
  {
    "id": "todri-2025",
    "title": "Assessment properties of the Visual Analogue scale, Numeric Rating Scale, Face Pain Scale, and Pain Intensity Subscale of the Brief Pain Inventory in Albanian population with low back pain",
    "authors": [
      "Todri J",
      "Gjini A",
      "Lena O",
      "Nimmaanrat S",
      "Thepsuwan J",
      "Tipchatyotin S"
    ],
    "year": 2025,
    "type": "cross-sectional",
    "doi": "10.1080/07853890.2025.2601406",
    "pmid": "41388783",
    "journal": "Annals of Medicine",
    "population": "Bel ağrılı yetişkinler (Arnavutluk), klinik örneklem",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Bel ağrılı hastalarda görsel analog ölçek, sayısal derecelendirme ölçeği (NRS), yüz ifadeli ağrı ölçeği ve Kısa Ağrı Envanteri'nin şiddet alt ölçeği karşılaştırıldı. Dördü de geçerli bulundu ve aynı tek boyutu ölçtü.\n- Yöntem bölümü NRS'yi 11 basamaklı (NRS-11) bir ölçek olarak tanımlıyor: 0 \"ağrı yok\", 10 \"hayal edilebilecek en kötü ağrı\".\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 0-10 (11 basamak) | NRS puanı | Ağrı haritasında bölge başına ağrı / sertlik; 0 = yok, 10 = en kötü |\n\n## Sınırlılıklar\n\n- Klinik bel ağrısı popülasyonu; sporcudaki egzersiz sonrası kas ağrısına aktarım dolaylı. Bu yüzden puan yalnız kişinin kendi geçmişiyle kıyaslanır, popülasyon eşiği kullanılmaz.\n- Açık erişimli tam metin okundu (PMC12704113)."
  },
  {
    "id": "vanrenterghem-2017",
    "title": "Training Load Monitoring in Team Sports: A Novel Framework Separating Physiological and Biomechanical Load-Adaptation Pathways",
    "authors": [
      "Vanrenterghem J",
      "Nedergaard NJ",
      "Robinson MA",
      "Drust B"
    ],
    "year": 2017,
    "type": "expert-opinion",
    "doi": "10.1007/s40279-017-0714-2",
    "pmid": "28283992",
    "journal": "Sports medicine (Auckland, N.Z.)",
    "population": "Kuramsal çerçeve; koşu temelli takım sporları",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Antrenman yükünü iki ayrı yol olarak ele almayı öneriyor: fizyolojik yük (kalp-dolaşım, metabolizma) ve biyomekanik yük (kas, tendon, kemik gibi dokulara binen mekanik gerilim).\n- İki yolun uyum süreleri ve uyum biçimleri farklıdır; fizyolojik bir ölçüyle (ör. nabız, RPE) dokuya binen mekanik yükü tahmin etmek yanıltıcı olabilir.\n- Bu ayrımın yük izleme verilerinin yorumunu ve yeni araştırmaların tasarımını netleştireceğini savunuyor.\n\n## Uygulamada kullanılan sayılar\n\nSayı alınmadı; yalnız nitel bulgu (eşleme veya gerekçe) için kullanılır.\n\n## Sınırlılıklar\n\n- Kuramsal öneri; ampirik doğrulama sunmuyor."
  },
  {
    "id": "vesterinen-2016",
    "title": "Individual Endurance Training Prescription with Heart Rate Variability",
    "authors": [
      "Vesterinen V",
      "Nummela A",
      "Heikura I",
      "Laine T",
      "Hynynen E",
      "Botella J",
      "Häkkinen K"
    ],
    "year": 2016,
    "type": "rct",
    "doi": "10.1249/MSS.0000000000000910",
    "pmid": "26909534",
    "journal": "Medicine & Science in Sports & Exercise",
    "population": "Rekreasyonel dayanıklılık koşucuları, n=40 (HRV grubu ve klasik program grubu)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- 4 haftalık hazırlık döneminden sonra 8 haftalık yoğun dönemde, HRV grubunda orta ve yüksek yoğunluklu seans yalnız sabah HRV'si kişisel en küçük anlamlı değişim bandı içindeyken yapıldı; bant dışındaysa düşük yoğunluk yapıldı.\n- HRV grubu daha az yoğun seansla 3000 m performansını geliştirdi; klasik grupta anlamlı gelişme yoktu. Maksimal oksijen tüketimi iki grupta da arttı.\n- Çıkarım: dinlenik HRV, yoğun seansların zamanlamasını kişiselleştirmek için kullanılabilir.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| Bant içinde → planlanan yoğunluk; bant dışında → düşük yoğunluk | kural | Karar kuralı. Bant yöntemi (7 günlük ort., ± 0,5 SD) Manresa-Rocamora 2021'deki tabloya göre bu çalışmada da kullanıldı |\n| Başlangıç dönemi 4 hafta | hafta | Kişisel referans |\n\n## Sınırlılıklar\n\n- Rekreasyonel koşucular; elit basketbolcu değil. Ölçüm sabah ve göğüs bandıyla; HoopLab gece bileklik ölçümü kullanıyor.\n- Yalnız özet ve derleme tablosu okundu (tam metin ücretli)."
  },
  {
    "id": "walsh-2021",
    "title": "Sleep and the athlete: narrative review and 2021 expert consensus recommendations",
    "authors": [
      "Walsh NP",
      "Halson SL",
      "Sargent C",
      "Roach GD",
      "Nédélec M",
      "Gupta L",
      "Leeder J",
      "Fullagar HH",
      "Coutts AJ",
      "Edwards BJ",
      "Pullinger SA",
      "Robertson CM",
      "Burniston JG",
      "Lastella M",
      "Le Meur Y",
      "Hausswirth C",
      "Bender AM",
      "Grandner MA",
      "Samuels CH"
    ],
    "year": 2021,
    "type": "consensus",
    "doi": "10.1136/bjsports-2020-102025",
    "pmid": "33144349",
    "journal": "British Journal of Sports Medicine",
    "population": "Elit sporcular (uzman konsensüsü ve anlatı derlemesi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Elit sporcularda alışkanlık haline gelmiş kısa uyku (gecede 7 saatten az) ve parçalı uyku yaygın.\n- Bir ya da daha fazla uykusuz gece performansı düşürür; 1-3 gecelik kısmi uyku kısıtlamasının etkisi daha belirsiz.\n- Genel nüfusta alışkanlık olarak 7 saatten az uyumak solunum yolu enfeksiyonuna yatkınlığı artırıyor.\n- Herkese aynı süreyi (ör. 7-9 saat) önermek yerine sporcunun kendi uyku ihtiyacını gözeten kişisel bir yaklaşım öneriliyor.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 7 gecelik ortalama uyku < 7 saat → \"kısa\" | saat | Alışkanlık düzeyinde kısa uyku; tek gece değil ortalama okunur. Kişisel uyku ihtiyacı ileride check-in'deki uyku kalitesiyle birlikte değerlendirilir |\n\n## Sınırlılıklar\n\n- Uzman konsensüsü; 7 saat eşiği sporcuya özgü bir deneyden değil, alışkanlık tanımından ve genel nüfus verisinden geliyor.\n- Yazarlardan biri Fitbit dahil şirketlere danışmanlık yapmış.\n- Yalnız özet okundu."
  },
  {
    "id": "weiss-2017",
    "title": "The Relationship Between Training Load and Injury in Men's Professional Basketball",
    "authors": [
      "Weiss KJ",
      "Allen SV",
      "McGuigan MR",
      "Whatman CS"
    ],
    "year": 2017,
    "type": "cohort",
    "doi": "10.1123/ijspp.2016-0726",
    "pmid": "28253031",
    "journal": "International Journal of Sports Physiology and Performance",
    "population": "Profesyonel erkek basketbolcular, bir rekabet sezonu (tek takım); seans RPE iç yükü",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Akut yük bu haftanın seans RPE yükü toplamı, kronik yük önceki 4 haftanın haftalık ortalaması olarak hesaplandı; alt ekstremite aşırı kullanım sakatlıkları haftalık anketle kaydedildi.\n- Oranın 1-1,49 olduğu haftalardan sonra daha az oyuncu sakatlandı; çok düşük, düşük ve yüksek (1,5 ve üstü) oranlarda oran daha yüksekti. Ama oyuncu bazlı modelde oranlar arası farkların hepsi belirsiz çıktı.\n- Yazarlar oyuncuya özgü bir izleme yaklaşımı öneriyor.\n\n## Uygulamada kullanılan sayılar\n\nDoğrudan eşik alınmadı. Seans RPE ile basketbolda haftalık yük izlemenin uygulanabildiğinin örneği; eşik dayanağı olarak yeterli değil.\n\n## Sınırlılıklar\n\n- Tek takım, küçük örneklem; istatistiksel farklar belirsiz.\n- Yalnız özet okundu."
  },
  {
    "id": "wheeler-1996",
    "title": "Macronutrient and energy database for the 1995 Exchange Lists for Meal Planning: a rationale for clinical practice decisions",
    "authors": [
      "Wheeler ML",
      "Franz M",
      "Barrier P",
      "Holler H",
      "Cronmiller N",
      "Delahanty LM"
    ],
    "year": 1996,
    "type": "cross-sectional",
    "doi": "10.1016/S0002-8223(96)00299-4",
    "pmid": "8906142",
    "journal": "Journal of the American Dietetic Association",
    "population": "Yok (değişim listelerindeki besinlerin bileşim veritabanı; diyabet ve kilo kontrolü için öğün planlama)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Değişim listeleri, besinleri benzer karbonhidrat, protein ve yağ içeren gruplara ayırıp her gruba tek bir \"birim\" değeri veren eski bir öğün planlama yöntemi.\n- 1995 listelerindeki besinlerin bileşimi incelendiğinde grup ortalamaları birim değerlerine yakın çıktı, ama besinden besine sapma ve aralık büyüktü.\n- Yöntemin bilimsel temeli ve klinik etkinliği üzerine az araştırma var.\n\n## Uygulamada kullanılan sayılar\n\nSayı kullanılmıyor. \"Porsiyon birimi\" yöntemini seçmeme gerekçesi (karar 0030): grup ortalaması tutsa da tek bir besindeki hata büyük olabilir.\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| — | — | — |\n\n## Sınırlılıklar\n\n- Diyabet ve kilo kontrolü bağlamı, sporcu değil; ABD besinleri.\n- Yalnız özet okundu."
  },
  {
    "id": "williams-2017",
    "title": "Better way to determine the acute:chronic workload ratio?",
    "authors": [
      "Williams S",
      "West S",
      "Cross MJ",
      "Stokes KA"
    ],
    "year": 2017,
    "type": "expert-opinion",
    "doi": "10.1136/bjsports-2016-096589",
    "pmid": "27650255",
    "journal": "British Journal of Sports Medicine",
    "population": "Yöntem mektubu (popülasyon yok)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Akut ve kronik yükü basit kayan ortalama yerine üstel ağırlıklı kayan ortalamayla (EWMA) hesaplamayı öneriyor: yakın günler daha ağır sayılır, yükün birikmesi ve sönmesi daha gerçekçi modellenir.\n- Günlük güncelleme: bugünkü EWMA = bugünkü yük × λ + (1 − λ) × dünkü EWMA; λ = 2 / (N + 1), N gün cinsinden zaman sabiti.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| λ = 2 / (N + 1) | - | EWMA ağırlığı |\n| N = 7 | gün | Akut yük |\n| N = 28 | gün | Kronik yük |\n\n## Sınırlılıklar\n\n- Bir mektup; ampirik karşılaştırma murray-2017'de.\n- Mektubun tam metni açık erişimde değil, okunmadı. Formül ve N değerleri bu mektuba atıf yapan açık erişimli ren-2024 (PMC11402767) tam metninden doğrulandı."
  },
  {
    "id": "zhang-2026",
    "title": "Effects of Player Characteristics and Periodization Strategies on External and Internal Loads, Wellness, and Recovery in Collegiate Male Basketball Players",
    "authors": [
      "Zhang S",
      "Li M",
      "Xing W",
      "Zheng W",
      "Zhai Z"
    ],
    "year": 2026,
    "type": "cohort",
    "doi": "10.1519/jsc.0000000000005372",
    "pmid": "41432633",
    "journal": "Journal of Strength and Conditioning Research",
    "population": "Üst düzey antrenmanlı kolej erkek basketbolcuları, n=18, aynı takım (Çin üniversite ligi)",
    "summary": "## Ne söylüyor (kendi cümlelerimizle)\n\n- Dış yük, iç yük (seans RPE), iyi oluş ve toparlanma sezon boyunca izlendi; en yüksek yükü maç günleri üretti.\n- İyi oluş her sabah saat 10:00'dan önce, basketbolculara uyarlanmış bir çevrim içi anketle toplandı.\n- Anketin beş maddesi var: yorgunluk, uyku kalitesi, kas ağrısı, stres ve ruh hali. Her madde 1-5 aralığında puanlanıyor; toplam iyi oluş puanı beş maddenin toplamı.\n\n## Uygulamada kullanılan sayılar\n\n| Değer | Birim | Bağlam / koşul |\n|---|---|---|\n| 5 madde: yorgunluk, uyku kalitesi, kas ağrısı, stres, ruh hali | madde | Sabah, antrenmandan önce |\n| 1-5 | puan / madde | Çalışmada 0,5 adımla; HoopLab tam sayı kullanır ([karar 0017](../../docs/decisions/0017-sabah-check-in-olcegi.md)) |\n| 5-25 | toplam puan | Beş maddenin toplamı |\n\n## Sınırlılıklar\n\n- Kolej düzeyi, tek takım, n=18; profesyonel ligle yük ve takvim farklı.\n- Ölçeğin yönü (yüksek puanın iyi mi kötü mü olduğu) bu kayıt için tam metinden ayrıca not edilmedi. HoopLab tüm maddelerde 5 = en iyi kullanır (karar 0017).\n- Açık erişimli tam metin okundu (PMC13098654)."
  }
];

export const kbRules: readonly KbRule[] = [
  {
    "id": "agri-olcek",
    "module": "agri",
    "description": "Ağrı haritası: bölge ve taraf başına ağrı / sertlik, sayısal derecelendirme ölçeği (NRS-11) 0-10 tam sayı; 0 = yok, 10 = en kötü.",
    "appliesTo": "sabah check-in içinde veya istenince; kişinin kendi geçmişiyle kıyaslanır, popülasyon eşiği yok",
    "notes": "Sporcuya özgü bir NRS kaynağı yok; klinik popülasyondan (todri-2025) yalnız ölçek biçimi alındı, eşik alınmadı.",
    "sources": [
      "todri-2025",
      "hawker-2011"
    ]
  },
  {
    "id": "alim-hedef-kiyasi",
    "module": "beslenme",
    "description": "Günün kayıtlı karbonhidrat ve proteini gün hedefinin (karbonhidrat-gun-tipi, protein-gunluk) aralığıyla yan yana gösterilir: aralığın altında, içinde, üstünde. Değer 'Tahmin' etiketli; eşik ve uyarı yok. Bugün'de halka olarak gösterilir: içte kayıtlı miktar, dışta ince bir yayla hedef aralığı; renk yalnız kategoriyi söyler (karbonhidrat / protein), risk rengi yok (karar 0031). Öğünün proteini öğün dozuna (protein-gunluk: ≈ 0,3 g/kg) ulaştıysa öğün satırında belirtilir. Kilo yoksa kıyas yapılmaz, yalnız gram gösterilir.",
    "appliesTo": "Bugün → Beslenme (kayıtlı öğün varsa)",
    "notes": "Kayıt genellikle gerçek alımın altında kalır: sporcularda enerji ortalama %19 eksik bildiriliyor (capling-2017), eğitimli kişiler bile öğün karbonhidratını ortanca %28 eksik tahmin ediyor (buck-2022, tip 1 diyabet). Bu yüzden 'aralığın altında' kayıt eksikliği de olabilir ve bir uyarı değildir. Öğün dozu davis-2022'den (protein-gunluk); tek öğünün dozu aşmaması bir hata değil.",
    "sources": [
      "capling-2017",
      "buck-2022",
      "amoutzopoulos-2020",
      "davis-2022"
    ]
  },
  {
    "id": "bolge-agri-izleme",
    "module": "kas-tendon",
    "description": "Ağrı izleme modeli, sabah ağrısına uyarlanmış: bir bölgede sabah ağrısı 5'in üstündeyse ya da bölge dün yüklendiyse ve bugünkü sabah ağrısı dünkünden azalmadıysa (dün ağrı vardı) o bölgeye 'tahmin' etiketli bir not düşer.",
    "appliesTo": "ağrı haritası (sabah check-in) ve bölge yükü; bölge ve taraf bazında",
    "notes": "Model tendinopati rehabilitasyonunda kullanılıyor: etkinlik sırası ve sonrası ağrı 0-10 ölçekte 5'e kadar çıkabilir, ertesi sabah azalmış olmalı (seidler-2025 tam metni; ilk kaynak silbernagel-2007). HoopLab yalnız sabah ağrısını kaydettiği için model sabah değerine uyarlanır; bu uyarlama doğrulanmadı. Not tanı değildir; şiddetli, ani başlayan veya şişlikle gelen ağrıda doktora yönlendirilir (CLAUDE.md §3).",
    "sources": [
      "silbernagel-2007",
      "seidler-2025"
    ]
  },
  {
    "id": "bolge-esleme",
    "module": "kas-tendon",
    "description": "Etiket → bölge eşlemesi (nitel, katsayısız). Sıçrama / iniş: patellar tendon, Aşil. Yön değiştirme / ani duruş: quadriceps, adduktor. Sprint: hamstring, baldır, Aşil. Alt vücut kuvvet: quadriceps, hamstring, kalça. Üst vücut kuvvet: omuz. Ayak bileği ve bel modelde yok; yalnız ağrı haritasında.",
    "appliesTo": "bölge yükü ve toparlanma penceresi hesabı",
    "notes": "Sıçrama → patellar tendon: basketbol ve voleybolda yaygınlık en yüksek (lian-2005), sıçrama sıklığı maruziyet olarak (bahr-2014); sıçrama yükünün diz şikayetine nedensel etkisi bulunamadı (bache-mathiesen-2024) ve güçlü bir değiştirilebilir risk etkeni yok (sprague-2018), bu yüzden eşleme maruziyettir, risk değil. Sıçrama ve koşu → Aşil (silbernagel-2007). Ani duruş → quadricepste yüksek eksantrik iş (harper-2022, tam metin). Yön değiştirme → adduktor (serner-2019, finnern-2026). Sprint → hamstring (danielsson-2020, finnern-2026) ve baldır (finnern-2026). Kuvvet etiketleri anatomik eşlemedir; kaynak yalnız toparlanma süresi için (bolge-toparlanma-penceresi). Ayak bileği burkulması basketbolda çoğunlukla rakibin ayağına basmayla oluşan anlık travma (panagiotakis-2017), birikmiş yük değil; bel için kaynaklı bir eşleme yok. Futbol ve voleybol kaynaklarının basketbola aktarımı varsayımdır.",
    "sources": [
      "lian-2005",
      "bahr-2014",
      "silbernagel-2007",
      "harper-2022",
      "serner-2019",
      "danielsson-2020",
      "finnern-2026",
      "panagiotakis-2017",
      "bache-mathiesen-2024",
      "sprague-2018"
    ]
  },
  {
    "id": "bolge-icerik-etiketleri",
    "module": "kas-tendon",
    "description": "Seans içerik etiketleri: sıçrama / iniş, yön değiştirme / ani duruş, sprint, alt vücut kuvvet, üst vücut kuvvet. Seans RPE'si fizyolojik yükü, etiketler hangi dokuların mekanik olarak çalıştığını işaretler. Türe göre hazır seçili gelir; kullanıcı düzeltir.",
    "appliesTo": "her seans kaydı; etiketsiz eski seanslar türün hazır etiketleriyle sayılır ve bu ekranda belirtilir",
    "notes": "Fizyolojik ve biyomekanik yük ayrı yollardır (vanrenterghem-2017); RPE doku yükünü göstermez (kalkhoven-2021), bu yüzden içerik ayrıca işaretlenir. Hazır seçimler bir kullanıcı arayüzü varsayılanıdır, eşik değildir; 30 saniyelik kayıt hedefi için (karar 0027). PRODUCT'taki 'temas' etiketi alınmadı: kaynaklı bir bölge eşlemesi yok.",
    "sources": [
      "vanrenterghem-2017",
      "kalkhoven-2021"
    ]
  },
  {
    "id": "bolge-toparlanma-penceresi",
    "module": "kas-tendon",
    "description": "Benzer bir yükten önce önerilen ara: tendon bölgeleri (patellar tendon, Aşil) 48 saat; kas bölgeleri (quadriceps, hamstring, adduktor, baldır, kalça, omuz) 72 saat. Pencere içinde yüklenmiş bölge 'toparlanıyor' olarak gösterilir.",
    "appliesTo": "bölgeye eşlenen son seanstan bu yana geçen süre; seans saati bilinmiyorsa takvim günüyle (48 saat = bugün ve dün, 72 saat = bugün ve önceki iki gün)",
    "notes": "Süreler gabbett-2025'ten: çok sıçramalı yüklenme sonrası tendonda 48 saat, eksantrik kas hasarında 72 saat veya daha uzun. Tendonda kollajen yapımı 24 saatte zirve yapıp yaklaşık 3 gün yüksek kalır (magnusson-2010, miller-2005); maç sonrası kreatin kinaz 72 saate kadar normale döner (doeven-2018). Süreler 'hasar var' demek değil, benzer bir doz için önerilen aradır. Elle girilen seansların saati yok (yalnız saatle eşleşenlerde var); bu yüzden takvim günü yaklaşımı. Derleme düzeyinde kanıt (düzey 4) ve bireysel farklar büyük; tahmin olarak etiketlenir.",
    "sources": [
      "gabbett-2025",
      "magnusson-2010",
      "miller-2005",
      "doeven-2018"
    ]
  },
  {
    "id": "bolge-yuku",
    "module": "kas-tendon",
    "description": "Bölge yükü = toparlanma penceresi içindeki, o bölgeye eşlenen en az bir etiketi taşıyan seansların seans yükleri toplamı (AU). Seans yükü bölgeler arasında bölünmez; dokuya binen yük değil, o bölgeyi çalıştıran seansların yükü. Kıyas: kendi son 28 gününde aynı uzunluktaki pencerelerin ortalaması; eşik yok.",
    "appliesTo": "Vücut görünümü ve bölge ayrıntısı; her bölge için",
    "notes": "Mevcut yük ölçüleri doku düzeyindeki mekanik yükle doğrulanmadı (kalkhoven-2021); bölge yükü bu yüzden yalnız maruziyetin yoğunluğunu gösterir ve 'tahmin' etiketlidir. Bölgeler arası katsayı veya sönüm eğrisi kullanılmaz: kaynağı yok (karar 0027, seçenek B reddedildi). Sıçrama yükü bile tek başına diz şikayetiyle nedensel ilişkili bulunmadı (bache-mathiesen-2024); risk dili ve renk yok. Kıyas penceresi antrenman yükünün kronik penceresiyle aynı (yuk-haftalik).",
    "sources": [
      "vanrenterghem-2017",
      "kalkhoven-2021",
      "bache-mathiesen-2024"
    ]
  },
  {
    "id": "checkin-kisisel",
    "module": "iyi-olus",
    "description": "Sabah check-in toplamının kişisel z-skoru: (bugünkü toplam − önceki 28 gündeki check-in toplamlarının ortalaması) / örneklem SD'si. z ≤ −1 ise \"alıştığından belirgin düşük\" notu düşer ve kendi ortalamasına göre en çok düşen madde yazılır. Günün durumuna girmez.",
    "appliesTo": "o sabahın check-in'i; yalnız check-in yapılan günler başlangıca girer, bugün dahil değil",
    "notes": "Sabah iyi oluşunun kişisel z-skoru −1 olunca o günkü antrenman çıktısı küçük ama anlamlı düşük bulundu (gallo-2016, Avustralya futbolu); −1 orada bir etki büyüklüğü birimi, doğrulanmış uyarı eşiği değil. Kırmızı bayraklar sporcunun kendi profiline göre konur; maç ertesi düşüş olağan (gallo-2017). Maddeler yüke aynı duyarlılıkta değil, yorgunluk en duyarlısı (thorpe-2015): bu yüzden en çok düşen madde ayrıca gösterilir. Öznel ölçümler yüke nesnel ölçümlerden duyarlı (saw-2016). 28 günlük pencere ve en az 12 değer HRV bandından aktarıldı (plews-2014); check-in'e özgü bir yeterlilik kaynağı bulunamadı. Basketbola aktarım varsayım; check-in doğrulanmış bir ölçek değil (burger-2024, karar 0017). Günün durumuna girmez: birleşim için kaynak yok (karar 0028).",
    "sources": [
      "gallo-2016",
      "gallo-2017",
      "thorpe-2015",
      "saw-2016",
      "plews-2014"
    ]
  },
  {
    "id": "checkin-olcek",
    "module": "iyi-olus",
    "description": "Sabah check-in: beş madde (uyku kalitesi, yorgunluk, kas ağrısı, stres, ruh hali), her biri 1-5 tam sayı; tüm maddelerde 5 = en iyi; toplam 5-25.",
    "appliesTo": "her sabah, antrenmandan önce; puanlar kişisel baseline'a göre okunur, popülasyon eşiği yok",
    "notes": "Madde listesi ve 1-5 aralığı basketbol çalışmasından (zhang-2026, tam metin). Çalışmadaki 0,5 adım yerine tam sayı: 30 saniye hedefi ve tek dokunuş (karar 0017). Kısa uyarlanmış anketler doğrulanmış ölçek değildir (burger-2024); bu yüzden check-in yalnız izleme aracıdır.",
    "sources": [
      "zhang-2026",
      "conte-2018",
      "saw-2016",
      "burger-2024",
      "hooper-1995",
      "mclean-2010"
    ]
  },
  {
    "id": "enerji-yeterliligi",
    "module": "beslenme",
    "description": "Düşük enerji yeterliliği (REDs) hesaplanmaz ve otomatik uyarı verilmez: öğün kaydı yalnız karbonhidrat ve protein tutar (enerji yok), egzersiz harcaması ve yağsız kütle ölçülmez, kayıt gerçek alımın altında kalabilir. Hedef sayfasında REDs anlatılır ve belirtilerde sağlık ekibine yönlendirilir. Sabah kilosu eşiksiz trend olarak gösterilir.",
    "appliesTo": "beslenme hedefi sayfası ve açıklaması",
    "notes": "IOC 2023 konsensüsü REDs'i egzersiz harcamasına göre yetersiz enerji alımının sonuçları olarak tanımlıyor; tanı klinik bir araçla (CAT2) klinisyen tarafından konuyor (mountjoy-2023). Enerji yeterliliği için alım, egzersiz harcaması ve yağsız kütle gerekir; IOC alt grubu bunların ölçümünün araştırmada bile standart olmadığını yazıyor (ackerman-2023). Sporcuların bildirdiği enerji alımı ortalama %19 eksik (capling-2017). Öğün kaydı eklendiğinde (karar 0030) yeniden değerlendirildi: uyarı ve alıma dayalı not yine yok. Konsensüsün tam metnine erişilemedi; eşik kullanılmadı. CLAUDE.md §3 tıbbi sınır: tanı yok.",
    "sources": [
      "mountjoy-2023",
      "ackerman-2023",
      "capling-2017"
    ]
  },
  {
    "id": "gunun-durumu",
    "module": "toparlanma",
    "description": "Günün durumu: HRV bandın altında ve dinlenik nabız bandın üstündeyse 'Toparlan'; HRV bandın dışında (iki yönde), dinlenik nabız bandın üstünde veya uyku kısaysa 'Kontrollü'; hiçbiri yoksa 'Hazır'. HRV bandı yoksa durum üretilmez.",
    "appliesTo": "Bugün ekranındaki 'Bugünün durumu'; tanı değil, izleme özeti",
    "notes": "Test edilmiş karar kuralı yalnız HRV'dir: bant içinde planlanan yoğunluk, bant dışında (iki yönde) düşük yoğunluk (vesterinen-2016). HRV tek başına uyumu ayırt etmeyebilir (bellenger-2016) ve HRV düşüşü nabızla birlikte okunur (plews-2013, buchheit-2014); bu yüzden en ağır durum iki otonom işaret aynı yönü gösterdiğinde. Uyku kısalığı (walsh-2021) yalnız 'Kontrollü'ye katkı verir. Bu birleşim HoopLab'in sentezidir, doğrulanmış bir hazır olma skoru değildir (karar 0021).",
    "sources": [
      "vesterinen-2016",
      "plews-2013",
      "buchheit-2014",
      "bellenger-2016",
      "walsh-2021"
    ]
  },
  {
    "id": "hrv-olcu",
    "module": "toparlanma",
    "description": "İzlenen HRV değeri: gece derin uyku dönemindeki RMSSD (ms). Bant ve ortalamalar doğal logaritması (ln) üzerinden hesaplanır, ekranda ms olarak gösterilir.",
    "appliesTo": "Google Health günlük HRV özeti (health_daily.hrv_deep_rmssd_ms)",
    "notes": "Bütün gecenin RMSSD'si uyku evresi dağılımından etkilenir; gece ölçümünde derin uyku dönemleri daha kararlıdır (buchheit-2014). Fitbit uygulamasının gösterdiği gece ortalaması (hrv_rmssd_ms) saklanır ama durum için kullanılmaz (karar 0021). ln dönüşümü HRV izleme çalışmalarının ortak yöntemi (plews-2013, plews-2014). Kaynakların ölçümü çoğunlukla sabah kısa kayıt; gece bileklik ölçümüne aktarım bir varsayımdır.",
    "sources": [
      "buchheit-2014",
      "plews-2013",
      "plews-2014"
    ]
  },
  {
    "id": "karbonhidrat-gun-tipi",
    "module": "beslenme",
    "description": "Günlük karbonhidrat hedefi gün tipine göre (g/kg/gün, sabah kilosuyla): dinlenme 3-5, antrenman 5-7, yoğun 8-10. Gün tipi o günün seans kayıtlarından: seans yoksa dinlenme, seans varsa antrenman, maç varsa ya da seansların toplam süresi 180 dakika veya üstüyse yoğun. Kullanıcı gün tipini değiştirebilir.",
    "appliesTo": "her gün; kilo son 7 günün sabah kilosu ortalamasından (yoksa son ölçüm)",
    "notes": "Antrenman günü 5-7 basketbol derlemesinden (davis-2022). Dinlenme 3-5 ve yoğun 8-10 ISSN derlemesinden (kerksick-2018): 3-5 genel fitness için, 8-10 günde 3-6 saat yoğun antrenman için; sporcunun dinlenme gününe ve basketbolda maç gününe aktarım varsayım. davis-2022 takım sporlarında 5-12 aralığı veriyor, üst ucu çok dakika oynayan oyuncu için. 180 dakika eşiği kerksick-2018'in '3-6 saat' alt ucu. Ortak bildirgenin (thomas-2016) tam metnine erişilemedi; aralıklar ondan doğrudan alınmadı. Hedef bir rehber aralık, eşik ya da uyarı değil; kişisel plan için spor diyetisyeni (thomas-2016).",
    "sources": [
      "davis-2022",
      "kerksick-2018",
      "thomas-2016"
    ]
  },
  {
    "id": "kilo-artisi-notu",
    "module": "hidrasyon",
    "description": "Seans sonrası kilo seans öncesinden fazlaysa not: seansta kilo artmamalı, fazla içmek yarar sağlamaz ve hiponatremiye yol açabilir. Tanı değil; baş ağrısı, bulantı, kafa karışıklığı varsa sağlık ekibine.",
    "appliesTo": "ter testi sonucu",
    "notes": "NATA öneri 6 (öneri gücü A): seansta kilo artmamalı, istisna seansa kaçınılmaz bir sıvı açığıyla başlamak (mcdermott-2017). Tartı hassasiyeti nedeniyle küçük artışlar ölçüm hatası olabilir; not bunu söyler.",
    "sources": [
      "mcdermott-2017"
    ]
  },
  {
    "id": "kilo-kaybi-notu",
    "module": "hidrasyon",
    "description": "Seans boyunca kilo kaybı (seans öncesi kilonun yüzdesi olarak, içilen sıvı hesaba katılmadan net değişim) %2 veya üstündeyse not: kayıp önerilen sınırın üstünde.",
    "appliesTo": "ter testi sonucu",
    "notes": "%2 sınırı NATA (mcdermott-2017, öneri gücü A) ve ACSM (sawka-2007) bildirgelerinde. Basketbolda becerinin anlamlı düştüğü ilk düzey %2 (baker-2007, randomize çapraz). Net kilo değişimi kullanılır (içilen sıvı zaten vücutta): (öncesi − sonrası) / öncesi.",
    "sources": [
      "mcdermott-2017",
      "sawka-2007",
      "baker-2007"
    ]
  },
  {
    "id": "ogun-besin-listesi",
    "module": "beslenme",
    "description": "Öğün kaydı sabit bir besin listesinden yapılır: her besinin ev ölçüsü (ör. 1 kase) ve gramı, 100 g'daki karbonhidrat ve proteini USDA FoodData Central'dan (SR Legacy), FDC kimliğiyle research/foods/foods.json'da. Porsiyon çarpanı 0,5 / 1 / 1,5 / 2 / 3; gramı kod hesaplar. Paketli ürün için etiketten elle karbonhidrat ve protein (gram). Serbest besin araması, kalori ve yapay zeka tahmini yok.",
    "appliesTo": "öğün kaydı (Bugün → Beslenme → Öğün ekle)",
    "notes": "Değerler FDC'den betikle alınır ve FDC API'siyle yeniden doğrulanabilir (tools/research/foods-fdc.mjs --online); kaynak kamu malı (CC0). Doğrulanmış tek bir veritabanı, kullanıcı girişli veritabanlarından daha geçerli sonuç veriyor (morello-2025, dayanıklılık sporcuları). El ölçüsü (yumruk, avuç) şekilsiz besinde fazla tahmin ettiriyor ve kişiye göre değişiyor (gibson-2016, sporcu değil); değişim listesinde grup ortalaması tutsa da besinden besine sapma büyük (wheeler-1996). Ev ölçüsünün yanında gram gösterilir (amoutzopoulos-2020). Fotoğraftan yapay zeka tahmini diyetisyenden belirgin hatalı (goncalves-2026) ve CLAUDE.md §3'e aykırı. ABD besinleri Türk yemeklerine yaklaşık eşlenir; çarpanlar görsel seçim, eşik değil.",
    "sources": [
      "fukagawa-2022",
      "morello-2025",
      "gibson-2016",
      "wheeler-1996",
      "amoutzopoulos-2020",
      "goncalves-2026"
    ]
  },
  {
    "id": "protein-gunluk",
    "module": "beslenme",
    "description": "Günlük protein hedefi 1,2-2,0 g/kg/gün (gün tipinden bağımsız), 4-5 saatte bir öğüne bölünmüş, öğün başına yaklaşık 0,3 g/kg.",
    "appliesTo": "her gün; kilo karbonhidrat hedefiyle aynı",
    "notes": "Aralık ve öğün dozu basketbol derlemesinden (davis-2022: 1,2-2,0 g/kg/gün, 0,31 g/kg her 4-5 saatte; ortak bildirgeye, thomas-2016, dayanıyor). Bağımsız ISSN bildirgesi 1,4-2,0 veriyor (jager-2017). Meta-analizde 1,6 g/kg/gün üstü ek kas kazanımı getirmedi (morton-2018; güven aralığı geniş); açıklamada aralığın ortası olarak anılır, tavan değil. 0,31 yuvarlanarak 0,3.",
    "sources": [
      "davis-2022",
      "jager-2017",
      "morton-2018",
      "thomas-2016"
    ]
  },
  {
    "id": "seans-rpe-olcek",
    "module": "yuk",
    "description": "Seans RPE: değiştirilmiş CR-10, 0-10 tam sayı; sözel çapalar 0, 1, 2, 3, 4, 5, 7 ve 10'da.",
    "appliesTo": "her seans bittikten sonra, tüm seans için tek puan",
    "notes": "Çapaların ifadeleri açık erişimli derlemeden (haddad-2017) doğrulandı; birincil kaynak foster-2001.",
    "sources": [
      "foster-2001",
      "haddad-2017"
    ]
  },
  {
    "id": "seans-yuku",
    "module": "yuk",
    "description": "Seans yükü = RPE × süre (dakika), keyfi birim (AU).",
    "appliesTo": "her seans; maçta süre olarak seansın tamamı (ısınma dahil) kullanılır, oynanan dakika ayrı tutulur",
    "notes": "Yük saklanmaz, packages/engine sessionLoad hesaplar. Maçta tam seans süresi korunur (karar 0025): basketbolda seans RPE ile yük izleyen çalışmalar da (weiss-2017, ferioli-2020) seansın tamamını kullanıyor.",
    "sources": [
      "foster-2001",
      "haddad-2017",
      "burger-2024"
    ]
  },
  {
    "id": "sivi-alim-kaydi",
    "module": "hidrasyon",
    "description": "Gün içinde içilen sıvı hedefsiz kaydedilir: hızlı ekleme 250 / 500 / 750 mL ya da elle mL. Bugün'de günün toplamı (L) gösterilir; o gün ter testi yapıldıysa seans sonrası sıvı hedefi (sivi-hedefi) yanında yazar. Günlük sabit bir su hedefi, renk ya da uyarı yok.",
    "appliesTo": "su kaydı (+ → Su, Bugün → Beslenme)",
    "notes": "Ter oranı ve elektrolit kaybı kişiden kişiye çok değiştiği için bildirgeler kişisel bir sıvı planı öneriyor (sawka-2007); ter oranını bilmeyen biri için susadıkça içmek fazla içmeyi önleyen güvenli yol (mcdermott-2017). Genel nüfus için verilen günlük su değerleri sporcuya özgü değil (CLAUDE.md §3: popülasyon referansı yalnız sporcu kaynağıyla), bu yüzden hedef olarak kullanılmadı. Hızlı ekleme miktarları bardak / şişe kolaylığı, bilimsel eşik değil.",
    "sources": [
      "sawka-2007",
      "mcdermott-2017"
    ]
  },
  {
    "id": "sivi-hedefi",
    "module": "hidrasyon",
    "description": "Seans sonrası sıvı hedefi: sonraki seansa 4 saatten az varsa kaybedilen her 1 kg için 1,0-1,5 L; daha uzun ara varsa öğünlerle birlikte, susadıkça.",
    "appliesTo": "ter testinde net kilo kaybı varsa",
    "notes": "NATA: 4 saatten kısa toparlanmada kaybın %100-150'si (mcdermott-2017). Basketbol derlemesi: kısa arada kg başına 1,0-1,5 L, 24 saat ve üstünde öğünlerle istendiği kadar (davis-2022). Aradaki (4-24 saat) için iki kaynak da sayı vermiyor; HoopLab 4 saatten uzun her arada öğünlerle içmeyi söyler. Sonraki seansa kalan süre bilinmediği için sonuçta iki durum da yazılır (kısa ara: L aralığı; uzun ara: öğünlerle).",
    "sources": [
      "mcdermott-2017",
      "davis-2022"
    ]
  },
  {
    "id": "solunum-bant",
    "module": "toparlanma",
    "description": "Gece solunum hızının kişisel bandı: son 7 günün ortalaması, önceki 28 günün ortalaması ± 0,5 SD'ye göre (HRV ve dinlenik nabızla aynı yöntem). Yalnız gösterilir; günün durumuna girmez.",
    "appliesTo": "Google Health'in gece solunum hızı (nefes/dk); veri yeterliliği toparlanma-veri-yeterliligi ile aynı",
    "notes": "Gece solunumu kişiler arasında çok, kişi içinde az değişiyor (natarajan-2021: 14 günde CV yaklaşık %2-9,5); bu yüzden popülasyon aralığı değil kişisel bant. Sporcularda da kişisel başlangıç düzeyine göre okunmuş (renteria-2024, n=14). Pencereler ve ± 0,5 SD HRV bandından aktarıldı (manresa-rocamora-2021); solunuma özgü doğrulanmış bir bant genişliği bulunamadı. Bandın altı veya üstü bir yorgunluk ya da hazır olma göstergesi olarak doğrulanmadığı için günün durumuna girmez (karar 0028).",
    "sources": [
      "natarajan-2021",
      "renteria-2024",
      "manresa-rocamora-2021"
    ]
  },
  {
    "id": "solunum-tek-gece",
    "module": "toparlanma",
    "description": "Son gecenin solunum hızı, önceki 28 günün kişisel ortalamasının 3 nefes/dk veya daha fazla üstündeyse not düşer. Tanı değil: olası nedenler (hastalık başlangıcı, sıcak, alkol, stres, yükseklik) sayılır, kendini hasta hissediyorsa doktora yönlendirilir.",
    "appliesTo": "son gece; bant için yeterli veri varsa (toparlanma-veri-yeterliligi)",
    "notes": "3 nefes/dk natarajan-2021'in tanımlayıcı sayısı: COVID-19'da belirtilerin çevresindeki haftada semptomlu kişilerin yaklaşık üçte birinde olağanın en az 3 nefes/dk üstünde bir gece. Doğrulanmış bir uyarı eşiği değil, özgüllüğü verilmedi; tam metindeki z ≥ 2,33 analizi daha hassas ama daha çok yanlış alarm üretebilir, temkinli olan seçildi (karar 0028). Solunum stres, sıcak ve efor gibi pek çok etkene duyarlı (nicolo-2020); bu yüzden not tek bir neden söylemez. Gece solunumu sporcularda diğer ölçümlerden önce değişebiliyor (renteria-2024, miller-2020). CLAUDE.md §3 tıbbi sınır: tanı yok, yönlendirme var.",
    "sources": [
      "natarajan-2021",
      "miller-2020",
      "renteria-2024",
      "nicolo-2020"
    ]
  },
  {
    "id": "ter-orani",
    "module": "hidrasyon",
    "description": "Ter testi: ter kaybı (L) = seans öncesi kilo − seans sonrası kilo + seansta içilen sıvı − (girildiyse) idrar; ter oranı (L/saat) = ter kaybı / seans süresi. Kilolar kg, sıvı L (1 kg ≈ 1 L).",
    "appliesTo": "seans kaydına bağlı ter testi; seans süresi seanstan",
    "notes": "Formül NATA bildirgesinin ter oranı denkleminden (mcdermott-2017, tam metin); tartıyla ter oranı tahmini ACSM bildirgesinde de var (sawka-2007). Basketbolda maç başına ter kaybı 1-4,6 L arasında değişti (osterberg-2009): kişisel test bu yüzden. Ter testi kişisel ve koşula bağlı bir ölçüm; farklı sıcaklık ve seans türünde tekrarlanır.",
    "sources": [
      "mcdermott-2017",
      "sawka-2007",
      "osterberg-2009"
    ]
  },
  {
    "id": "toparlanma-bant",
    "module": "toparlanma",
    "description": "Kişisel bant: son 7 günün ortalaması, ondan hemen önceki 28 günün günlük değerlerinin ortalaması ± 0,5 SD ile karşılaştırılır. Bandın altı, içi, üstü.",
    "appliesTo": "HRV (ln) ve dinlenik nabız (atım/dk); her gün yeniden hesaplanır",
    "notes": "Çalışmalar 7 günlük ortalamayı 3-4 haftalık sabit bir başlangıç döneminden hesaplanan ortalama ± 0,5 SD ile karşıladı ve referansı dönem ortasında güncelledi (manresa-rocamora-2021). Sürekli kullanımda referans her gün kayar; 7 günlük pencereyle çakışmaz, böylece bu haftaki düşüş bandı aşağı çekmez. SD örneklem SD'si (n − 1). Dinlenik nabıza aynı yöntem uygulanır: anlamlı değişim kişisel günden güne oynamanın kesri (buchheit-2014). Kaynaklar dayanıklılık sporcularından; basketbola aktarım bir varsayımdır.",
    "sources": [
      "manresa-rocamora-2021",
      "vesterinen-2016",
      "buchheit-2014",
      "duking-2021"
    ]
  },
  {
    "id": "toparlanma-veri-yeterliligi",
    "module": "toparlanma",
    "description": "Ortalama ve bant için en az veri: 7 günlük pencerede en az 3 değer, 28 günlük başlangıç penceresinde en az 12 değer (haftada 3). Daha azsa sonuç üretilmez, 'veri yetersiz' gösterilir.",
    "appliesTo": "HRV, dinlenik nabız ve 7 gecelik uyku ortalaması",
    "notes": "plews-2014 haftalık HRV ortalaması için en az 3 geçerli ölçüm öneriyor; başlangıç penceresi için haftada 3 × 4 hafta. Aynı alt sınır dinlenik nabız ve uyku ortalamasına da uygulanır (doğrudan kaynak yok; tutarlılık için).",
    "sources": [
      "plews-2014"
    ]
  },
  {
    "id": "uyku-kisa",
    "module": "toparlanma",
    "description": "Son 7 gecenin ortalama uyku süresi (uykuda geçen dakika, şekerlemeler hariç) 7 saatin altındaysa uyku 'kısa'.",
    "appliesTo": "Google Health uyku oturumları (sleep_sessions.minutes_asleep, şekerleme olmayanlar; bitiş gününe göre)",
    "notes": "walsh-2021 sporcularda alışkanlık haline gelmiş kısa uykuyu gecede 7 saatten az olarak tanımlıyor ve herkese aynı süreyi önermek yerine kişisel ihtiyacı öneriyor. Kişisel uyku ihtiyacı henüz ölçülmüyor; 7 saat bu yüzden alt sınır olarak kullanılır. Tek gece değil ortalama okunur.",
    "sources": [
      "walsh-2021"
    ]
  },
  {
    "id": "yuk-artis-notu",
    "module": "yuk",
    "description": "Oran 1,5 veya üstündeyse bilgi notu: 'Bu hafta yük alıştığın seviyenin belirgin üstünde.' Tahmin olarak etiketlenir; sakatlık tahmini değildir. Düşük oran için not veya renk yok.",
    "appliesTo": "yuk-orani hesaplanabildiğinde, bugün",
    "notes": "1,5, çalışmaların 'yüksek oran' için en sık kullandığı alt sınır (gabbett-2016, maupin-2020); ani yük artışları uzlaşı metinlerinde risk etkeni (soligard-2016). Eşik başka takım sporlarından; basketbolda oran eşikleri doğrulanmadı (chan-2024; weiss-2017 belirsiz, ferioli-2020 ilişki yok). Bu yüzden not bir uyarı ya da risk tahmini değil, 'alıştığından belirgin fazla' bilgisidir (karar 0025).",
    "sources": [
      "gabbett-2016",
      "maupin-2020",
      "andrade-2020",
      "soligard-2016",
      "ding-2026",
      "chan-2024",
      "weiss-2017",
      "ferioli-2020",
      "impellizzeri-2020",
      "impellizzeri-2021"
    ]
  },
  {
    "id": "yuk-ewma",
    "module": "yuk",
    "description": "Akut ve kronik yük üstel ağırlıklı ortalama (EWMA) ile: bugünkü = günlük yük × λ + (1 − λ) × dünkü; λ = 2 / (N + 1); akut N = 7, kronik N = 28 gün.",
    "appliesTo": "yuk-gunluk serisi; ilk kayıt gününden başlar",
    "notes": "EWMA kayan ortalamadan daha duyarlı bulundu (murray-2017, griffin-2019). Formül williams-2017'de; mektup açık erişimde olmadığı için ren-2024 tam metninden doğrulandı. Başlangıç değeri kaynaklarda tanımlı değil; HoopLab ağırlıkları ilk kayıt gününden itibaren normalleştirir (ağırlıklar toplamı 1), yani kayıt öncesi günleri 0 saymaz. Yeterince uzun geçmişte bu, özyinelemeli formülle aynı sonucu verir (karar 0025).",
    "sources": [
      "williams-2017",
      "ren-2024",
      "murray-2017",
      "griffin-2019",
      "andrade-2020"
    ]
  },
  {
    "id": "yuk-gunluk",
    "module": "yuk",
    "description": "Günlük yük = o günün (sporcunun yerel günü) seans yüklerinin toplamı. Seans kaydı olmayan gün 0 yük sayılır.",
    "appliesTo": "ilk seans kaydının olduğu günden bugüne her gün",
    "notes": "Dinlenme günü yükün parçasıdır; monotonluk ve ortalamalar 0 yüklü günlerle hesaplanır (foster-1998). Uygulama kaydedilmemiş bir seansı dinlenme gününden ayıramaz; etiketlenmemiş saat oturumları yük bölümünde sayılır ve etiketlemeye bağlanır (karar 0025). İlk kayıttan önceki günler bilinmiyor sayılır, 0 sayılmaz.",
    "sources": [
      "bourdon-2017",
      "foster-1998",
      "haddad-2017"
    ]
  },
  {
    "id": "yuk-haftalik",
    "module": "yuk",
    "description": "Son 7 günün toplam yükü, ondan önceki 7 günün toplamı ve haftadan haftaya değişim; son 28 günün haftalık ortalaması (28 günlük toplam / 4). Yalnız gösterilir, eşik yok.",
    "appliesTo": "bugün dahil son 7 / 14 / 28 gün; pencerenin tamamı ilk kayıttan sonraysa hesaplanır",
    "notes": "1 hafta / 4 hafta penceresi akut / kronik yük çalışmalarında en yaygın olanı (andrade-2020). Haftadan haftaya değişim basketbolda incelenmiş ama sakatlıkla ilişkili bulunmamış bir gösterge (ferioli-2020); bu yüzden eşiği ve rengi yok.",
    "sources": [
      "andrade-2020",
      "ferioli-2020",
      "weiss-2017"
    ]
  },
  {
    "id": "yuk-monotonluk",
    "module": "yuk",
    "description": "Monotonluk = son 7 günün günlük yük ortalaması / standart sapması (örneklem SD'si, 0 yüklü günler dahil). Gerilim = son 7 günün toplam yükü × monotonluk. Yalnız gösterilir, eşik yok.",
    "appliesTo": "son 7 gün ilk kayıttan sonraysa; SD 0 ise (her gün aynı yük) hesaplanmaz",
    "notes": "Foster eşikleri sporcuya özgü buldu, evrensel değer vermedi; sık anılan '2'nin üstü' eşiği doğrulanmış bir kaynakta bulunamadı, kullanılmaz. SD türü kaynaklarda yazmıyor; örneklem SD'si (n − 1) seçildi. Kişisel geçmişe göre yorum ileride, haftalar biriktikçe.",
    "sources": [
      "foster-1998",
      "haddad-2017"
    ]
  },
  {
    "id": "yuk-orani",
    "module": "yuk",
    "description": "Akut / kronik oran = akut EWMA / kronik EWMA. Sakatlık riski olarak değil, 'bu hafta alıştığın seviyenin kaç katı' bağlamı olarak gösterilir. İlk kayıttan bu yana en az 28 gün geçmeden ve kronik yük 0 iken hesaplanmaz.",
    "appliesTo": "bugün",
    "notes": "En güncel meta-analiz oranı tek başına tahmin aracı değil, bağlam göstergesi olarak okumayı öneriyor (ding-2026). Oranın nedensel kanıtı yok ve istatistik sorunları var (lolli-2017, impellizzeri-2020, impellizzeri-2021); bu yüzden 'güvenli bölge' rengi ve risk dili yok. En az geçmiş kronik pencerenin uzunluğu (N = 28).",
    "sources": [
      "williams-2017",
      "andrade-2020",
      "ding-2026",
      "impellizzeri-2020",
      "impellizzeri-2021",
      "lolli-2017"
    ]
  }
];
