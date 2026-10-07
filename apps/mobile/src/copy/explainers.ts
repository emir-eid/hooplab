// Bugün, Trend ve Vücut'taki ölçüm ve hesapların açıklamaları (karar 0026, 0027): dokununca açılan alt sayfanın metni.
// Her açıklama research/rules'taki kurallara bağlıdır; kaynaklar o kuralların kaynaklarından seçilir
// (explainers.test.ts denetler). Sayılar motor sabitlerinden; metinde eşik uydurulmaz.

import {
  checkinBaseline,
  loadEwma,
  loadRatioRule,
  loadSpikeRule,
  loadWeek,
  painMonitoringRule,
  recoveryBand,
  regionComparison,
  regionWindow,
  recoveryMinValues,
  respirationNightRule,
  shortSleep,
  wellnessScale,
  wellnessTotalRange,
} from '@hooplab/engine';

import type { SourceId } from './sources.ts';

/** Değer nereden geliyor: saatin ölçümü mü, kayıtlardan hesap mı, tahmin mi (CLAUDE.md §3: tahmin etiketlenir). */
export type ExplainerBasis = 'measured' | 'computed' | 'estimate';

export const basisLabels: Record<ExplainerBasis, string> = {
  measured: 'Saatin ölçümü',
  computed: 'Kayıtlarından hesap',
  estimate: 'Tahmin',
};

export interface Explainer {
  title: string;
  basis: ExplainerBasis;
  /** Bu ne? */
  what: string;
  /** Nasıl okunur? Her madde ayrı satır. */
  read: readonly string[];
  /** Neye göre? Referans: kişisel bant, kaynak, neden eşik yok. */
  reference: string;
  /** Sınırlar: ne zaman hesaplanmaz, neyi göstermez. */
  limits?: string;
  /** Sağlıkla ilgili ölçümlerde tanı değil notu gösterilir. */
  medical?: boolean;
  /** research/rules kural kimlikleri. */
  rules: readonly string[];
  sources: readonly SourceId[];
}

const dec = (n: number) => String(n).replace('.', ',');
const bandWeeks = recoveryBand.baselineDays / loadWeek.days;
const bandText = `Senin önceki ${bandWeeks} haftanın ortalaması ± ${dec(recoveryBand.sdMultiplier)} standart sapma: buna kişisel bant diyoruz. Bant her gün yeniden hesaplanır; başkasının değeriyle karşılaştırılmaz.`;
const bandLimits = `Son ${recoveryBand.rollingDays} günde en az ${recoveryMinValues.rolling}, bant için önceki ${bandWeeks} haftada en az ${recoveryMinValues.baseline} geçerli gece gerekir. Daha azsa değer veya bant gösterilmez.`;

export const explainers = {
  hrv: {
    title: 'HRV · derin uyku',
    basis: 'measured',
    what: "Kalp atımları arasındaki sürenin ne kadar değiştiğini gösterir (RMSSD, milisaniye). Vücudun dinlenme tarafının ne kadar devrede olduğuna dair dolaylı bir işarettir. Saat bunu gece derin uykuda ölçer; Fitbit uygulamasındaki bütün gece değerinden farklı olabilir.",
    read: [
      `Tek gece gürültülüdür; bu yüzden büyük sayı son ${recoveryBand.rollingDays} günün ortalamasıdır. Nokta tek geceyi, çizgi ortalamayı gösterir.`,
      'Bant içi: alıştığın aralıktasın. Bandın altı da üstü de "her zamankinden farklı" demektir; yüksek değer her zaman iyi değildir.',
      'HRV tek başına yetmez; dinlenik nabızla birlikte okunur. Günün durumu ikisine birlikte bakar.',
      'Grafikte bir güne dokununca o gecenin değeri başlıkta görünür.',
    ],
    reference: bandText,
    limits: bandLimits,
    medical: true,
    rules: ['hrv-olcu', 'toparlanma-bant', 'toparlanma-veri-yeterliligi', 'gunun-durumu'],
    sources: ['buchheit-2014', 'plews-2013', 'manresa-rocamora-2021', 'plews-2014', 'bellenger-2016'],
  },
  hrvNight: {
    title: 'Son gece HRV',
    basis: 'measured',
    what: 'Dün gece derin uykuda ölçülen tek değer (milisaniye).',
    read: [
      'Tek gece gürültülüdür; önceki günün yükü bile onu oynatabilir.',
      `Karar için ${recoveryBand.rollingDays} günlük ortalamaya bak; bant karşılaştırması o ortalamayla yapılır, bu değerle değil.`,
    ],
    reference: 'Kendi gecelerin. Tek değerin bir eşiği yok.',
    medical: true,
    rules: ['hrv-olcu'],
    sources: ['buchheit-2014', 'plews-2013'],
  },
  rhr: {
    title: 'Dinlenik nabız',
    basis: 'measured',
    what: 'Dinlenirken kalbinin dakikadaki atım sayısı. Google Health her gün için bir değer verir; büyük sayı son 7 günün ortalamasıdır.',
    read: [
      'Bandın içi: alıştığın aralık.',
      'Bandın üstü günün durumunu "Kontrollü"ye çeker. HRV de bandın altındaysa durum "Toparlan" olur.',
      'Tek başına okunmaz; HRV ile birlikte anlam kazanır.',
    ],
    reference: bandText,
    limits: bandLimits,
    medical: true,
    rules: ['toparlanma-bant', 'toparlanma-veri-yeterliligi', 'gunun-durumu'],
    sources: ['manresa-rocamora-2021', 'buchheit-2014', 'plews-2013', 'plews-2014'],
  },
  sleep: {
    title: 'Uyku',
    basis: 'measured',
    what: 'Uykuda geçen süre; şekerlemeler sayılmaz. Büyük sayı dün gece, altındaki satır son 7 gecenin ortalaması.',
    read: [
      `Son ${shortSleep.rollingNights} gecenin ortalaması ${shortSleep.minHours} saatin altındaysa uyku kısa sayılır ve günün durumu "Kontrollü"ye çekilir.`,
      'Tek kötü gece durumu tek başına değiştirmez; ortalama okunur.',
    ],
    reference: `${shortSleep.minHours} saat, sporcularda uyku üzerine uzman konsensüsündeki kısa uyku sınırı. Aynı metin herkese tek bir süre önermek yerine kişisel uyku ihtiyacını öneriyor; senin ihtiyacın henüz ölçülmüyor, bu yüzden ${shortSleep.minHours} saat alt sınır olarak kullanılıyor.`,
    rules: ['uyku-kisa'],
    sources: ['walsh-2021'],
  },
  respiration: {
    title: 'Solunum',
    basis: 'measured',
    what: 'Uykuda dakikadaki nefes sayısı. Saat bunu gece nabzının nefesle birlikte hafifçe dalgalanmasından hesaplar. Büyük sayı son gece, altındaki satır son 7 gecenin ortalaması ve bandı.',
    read: [
      'Gece solunumu kişiden kişiye çok değişir, ama aynı kişide gece gece çok az oynar. Bu yüzden başkasıyla değil, kendi bandınla karşılaştırılır.',
      'Bandın altı ya da üstü "her zamankinden farklı" demektir; iyi ya da kötü demez. Günün durumuna girmez.',
      `Son gece önceki 4 haftanın ortalamasından ${respirationNightRule.aboveBaselineMean} nefes/dk veya daha fazla yüksekse ayrı bir not çıkar.`,
      'Not tanı değil: hastalık başlangıcında da, sıcak, alkol, stres veya yükseklikte de görülebilir.',
    ],
    reference: `${bandText} ${respirationNightRule.aboveBaselineMean} nefes/dk, Fitbit'in kendi çalışmasından: hastalık başlangıcında semptomlu kişilerin yaklaşık üçte birinde en az bir gece olağanın bu kadar üstünde ölçüm görüldü. Sporcularda da gece solunumu, kişisel başlangıç düzeyine göre, diğer ölçümlerden önce değişebilmiş.`,
    limits: `${bandLimits} ${respirationNightRule.aboveBaselineMean} nefes/dk doğrulanmış bir uyarı eşiği değil ve yanlış alarm oranı bilinmiyor. Bant genişliği HRV çalışmalarından aktarıldı.`,
    medical: true,
    rules: ['solunum-bant', 'solunum-tek-gece', 'toparlanma-veri-yeterliligi'],
    sources: ['natarajan-2021', 'renteria-2024', 'miller-2020', 'nicolo-2020', 'manresa-rocamora-2021', 'plews-2014'],
  },
  checkin: {
    title: 'Sabah check-in',
    basis: 'computed',
    what: `Her sabah beş soru: uyku kalitesi, yorgunluk, kas ağrısı, stres, ruh hali. Her biri ${wellnessScale.min}-${wellnessScale.max} arası, ${wellnessScale.max} en iyi. Toplam ${wellnessTotalRange.min}-${wellnessTotalRange.max}.`,
    read: [
      'Yüksek toplam, o sabah kendini iyi hissettiğini gösterir.',
      `Asıl anlamı kendi geçmişinle kıyasta: bugünkü toplam, önceki ${checkinBaseline.baselineDays} günde girdiğin check-in'lerin ortalamasıyla karşılaştırılır. Fark standart sapma (SD) cinsinden yazılır: "−1 SD", olağan günlük oynamanın bir katı kadar düşük demek.`,
      `Bugün ${Math.abs(checkinBaseline.zNoteMax)} SD veya daha fazla düşükse "alıştığından belirgin düşük" notu çıkar ve kendi ortalamana göre en çok düşen madde yazılır.`,
      'Maç ertesi düşük toplam olağandır; not kendi başına yük azalt demez, o günü bilerek planlamanı söyler.',
      'Günün durumuna girmez; HRV, nabız ve uykudan ayrı okunur.',
      'Karta dokununca o sabahın cevaplarını değiştirebilirsin.',
    ],
    reference: "Basketbol çalışmalarında kullanılan kısa iyi oluş anketinden uyarlandı. Sporcunun kendi bildirdiği ölçümler, yükteki değişime kan ya da nabız gibi nesnel ölçümlerden daha duyarlı bulunmuş. Avustralya futbolunda sabah toplamı kendi ortalamasının 1 SD altında olan oyuncuların o günkü antrenman çıktısı küçük ama anlamlı düşük bulundu; futbolda sabah yorgunluğu yüke en duyarlı madde çıktı.",
    limits: `Kıyas için önceki ${checkinBaseline.baselineDays} günde en az ${checkinBaseline.minValues} check-in gerekir. Doğrulanmış bir psikometrik ölçek değil; bir izleme aracı, tanı aracı değil. 1 SD doğrulanmış bir uyarı eşiği değil; futbol bulgularının basketbola aktarımı varsayım.`,
    rules: ['checkin-olcek', 'checkin-kisisel'],
    sources: ['zhang-2026', 'saw-2016', 'burger-2024', 'gallo-2016', 'gallo-2017', 'thorpe-2015'],
  },
  sessionLoad: {
    title: 'Seans yükü · AU',
    basis: 'computed',
    what: "Bir seansın seni ne kadar zorladığını tek sayıda toplar: zorluk puanın (RPE, 0-10) × süre (dakika). Birimi AU (arbitrary unit), yani keyfi birim: kilo ya da kalori gibi fiziksel bir karşılığı yok.",
    read: [
      'Örnek: RPE 6 ile 90 dakikalık antrenman 540 AU eder.',
      'Sayı yalnız kendi seanslarınla karşılaştırılınca anlamlı.',
      'RPE seans bittikten sonra, seansın tamamı için tek puan olarak verilir.',
      'Maçta süre, ısınma dahil seansın tamamıdır; oynadığın dakika ayrıca tutulur.',
    ],
    reference: 'Seans RPE yöntemi. Basketbol dahil farklı egzersizlerde nabza dayalı yük hesabıyla tutarlı bulunmuş.',
    rules: ['seans-rpe-olcek', 'seans-yuku'],
    sources: ['foster-2001', 'haddad-2017'],
  },
  loadChart: {
    title: 'Günlük ve haftalık yük',
    basis: 'computed',
    what: 'Her çubuk bir günün toplam yükü (AU). Renkler seans türünü gösterir: maç, saha (takım antrenmanı ve şut), kuvvet ve kondisyon, hafif (mobilite ve rehabilitasyon).',
    read: [
      `Gölgeli alan son ${loadWeek.days} gün. Başlıktaki sayı bu ${loadWeek.days} günün toplamı; yanında önceki ${loadWeek.days} gün ve değişim.`,
      'Kesikli çizgi alıştığın günlük yük (bkz. "Alıştığına göre").',
      'Seans kaydı olmayan gün 0 sayılır: dinlenme günü de yükün parçası.',
      'Renk yalnız türü gösterir, iyi ya da kötü demez. Haftadan haftaya değişimin basketbolda sakatlıkla ilişkisi bulunmamış; bu yüzden eşiği yok.',
    ],
    reference: `Kendi geçmişin. ${loadWeek.days} gün ve ${loadWeek.averageWeeks} hafta pencereleri yük çalışmalarında en sık kullanılanlar.`,
    limits: 'Kaydetmediğin bir seans dinlenme günü gibi görünür. Saatin kaydettiği ama etiketlemediğin oturumlar yüke girmez; yük eksik görünebilir.',
    rules: ['yuk-gunluk', 'yuk-haftalik'],
    sources: ['bourdon-2017', 'foster-1998', 'andrade-2020', 'ferioli-2020'],
  },
  ratio: {
    title: 'Alıştığına göre',
    basis: 'computed',
    what: `Son günlerdeki yükünün, son ${loadWeek.averageWeeks} haftada alıştığın yüke oranı. 1,0 alıştığın kadar demek; 1,2 yüzde 20 fazla.`,
    read: [
      `İki ortalama karşılaştırılır: ${loadEwma.acuteN} günlük ve ${loadEwma.chronicN} günlük. İkisinde de yakın günler daha ağır sayılır (üstel ağırlıklı ortalama).`,
      `Oran ${dec(loadSpikeRule.ratioMin)} ve üstündeyse "Tahmin" etiketli bir not çıkar: bu hafta yük alıştığının belirgin üstünde.`,
      'Düşük oran için not yok.',
    ],
    reference: `${dec(loadSpikeRule.ratioMin)}, başka takım sporlarındaki (ragbi, kriket, Avustralya futbolu) çalışmaların "yüksek oran" için en sık kullandığı sınır. Basketbolda doğrulanmadı ve yöntem eleştiriliyor; en güncel meta-analiz oranı bir tahmin aracı değil, bağlam olarak okumayı öneriyor. Bu yüzden renk ve "güvenli bölge" yok.`,
    limits: `İlk seans kaydından ${loadRatioRule.minHistoryDays} gün sonra hesaplanır.`,
    rules: ['yuk-ewma', 'yuk-orani', 'yuk-artis-notu'],
    sources: ['murray-2017', 'williams-2017', 'gabbett-2016', 'chan-2024', 'ding-2026', 'impellizzeri-2020'],
  },
  weeklyAverage: {
    title: `${loadWeek.averageWeeks} hafta ortalaması`,
    basis: 'computed',
    what: `Son ${loadWeek.days * loadWeek.averageWeeks} günün toplam yükü ÷ ${loadWeek.averageWeeks}: bir haftada ortalama ne kadar yük aldığın.`,
    read: ['Bu haftanın toplamını bununla karşılaştırınca haftanın olağanın üstünde mi altında mı olduğunu görürsün.'],
    reference: 'Kendi geçmişin; eşik yok.',
    limits: `İlk kayıttan ${loadWeek.days * loadWeek.averageWeeks} gün sonra hesaplanır.`,
    rules: ['yuk-haftalik'],
    sources: ['andrade-2020'],
  },
  monotony: {
    title: 'Monotonluk',
    basis: 'computed',
    what: `Haftanın günleri birbirine ne kadar benziyor? Son ${loadWeek.days} günün günlük yük ortalaması ÷ günden güne değişimi (standart sapma).`,
    read: [
      'Yüksek değer: her gün aşağı yukarı aynı yük, hafif ya da dinlenme günü az.',
      'Düşük değer: zor ve hafif günler sırayla geliyor.',
      'Dinlenme günleri 0 yükle hesaba girer.',
    ],
    reference: "Foster'ın yöntemi. Çalışmada hastalıklar sporcuların kendine özgü eşiklerini aştığında görüldü; herkese uyan bir sınır verilmedi. Sık anılan \"2'nin üstü\" eşiği doğrulanmış bir kaynakta bulunamadı, kullanılmıyor. Kendi geçmişinle karşılaştırma haftalar biriktikçe gelecek.",
    limits: 'Her gün aynı yük varsa (değişim 0) hesaplanmaz.',
    rules: ['yuk-monotonluk'],
    sources: ['foster-1998', 'haddad-2017'],
  },
  strain: {
    title: 'Gerilim',
    basis: 'computed',
    what: `Son ${loadWeek.days} günün toplam yükü × monotonluk. Hem yüklü hem tekdüze bir haftada yükselir.`,
    read: ['Aynı toplam yükte, arada hafif günleri olan bir hafta daha düşük gerilim verir.'],
    reference: "Foster'ın çalışmasında hastalıklar en çok gerilimle ilişkiliydi, ama eşikler kişiye özgüydü. Burada eşik yok; kendi geçmişinle karşılaştırma haftalar biriktikçe gelecek.",
    rules: ['yuk-monotonluk'],
    sources: ['foster-1998'],
  },
  regionLoad: {
    title: 'Bölge yükü',
    basis: 'estimate',
    what: 'Bir bölgenin son 2-3 günde hangi seanslarla, ne kadar çalıştığı. Seansa işaretlediğin içerik (sıçrama, yön değiştirme, sprint, alt / üst vücut kuvvet) o içeriğin çalıştırdığı bölgelere eşlenir. Bölge yükü, o bölgeyi çalıştıran seansların yükleri toplamıdır (AU).',
    read: [
      'Eşleme: sıçrama / iniş → patellar tendon ve Aşil; yön değiştirme / ani duruş → quadriceps ve adduktor; sprint → hamstring, baldır ve Aşil; alt vücut kuvvet → quadriceps, hamstring ve kalça; üst vücut kuvvet → omuz.',
      "Seans yükü bölgeler arasında bölünmez: sıçramalı bir maçın yükünün tamamı hem patellar tendona hem Aşil'e yazılır. Bu dokuya binen yük değil, o bölgeyi çalıştıran seansların yüküdür.",
      `Yanındaki "olağan", kendi son ${regionComparison.days} gününde aynı uzunluktaki pencerelerin ortalaması. Eşik ve renk yok; yüksek değer risk demek değil.`,
      'İçerik girmediğin seanslar türün hazır etiketleriyle sayılır; ekranda kaç seans olduğu yazar.',
    ],
    reference:
      "Fizyolojik yük (ne kadar zorlandın) ile mekanik yük (hangi doku ne kadar çalıştı) ayrı şeyler; RPE × dakika ikincisini göstermez, bu yüzden içerik ayrıca işaretlenir. Eşlemeler basketbol, voleybol ve futbol çalışmalarından: sıçrama patellar tendonu ve Aşil'i, ani duruş quadricepsi, yön değiştirme adduktoru, sprint hamstring ve baldırı yükler. Sıçrama yükünün diz şikayetine nedensel etkisi ise bulunamamış: eşleme maruziyettir, risk değil.",
    limits:
      'Doku yükünü ölçmez; doğrulanmış bir ölçüm değil. Ayak bileği (burkulma çoğunlukla anlık bir travma) ve bel için kaynaklı bir eşleme yok; ikisi yalnız ağrı haritasında. Futbol ve voleybol bulgularının basketbola aktarımı bir varsayım.',
    rules: ['bolge-icerik-etiketleri', 'bolge-esleme', 'bolge-yuku'],
    sources: [
      'vanrenterghem-2017',
      'kalkhoven-2021',
      'lian-2005',
      'silbernagel-2007',
      'harper-2022',
      'serner-2019',
      'danielsson-2020',
      'finnern-2026',
      'bache-mathiesen-2024',
      'panagiotakis-2017',
    ],
  },
  regionWindow: {
    title: 'Toparlanma penceresi',
    basis: 'estimate',
    what: `Benzer bir yükten önce önerilen ara: tendonlarda (patellar tendon, Aşil) ${regionWindow.tendonHours} saat, kaslarda ${regionWindow.muscleHours} saat. Bu pencere içinde çalışmış bölge "toparlanıyor" olarak gösterilir.`,
    read: [
      `Elle girilen seansın saati yok; pencere takvim günüyle uygulanır: ${regionWindow.tendonHours} saat bugün ve dün, ${regionWindow.muscleHours} saat bugün ve önceki iki gün.`,
      'Saatle eşleşen seansta son yüklenmeden bu yana geçen saat ayrıca yazılır.',
      '"Toparlanıyor" hasar var demek değil; aynı bölgeye benzer bir yük için önerilen aranın henüz dolmadığını söyler.',
    ],
    reference:
      'Güncel bir derleme çok sıçramalı yüklenmeden sonra tendonda yaklaşık 48 saat, eksantrik kas hasarında 72 saat veya daha uzun ara öneriyor. Tendonda kollajen yapımı egzersizden sonra yaklaşık 24 saatte zirve yapıp üç gün kadar yüksek kalıyor; maç sonrası kas hasarı belirteci (kreatin kinaz) 72 saate kadar normale dönüyor.',
    limits: 'Süreler derleme düzeyinde kanıta dayanır ve kişiden kişiye çok değişir. Uyku ve beslenme hesaba girmez.',
    rules: ['bolge-toparlanma-penceresi'],
    sources: ['gabbett-2025', 'magnusson-2010', 'miller-2005', 'doeven-2018'],
  },
  painMonitoring: {
    title: 'Ağrı izleme',
    basis: 'estimate',
    what: `Tendon rehabilitasyonunda kullanılan ağrı izleme modelinin sabah ağrısına uyarlanmışı. Bir bölgede sabah ağrısı ${painMonitoringRule.maxNrs}'in üstündeyse ya da bölge dün çalıştıysa ve bu sabahki ağrı dünkünden azalmadıysa not düşer.`,
    read: [
      `Modelde etkinlik sırasında ve sonrasında 10 üzerinden ${painMonitoringRule.maxNrs}'e kadar ağrı kabul edilebilir sayılır; ertesi sabah ağrının azalmış olması beklenir.`,
      `Not yalnız bugünkü check-in'den çıkar. Dün ağrı yoksa yeni başlayan ağrı "azalmadı" sayılmaz; yalnız ${painMonitoringRule.maxNrs} sınırına bakılır.`,
      'Not bir uyarı değil, bir dikkat işareti: o bölgeyi ve sonraki sabahları izlemeni söyler.',
    ],
    reference:
      'Aşil ve patellar tendinopati rehabilitasyonunda kullanılan model; elit sporcularda da uygulanmış. HoopLab yalnız sabah ağrısını kaydettiği için model sabah değerine uyarlandı; bu uyarlama doğrulanmadı.',
    limits: 'Tanı değil. Ağrı şiddetliyse, aniden başladıysa veya şişlikle geldiyse doktora ya da fizyoterapiste başvur.',
    medical: true,
    rules: ['bolge-agri-izleme'],
    sources: ['silbernagel-2007', 'seidler-2025'],
  },
} as const satisfies Record<string, Explainer>;

export type ExplainerId = keyof typeof explainers;

export function isExplainerId(value: unknown): value is ExplainerId {
  return typeof value === 'string' && Object.hasOwn(explainers, value);
}

export const medicalNote =
  'İzleme özeti, tanı değil. Göğüs ağrısı, çarpıntı veya olağandışı nabız gibi bir belirti varsa doktora başvur.';
